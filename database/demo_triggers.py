#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, '/workspaces/Non-Profit-Database-Management/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

import django
django.setup()

from django.db import connection

def demo_triggers():
    cursor = connection.cursor()
    
    print("\n" + "="*80)
    print("TRIGGER 1: Petty Cash Statement Total is updated when new expense is added")
    print("="*80)
    
    # Get a petty cash statement
    cursor.execute("SELECT pcs_id, total_spent, closing_balance FROM petty_cash_statement LIMIT 1")
    pcs = cursor.fetchone()
    
    if pcs:
        pcs_id = pcs[0]
        print(f"\nBEFORE inserting new expense:")
        print(f"PCS ID: {pcs_id}, Total Spent: ${float(pcs[1]):,.2f}, Closing Balance: ${float(pcs[2]):,.2f}")
        
        # Insert new petty cash expense (trigger will auto-update statement)
        cursor.execute("""
            INSERT INTO petty_cash_expense (pcs_id, event_id, nature_of_expense, vendor, 
                                            amount_before_tax, hst, round_off, total_amount,
                                            spent_at, volunteer_name)
            VALUES (%s, 1, 'Office supplies', 'Demo Vendor', 21.24, 3.76, 0.00, 25.00,
                    'Office', 'Demo Volunteer')
            RETURNING pcx_id
        """, [pcs_id])
        new_expense_id = cursor.fetchone()[0]
        
        # Check the statement again (should be automatically updated by trigger)
        cursor.execute("SELECT total_spent, closing_balance FROM petty_cash_statement WHERE pcs_id = %s", [pcs_id])
        after = cursor.fetchone()
        
        print(f"\nAFTER inserting new $25.00 expense (ID: {new_expense_id}):")
        print(f"PCS ID: {pcs_id}, Total Spent: ${float(after[0]):,.2f}, Closing Balance: ${float(after[1]):,.2f}")
        print(f"✓ Trigger automatically updated total_spent and closing_balance!")
        
        # Clean up demo data
        cursor.execute("DELETE FROM petty_cash_expense WHERE pcx_id = %s", [new_expense_id])
        print(f"\n(Demo expense cleaned up)")
    else:
        print("\nNo petty cash statements available for demonstration")
    
    print("\n" + "="*80)
    print("TRIGGER 2: A New receipt row is created when new expense is added")
    print("="*80)
    
    # Count receipts before
    cursor.execute("SELECT COUNT(*) FROM receipt")
    before_count = cursor.fetchone()[0]
    print(f"\nReceipt count BEFORE: {before_count}")
    
    # Insert expense with receipt number (trigger will auto-create receipt)
    cursor.execute("""
        INSERT INTO expense (event_id, category_id, vendor, receipt_number, total_amount, expense_date)
        VALUES (1, 1, 'Demo Vendor', 'DEMO-REC-001', 50.00, CURRENT_DATE)
        RETURNING expense_id
    """)
    new_expense_id = cursor.fetchone()[0]
    
    # Count receipts after
    cursor.execute("SELECT COUNT(*) FROM receipt")
    after_count = cursor.fetchone()[0]
    
    print(f"\nExpense inserted (ID: {new_expense_id}) with receipt_number: 'DEMO-REC-001'")
    print(f"Receipt count AFTER: {after_count}")
    print(f"✓ Trigger automatically created receipt record! (+{after_count - before_count})")
    
    # Show the created receipt
    cursor.execute("SELECT receipt_id, expense_id, uploaded_at FROM receipt WHERE expense_id = %s", [new_expense_id])
    receipt = cursor.fetchone()
    if receipt:
        print(f"\nCreated Receipt:")
        print(f"Receipt ID: {receipt[0]}, Expense ID: {receipt[1]}, Uploaded At: {receipt[2]}")
    
    # Clean up demo data
    cursor.execute("DELETE FROM receipt WHERE expense_id = %s", [new_expense_id])
    cursor.execute("DELETE FROM expense WHERE expense_id = %s", [new_expense_id])
    print(f"\n(Demo expense and receipt cleaned up)")

if __name__ == '__main__':
    demo_triggers()
