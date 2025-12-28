const mysql = require('mysql2/promise');
require('dotenv').config();

async function reactivateAccount() {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cipher_db'
    });

    // Reactivate the account with email Cypher456@gmail.com
    const [result] = await db.execute(
      'UPDATE users SET is_active = TRUE WHERE email = ?',
      ['Cypher456@gmail.com']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Account reactivated successfully!');
    } else {
      console.log('❌ No account found with that email');
    }

    await db.end();
  } catch (error) {
    console.error('❌ Error reactivating account:', error);
  }
}

reactivateAccount();