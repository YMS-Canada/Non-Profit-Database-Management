CREATE TABLE city (
    city_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL
);

CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE users (
    users_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    whatsapp VARCHAR(50),
    role VARCHAR(50) CHECK (role IN ('ADMIN', 'TREASURER')),
    password_hash TEXT NOT NULL,
    city_id INT REFERENCES city(city_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    invited_at TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE budget_request (
    request_id SERIAL PRIMARY KEY,
    city_id INT REFERENCES city(city_id) ON DELETE RESTRICT,
    requester_id INT REFERENCES users(users_id) ON DELETE SET NULL,
    recipient_id INT REFERENCES users(users_id) ON DELETE SET NULL,
    month VARCHAR(20) NOT NULL,
    description TEXT,
    status VARCHAR(10) CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE requested_event (
    req_event_id SERIAL PRIMARY KEY,
    request_id INT REFERENCES budget_request(request_id),
    name VARCHAR(100),
    event_date DATE,
    total_amount NUMERIC(10, 2),
    notes TEXT
);

CREATE TABLE requested_break_down_line (
    line_id SERIAL PRIMARY KEY,
    req_event_id INT REFERENCES requested_event(req_event_id),
    category_id INT REFERENCES category(category_id),
    description TEXT,
    amount NUMERIC(10, 2)
);

CREATE TABLE approval (
    approval_id SERIAL PRIMARY KEY,
    request_id INT REFERENCES budget_request(request_id),
    approver_id INT REFERENCES users(users_id),
    decision VARCHAR(20) CHECK (decision IN ('YES', 'NO-PLEASE RESEND')),
    note TEXT,
    decided_at TIMESTAMP
);

CREATE TABLE event (
    event_id SERIAL PRIMARY KEY,
    city_id INT REFERENCES city(city_id),
    name VARCHAR(50),
    event_date DATE,
    attendees_count INT NOT NULL,
    prepared_by INT REFERENCES users(users_id)
);
