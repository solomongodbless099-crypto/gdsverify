-- =========================================================
-- GDSVERIFY.COM
-- DATABASE STRUCTURE
-- GLOBAL DIGITAL VERIFICATION SERVICES
-- =========================================================

CREATE DATABASE IF NOT EXISTS gdsverify_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE gdsverify_db;


-- =========================================================
-- USERS
-- CUSTOMER ACCOUNTS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(190) NOT NULL,

    phone VARCHAR(30) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    wallet_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    status ENUM(
        'active',
        'suspended',
        'blocked'
    ) NOT NULL DEFAULT 'active',

    email_verified TINYINT(1) NOT NULL DEFAULT 0,

    phone_verified TINYINT(1) NOT NULL DEFAULT 0,

    remember_token VARCHAR(255) DEFAULT NULL,

    last_login_at DATETIME DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_email (email),

    UNIQUE KEY unique_phone (phone),

    KEY idx_status (status),

    KEY idx_created_at (created_at)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- PROVIDERS
-- GDSVERIFY USES 5SIM ONLY
-- =========================================================

CREATE TABLE IF NOT EXISTS providers (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    name VARCHAR(100) NOT NULL,

    code VARCHAR(50) NOT NULL,

    api_base_url VARCHAR(255) DEFAULT NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    balance DECIMAL(15,6) NOT NULL DEFAULT 0.000000,

    last_sync_at DATETIME DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_provider_code (code),

    KEY idx_provider_status (status)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- INSERT 5SIM PROVIDER
-- =========================================================

INSERT INTO providers (
    name,
    code,
    api_base_url,
    status
)
VALUES (
    '5SIM',
    '5sim',
    'https://5sim.net/v1',
    'active'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    api_base_url = VALUES(api_base_url),
    status = VALUES(status);


-- =========================================================
-- OTP COUNTRIES
-- =========================================================

CREATE TABLE IF NOT EXISTS otp_countries (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    country_code VARCHAR(20) NOT NULL,

    country_name VARCHAR(150) NOT NULL,

    iso_code VARCHAR(10) DEFAULT NULL,

    dial_code VARCHAR(20) DEFAULT NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    sort_order INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_country_code (country_code),

    KEY idx_country_status (status),

    KEY idx_country_name (country_name)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- OTP SERVICES
-- =========================================================

CREATE TABLE IF NOT EXISTS otp_services (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    service_code VARCHAR(100) NOT NULL,

    service_name VARCHAR(150) NOT NULL,

    category VARCHAR(100) DEFAULT 'OTP',

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_service_code (service_code),

    KEY idx_service_status (status),

    KEY idx_service_category (category)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- OTP PROFIT SETTINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS otp_profit_settings (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    profit_type ENUM(
        'fixed',
        'percentage'
    ) NOT NULL DEFAULT 'fixed',

    profit_value DECIMAL(15,4) NOT NULL DEFAULT 0.0000,

    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',

    usd_to_ngn_rate DECIMAL(15,4) NOT NULL DEFAULT 1500.0000,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- DEFAULT OTP PROFIT SETTING
-- =========================================================

INSERT INTO otp_profit_settings (
    profit_type,
    profit_value,
    currency,
    usd_to_ngn_rate,
    status
)
SELECT
    'fixed',
    0.0000,
    'NGN',
    1500.0000,
    'active'
WHERE NOT EXISTS (
    SELECT 1
    FROM otp_profit_settings
);


-- =========================================================
-- PROVIDER PRICES
-- 5SIM LIVE/IMPORTED PRICING
-- =========================================================

CREATE TABLE IF NOT EXISTS provider_prices (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    provider_id INT UNSIGNED NOT NULL,

    country_code VARCHAR(50) NOT NULL,

    country_name VARCHAR(150) DEFAULT NULL,

    service_code VARCHAR(150) NOT NULL,

    service_name VARCHAR(150) DEFAULT NULL,

    number_type VARCHAR(100) DEFAULT NULL,

    provider_price_usd DECIMAL(15,6) NOT NULL DEFAULT 0.000000,

    selling_price_ngn DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    stock INT NOT NULL DEFAULT 0,

    provider_product VARCHAR(255) DEFAULT NULL,

    provider_data JSON DEFAULT NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    last_synced_at DATETIME DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_provider (provider_id),

    KEY idx_country (country_code),

    KEY idx_service (service_code),

    KEY idx_country_service (
        country_code,
        service_code
    ),

    KEY idx_status (status),

    CONSTRAINT fk_provider_prices_provider
        FOREIGN KEY (provider_id)
        REFERENCES providers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
