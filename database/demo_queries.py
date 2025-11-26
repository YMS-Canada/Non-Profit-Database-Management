#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, '/workspaces/Non-Profit-Database-Management/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

import django
django.setup()

from django.db import connection

def demo_queries():
    cursor = connection.cursor()
    
    print("\n" + "="*80)
    print("QUERY 1: View total monthly budget requests of each city")
    print("="*80)
    cursor.execute('SELECT * FROM vw_total_requested_per_city_month ORDER BY month DESC, city LIMIT 5')
    print(f"{'City ID':<10} {'City':<20} {'Month':<15} {'Total Requested':<20}")
    print("-" * 80)
    for row in cursor.fetchall():
        print(f"{row[0]:<10} {row[1]:<20} {str(row[2]):<15} ${float(row[3]):<19,.2f}")
    
    print("\n" + "="*80)
    print("QUERY 2: View the listed summary of event expenses")
    print("="*80)
    cursor.execute('SELECT * FROM vw_event_expenses ORDER BY total_spent DESC LIMIT 5')
    print(f"{'Event ID':<12} {'Event Name':<30} {'Vendor':<20} {'Total Spent':<15}")
    print("-" * 80)
    for row in cursor.fetchall():
        print(f"{row[0]:<12} {row[1]:<30} {row[2]:<20} ${float(row[3]):<14,.2f}")

if __name__ == '__main__':
    demo_queries()
