-- CipherProject Database Setup (Manual)
-- Note: The backend auto-creates these tables on startup.
-- Use this script only if you want to create everything manually.

CREATE DATABASE IF NOT EXISTS cipher_db;
USE cipher_db;

-- Users table
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
);

-- OTPs for email verification / sensitive actions
CREATE TABLE IF NOT EXISTS email_otps (
	id INT AUTO_INCREMENT PRIMARY KEY,
	email VARCHAR(100) NOT NULL,
	purpose ENUM('register', 'deactivate', 'delete') NOT NULL,
	otp_hash VARCHAR(255) NOT NULL,
	expires_at TIMESTAMP NOT NULL,
	consumed_at TIMESTAMP NULL,
	attempts INT DEFAULT 0,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	INDEX idx_email_purpose (email, purpose),
	INDEX idx_expires (expires_at)
);

-- Email cooldowns to prevent spam (failed login, OTP resend, etc.)
CREATE TABLE IF NOT EXISTS email_event_log (
	id INT AUTO_INCREMENT PRIMARY KEY,
	email VARCHAR(100) NOT NULL,
	event_type VARCHAR(50) NOT NULL,
	last_sent_at TIMESTAMP NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uniq_email_event (email, event_type),
	INDEX idx_event_last_sent (event_type, last_sent_at)
);

-- System email settings (admin configurable)
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
);

INSERT IGNORE INTO system_email_settings (id, enabled, provider, smtp_host, smtp_port, smtp_secure)
VALUES (1, TRUE, 'smtp', 'smtp.gmail.com', 587, FALSE);

-- Custom ciphers table
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
);

-- Cipher history table for tracking usage
CREATE TABLE IF NOT EXISTS cipher_history (
	id INT AUTO_INCREMENT PRIMARY KEY,
	user_id INT,
	cipher_type VARCHAR(50) NOT NULL,
	cipher_id INT NULL,
	operation ENUM('encrypt', 'decrypt') NOT NULL,
	input_length INT,
	execution_time_ms INT,
	cipher_config JSON NULL,
	input_text TEXT NULL,
	output_text TEXT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
	FOREIGN KEY (cipher_id) REFERENCES custom_ciphers(id) ON DELETE SET NULL,
	INDEX idx_user_cipher (user_id, cipher_type),
	INDEX idx_created_at (created_at)
);

-- Saved messages table
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
);

-- Cipher challenges table
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
);

-- User challenge attempts table
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
);

-- User statistics table
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
);

-- Badge tables
CREATE TABLE IF NOT EXISTS user_badges (
	id INT AUTO_INCREMENT PRIMARY KEY,
	user_id INT NOT NULL,
	badge ENUM('bronze', 'silver', 'gold', 'diamond') NOT NULL,
	earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	UNIQUE KEY uniq_user_badge (user_id, badge),
	INDEX idx_user (user_id)
);

CREATE TABLE IF NOT EXISTS badge_assets (
	id INT AUTO_INCREMENT PRIMARY KEY,
	badge ENUM('bronze', 'silver', 'gold', 'diamond') NOT NULL,
	file_name VARCHAR(255) NOT NULL,
	url_path VARCHAR(255) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE KEY uniq_badge (badge)
);

INSERT IGNORE INTO badge_assets (badge, file_name, url_path) VALUES
('bronze', 'Bronze.png', '/badges/Bronze.png'),
('silver', 'Silver.png', '/badges/Silver.png'),
('gold', 'Gold.jpg', '/badges/Gold.jpg'),
('diamond', 'Diamond.png', '/badges/Diamond.png');

-- Shared ciphers table
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
);

-- Optional: promote an existing user to admin
-- UPDATE users SET role = 'admin' WHERE email = 'admin@gmail.com';

-- Optional: create a new admin user (replace password hash)
-- INSERT INTO users (username, email, password, role, is_active)
-- VALUES ('admin', 'admin@gmail.com', '<bcrypt_hash_here>', 'admin', TRUE);
