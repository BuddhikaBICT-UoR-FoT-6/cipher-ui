/**
 * CipherProject Backend API (Express + MySQL).
 *
 * Key responsibilities:
 * - Authentication (JWT), user/admin APIs
 * - Email OTP flows (registration, password reset, sensitive actions)
 * - Admin-configurable email settings persisted in DB
 *   - SMTP password is encrypted at rest (AES-256-GCM)
 * - Cipher history, saved messages, challenges, badges
 */

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve badge images (stored in repo under src/main/badges)
app.use('/badges', express.static(path.join(__dirname, '..', 'src', 'main', 'badges')));

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number.parseInt(String(process.env.DB_PORT), 10) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cipher_db',
  ssl:
    String(process.env.DB_SSL || '').trim().toLowerCase() === 'true'
      ? { rejectUnauthorized: String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').trim().toLowerCase() !== 'false' }
      : undefined,
};

let db;

const APP_NAME = process.env.APP_NAME || 'Cipher Project';
const OTP_EXPIRY_MINUTES = Number.parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
const OTP_RESEND_COOLDOWN_SECONDS = Number.parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10);
const FAILED_LOGIN_EMAIL_COOLDOWN_SECONDS = Number.parseInt(process.env.FAILED_LOGIN_EMAIL_COOLDOWN_SECONDS || '300', 10);
const EMAIL_PROVIDER = String(process.env.EMAIL_PROVIDER || 'smtp').trim().toLowerCase();

/**
 * Derive a stable 32-byte key for encrypting secrets stored in the DB.
 *
 * - If EMAIL_SETTINGS_ENC_KEY is set:
 *   - Accept either 64 hex chars (32 bytes) or an arbitrary string (SHA-256 -> 32 bytes).
 * - Otherwise fall back to JWT_SECRET-derived key (keeps local dev easy).
 */
const getEmailSettingsEncryptionKey = () => {
  const raw = String(process.env.EMAIL_SETTINGS_ENC_KEY || '').trim();
  if (raw) {
    if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, 'hex');
    return crypto.createHash('sha256').update(raw).digest();
  }
  return crypto.createHash('sha256').update(String(process.env.JWT_SECRET || 'cipher_secret_key')).digest();
};

/**
 * Encrypt a secret (e.g., SMTP password) for storage.
 *
 * Output format: `${ivB64}.${tagB64}.${ciphertextB64}`
 * - iv: 12 bytes random
 * - tag: GCM auth tag
 */
const encryptSecret = (plaintext) => {
  const plain = String(plaintext || '');
  if (!plain) return '';
  const key = getEmailSettingsEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join('.');
};

/**
 * Decrypt a secret stored via encryptSecret().
 * Returns empty string if payload is missing/malformed.
 */
const decryptSecret = (payload) => {
  const text = String(payload || '').trim();
  if (!text) return '';
  const parts = text.split('.');
  if (parts.length !== 3) return '';
  const [ivB64, tagB64, dataB64] = parts;
  const key = getEmailSettingsEncryptionKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString('utf8');
};

let emailSettingsCache = null;
/**
 * Compute the effective email settings, preferring the cached DB-configured values
 * when email settings are enabled; otherwise fall back to environment variables.
 */
const getEffectiveEmailSettings = () => {
  const cached = emailSettingsCache && emailSettingsCache.enabled ? emailSettingsCache : null;
  const provider = (cached?.provider || EMAIL_PROVIDER || 'smtp').trim().toLowerCase();

  return {
    provider,
    smtpHost: cached?.smtpHost || process.env.SMTP_HOST,
    smtpPort: cached?.smtpPort ?? (process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : 587),
    smtpSecure:
      typeof cached?.smtpSecure === 'boolean'
        ? cached.smtpSecure
        : (process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    smtpUser: cached?.smtpUser || process.env.SMTP_USER,
    smtpPass: cached?.smtpPass || process.env.SMTP_PASS,
    emailFrom: cached?.emailFrom || process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER,
  };
};

/**
 * Returns true when email sending is configured and safe to attempt.
 * Ethereal is only allowed for non-production environments.
 */
const isEmailConfigured = () => {
  const settings = getEffectiveEmailSettings();
  if (settings.provider === 'ethereal') {
    const isProd = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
    return !isProd;
  }

  return Boolean(settings.smtpHost && settings.smtpPort && settings.smtpUser && settings.smtpPass);
};

let mailTransporter;
let etherealAccount;
/**
 * Lazily create and cache a Nodemailer transporter.
 * - provider=ethereal: creates a test account (local dev)
 * - provider=smtp: uses configured SMTP credentials
 */
const getMailTransporter = async () => {
  if (mailTransporter) return mailTransporter;

  const settings = getEffectiveEmailSettings();

  if (settings.provider === 'ethereal') {
    etherealAccount = etherealAccount || (await nodemailer.createTestAccount());
    mailTransporter = nodemailer.createTransport({
      host: etherealAccount.smtp.host,
      port: etherealAccount.smtp.port,
      secure: etherealAccount.smtp.secure,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass,
      },
    });
    return mailTransporter;
  }

  mailTransporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: Number.parseInt(String(settings.smtpPort || '587'), 10),
    secure: Boolean(settings.smtpSecure),
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });

  return mailTransporter;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const columnExists = async ({ tableName, columnName }) => {
  const [rows] = await db.execute(
    `SELECT 1 AS ok
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [dbConfig.database, tableName, columnName]
  );
  return Array.isArray(rows) && rows.length > 0;
};

const ensureUserColumns = async () => {
  try {
    if (!(await columnExists({ tableName: 'users', columnName: 'email_verified' }))) {
      await db.execute('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT TRUE');
    }
    if (!(await columnExists({ tableName: 'users', columnName: 'email_verified_at' }))) {
      await db.execute('ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL');
    }
    if (!(await columnExists({ tableName: 'users', columnName: 'deactivated_at' }))) {
      await db.execute('ALTER TABLE users ADD COLUMN deactivated_at TIMESTAMP NULL');
    }

    if (await columnExists({ tableName: 'users', columnName: 'email_verified' })) {
      await db.execute('UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL').catch(() => {});
    }
  } catch (e) {
    console.warn('User column migration skipped:', e?.message || e);
  }
};

const ensureCipherHistoryColumns = async () => {
  try {
    if (!(await columnExists({ tableName: 'cipher_history', columnName: 'cipher_config' }))) {
      await db.execute('ALTER TABLE cipher_history ADD COLUMN cipher_config JSON NULL');
    }
    if (!(await columnExists({ tableName: 'cipher_history', columnName: 'input_text' }))) {
      await db.execute('ALTER TABLE cipher_history ADD COLUMN input_text TEXT NULL');
    }
    if (!(await columnExists({ tableName: 'cipher_history', columnName: 'output_text' }))) {
      await db.execute('ALTER TABLE cipher_history ADD COLUMN output_text TEXT NULL');
    }
  } catch (e) {
    console.warn('Cipher history column migration skipped:', e?.message || e);
  }
};

const ensureEmailOtpsPurposeSupportsReset = async () => {
  try {
    const [rows] = await db.execute(
      `SELECT COLUMN_TYPE
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'email_otps' AND COLUMN_NAME = 'purpose'
       LIMIT 1`,
      [dbConfig.database]
    );

    const columnType = String(rows?.[0]?.COLUMN_TYPE || '').toLowerCase();
    if (columnType.includes("'reset'")) return;

    await db.execute(
      "ALTER TABLE email_otps MODIFY COLUMN purpose ENUM('register', 'deactivate', 'delete', 'reset') NOT NULL"
    );
  } catch (e) {
    console.warn('Email OTP purpose migration skipped:', e?.message || e);
  }
};

const createEmailNotConfiguredError = () => {
  const error = new Error(
    'Email service is not configured. Configure SMTP in backend .env or set it from the Admin Dashboard (or set EMAIL_PROVIDER=ethereal for local dev)'
  );
  error.statusCode = 503;
  return error;
};

const isDevOtpFallbackEnabled = () => {
  const enabled = String(process.env.DEV_PRINT_OTPS || '').trim().toLowerCase() === 'true';
  const isProd = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
  return enabled && !isProd;
};

const sendEmail = async ({ to, subject, text }) => {
  const emailTo = normalizeEmail(to);
  if (!emailTo) return { ok: false };

  if (!isEmailConfigured()) {
    console.log('[email disabled]', { to: emailTo, subject, text });
    return { ok: false, disabled: true };
  }

  try {
    const transporter = await getMailTransporter();
    const settings = getEffectiveEmailSettings();
    const from = settings.emailFrom || (settings.provider === 'ethereal' ? etherealAccount?.user : settings.smtpUser);

    const info = await transporter.sendMail({
      from,
      to: emailTo,
      subject,
      text,
    });

    if (settings.provider === 'ethereal') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('[ethereal preview]', previewUrl);
      }
    }

    return { ok: true };
  } catch (e) {
    console.warn('Email send failed:', e?.message || e);
    return { ok: false, error: e };
  }
};

const isEmailEventInCooldown = async ({ email, eventType, cooldownSeconds }) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const [rows] = await db.execute(
    'SELECT last_sent_at FROM email_event_log WHERE email = ? AND event_type = ? LIMIT 1',
    [normalized, eventType]
  );

  if (rows.length === 0 || !rows[0].last_sent_at) return false;
  const lastSent = new Date(rows[0].last_sent_at).getTime();
  if (!Number.isFinite(lastSent)) return false;
  return (Date.now() - lastSent) / 1000 < cooldownSeconds;
};

const markEmailEventSentNow = async ({ email, eventType }) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  await db.execute(
    'INSERT INTO email_event_log (email, event_type, last_sent_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE last_sent_at = NOW()',
    [normalized, eventType]
  );
};

const trySendEmailWithCooldown = async ({ email, eventType, cooldownSeconds, subject, text }) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  try {
    const inCooldown = await isEmailEventInCooldown({ email: normalized, eventType, cooldownSeconds });
    if (inCooldown) return;
    const result = await sendEmail({ to: normalized, subject, text });
    if (result?.ok) {
      await markEmailEventSentNow({ email: normalized, eventType });
    }
  } catch (e) {
    console.warn('Email send skipped due to error:', e?.message || e);
  }
};

const createAndSendOtp = async ({ email, purpose, eventType }) => {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error('Email is required');

  if (!isEmailConfigured() && !isDevOtpFallbackEnabled()) {
    throw createEmailNotConfiguredError();
  }

  const inCooldown = await isEmailEventInCooldown({
    email: normalized,
    eventType,
    cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  });
  if (inCooldown) {
    const error = new Error('Please wait before requesting another OTP');
    error.statusCode = 429;
    throw error;
  }

  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.execute(
    'INSERT INTO email_otps (email, purpose, otp_hash, expires_at) VALUES (?, ?, ?, ?)',
    [normalized, purpose, otpHash, expiresAt]
  );

  if (!isEmailConfigured() && isDevOtpFallbackEnabled()) {
    console.warn('[dev otp]', { email: normalized, purpose, otp });
  } else {
    const emailResult = await sendEmail({
      to: normalized,
      subject: `${APP_NAME} verification code`,
      text: `Your one-time verification code is: ${otp}\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes. If you did not request this, you can ignore this email.`,
    });

    if (!emailResult?.ok) {
      const smtpErr = emailResult?.error;
      let message =
        'Failed to send OTP email. Check Email Settings (SMTP credentials / provider) in the Admin Dashboard.';

      // Common Gmail failure: wrong password / not an App Password
      if (smtpErr?.code === 'EAUTH' || smtpErr?.responseCode === 535) {
        message =
          'Failed to send OTP email: SMTP authentication failed (Gmail 535). If you are using Gmail, you must use a Google App Password (requires 2-Step Verification), not your normal Gmail password.';
      }

      const error = new Error(message);
      error.statusCode = emailResult?.disabled ? 503 : 502;
      throw error;
    }
  }

  await markEmailEventSentNow({ email: normalized, eventType });
};

const verifyOtp = async ({ email, purpose, otp }) => {
  const normalized = normalizeEmail(email);
  const provided = String(otp || '').trim();
  if (!normalized || !provided) return { ok: false };

  const [rows] = await db.execute(
    'SELECT id, otp_hash, expires_at, consumed_at, attempts FROM email_otps WHERE email = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
    [normalized, purpose]
  );
  if (rows.length === 0) return { ok: false };

  const record = rows[0];
  if ((record.attempts || 0) >= 5) return { ok: false };

  const matches = await bcrypt.compare(provided, record.otp_hash);
  if (!matches) {
    await db.execute('UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?', [record.id]);
    return { ok: false };
  }

  await db.execute('UPDATE email_otps SET consumed_at = NOW() WHERE id = ?', [record.id]);
  return { ok: true };
};

// Initialize database
async function initDatabase() {
  try {
    // Create database if it doesn't exist
    try {
      const connection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        ssl: dbConfig.ssl,
      });

      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      await connection.end();
    } catch (e) {
      // Some hosted providers (or limited users) do not allow CREATE DATABASE.
      // In that case, assume the DB already exists and continue.
      console.warn('Skipping CREATE DATABASE step:', e?.message || e);
    }
    
    // Connect to the database
    db = await mysql.createConnection(dbConfig);
    
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        email_verified BOOLEAN DEFAULT TRUE,
        email_verified_at TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        deactivated_at TIMESTAMP NULL,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Ensure required columns exist even on MySQL versions that don't support ADD COLUMN IF NOT EXISTS.
    await ensureUserColumns();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS email_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        purpose ENUM('register', 'deactivate', 'delete', 'reset') NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        consumed_at TIMESTAMP NULL,
        attempts INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_purpose (email, purpose),
        INDEX idx_expires (expires_at)
      )
    `);

    await ensureEmailOtpsPurposeSupportsReset();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS email_event_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        last_sent_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_email_event (email, event_type),
        INDEX idx_event_last_sent (event_type, last_sent_at)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS system_email_settings (
        id INT PRIMARY KEY,
        enabled BOOLEAN DEFAULT TRUE,
        provider ENUM('smtp', 'ethereal') DEFAULT 'smtp',
        smtp_host VARCHAR(255) NULL,
        smtp_port INT NULL,
        smtp_secure BOOLEAN DEFAULT FALSE,
        smtp_user VARCHAR(255) NULL,
        smtp_pass_enc TEXT NULL,
        email_from VARCHAR(255) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(
      'INSERT IGNORE INTO system_email_settings (id, enabled, provider, smtp_host, smtp_port, smtp_secure) VALUES (1, TRUE, ?, ?, ?, ?) ',
      [
        EMAIL_PROVIDER === 'ethereal' ? 'ethereal' : 'smtp',
        process.env.SMTP_HOST || 'smtp.gmail.com',
        Number.parseInt(process.env.SMTP_PORT || '587', 10),
        (process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      ]
    );
    
    // Create custom_ciphers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS custom_ciphers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        mapping JSON NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        usage_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_public (is_public)
      )
    `);
    
    // Create cipher_history table for tracking usage
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cipher_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        cipher_type VARCHAR(50) NOT NULL,
        cipher_id INT NULL,
        operation ENUM('encrypt', 'decrypt') NOT NULL,
        input_length INT,
        execution_time_ms INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (cipher_id) REFERENCES custom_ciphers(id) ON DELETE SET NULL,
        INDEX idx_user_cipher (user_id, cipher_type),
        INDEX idx_created_at (created_at)
      )
    `);

    // Ensure columns exist even on MySQL versions that don't support ADD COLUMN IF NOT EXISTS.
    await ensureCipherHistoryColumns();
    
    // Create saved_messages table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS saved_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        original_text TEXT NOT NULL,
        encrypted_text TEXT NOT NULL,
        cipher_type VARCHAR(50) NOT NULL,
        cipher_config JSON,
        tags VARCHAR(500),
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_cipher_type (cipher_type),
        INDEX idx_favorite (is_favorite)
      )
    `);
    
    // Create cipher_challenges table for puzzle games
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cipher_challenges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        encrypted_text TEXT NOT NULL,
        cipher_type VARCHAR(50) NOT NULL,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        hint TEXT,
        solution TEXT NOT NULL,
        points INT DEFAULT 10,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_difficulty (difficulty),
        INDEX idx_active (is_active)
      )
    `);
    
    // Create user_challenge_attempts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_challenge_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        challenge_id INT NOT NULL,
        attempt_text TEXT,
        is_correct BOOLEAN DEFAULT FALSE,
        points_earned INT DEFAULT 0,
        time_taken_seconds INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (challenge_id) REFERENCES cipher_challenges(id) ON DELETE CASCADE,
        INDEX idx_user_challenge (user_id, challenge_id),
        INDEX idx_correct (is_correct)
      )
    `);
    
    // Create user_stats table for analytics
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_encryptions INT DEFAULT 0,
        total_decryptions INT DEFAULT 0,
        favorite_cipher VARCHAR(50),
        challenges_completed INT DEFAULT 0,
        total_points INT DEFAULT 0,
        streak_days INT DEFAULT 0,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user (user_id)
      )
    `);

    // Create user_badges table (challenge milestone rewards)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        badge ENUM('bronze', 'silver', 'gold', 'diamond') NOT NULL,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uniq_user_badge (user_id, badge),
        INDEX idx_user (user_id)
      )
    `);

    // Create badge_assets table (maps badge -> image path)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS badge_assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        badge ENUM('bronze', 'silver', 'gold', 'diamond') NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        url_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_badge (badge)
      )
    `);

    // Seed badge assets (images are served from /badges)
    const badgeAssets = [
      { badge: 'bronze', file_name: 'Bronze.png', url_path: '/badges/Bronze.png' },
      { badge: 'silver', file_name: 'Silver.png', url_path: '/badges/Silver.png' },
      { badge: 'gold', file_name: 'Gold.jpg', url_path: '/badges/Gold.jpg' },
      { badge: 'diamond', file_name: 'Diamond.png', url_path: '/badges/Diamond.png' },
    ];
    for (const asset of badgeAssets) {
      await db.execute(
        'INSERT IGNORE INTO badge_assets (badge, file_name, url_path) VALUES (?, ?, ?)',
        [asset.badge, asset.file_name, asset.url_path]
      );
    }
    
    // Create shared_ciphers table for collaboration
    await db.execute(`
      CREATE TABLE IF NOT EXISTS shared_ciphers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cipher_id INT NOT NULL,
        shared_by INT NOT NULL,
        shared_with INT,
        share_token VARCHAR(100) UNIQUE,
        permissions ENUM('view', 'edit') DEFAULT 'view',
        expires_at TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cipher_id) REFERENCES custom_ciphers(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (share_token),
        INDEX idx_shared_with (shared_with)
      )
    `);
    
    // Insert sample challenges (seed once to avoid duplicates)
    const [challengeCountRows] = await db.execute('SELECT COUNT(*) AS cnt FROM cipher_challenges');
    const challengeCount = Number(challengeCountRows?.[0]?.cnt) || 0;

    const sampleChallenges = [
      {
        title: 'Caesar Cipher - Easy',
        description: 'Decrypt this Caesar cipher with shift 3',
        encrypted_text: 'WKLV LV D VHFUHW PHVVDJH',
        cipher_type: 'caesar',
        difficulty: 'easy',
        hint: 'Try shifting each letter back by 3 positions',
        solution: 'THIS IS A SECRET MESSAGE',
        points: 10
      },
      {
        title: 'ROT13 Challenge',
        description: 'Decode this ROT13 encrypted message',
        encrypted_text: 'URYYB JBEYQ',
        cipher_type: 'rot13',
        difficulty: 'easy',
        hint: 'ROT13 shifts each letter by 13 positions',
        solution: 'HELLO WORLD',
        points: 5
      },
      {
        title: 'Atbash Mystery',
        description: 'Solve this Atbash cipher puzzle',
        encrypted_text: 'XIBKGR XLMW',
        cipher_type: 'atbash',
        difficulty: 'medium',
        hint: 'A=Z, B=Y, C=X... each letter maps to its opposite',
        solution: 'CIPHER CODE',
        points: 15
      },
      {
        title: 'Vigenère Puzzle',
        description: 'Decrypt using keyword "KEY"',
        encrypted_text: 'RIJVS UYVJN',
        cipher_type: 'vigenere',
        difficulty: 'hard',
        hint: 'Use the keyword KEY repeatedly: K-E-Y-K-E-Y...',
        solution: 'HELLO WORLD',
        points: 25
      },

      // Extra unique challenges (to support 20-step runs)
      { title: 'Caesar Sprint 1', description: 'Short Caesar decode (shift 1)', encrypted_text: 'DBU', cipher_type: 'caesar', difficulty: 'easy', hint: 'Shift back by 1', solution: 'CAT', points: 2 },
      { title: 'Caesar Sprint 2', description: 'Short Caesar decode (shift 2)', encrypted_text: 'EJG', cipher_type: 'caesar', difficulty: 'easy', hint: 'Shift back by 2', solution: 'CHF', points: 2 },
      { title: 'Caesar Sprint 3', description: 'Short Caesar decode (shift 3)', encrypted_text: 'KHOOR', cipher_type: 'caesar', difficulty: 'easy', hint: 'Shift back by 3', solution: 'HELLO', points: 3 },
      { title: 'ROT13 Mini 1', description: 'Decode this ROT13 word', encrypted_text: 'NPPYR', cipher_type: 'rot13', difficulty: 'easy', hint: 'ROT13 letters wrap halfway', solution: 'APPLE', points: 3 },
      { title: 'ROT13 Mini 2', description: 'Decode this ROT13 phrase', encrypted_text: 'GUR PNG', cipher_type: 'rot13', difficulty: 'easy', hint: 'ROT13 is symmetric', solution: 'THE CAT', points: 3 },
      { title: 'Atbash Mini 1', description: 'Atbash decode (single word)', encrypted_text: 'ZOO', cipher_type: 'atbash', difficulty: 'easy', hint: 'A↔Z, B↔Y...', solution: 'ALL', points: 4 },
      { title: 'Atbash Mini 2', description: 'Atbash decode (two words)', encrypted_text: 'GSV XLWV', cipher_type: 'atbash', difficulty: 'medium', hint: 'Mirror the alphabet', solution: 'THE CODE', points: 10 },
      { title: 'Vigenère Key: DOG', description: 'Decrypt with keyword DOG', encrypted_text: 'PSHOF HJ', cipher_type: 'vigenere', difficulty: 'medium', hint: 'Keyword is DOG', solution: 'CIPHER IT', points: 12 },
      { title: 'Vigenère Key: SUN', description: 'Decrypt with keyword SUN', encrypted_text: 'ZKXOG', cipher_type: 'vigenere', difficulty: 'hard', hint: 'Keyword is SUN', solution: 'ATTACK', points: 20 },
      { title: 'Rail Fence 2 Rails', description: 'Read the zig-zag (2 rails)', encrypted_text: 'HLOEL', cipher_type: 'railfence', difficulty: 'medium', hint: 'Try 2 rails', solution: 'HELLO', points: 12 },
      { title: 'Rail Fence 3 Rails', description: 'Read the zig-zag (3 rails)', encrypted_text: 'WECRLTEERDSOEEFEAOCAIVDEN', cipher_type: 'railfence', difficulty: 'hard', hint: 'Try 3 rails', solution: 'WE ARE DISCOVERED FLEE AT ONCE', points: 22 },
      { title: 'Caesar Phrase 1', description: 'Caesar shift decode', encrypted_text: 'UFTU UIF TZTUFN', cipher_type: 'caesar', difficulty: 'medium', hint: 'Shift back by 1', solution: 'TEST THE SYSTEM', points: 10 },
      { title: 'Caesar Phrase 2', description: 'Caesar shift decode', encrypted_text: 'YMNX NX F QJXXTS', cipher_type: 'caesar', difficulty: 'medium', hint: 'Shift back by 5', solution: 'THIS IS A LESSON', points: 11 },
      { title: 'ROT13 Sentence', description: 'Decode the sentence', encrypted_text: 'V ybir pvcuref', cipher_type: 'rot13', difficulty: 'medium', hint: 'ROT13 the whole line', solution: 'I love ciphers', points: 11 },
      { title: 'Atbash Short Sentence', description: 'Atbash decode', encrypted_text: 'GSV JFRXP YILDM ULC QFNKH LEVI GSV OZAB WLT', cipher_type: 'atbash', difficulty: 'hard', hint: 'Atbash mirrors letters', solution: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG', points: 24 },
      { title: 'Vigenère Key: KEY', description: 'Classic Vigenère with KEY', encrypted_text: 'LXFOPV EF RNHR', cipher_type: 'vigenere', difficulty: 'hard', hint: 'Keyword is KEY', solution: 'ATTACK AT DAWN', points: 25 },
      { title: 'Caesar Sprint 4', description: 'Short Caesar decode (shift 4)', encrypted_text: 'XLMW', cipher_type: 'caesar', difficulty: 'easy', hint: 'Shift back by 4', solution: 'THIS', points: 3 },
      { title: 'ROT13 Mini 3', description: 'Decode this ROT13 word', encrypted_text: 'FGENX', cipher_type: 'rot13', difficulty: 'easy', hint: 'ROT13 swaps letters', solution: 'STACK', points: 3 },
      { title: 'Caesar Word 1', description: 'Caesar decode (shift 2)', encrypted_text: 'JCUV', cipher_type: 'caesar', difficulty: 'easy', hint: 'Shift back by 2', solution: 'HAST', points: 3 },
    ];

    if (challengeCount === 0) {
      for (const challenge of sampleChallenges) {
        await db.execute(
          'INSERT INTO cipher_challenges (title, description, encrypted_text, cipher_type, difficulty, hint, solution, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            challenge.title,
            challenge.description,
            challenge.encrypted_text,
            challenge.cipher_type,
            challenge.difficulty,
            challenge.hint,
            challenge.solution,
            challenge.points,
          ]
        );
      }
    }
    
    console.log('✅ Database and all tables initialized successfully');
    console.log('📊 Created tables: users, custom_ciphers, cipher_history, saved_messages, cipher_challenges, user_challenge_attempts, user_stats, user_badges, shared_ciphers');
    console.log('🧩 Sample challenges added to database');

    try {
      const [rows] = await db.execute('SELECT * FROM system_email_settings WHERE id = 1 LIMIT 1');
      if (rows && rows.length > 0) {
        const row = rows[0];
        emailSettingsCache = {
          enabled: Boolean(row.enabled),
          provider: String(row.provider || '').trim().toLowerCase() || 'smtp',
          smtpHost: row.smtp_host || null,
          smtpPort: row.smtp_port ?? null,
          smtpSecure: row.smtp_secure === 1 || row.smtp_secure === true,
          smtpUser: row.smtp_user || null,
          smtpPass: row.smtp_pass_enc ? decryptSecret(row.smtp_pass_enc) : null,
          emailFrom: row.email_from || null,
        };
      }
    } catch (e) {
      console.warn('Email settings cache load skipped:', e?.message || e);
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'cipher_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = async (req, res, next) => {
  try {
    const [users] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Auth routes
app.post('/api/auth/register/request-otp', async (req, res) => {
  try {
    const { username, email } = req.body;
    const trimmedUsername = String(username || '').trim();
    const normalizedEmail = normalizeEmail(email);

    if (!trimmedUsername || !normalizedEmail) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [normalizedEmail, trimmedUsername]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    try {
      await createAndSendOtp({ email: normalizedEmail, purpose: 'register', eventType: 'otp_register' });
    } catch (e) {
      if (e?.statusCode) return res.status(e.statusCode).json({ message: e.message });
      throw e;
    }

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Register OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, otp } = req.body;

    const trimmedUsername = String(username || '').trim();
    const normalizedEmail = normalizeEmail(email);
    const otpValue = String(otp || '').trim();

    if (!trimmedUsername || !normalizedEmail || !password || !otpValue) {
      return res.status(400).json({ message: 'Username, email, password and OTP are required' });
    }

    const otpResult = await verifyOtp({ email: normalizedEmail, purpose: 'register', otp: otpValue });
    if (!otpResult.ok) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if user exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [normalizedEmail, trimmedUsername]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [trimmedUsername, normalizedEmail, hashedPassword]
    );

    // Generate token
    const token = jwt.sign(
      { id: result.insertId, email: normalizedEmail },
      process.env.JWT_SECRET || 'cipher_secret_key',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: result.insertId, username: trimmedUsername, email: normalizedEmail }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password (OTP reset)
app.post('/api/auth/forgot-password/request-otp', async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Avoid leaking whether the email exists.
    const [users] = await db.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);

    if (users.length > 0) {
      try {
        await createAndSendOtp({ email: normalizedEmail, purpose: 'reset', eventType: 'otp_reset' });
      } catch (e) {
        if (e?.statusCode) return res.status(e.statusCode).json({ message: e.message });
        throw e;
      }
    }

    return res.json({ message: 'If an account exists for that email, an OTP has been sent.' });
  } catch (error) {
    console.error('Forgot password OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    const otpValue = String(req.body?.otp || '').trim();
    const newPassword = String(req.body?.newPassword || '').trim();

    if (!normalizedEmail || !otpValue || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const otpResult = await verifyOtp({ email: normalizedEmail, purpose: 'reset', otp: otpValue });
    if (!otpResult.ok) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const [users] = await db.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (users.length === 0) {
      // Keep response generic.
      return res.json({ message: 'If the account exists, the password has been reset.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, users[0].id]);

    return res.json({ message: 'Password reset successful. Please login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if account is active or can be reactivated
    if (!user.is_active) {
      if (user.deactivated_at) {
        const daysSinceDeactivation = (new Date() - new Date(user.deactivated_at)) / (1000 * 60 * 60 * 24);
        if (daysSinceDeactivation <= 30) {
          // Reactivate account
          await db.execute(
            'UPDATE users SET is_active = TRUE, deactivated_at = NULL WHERE id = ?',
            [user.id]
          );
          user.is_active = true;
        } else {
          return res.status(400).json({ message: 'Account permanently deactivated. Please contact support.' });
        }
      } else {
        return res.status(400).json({ message: 'Account is deactivated. Please contact support.' });
      }
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await trySendEmailWithCooldown({
        email: user.email,
        eventType: 'login_failed',
        cooldownSeconds: FAILED_LOGIN_EMAIL_COOLDOWN_SECONDS,
        subject: `${APP_NAME} - failed login attempt`,
        text: `A failed login attempt was made for your account at ${new Date().toISOString()} from IP: ${req.ip}. If this wasn't you, consider changing your password.`,
      });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await db.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'cipher_secret_key',
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });

    sendEmail({
      to: user.email,
      subject: `${APP_NAME} - login successful`,
      text: `A login to your account occurred at ${new Date().toISOString()} from IP: ${req.ip}. If this wasn't you, please reset your password.`,
    }).catch(() => {});
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Custom cipher routes
app.post('/api/ciphers', authenticateToken, async (req, res) => {
  try {
    const { name, description, mapping, isPublic } = req.body;
    const userId = req.user.id;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      return res.status(400).json({ message: 'Cipher name is required' });
    }
    if (!mapping || typeof mapping !== 'object') {
      return res.status(400).json({ message: 'Cipher mapping is required' });
    }

    const [result] = await db.execute(
      'INSERT INTO custom_ciphers (user_id, name, description, mapping, is_public) VALUES (?, ?, ?, ?, ?)',
      [userId, trimmedName, description || null, JSON.stringify(mapping), isPublic || false]
    );

    res.status(201).json({
      message: 'Cipher saved successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Save cipher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/ciphers', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [ciphers] = await db.execute(
      'SELECT * FROM custom_ciphers WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const safeParseMapping = (value) => {
      if (value == null) return null;
      if (typeof value === 'object') return value;
      if (typeof value !== 'string') return null;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    res.json(
      ciphers.map((cipher) => ({
        ...cipher,
        mapping: safeParseMapping(cipher.mapping),
      }))
    );
  } catch (error) {
    console.error('Get ciphers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Saved messages routes
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { title, originalText, encryptedText, cipherType, cipherConfig, tags } = req.body;
    const userId = req.user.id;

    const [result] = await db.execute(
      'INSERT INTO saved_messages (user_id, title, original_text, encrypted_text, cipher_type, cipher_config, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, title, originalText, encryptedText, cipherType, JSON.stringify(cipherConfig), tags]
    );

    res.status(201).json({ message: 'Message saved successfully', id: result.insertId });
  } catch (error) {
    console.error('Save message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [messages] = await db.execute(
      'SELECT * FROM saved_messages WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json(messages.map(msg => ({
      ...msg,
      cipher_config: JSON.parse(msg.cipher_config || '{}')
    })));
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cipher history tracking
app.post('/api/history', authenticateToken, async (req, res) => {
  try {
    const {
      cipherType,
      cipherId,
      operation,
      inputLength,
      executionTime,
      inputText,
      outputText,
      cipherConfig,
    } = req.body;
    const userId = req.user.id;

    const executionTimeMs = Number.isFinite(Number(executionTime)) ? Number(executionTime) : null;
    const safeInputLength = Number.isFinite(Number(inputLength)) ? Number(inputLength) : null;

    const cipherConfigJson = cipherConfig === undefined ? null : JSON.stringify(cipherConfig);
    const safeInputText = typeof inputText === 'string' ? inputText : null;
    const safeOutputText = typeof outputText === 'string' ? outputText : null;

    await db.execute(
      'INSERT INTO cipher_history (user_id, cipher_type, cipher_id, operation, input_length, execution_time_ms, cipher_config, input_text, output_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        cipherType,
        cipherId || null,
        operation,
        safeInputLength,
        executionTimeMs,
        cipherConfigJson,
        safeInputText,
        safeOutputText,
      ]
    );

    // Update user stats
    const statField = operation === 'encrypt' ? 'total_encryptions' : 'total_decryptions';
    await db.execute(
      `INSERT INTO user_stats (user_id, ${statField}, last_activity) VALUES (?, 1, NOW()) ON DUPLICATE KEY UPDATE ${statField} = ${statField} + 1, last_activity = NOW()`,
      [userId]
    );

    res.json({ message: 'History recorded' });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cipher history
app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const requestedLimit = Number.parseInt(String(req.query.limit || '50'), 10);
    const safeLimit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 50;

    // Some MySQL / driver setups don't allow binding LIMIT as a parameter.
    const [history] = await db.execute(
      `SELECT * FROM cipher_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ${safeLimit}`,
      [userId]
    );
    
    res.json(
      history.map((row) => {
        let parsedConfig = null;
        if (row?.cipher_config) {
          try {
            parsedConfig = JSON.parse(row.cipher_config);
          } catch {
            parsedConfig = row.cipher_config;
          }
        }

        return {
          ...row,
          cipher_config: parsedConfig,
        };
      })
    );
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User statistics
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [stats] = await db.execute(
      'SELECT * FROM user_stats WHERE user_id = ?',
      [userId]
    );

    if (stats.length === 0) {
      return res.json({
        total_encryptions: 0,
        total_decryptions: 0,
        challenges_completed: 0,
        total_points: 0,
        streak_days: 0
      });
    }

    res.json(stats[0]);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public ciphers
app.get('/api/public-ciphers', async (req, res) => {
  try {
    const [ciphers] = await db.execute(
      'SELECT c.*, u.username FROM custom_ciphers c JOIN users u ON c.user_id = u.id WHERE c.is_public = TRUE ORDER BY c.usage_count DESC, c.created_at DESC LIMIT 20'
    );

    res.json(ciphers.map(cipher => ({
      ...cipher,
      mapping: JSON.parse(cipher.mapping)
    })));
  } catch (error) {
    console.error('Public ciphers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const trimmedUsername = String(username || '').trim();
    const normalizedEmail = normalizeEmail(email);
    const rawPassword = String(password || '').trim();
    const requestedRole = String(role || 'user').trim().toLowerCase() === 'admin' ? 'admin' : 'user';

    if (!trimmedUsername || !normalizedEmail || !rawPassword) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [normalizedEmail, trimmedUsername]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    await db.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [trimmedUsername, normalizedEmail, hashedPassword, requestedRole]
    );

    res.json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/email-settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM system_email_settings WHERE id = 1 LIMIT 1');
    const row = rows && rows.length > 0 ? rows[0] : null;

    res.json({
      enabled: row ? Boolean(row.enabled) : true,
      provider: row?.provider || 'smtp',
      smtpHost: row?.smtp_host || 'smtp.gmail.com',
      smtpPort: row?.smtp_port ?? 587,
      smtpSecure: row ? (row.smtp_secure === 1 || row.smtp_secure === true) : false,
      smtpUser: row?.smtp_user || '',
      emailFrom: row?.email_from || row?.smtp_user || '',
      hasSmtpPass: Boolean(row?.smtp_pass_enc),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/email-settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const enabled = req.body?.enabled;
    const provider = String(req.body?.provider || 'smtp').trim().toLowerCase();
    const smtpHost = String(req.body?.smtpHost || '').trim();
    const smtpPort = Number.parseInt(String(req.body?.smtpPort || '587'), 10);
    const smtpSecure = Boolean(req.body?.smtpSecure);
    const smtpUser = String(req.body?.smtpUser || '').trim();
    const smtpPass = String(req.body?.smtpPass || '').trim();
    const emailFrom = String(req.body?.emailFrom || '').trim();

    if (provider !== 'smtp' && provider !== 'ethereal') {
      return res.status(400).json({ message: 'Invalid email provider' });
    }

    if (provider === 'smtp') {
      if (!smtpHost || !Number.isFinite(smtpPort) || smtpPort <= 0 || smtpPort > 65535 || !smtpUser) {
        return res.status(400).json({ message: 'SMTP host, port and user are required' });
      }
    }

    const [rows] = await db.execute('SELECT smtp_pass_enc FROM system_email_settings WHERE id = 1 LIMIT 1');
    const existingEnc = rows && rows.length > 0 ? rows[0].smtp_pass_enc : null;
    const nextEnc = smtpPass ? encryptSecret(smtpPass) : existingEnc;

    await db.execute(
      `INSERT INTO system_email_settings
        (id, enabled, provider, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass_enc, email_from)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        enabled = VALUES(enabled),
        provider = VALUES(provider),
        smtp_host = VALUES(smtp_host),
        smtp_port = VALUES(smtp_port),
        smtp_secure = VALUES(smtp_secure),
        smtp_user = VALUES(smtp_user),
        smtp_pass_enc = VALUES(smtp_pass_enc),
        email_from = VALUES(email_from)
      `,
      [
        typeof enabled === 'boolean' ? enabled : true,
        provider,
        smtpHost || null,
        Number.isFinite(smtpPort) ? smtpPort : 587,
        smtpSecure,
        smtpUser || null,
        nextEnc || null,
        emailFrom || null,
      ]
    );

    const [freshRows] = await db.execute('SELECT * FROM system_email_settings WHERE id = 1 LIMIT 1');
    if (freshRows && freshRows.length > 0) {
      const row = freshRows[0];
      emailSettingsCache = {
        enabled: Boolean(row.enabled),
        provider: String(row.provider || '').trim().toLowerCase() || 'smtp',
        smtpHost: row.smtp_host || null,
        smtpPort: row.smtp_port ?? null,
        smtpSecure: row.smtp_secure === 1 || row.smtp_secure === true,
        smtpUser: row.smtp_user || null,
        smtpPass: row.smtp_pass_enc ? decryptSecret(row.smtp_pass_enc) : null,
        emailFrom: row.email_from || null,
      };
    }
    mailTransporter = null;
    etherealAccount = null;

    res.json({ message: 'Email settings saved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at, u.last_login, COUNT(c.id) as cipher_count FROM users u LEFT JOIN custom_ciphers c ON u.id = c.user_id GROUP BY u.id ORDER BY u.created_at DESC'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active } = req.body;
    
    await db.execute(
      'UPDATE users SET role = ?, is_active = ? WHERE id = ?',
      [role, is_active, id]
    );
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [cipherCount] = await db.execute('SELECT COUNT(*) as count FROM custom_ciphers');
    const [activeUsers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE last_login > DATE_SUB(NOW(), INTERVAL 7 DAY)');
    
    res.json({
      totalUsers: userCount[0].count,
      totalCiphers: cipherCount[0].count,
      activeUsers: activeUsers[0].count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Challenge routes
app.get('/api/challenges', authenticateToken, async (req, res) => {
  try {
    const [challenges] = await db.execute(
      // Never return solutions to the client.
      'SELECT id, title, description, encrypted_text, cipher_type, difficulty, hint, points, created_by, created_at FROM cipher_challenges WHERE is_active = TRUE ORDER BY difficulty, created_at DESC'
    );
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reveal a challenge solution (used only when the user explicitly chooses to reveal)
app.get('/api/challenges/:id/reveal', authenticateToken, async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    if (!Number.isFinite(challengeId)) {
      return res.status(400).json({ message: 'Invalid challenge id' });
    }

    const [rows] = await db.execute('SELECT solution FROM cipher_challenges WHERE id = ? LIMIT 1', [challengeId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    return res.json({ solution: rows[0].solution || '' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

const caesarShift = (text, shift) => {
  const s = ((shift % 26) + 26) % 26;
  return String(text)
    .toUpperCase()
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const base = 65;
        return String.fromCharCode(((code - base + s) % 26) + base);
      }
      return ch;
    })
    .join('');
};

// Generate a new easy (very short + predictable) challenge for "lower difficulty" flow
app.post('/api/challenges/generate-easy', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const words = ['CAT', 'DOG', 'SUN', 'MOON', 'TREE', 'BOOK', 'CODE', 'LOCK', 'KEY', 'FISH', 'BIRD', 'STAR'];
    const solution = words[Math.floor(Math.random() * words.length)];
    const shift = 1 + Math.floor(Math.random() * 3); // 1..3
    const encrypted = caesarShift(solution, shift);

    const title = `Easy Practice (Caesar ${shift})`;
    const description = 'A short Caesar cipher word — very easy.';
    const hint = `Shift each letter back by ${shift}.`;

    const [result] = await db.execute(
      'INSERT INTO cipher_challenges (title, description, encrypted_text, cipher_type, difficulty, hint, solution, points, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, encrypted, 'caesar', 'easy', hint, solution, 1, userId]
    );

    const id = result.insertId;
    return res.json({
      challenge: {
        id,
        title,
        description,
        encrypted_text: encrypted,
        cipher_type: 'caesar',
        difficulty: 'easy',
        hint,
        points: 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/challenges/attempt', authenticateToken, async (req, res) => {
  try {
    const { challengeId, answer, timeTakenSeconds } = req.body;
    const userId = req.user.id;

    const safeTimeTakenSeconds = Number.isFinite(Number(timeTakenSeconds))
      ? Math.max(0, parseInt(timeTakenSeconds, 10))
      : null;
    
    const [challenges] = await db.execute(
      'SELECT * FROM cipher_challenges WHERE id = ?',
      [challengeId]
    );
    
    if (challenges.length === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    const challenge = challenges[0];
    const isCorrect = answer.toLowerCase().trim() === challenge.solution.toLowerCase().trim();
    let pointsEarned = isCorrect ? challenge.points : 0;

    // Only the first correct solve of a specific challenge counts for points/stats.
    let isFirstCorrectSolve = false;
    if (isCorrect) {
      const [priorCorrect] = await db.execute(
        'SELECT id FROM user_challenge_attempts WHERE user_id = ? AND challenge_id = ? AND is_correct = TRUE LIMIT 1',
        [userId, challengeId]
      );
      isFirstCorrectSolve = priorCorrect.length === 0;
      if (!isFirstCorrectSolve) {
        pointsEarned = 0;
      }
    }
    
    await db.execute(
      'INSERT INTO user_challenge_attempts (user_id, challenge_id, attempt_text, is_correct, points_earned, time_taken_seconds) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, challengeId, answer, isCorrect, pointsEarned, safeTimeTakenSeconds]
    );

    // Always update last_activity, and add points only on the first correct solve.
    if (isCorrect && isFirstCorrectSolve) {
      await db.execute(
        'INSERT INTO user_stats (user_id, challenges_completed, total_points, last_activity) VALUES (?, 1, ?, NOW()) ON DUPLICATE KEY UPDATE challenges_completed = challenges_completed + 1, total_points = total_points + ?, last_activity = NOW()',
        [userId, pointsEarned, pointsEarned]
      );

      // Award milestone badges based on total challenges completed.
      const [statsRows] = await db.execute(
        'SELECT challenges_completed FROM user_stats WHERE user_id = ?',
        [userId]
      );
      const completedCount = statsRows?.[0]?.challenges_completed || 0;

      if (completedCount >= 3) {
        await db.execute('INSERT IGNORE INTO user_badges (user_id, badge) VALUES (?, ?)', [userId, 'bronze']);
      }
      if (completedCount >= 6) {
        await db.execute('INSERT IGNORE INTO user_badges (user_id, badge) VALUES (?, ?)', [userId, 'silver']);
      }
      if (completedCount >= 11) {
        await db.execute('INSERT IGNORE INTO user_badges (user_id, badge) VALUES (?, ?)', [userId, 'gold']);
      }

      // Diamond badge: solving the hardest active challenge.
      const [hardestRows] = await db.execute(
        "SELECT id FROM cipher_challenges WHERE is_active = TRUE ORDER BY CASE difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 ELSE 0 END DESC, points DESC, id DESC LIMIT 1"
      );
      const hardestId = hardestRows?.[0]?.id;
      if (hardestId && Number(hardestId) === Number(challengeId)) {
        await db.execute('INSERT IGNORE INTO user_badges (user_id, badge) VALUES (?, ?)', [userId, 'diamond']);
      }
    } else {
      await db.execute(
        'INSERT INTO user_stats (user_id, last_activity) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_activity = NOW()',
        [userId]
      );
    }
    
    res.json({
      correct: isCorrect,
      message: isCorrect
        ? (isFirstCorrectSolve ? `Correct! You earned ${pointsEarned} points!` : 'Correct! (Already completed — no additional points)')
        : 'Incorrect answer. Try again!',
      pointsEarned,
      timeTakenSeconds: safeTimeTakenSeconds
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Current user profile (stats + badges)
app.get('/api/me/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [userRows] = await db.execute(
      'SELECT id, username, email, role, last_login, created_at FROM users WHERE id = ?',
      [userId]
    );

    const [statsRows] = await db.execute(
      'SELECT total_encryptions, total_decryptions, favorite_cipher, challenges_completed, total_points, streak_days, last_activity FROM user_stats WHERE user_id = ?',
      [userId]
    );

    const [badgeRows] = await db.execute(
      'SELECT ub.badge, ub.earned_at, ba.url_path FROM user_badges ub LEFT JOIN badge_assets ba ON ub.badge = ba.badge WHERE ub.user_id = ? ORDER BY ub.earned_at ASC',
      [userId]
    );

    const [badgeAssetRows] = await db.execute(
      'SELECT badge, url_path, file_name FROM badge_assets ORDER BY badge ASC'
    );

    res.json({
      user: userRows?.[0] || null,
      stats: statsRows?.[0] || null,
      badges: Array.isArray(badgeRows) ? badgeRows : [],
      badgeAssets: Array.isArray(badgeAssetRows) ? badgeAssetRows : [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Message favorite toggle
app.put('/api/messages/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_favorite } = req.body;
    const userId = req.user.id;
    
    await db.execute(
      'UPDATE saved_messages SET is_favorite = ? WHERE id = ? AND user_id = ?',
      [is_favorite, id, userId]
    );
    
    res.json({ message: 'Favorite status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message
app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await db.execute(
      'DELETE FROM saved_messages WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Shared cipher routes
app.post('/api/ciphers/:id/share', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { shareWith, permissions } = req.body;
    const userId = req.user.id;
    
    const shareToken = Math.random().toString(36).substring(2, 15);
    
    await db.execute(
      'INSERT INTO shared_ciphers (cipher_id, shared_by, shared_with, share_token, permissions) VALUES (?, ?, ?, ?, ?)',
      [id, userId, shareWith || null, shareToken, permissions || 'view']
    );
    
    res.json({ message: 'Cipher shared successfully', shareToken });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const [shared] = await db.execute(
      'SELECT sc.*, cc.name, cc.description, cc.mapping, u.username FROM shared_ciphers sc JOIN custom_ciphers cc ON sc.cipher_id = cc.id JOIN users u ON sc.shared_by = u.id WHERE sc.share_token = ? AND sc.is_active = TRUE',
      [token]
    );
    
    if (shared.length === 0) {
      return res.status(404).json({ message: 'Shared cipher not found' });
    }
    
    const cipher = shared[0];
    res.json({
      ...cipher,
      mapping: JSON.parse(cipher.mapping)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// User account management
app.post('/api/user/deactivate/request-otp', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.execute('SELECT email FROM users WHERE id = ? LIMIT 1', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    try {
      await createAndSendOtp({ email: users[0].email, purpose: 'deactivate', eventType: 'otp_deactivate' });
    } catch (e) {
      if (e?.statusCode) return res.status(e.statusCode).json({ message: e.message });
      throw e;
    }

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Deactivate OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/user/deactivate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const otpValue = String(req.body?.otp || '').trim();
    if (!otpValue) {
      return res.status(400).json({ message: 'OTP is required to deactivate your account' });
    }

    const [users] = await db.execute('SELECT email FROM users WHERE id = ? LIMIT 1', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    const otpResult = await verifyOtp({ email: users[0].email, purpose: 'deactivate', otp: otpValue });
    if (!otpResult.ok) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    await db.execute(
      'UPDATE users SET is_active = FALSE, deactivated_at = NOW() WHERE id = ?',
      [userId]
    );
    
    res.json({ message: 'Account deactivated successfully. You can reactivate within 30 days by logging in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/user/reactivate', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Reactivate account
    await db.execute(
      'UPDATE users SET is_active = TRUE WHERE id = ?',
      [user.id]
    );
    
    res.json({ message: 'Account reactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/user/delete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const otpValue = String(req.body?.otp || '').trim();
    if (!otpValue) {
      return res.status(400).json({ message: 'OTP is required to delete your account' });
    }

    const [users] = await db.execute('SELECT email FROM users WHERE id = ? LIMIT 1', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    const otpResult = await verifyOtp({ email: users[0].email, purpose: 'delete', otp: otpValue });
    if (!otpResult.ok) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/user/delete/request-otp', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.execute('SELECT email FROM users WHERE id = ? LIMIT 1', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    try {
      await createAndSendOtp({ email: users[0].email, purpose: 'delete', eventType: 'otp_delete' });
    } catch (e) {
      if (e?.statusCode) return res.status(e.statusCode).json({ message: e.message });
      throw e;
    }

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Delete OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Cipher API is running',
    features: [
      'JWT Authentication',
      'Custom Cipher Builder', 
      'Message History',
      'User Statistics',
      'Public Cipher Gallery',
      'Cipher Usage Tracking',
      'Admin Dashboard',
      'Cipher Challenges',
      'Saved Messages',
      'Cipher Sharing'
    ]
  });
});

// Start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});