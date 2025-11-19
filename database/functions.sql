CREATE OR REPLACE FUNCTION approve_request(temp_request_id INT, temp_approver_id INT, temp_note TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO approval (request_id, approver_id, decision, note, decided_at) VALUES 
  (temp_request_id, temp_approver_id, 'YES', temp_note, now());
  UPDATE budget_request SET status = 'APPROVED' WHERE request_id = temp_request_id;
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION compute_pcs_closing(temp_pcs_id INT)
RETURNS NUMERIC LANGUAGE plpgsql AS $$
DECLARE
  opening NUMERIC := 0;
  spent NUMERIC := 0;
BEGIN
  SELECT opening_balance INTO opening FROM petty_cash_statement WHERE pcs_id = temp_pcs_id;
  SELECT COALESCE(SUM(total_amount),0) INTO spent FROM petty_cash_expense WHERE pcs_id = temp_pcs_id;
  RETURN opening - spent;
END;
$$;
