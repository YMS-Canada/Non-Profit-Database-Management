-- Ensure we're working inside the default schema
CREATE SCHEMA IF NOT EXISTS public;
SET search_path = public;

CREATE TABLE city (
    city_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    UNIQUE (name, province)
);


CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
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
    requester_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    recipient_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    month DATE NOT NULL, --we can store the first day of each month
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
    approver_id INT REFERENCES users(user_id),
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
    prepared_by INT REFERENCES users(user_id)
);

CREATE TABLE expense (
    expense_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES event(event_id),
    category_id INT NOT NULL REFERENCES category(category_id),
    vendor VARCHAR(100) NOT NULL,
    item_desc VARCHAR(100) NOT NULL,
    amount_before_tax NUMERIC(10, 2) NOT NULL,
    hst NUMERIC(10, 2) NOT NULL,
    round_off NUMERIC(10, 2),
    total_amount NUMERIC(10, 2) NOT NULL,
    receipt_number INTEGER,
    spent_at VARCHAR(100) NOT NULL,
    volunteer_name VARCHAR(100) NOT NULL
);

CREATE TABLE receipt(
    receipt_id SERIAL PRIMARY KEY,
    expense_id INT NOT NULL REFERENCES expense (expense_id),
    file_path VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE petty_cash_statement(
    pcs_id SERIAL PRIMARY KEY,
    month VARCHAR(20) NOT NULL,
    opening_balance NUMERIC(10, 2) NOT NULL,
    total_spent NUMERIC(10, 2) NOT NULL,
    closing_balance NUMERIC(10, 2) NOT NULL,
    carried_forward NUMERIC(10, 2) NOT NULL,
    cash_in_hand NUMERIC(10, 2) NOT NULL,
    city_id INT NOT NULL  REFERENCES city (city_id),
    prepared_by INT NOT NULL REFERENCES users(user_id),
    approved_by INT NOT NULL REFERENCES users(user_id)
);

CREATE TABLE petty_cash_expense(
    pcx_id SERIAL PRIMARY KEY,
    pcs_id INT NOT NULL REFERENCES petty_cash_statement(pcs_id),
    event_id INT NOT NULL REFERENCES event(event_id),
    nature_of_expense VARCHAR(100) NOT NULL,
    vendor VARCHAR(100) NOT NULL,
    amount_before_tax NUMERIC(10, 2) NOT NULL,
    hst NUMERIC(10, 2) NOT NULL,
    round_off NUMERIC(10, 2),
    total_amount NUMERIC(10, 2) NOT NULL,
    receipt_number INTEGER,
    spent_at VARCHAR(100) NOT NULL,
    volunteer_name VARCHAR(100) NOT NULL,
    balance_on_hand_after NUMERIC(10, 2) NOT NULL
);

CREATE TABLE cash_collection(
    collection_id SERIAL PRIMARY KEY,
    city_id INT NOT NULL REFERENCES city(city_id),
    event_id INT NOT NULL REFERENCES event(event_id),
    amount_collected NUMERIC(10, 2) NOT NULL,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes VARCHAR(100)
);

CREATE TABLE deposit(
    deposit_id SERIAL PRIMARY KEY,
    collection_id INT NOT NULL  REFERENCES cash_collection(collection_id),
    bank_ref VARCHAR(100) NOT NULL,
    deposited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    slip_path VARCHAR(100)
);

CREATE TABLE disbursement(
    disb_id SERIAL PRIMARY KEY,
    amount NUMERIC(10, 2) NOT NULL,
    method VARCHAR(100) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ref_no INTEGER,
    reason VARCHAR(100),
    city_id INT NOT NULL REFERENCES city(city_id),
    request_id INT NOT NULL REFERENCES budget_request(request_id)
);


-- not part of schema structure but better for speed
-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_budget_request_city_id ON budget_request(city_id);
CREATE INDEX idx_budget_request_requester_id ON budget_request(requester_id);
CREATE INDEX idx_budget_request_recipient_id ON budget_request(recipient_id);
CREATE INDEX idx_requested_event_request_id ON requested_event(request_id);
CREATE INDEX idx_requested_line_req_event_id ON requested_break_down_line(req_event_id);
CREATE INDEX idx_expense_event_id ON expense(event_id);
CREATE INDEX idx_expense_category_id ON expense(category_id);
CREATE INDEX idx_petty_cash_expense_pcs_id ON petty_cash_expense(pcs_id);
CREATE INDEX idx_cash_collection_city_id ON cash_collection(city_id);
CREATE INDEX idx_deposit_collection_id ON deposit(collection_id);
CREATE INDEX idx_disbursement_request_id ON disbursement(request_id);
CREATE INDEX IF NOT EXISTS idx_budget_request_status ON budget_request(status);
CREATE INDEX IF NOT EXISTS idx_budget_request_month ON budget_request(month);
CREATE INDEX IF NOT EXISTS idx_budget_request_city ON budget_request(city_id);
