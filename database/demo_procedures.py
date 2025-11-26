#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, '/workspaces/Non-Profit-Database-Management/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

import django
django.setup()

from django.db import connection

def demo_procedures():
    cursor = connection.cursor()
    
    print("\n" + "="*80)
    print("PROCEDURE 1: Function for Admin to record an approval for a budget request")
    print("="*80)
    
    # Show pending request
    cursor.execute("SELECT request_id, status, description FROM budget_request WHERE status = 'PENDING' LIMIT 1")
    pending = cursor.fetchone()
    
    if pending:
        request_id = pending[0]
        print(f"\nBEFORE Approval:")
        print(f"Request ID: {request_id}, Status: {pending[1]}, Description: {pending[2]}")
        
        # Approve the request
        cursor.execute("SELECT approve_request(%s, %s, %s)", [request_id, 1, 'Approved for community event demonstration'])
        result = cursor.fetchone()[0]
        
        # Show after approval
        cursor.execute("SELECT request_id, status FROM budget_request WHERE request_id = %s", [request_id])
        after = cursor.fetchone()
        print(f"\nAFTER Approval:")
        print(f"Request ID: {after[0]}, Status: {after[1]}")
        
        # Show approval record
        cursor.execute("SELECT approver_id, decision, note, decided_at FROM approval WHERE request_id = %s", [request_id])
        approval = cursor.fetchone()
        print(f"\nApproval Record Created:")
        print(f"Approver ID: {approval[0]}, Decision: {approval[1]}, Note: {approval[2]}")
        print(f"Decided At: {approval[3]}")
    else:
        print("\nNo pending requests available for demonstration")
    
    print("\n" + "="*80)
    print("PROCEDURE 2: Function to calculate petty cash closing balance")
    print("="*80)
    
    # Show petty cash statement
    cursor.execute("SELECT pcs_id, opening_balance, total_spent, closing_balance FROM petty_cash_statement LIMIT 1")
    pcs = cursor.fetchone()
    
    if pcs:
        pcs_id = pcs[0]
        print(f"\nPetty Cash Statement (ID: {pcs_id}):")
        print(f"Opening Balance: ${float(pcs[1]):,.2f}")
        print(f"Total Spent: ${float(pcs[2]):,.2f}")
        print(f"Closing Balance: ${float(pcs[3]):,.2f}")
        
        # Calculate using function
        cursor.execute("SELECT compute_pcs_closing(%s)", [pcs_id])
        calculated = cursor.fetchone()[0]
        print(f"\nFunction Calculate Result: ${float(calculated):,.2f}")
        print(f"Verification: Opening ({float(pcs[1]):,.2f}) - Spent ({float(pcs[2]):,.2f}) = {float(calculated):,.2f}")
    else:
        print("\nNo petty cash statements available for demonstration")

if __name__ == '__main__':
    demo_procedures()
