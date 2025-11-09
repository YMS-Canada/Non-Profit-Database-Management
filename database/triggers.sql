CREATE OR REPLACE FUNCTION update_pcs_closing_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE petty_cash_statement
  SET
    total_spent = (SELECT COALESCE(SUM(total_amount),0) FROM petty_cash_expense WHERE pcs_id = new.pcs_id),
    closing_balance = compute_pcs_closing(new.pcs_id)
  WHERE pcs_id = new.pcs_id;

  RETURN new;
END;
$$;

CREATE TRIGGER trg_pcx_after_insert
AFTER INSERT ON petty_cash_expense
FOR EACH ROW EXECUTE FUNCTION update_pcs_closing_after_insert();

CREATE OR REPLACE FUNCTION create_receipt_after_expense()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF new.receipt_number IS NOT NULL THEN
    INSERT INTO receipt (expense_id, file_path, uploaded_at)
    VALUES (new.expense_id, NULL, now());
  END IF;
  RETURN new;
END;
$$;

CREATE TRIGGER trg_expense_after_insert
AFTER INSERT ON expense
FOR EACH ROW EXECUTE FUNCTION create_receipt_after_expense();
