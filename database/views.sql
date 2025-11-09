CREATE OR REPLACE VIEW vw_total_requested_per_city_month AS
SELECT
  c.city_id,
  c.name AS city,
  br.month,
  COALESCE(SUM(re.total_amount),0) AS total_requested
FROM budget_request br
JOIN requested_event re ON re.request_id = br.request_id
JOIN city c ON c.city_id = br.city_id
GROUP BY c.city_id, c.name, br.month;

CREATE OR REPLACE VIEW vw_event_expenses AS
SELECT
  ev.event_id,
  ev.name AS event_name,
  e.vendor,
  SUM(e.total_amount) AS total_spent
FROM expense e
JOIN event ev ON ev.event_id = e.event_id
GROUP BY ev.event_id, ev.name, e.vendor;
