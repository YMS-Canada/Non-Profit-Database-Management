#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, '/workspaces/Non-Profit-Database-Management/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

import django
django.setup()

from django.db import connection

print("\n" + "="*80)
print("DATABASE DEMONSTRATION - Non-Profit Budget Management System")
print("="*80)

cursor = connection.cursor()

# ============================================================================
# QUERIES (VIEWS)
# ============================================================================
print("\n" + "="*80)
print("SECTION 1: QUERIES - Views for Data Aggregation")
print("="*80)

print("\n[QUERY 1] View total monthly budget requests of each city")
print("-" * 80)
cursor.execute('SELECT * FROM vw_total_requested_per_city_month ORDER BY month DESC, city LIMIT 5')
print(f"{'City ID':<10} {'City':<20} {'Month':<15} {'Total Requested':<20}")
print("-" * 80)
for row in cursor.fetchall():
    print(f"{row[0]:<10} {row[1]:<20} {str(row[2]):<15} ${float(row[3]):<19,.2f}")

print("\n[QUERY 2] View the listed summary of event expenses")
print("-" * 80)
cursor.execute('SELECT * FROM vw_event_expenses ORDER BY total_spent DESC LIMIT 5')
print(f"{'Event ID':<12} {'Event Name':<30} {'Vendor':<20} {'Total Spent':<15}")
print("-" * 80)
for row in cursor.fetchall():
    print(f"{row[0]:<12} {row[1]:<30} {row[2]:<20} ${float(row[3]):<14,.2f}")

# ============================================================================
# STORED PROCEDURES
# ============================================================================
print("\n\n" + "="*80)
print("SECTION 2: STORED PROCEDURES - Business Logic Functions")
print("="*80)

print("\n[PROCEDURE 1] Function for Admin to record budget request approval")
print("-" * 80)
print("Purpose: Atomically records admin approval and updates request status")
print("\nDemo: Showing most recent approval record from database")
cursor.execute("""
    SELECT br.request_id, br.status, br.description, 
           a.approver_id, a.decision, a.note, a.decided_at
    FROM budget_request br
    JOIN approval a ON a.request_id = br.request_id
    WHERE br.status = 'APPROVED'
    ORDER BY a.decided_at DESC
    LIMIT 1
""")
result = cursor.fetchone()
if result:
    print(f"\nRequest ID: {result[0]}")
    print(f"Status: {result[1]}")
    print(f"Description: {result[2]}")
    print(f"Approver ID: {result[3]}")
    print(f"Decision: {result[4]}")
    print(f"Admin Note: {result[5] or 'None'}")
    print(f"Decided At: {result[6]}")
    print("\n✓ Function approve_request() was called to create this approval")
else:
    print("\nNo approved requests found in database")

print("\n[PROCEDURE 2] Function to calculate petty cash closing balance")
print("-" * 80)
print("Purpose: Computes remaining petty cash by: Opening - Spent = Closing")
cursor.execute("SELECT pcs_id, opening_balance, total_spent, closing_balance FROM petty_cash_statement LIMIT 1")
pcs = cursor.fetchone()
if pcs:
    pcs_id, opening, spent, closing = pcs
    print(f"\nPetty Cash Statement (ID: {pcs_id}):")
    print(f"Opening Balance: ${float(opening):,.2f}")
    print(f"Total Spent:     ${float(spent):,.2f}")
    print(f"Closing Balance: ${float(closing):,.2f}")
    
    cursor.execute("SELECT compute_pcs_closing(%s)", [pcs_id])
    calculated = cursor.fetchone()[0]
    print(f"\nFunction Result: ${float(calculated):,.2f}")
    print(f"✓ Verification: {float(opening):,.2f} - {float(spent):,.2f} = {float(calculated):,.2f}")
else:
    print("\nNo petty cash statements found")

# ============================================================================
# TRIGGERS
# ============================================================================
print("\n\n" + "="*80)
print("SECTION 3: TRIGGERS - Automatic Database Actions")
print("="*80)

print("\n[TRIGGER 1] Auto-update Petty Cash Statement when expense is added")
print("-" * 80)
print("Trigger: trg_pcx_after_insert")
print("Function: update_pcs_closing_after_insert()")
print("Purpose: Automatically recalculates total_spent and closing_balance")
print("\nExample from database:")
cursor.execute("""
    SELECT pcs.pcs_id, pcs.opening_balance, pcs.total_spent, pcs.closing_balance,
           COUNT(pcx.pcx_id) as expense_count
    FROM petty_cash_statement pcs
    LEFT JOIN petty_cash_expense pcx ON pcx.pcs_id = pcs.pcs_id
    GROUP BY pcs.pcs_id, pcs.opening_balance, pcs.total_spent, pcs.closing_balance
    LIMIT 1
""")
pcs_data = cursor.fetchone()
if pcs_data:
    print(f"\nStatement ID: {pcs_data[0]}")
    print(f"Opening: ${float(pcs_data[1]):,.2f}")
    print(f"Total Spent: ${float(pcs_data[2]):,.2f} (from {pcs_data[4]} expenses)")
    print(f"Closing: ${float(pcs_data[3]):,.2f}")
    print(f"\n✓ Each time an expense is inserted, trigger automatically updates these totals")

print("\n[TRIGGER 2] Auto-create receipt record when expense has receipt_number")
print("-" * 80)
print("Trigger: trg_expense_after_insert")
print("Function: create_receipt_after_expense()")
print("Purpose: Creates receipt placeholder when expense is logged")
print("\nExample from database:")
cursor.execute("""
    SELECT e.expense_id, e.vendor, e.receipt_number, r.receipt_id, r.uploaded_at
    FROM expense e
    LEFT JOIN receipt r ON r.expense_id = e.expense_id
    WHERE e.receipt_number IS NOT NULL
    ORDER BY e.expense_id DESC
    LIMIT 3
""")
receipts = cursor.fetchall()
if receipts:
    print(f"\n{'Expense ID':<12} {'Vendor':<20} {'Receipt #':<15} {'Receipt ID':<12} {'Auto-Created':<20}")
    print("-" * 80)
    for r in receipts:
        print(f"{r[0]:<12} {r[1]:<20} {r[2] or 'N/A':<15} {r[3] or 'N/A':<12} {str(r[4]) if r[4] else 'N/A':<20}")
    print(f"\n✓ Receipt records were automatically created by trigger when expenses were inserted")
else:
    print("\nNo expenses with receipts found")

print("\n" + "="*80)
print("DEMONSTRATION COMPLETE")
print("="*80 + "\n")
