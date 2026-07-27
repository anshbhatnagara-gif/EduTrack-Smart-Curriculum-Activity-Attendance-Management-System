-- Migration 004: Add password_reset_otps table
-- Description: Creates the table to securely handle OTP based password resets

CREATE TABLE IF NOT EXISTS password_reset_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempt_count INT DEFAULT 0 NOT NULL,
  max_attempts INT DEFAULT 5 NOT NULL,
  is_used TINYINT(1) DEFAULT 0 NOT NULL,
  requested_ip VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reset_otps_user (user_id),
  INDEX idx_reset_otps_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
