CREATE TABLE city (
    city_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL
);

CREATE TABLE expense (
    expense_id SERIAL PRIMARY KEY,
    FOREIGN KEY (event_id) REFERENCES event (event_id),
    FOREIGN KEY (category_id) REFERENCES category (category_id),
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
    FOREIGN KEY (expense_id) REFERENCES expense (expense_id),
    file_path VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE petty_cash_statement(
    pcs_id SERIAL PRIMARY KEY,
    FOREIGN KEY (city_id) REFERENCES city (city_id),
    month VARCHAR(20) NOT NULL,
    opening_balance NUMERIC(10, 2) NOT NULL,
    total_spent NUMERIC(10, 2) NOT NULL,
    closing_balance NUMERIC(10, 2) NOT NULL,
    carried_forward NUMERIC(10, 2) NOT NULL,
    cash_in_hand NUMERIC(10, 2) NOT NULL,
    FOREIGN KEY(prepared_by) REFERENCES user(name),
    FOREIGN KEY(approved_by) REFERENCES user(name)
);

CREATE TABLE petty_cash_expense(
    pcx_id SERIAL PRIMARY KEY,
    FOREIGN KEY(pcs_id) REFERENCES petty_cash_statement(pcs_id),
    event VARCHAR(100) NOT NULL,
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

CREATE TABLE CashCollection(
    collection_id SERIAL PRIMARY KEY,
    FOREIGN KEY(city_id) REFERENCES city(city_id),
    event VARCHAR(100) NOT NULL,
    amount_collected NUMERIC(10, 2) NOT NULL,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes VARCHAR(100)
);

CREATE TABLE deposit(
   deposit_id SERIAL PRIMARY KEY,
   FOREIGN KEY(collection_id) REFERENCES CashCollection(collection_id),
   bank_ref VARCHAR(100) NOT NULL,
   deposited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
   slip_path VARCHAR(100)
);

CREATE TABLE Disbursement(
   disb_id SERIAL PRIMARY KEY,
   FOREIGN KEY(city_id) REFERENCES city(city_id),
   amount NUMERIC(10, 2) NOT NULL,
   method VARCHAR(100) NOT NULL,
   sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
   ref_no INTEGER,
   reason VARCHAR(100),
   FOREIGN KEY(request_id) REFERENCES budget_request(request_id)
);