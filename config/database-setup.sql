-- ===================================
-- DATABASE SETUP - DEFAULT TEMPLATE
-- ===================================
-- Create database
CREATE DATABASE IF NOT EXISTS `voting_system_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `voting_system_db`;
-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'user') DEFAULT 'user',
    `is_active` BOOLEAN DEFAULT true,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`),
    INDEX `idx_role` (`role`)
) ENGINE = InnoDB;
-- Create voting_sessions table
CREATE TABLE IF NOT EXISTS `voting_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME NOT NULL,
    `is_active` BOOLEAN DEFAULT false,
    `created_by` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_active` (`is_active`),
    INDEX `idx_dates` (`start_time`, `end_time`)
) ENGINE = InnoDB;
-- Create candidates table
CREATE TABLE IF NOT EXISTS `candidates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `voting_session_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `image_url` VARCHAR(500),
    `vote_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`voting_session_id`) REFERENCES `voting_sessions`(`id`) ON DELETE CASCADE,
    INDEX `idx_session` (`voting_session_id`),
    INDEX `idx_vote_count` (`vote_count`)
) ENGINE = InnoDB;
-- Create votes table
CREATE TABLE IF NOT EXISTS `votes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `candidate_id` INT NOT NULL,
    `voting_session_id` INT NOT NULL,
    `ip_address` VARCHAR(45),
    `user_agent` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`voting_session_id`) REFERENCES `voting_sessions`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_vote` (`user_id`, `voting_session_id`),
    INDEX `idx_session` (`voting_session_id`),
    INDEX `idx_candidate` (`candidate_id`)
) ENGINE = InnoDB;
-- Insert default admin user
INSERT INTO `users` (`email`, `password_hash`, `full_name`, `role`)
VALUES (
        'admin@your-domain.com',
        '$2b$10$defaulthashedpassword',
        'System Administrator',
        'admin'
    ) ON DUPLICATE KEY
UPDATE `email` =
VALUES(`email`);
-- Insert sample voting session
INSERT INTO `voting_sessions` (
        `title`,
        `description`,
        `start_time`,
        `end_time`,
        `created_by`
    )
VALUES (
        'Sample Election 2025',
        'Default voting session template',
        '2025-01-01 09:00:00',
        '2025-12-31 23:59:59',
        1
    ) ON DUPLICATE KEY
UPDATE `title` =
VALUES(`title`);
COMMIT;
-- ===================================
-- SETUP COMPLETED SUCCESSFULLY
-- ===================================