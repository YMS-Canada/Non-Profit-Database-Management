BEGIN;

INSERT INTO city (name, province) VALUES
('Windsor', 'ON'), ('Montreal', 'QC'), ('Vancouver', 'BC');

INSERT INTO category (name) VALUES 
('Supplies'), ('Decor'), ('Food');

INSERT INTO users (name, email, whatsapp, role, password_hash, city_id) VALUES
('Fatima','fatima@example.com','1234567890','TREASURER','random123',1), 
('Zainab','zainab@example.com','0987654321','ADMIN','random321',1);

INSERT INTO budget_request (city_id, requester_id, recipient_id, month, description, status) VALUES 
(1,1,2,'2025-11','Paint Night','PENDING')
RETURNING request_id INTO TEMP_TABLE;

INSERT INTO requested_event (request_id, name, event_date, total_amount) VALUES 
(1, 'Paint Night', '2025-11-08', 226.00);

INSERT INTO requested_break_down_line (req_event_id, category_id, description, amount) VALUES 
(1, 1, 'Paint and Canvases', 113.00),
(1, 3, 'Food Vendor', 113.00);

INSERT INTO approval (request_id, approver_id, decision, note, decided_at) VALUES 
(1, 2, 'YES', 'All good', now());

INSERT INTO event (city_id, name, event_date, attendees_count, prepared_by) VALUES 
(1, 'Paint Night', '2025-11-08', 20, 1);

INSERT INTO expense (event_id, category_id, vendor, item_desc, amount_before_tax, hst, round_off, total_amount, receipt_number, spent_at, volunteer_name) VALUES 
(1, 1, 'Dollarama', 'Paint and Canvases', 100.00, 13.00, 113.00, 113.00, 12345, 'Social Program', 'Aliya'),
(1, 3, 'Walmart', 'Baked Goods and Snacks', 100.00, 13.00, 113.00, 113.00, 12346, 'Social Program', 'Dina');

INSERT INTO receipt (expense_id, receipt_image_path, uploaded_at) VALUES 
(1, '/receipts/receipt1.jpg', now()),
(2, '/receipts/receipt2.jpg', now());

INSERT INTO petty_cash_statement (city_id, month, opening_balance, total_spent, closing_balance, carried_forward, cash_in_hand, prepared_by, approved_by) VALUES 
(1, '2025-11', 500.00, 226.00, 274.00, 274.00, 274.00, 'Fatima', 'Zainab');

INSERT INTO petty_cash_expense (pcs_id, event, nature_of_expense, vendor, amount_before_tax, hst, round_off, total_amount, receipt_number, spent_at, volunteer_name, balance_on_hand_after) VALUES 
(1, 'Paint Night', 'Supplies', 'Dollarama', 100.00, 13.00, 0.00, 113.00, 12345, 'Social Program', 'Aliya', 387.00),
(1, 'Paint Night', 'Food', 'Walmart', 100.00, 13.00, 0.00, 113.00, 12346, 'Social Program', 'Dina', 274.00);

INSERT INTO cash_collection (city_id, event, amount_collected, collected_at, notes) VALUES 
(1, 'Paint Night', 400.00, now(), 'Ticket purchases collected during event');

INSERT INTO deposit (collection_id, bank_ref, deposited_at, slip_path) VALUES 
(1, 'Toronto Dominion', now(), '/deposits/deposit1.jpg');

INSERT INTO disbursement (city_id, amount, method, sent_at, ref_no, reason, request_id) VALUES 
(1, 226.00, 'E-Transfer', now(), '1234', 'Disbursement for Paint Night expenses', 1);

COMMIT;
