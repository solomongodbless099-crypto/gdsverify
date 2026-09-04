-- =========================================================
-- GDSVERIFY.COM
-- GLOBAL DIGITAL VERIFICATION SERVICES
-- DATABASE.SQL
-- PART 1 — DATABASE + USERS + SECURITY + SETTINGS
-- =========================================================

CREATE DATABASE IF NOT EXISTS gdsverify_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE gdsverify_db;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(190) NOT NULL,

    phone VARCHAR(30) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    wallet_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    status ENUM(
        'active',
        'suspended',
        'blocked',
        'pending'
    ) NOT NULL DEFAULT 'active',

    email_verified TINYINT(1) NOT NULL DEFAULT 0,

    phone_verified TINYINT(1) NOT NULL DEFAULT 0,

    remember_token VARCHAR(255) DEFAULT NULL,

    last_login_at DATETIME DEFAULT NULL,

    last_login_ip VARCHAR(45) DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_email (email),

    UNIQUE KEY unique_phone (phone),

    KEY idx_user_status (status),

    KEY idx_user_created (created_at)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- LOGIN ATTEMPTS
-- =========================================================

CREATE TABLE IF NOT EXISTS login_attempts (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    email VARCHAR(190) DEFAULT NULL,

    ip_address VARCHAR(45) DEFAULT NULL,

    user_agent VARCHAR(500) DEFAULT NULL,

    success TINYINT(1) NOT NULL DEFAULT 0,

    attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_login_email (email),

    KEY idx_login_ip (ip_address),

    KEY idx_login_time (attempted_at)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- SECURITY LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS security_logs (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED DEFAULT NULL,

    event_type VARCHAR(100) NOT NULL,

    description TEXT DEFAULT NULL,

    ip_address VARCHAR(45) DEFAULT NULL,

    user_agent VARCHAR(500) DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_security_user (user_id),

    KEY idx_security_event (event_type),

    KEY idx_security_created (created_at),

    CONSTRAINT fk_security_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- SETTINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS settings (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    setting_key VARCHAR(100) NOT NULL,

    setting_value TEXT DEFAULT NULL,

    description VARCHAR(255) DEFAULT NULL,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_setting_key (setting_key)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- DEFAULT SYSTEM SETTINGS
-- =========================================================

INSERT INTO settings
    (setting_key, setting_value, description)
VALUES
    (
        'usd_to_ngn',
        '1500',
        'USD to NGN exchange rate'
    ),
    (
        'currency',
        'NGN',
        'Customer currency'
    ),
    (
        'provider_currency',
        'USD',
        'Provider currency'
    ),
    (
        'default_profit_type',
        'fixed',
        'Default OTP profit calculation type'
    ),
    (
        'default_profit_value',
        '0',
        'Default OTP profit value'
    ),
    (
        'site_name',
        'GDSVERIFY',
        'Website name'
    ),
    (
        'site_url',
        'https://gdsverify.com',
        'Website URL'
    ),
    (
        'support_whatsapp',
        '2348123608821',
        'Customer WhatsApp support number'
    )
ON DUPLICATE KEY UPDATE
    setting_value = VALUES(setting_value);


-- =========================================================
-- ADMIN USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS admin_users (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(190) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM(
        'super_admin',
        'admin',
        'support'
    ) NOT NULL DEFAULT 'admin',

    status ENUM(
        'active',
        'suspended',
        'blocked'
    ) NOT NULL DEFAULT 'active',

    last_login_at DATETIME DEFAULT NULL,

    last_login_ip VARCHAR(45) DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_admin_email (email),

    KEY idx_admin_status (status)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- ADMIN SECURITY LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS admin_logs (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    admin_id BIGINT UNSIGNED DEFAULT NULL,

    action VARCHAR(150) NOT NULL,

    description TEXT DEFAULT NULL,

    ip_address VARCHAR(45) DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_admin_log_admin (admin_id),

    KEY idx_admin_log_action (action),

    KEY idx_admin_log_created (created_at),

    CONSTRAINT fk_admin_log_user
        FOREIGN KEY (admin_id)
        REFERENCES admin_users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- END OF DATABASE.SQL — PART 1
-- =========================================================
-- =========================================================
-- GDSVERIFY.COM
-- DATABASE.SQL
-- PART 2 — 5SIM PROVIDER + OTP SYSTEM + PRICING
-- =========================================================

USE gdsverify_db;


-- =========================================================
-- PROVIDERS
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

    priority INT NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_provider_code (code),

    KEY idx_provider_status (status),

    KEY idx_provider_priority (priority)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- ONLY ACTIVE PROVIDER: 5SIM
-- =========================================================

INSERT INTO providers
    (
        name,
        code,
        api_base_url,
        status,
        priority
    )
VALUES
    (
        '5SIM',
        '5sim',
        'https://5sim.net/v1',
        'active',
        1
    )
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    api_base_url = VALUES(api_base_url),
    status = VALUES(status),
    priority = VALUES(priority);


-- =========================================================
-- OTP COUNTRIES
-- =========================================================

CREATE TABLE IF NOT EXISTS otp_countries (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    country_code VARCHAR(20) NOT NULL,

    country_name VARCHAR(150) NOT NULL,

    iso_code VARCHAR(10) DEFAULT NULL,

    flag VARCHAR(20) DEFAULT NULL,

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

    KEY idx_country_name (country_name),

    KEY idx_country_sort (sort_order)

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

    icon VARCHAR(255) DEFAULT NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    sort_order INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_service_code (service_code),

    KEY idx_service_status (status),

    KEY idx_service_name (service_name),

    KEY idx_service_sort (sort_order)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- PROVIDER PRICES
-- =========================================================

CREATE TABLE IF NOT EXISTS provider_prices (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    provider_id INT UNSIGNED NOT NULL,

    country_code VARCHAR(20) NOT NULL,

    service_code VARCHAR(100) NOT NULL,

    number_type VARCHAR(100) DEFAULT 'activation',

    provider_price_usd DECIMAL(12,6) NOT NULL DEFAULT 0.000000,

    selling_price_ngn DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    stock INT NOT NULL DEFAULT 0,

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

    UNIQUE KEY unique_provider_price (
        provider_id,
        country_code,
        service_code,
        number_type
    ),

    KEY idx_provider_prices_provider (provider_id),

    KEY idx_provider_prices_country (country_code),

    KEY idx_provider_prices_service (service_code),

    KEY idx_provider_prices_stock (stock),

    KEY idx_provider_prices_status (status),

    KEY idx_provider_prices_sync (last_synced_at),

    CONSTRAINT fk_provider_prices_provider
        FOREIGN KEY (provider_id)
        REFERENCES providers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

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

    profit_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    minimum_profit_ngn DECIMAL(15,2) NOT NULL DEFAULT 0.00,

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
-- DEFAULT PROFIT RULE
-- =========================================================

INSERT INTO otp_profit_settings
    (
        profit_type,
        profit_value,
        minimum_profit_ngn,
        status
    )
VALUES
    (
        'fixed',
        0.00,
        0.00,
        'active'
    );


-- =========================================================
-- CUSTOMER OTP PRICING OVERRIDES
-- =========================================================

CREATE TABLE IF NOT EXISTS otp_prices (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    country_code VARCHAR(20) NOT NULL,

    service_code VARCHAR(100) NOT NULL,

    provider_id INT UNSIGNED NOT NULL,

    provider_price_usd DECIMAL(12,6) NOT NULL DEFAULT 0.000000,

    exchange_rate DECIMAL(12,4) NOT NULL DEFAULT 1500.0000,

    customer_price_ngn DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    profit_type ENUM(
        'fixed',
        'percentage'
    ) NOT NULL DEFAULT 'fixed',

    profit_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    stock INT NOT NULL DEFAULT 0,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    last_synced_at DATETIME DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_otp_price (
        country_code,
        service_code,
        provider_id
    ),

    KEY idx_otp_price_country (country_code),

    KEY idx_otp_price_service (service_code),

    KEY idx_otp_price_provider (provider_id),

    KEY idx_otp_price_status (status),

    CONSTRAINT fk_otp_prices_provider
        FOREIGN KEY (provider_id)
        REFERENCES providers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- END OF DATABASE.SQL — PART 2
-- =========================================================

-- =========================================================
-- GDSVERIFY.COM
-- DATABASE.SQL
-- PART 3 — WALLET + TRANSACTIONS + DEPOSITS + OTP ORDERS
-- =========================================================

USE gdsverify_db;


-- =========================================================
-- WALLET TRANSACTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS transactions (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    reference VARCHAR(150) NOT NULL,

    type ENUM(
        'credit',
        'debit'
    ) NOT NULL,

    category ENUM(
        'wallet_funding',
        'otp_purchase',
        'otp_refund',
        'airtime_purchase',
        'data_purchase',
        'social_boost',
        'adjustment',
        'refund',
        'other'
    ) NOT NULL DEFAULT 'other',

    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    balance_before DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    balance_after DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    description VARCHAR(500) DEFAULT NULL,

    status ENUM(
        'pending',
        'completed',
        'failed',
        'cancelled'
    ) NOT NULL DEFAULT 'completed',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_transaction_reference (reference),

    KEY idx_transaction_user (user_id),

    KEY idx_transaction_type (type),

    KEY idx_transaction_category (category),

    KEY idx_transaction_status (status),

    KEY idx_transaction_created (created_at),

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- WALLET DEPOSITS
-- =========================================================

CREATE TABLE IF NOT EXISTS deposits (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    reference VARCHAR(150) NOT NULL,

    payment_reference VARCHAR(150) DEFAULT NULL,

    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',

    payment_method VARCHAR(50) NOT NULL DEFAULT 'flutterwave',

    status ENUM(
        'pending',
        'successful',
        'failed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    gateway_response TEXT DEFAULT NULL,

    paid_at DATETIME DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_deposit_reference (reference),

    KEY idx_deposit_user (user_id),

    KEY idx_deposit_payment_reference (payment_reference),

    KEY idx_deposit_status (status),

    KEY idx_deposit_created (created_at),

    CONSTRAINT fk_deposits_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- OTP ORDERS
-- =========================================================

CREATE TABLE IF NOT EXISTS orders (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    provider_id INT UNSIGNED NOT NULL,

    order_reference VARCHAR(150) NOT NULL,

    provider_order_id VARCHAR(150) DEFAULT NULL,

    country_code VARCHAR(20) NOT NULL,

    service_code VARCHAR(100) NOT NULL,

    number_type VARCHAR(100) NOT NULL DEFAULT 'activation',

    phone_number VARCHAR(50) DEFAULT NULL,

    provider_price_usd DECIMAL(12,6) NOT NULL DEFAULT 0.000000,

    exchange_rate DECIMAL(12,4) NOT NULL DEFAULT 1500.0000,

    customer_price_ngn DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    otp_code VARCHAR(50) DEFAULT NULL,

    provider_status VARCHAR(100) DEFAULT NULL,

    status ENUM(
        'pending',
        'active',
        'completed',
        'cancelled',
        'expired',
        'failed'
    ) NOT NULL DEFAULT 'pending',

    sms_received_at DATETIME DEFAULT NULL,

    expires_at DATETIME DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_order_reference (order_reference),

    KEY idx_order_user (user_id),

    KEY idx_order_provider (provider_id),

    KEY idx_order_provider_id (provider_order_id),

    KEY idx_order_country (country_code),

    KEY idx_order_service (service_code),

    KEY idx_order_status (status),

    KEY idx_order_created (created_at),

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_orders_provider
        FOREIGN KEY (provider_id)
        REFERENCES providers(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- OTP ORDER EVENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS order_events (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    order_id BIGINT UNSIGNED NOT NULL,

    event_type VARCHAR(100) NOT NULL,

    message TEXT DEFAULT NULL,

    provider_response JSON DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_order_event_order (order_id),

    KEY idx_order_event_type (event_type),

    KEY idx_order_event_created (created_at),

    CONSTRAINT fk_order_events_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- CUSTOMER NOTIFICATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    type ENUM(
        'info',
        'success',
        'warning',
        'error',
        'order',
        'wallet',
        'system'
    ) NOT NULL DEFAULT 'info',

    is_read TINYINT(1) NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    read_at DATETIME DEFAULT NULL,

    PRIMARY KEY (id),

    KEY idx_notification_user (user_id),

    KEY idx_notification_read (is_read),

    KEY idx_notification_created (created_at),

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- END OF DATABASE.SQL — PART 3
-- =========================================================

-- =========================================================
-- GDSVERIFY.COM
-- DATABASE.SQL
-- PART 4 — OTHER SERVICES + PASSWORD RESET + SUPPORT
-- =========================================================

USE gdsverify_db;


-- =========================================================
-- AIRTIME PRICES
-- =========================================================

CREATE TABLE IF NOT EXISTS airtime_prices (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    network VARCHAR(100) NOT NULL,

    network_code VARCHAR(50) NOT NULL,

    minimum_amount DECIMAL(15,2) NOT NULL DEFAULT 100.00,

    maximum_amount DECIMAL(15,2) NOT NULL DEFAULT 100000.00,

    profit_type ENUM(
        'fixed',
        'percentage'
    ) NOT NULL DEFAULT 'fixed',

    profit_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_airtime_network (network_code),

    KEY idx_airtime_status (status)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- AIRTIME ORDERS
-- =========================================================

CREATE TABLE IF NOT EXISTS airtime_orders (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    reference VARCHAR(150) NOT NULL,

    network VARCHAR(100) NOT NULL,

    network_code VARCHAR(50) NOT NULL,

    phone_number VARCHAR(30) NOT NULL,

    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    status ENUM(
        'pending',
        'successful',
        'failed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    provider_reference VARCHAR(150) DEFAULT NULL,

    provider_response JSON DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_airtime_reference (reference),

    KEY idx_airtime_order_user (user_id),

    KEY idx_airtime_order_status (status),

    KEY idx_airtime_order_created (created_at),

    CONSTRAINT fk_airtime_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- DATA PLANS
-- =========================================================

CREATE TABLE IF NOT EXISTS data_plans (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    network VARCHAR(100) NOT NULL,

    network_code VARCHAR(50) NOT NULL,

    plan_code VARCHAR(100) NOT NULL,

    plan_name VARCHAR(200) NOT NULL,

    validity VARCHAR(100) DEFAULT NULL,

    provider_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    selling_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    sort_order INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_data_plan (
        network_code,
        plan_code
    ),

    KEY idx_data_plan_network (network_code),

    KEY idx_data_plan_status (status),

    KEY idx_data_plan_sort (sort_order)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- DATA ORDERS
-- =========================================================

CREATE TABLE IF NOT EXISTS data_orders (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    reference VARCHAR(150) NOT NULL,

    network VARCHAR(100) NOT NULL,

    network_code VARCHAR(50) NOT NULL,

    plan_code VARCHAR(100) NOT NULL,

    plan_name VARCHAR(200) NOT NULL,

    phone_number VARCHAR(30) NOT NULL,

    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    status ENUM(
        'pending',
        'successful',
        'failed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    provider_reference VARCHAR(150) DEFAULT NULL,

    provider_response JSON DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_data_reference (reference),

    KEY idx_data_order_user (user_id),

    KEY idx_data_order_status (status),

    KEY idx_data_order_created (created_at),

    CONSTRAINT fk_data_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- SOCIAL BOOST SERVICES
-- =========================================================

CREATE TABLE IF NOT EXISTS boost_services (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    platform VARCHAR(100) NOT NULL,

    service_code VARCHAR(100) NOT NULL,

    service_name VARCHAR(200) NOT NULL,

    description TEXT DEFAULT NULL,

    minimum_quantity INT UNSIGNED NOT NULL DEFAULT 1,

    maximum_quantity INT UNSIGNED NOT NULL DEFAULT 100000,

    price_per_1000 DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    sort_order INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_boost_service (
        platform,
        service_code
    ),

    KEY idx_boost_platform (platform),

    KEY idx_boost_status (status),

    KEY idx_boost_sort (sort_order)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- SOCIAL BOOST ORDERS
-- =========================================================

CREATE TABLE IF NOT EXISTS boost_orders (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    service_id INT UNSIGNED NOT NULL,

    reference VARCHAR(150) NOT NULL,

    target_url VARCHAR(1000) NOT NULL,

    quantity INT UNSIGNED NOT NULL,

    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    status ENUM(
        'pending',
        'processing',
        'completed',
        'partial',
        'cancelled',
        'failed'
    ) NOT NULL DEFAULT 'pending',

    provider_order_id VARCHAR(150) DEFAULT NULL,

    provider_response JSON DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_boost_reference (reference),

    KEY idx_boost_order_user (user_id),

    KEY idx_boost_order_service (service_id),

    KEY idx_boost_order_status (status),

    CONSTRAINT fk_boost_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_boost_orders_service
        FOREIGN KEY (service_id)
        REFERENCES boost_services(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- PASSWORD RESET TOKENS
-- =========================================================

CREATE TABLE IF NOT EXISTS password_resets (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    token_hash VARCHAR(255) NOT NULL,

    expires_at DATETIME NOT NULL,

    used_at DATETIME DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_reset_token (token_hash),

    KEY idx_reset_user (user_id),

    KEY idx_reset_expiry (expires_at),

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- SUPPORT TICKETS
-- =========================================================

CREATE TABLE IF NOT EXISTS support_tickets (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    ticket_reference VARCHAR(100) NOT NULL,

    subject VARCHAR(255) NOT NULL,

    category VARCHAR(100) NOT NULL DEFAULT 'general',

    priority ENUM(
        'low',
        'normal',
        'high',
        'urgent'
    ) NOT NULL DEFAULT 'normal',

    status ENUM(
        'open',
        'pending',
        'resolved',
        'closed'
    ) NOT NULL DEFAULT 'open',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_ticket_reference (
        ticket_reference
    ),

    KEY idx_ticket_user (user_id),

    KEY idx_ticket_status (status),

    KEY idx_ticket_priority (priority),

    CONSTRAINT fk_support_ticket_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- SUPPORT TICKET MESSAGES
-- =========================================================

CREATE TABLE IF NOT EXISTS support_messages (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    ticket_id BIGINT UNSIGNED NOT NULL,

    sender_type ENUM(
        'customer',
        'admin'
    ) NOT NULL,

    sender_id BIGINT UNSIGNED DEFAULT NULL,

    message TEXT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_support_message_ticket (ticket_id),

    KEY idx_support_message_created (created_at),

    CONSTRAINT fk_support_message_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES support_tickets(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- SYSTEM ACTIVITY LOG
-- =========================================================

CREATE TABLE IF NOT EXISTS activity_logs (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED DEFAULT NULL,

    action VARCHAR(150) NOT NULL,

    description TEXT DEFAULT NULL,

    ip_address VARCHAR(45) DEFAULT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_activity_user (user_id),

    KEY idx_activity_action (action),

    KEY idx_activity_created (created_at),

    CONSTRAINT fk_activity_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- END OF DATABASE.SQL — PART 4
-- =========================================================


