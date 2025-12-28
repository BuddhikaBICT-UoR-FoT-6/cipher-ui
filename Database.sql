-- Contains SQL commands for database setup and user role update
CREATE DATABASE cipher_db;

UPDATE users SET role = 'admin' WHERE email = 'admin@gmail.com';
