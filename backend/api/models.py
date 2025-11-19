# backend/api/models.py
from django.db import models

class City(models.Model):
    city_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    province = models.CharField(max_length=100)

    class Meta:
        db_table = 'city'
        managed = False

class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)

    class Meta:
        db_table = 'category'
        managed = False

class Users(models.Model):
    user_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    email = models.CharField(max_length=100, unique=True)
    whatsapp = models.CharField(max_length=50, null=True)
    role = models.CharField(max_length=50)
    password_hash = models.TextField()
    city = models.ForeignKey(City, null=True, on_delete=models.SET_NULL, db_column='city_id')
    is_active = models.BooleanField(default=True)
    invited_at = models.DateTimeField(null=True)
    last_login = models.DateTimeField(null=True)

    class Meta:
        db_table = 'users'
        managed = False

class BudgetRequest(models.Model):
    request_id = models.AutoField(primary_key=True)
    city = models.ForeignKey(City, on_delete=models.RESTRICT, db_column='city_id')
    requester = models.ForeignKey(Users, null=True, on_delete=models.SET_NULL, db_column='requester_id', related_name="requests_made")
    recipient = models.ForeignKey(Users, null=True, on_delete=models.SET_NULL, db_column='recipient_id', related_name="requests_received")
    month = models.DateField()
    description = models.TextField(null=True)
    status = models.CharField(max_length=10)
    created_at = models.DateTimeField()

    class Meta:
        db_table = 'budget_request'
        managed = False

class RequestedEvent(models.Model):
    req_event_id = models.AutoField(primary_key=True)
    request = models.ForeignKey(BudgetRequest, on_delete=models.CASCADE, db_column='request_id')
    name = models.CharField(max_length=100, null=True)
    event_date = models.DateField(null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    notes = models.TextField(null=True)

    class Meta:
        db_table = 'requested_event'
        managed = False

class RequestedBreakDownLine(models.Model):
    line_id = models.AutoField(primary_key=True)
    req_event = models.ForeignKey(RequestedEvent, on_delete=models.CASCADE, db_column='req_event_id')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, db_column='category_id')
    description = models.TextField(null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'requested_break_down_line'
        managed = False

class Approval(models.Model):
    approval_id = models.AutoField(primary_key=True)
    request = models.ForeignKey(BudgetRequest, on_delete=models.CASCADE, db_column='request_id')
    approver = models.ForeignKey(Users, on_delete=models.CASCADE, db_column='approver_id')
    decision = models.CharField(max_length=20)
    note = models.TextField(null=True)
    decided_at = models.DateTimeField(null=True)

    class Meta:
        db_table = 'approval'
        managed = False

class Event(models.Model):
    event_id = models.AutoField(primary_key=True)
    city = models.ForeignKey(City, on_delete=models.CASCADE, db_column='city_id')
    name = models.CharField(max_length=50, null=True)
    event_date = models.DateField(null=True)
    attendees_count = models.IntegerField()
    prepared_by = models.ForeignKey(Users, on_delete=models.CASCADE, db_column='prepared_by')

    class Meta:
        db_table = 'event'
        managed = False

class Expense(models.Model):
    expense_id = models.AutoField(primary_key=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, db_column='event_id')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, db_column='category_id')
    vendor = models.CharField(max_length=100)
    item_desc = models.CharField(max_length=100)
    amount_before_tax = models.DecimalField(max_digits=10, decimal_places=2)
    hst = models.DecimalField(max_digits=10, decimal_places=2)
    round_off = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    receipt_number = models.IntegerField(null=True)
    spent_at = models.CharField(max_length=100)
    volunteer_name = models.CharField(max_length=100)

    class Meta:
        db_table = 'expense'
        managed = False

class Receipt(models.Model):
    receipt_id = models.AutoField(primary_key=True)
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, db_column='expense_id')
    file_path = models.CharField(max_length=100, null=True)
    uploaded_at = models.DateTimeField()

    class Meta:
        db_table = 'receipt'
        managed = False

class PettyCashStatement(models.Model):
    pcs_id = models.AutoField(primary_key=True)
    month = models.CharField(max_length=20)
    opening_balance = models.DecimalField(max_digits=10, decimal_places=2)
    total_spent = models.DecimalField(max_digits=10, decimal_places=2)
    closing_balance = models.DecimalField(max_digits=10, decimal_places=2)
    carried_forward = models.DecimalField(max_digits=10, decimal_places=2)
    cash_in_hand = models.DecimalField(max_digits=10, decimal_places=2)
    city = models.ForeignKey(City, on_delete=models.CASCADE, db_column='city_id')
    prepared_by = models.ForeignKey(Users, related_name="pcs_prepared", on_delete=models.CASCADE, db_column='prepared_by')
    approved_by = models.ForeignKey(Users, related_name="pcs_approved", on_delete=models.CASCADE, db_column='approved_by')

    class Meta:
        db_table = 'petty_cash_statement'
        managed = False

class PettyCashExpense(models.Model):
    pcx_id = models.AutoField(primary_key=True)
    pcs = models.ForeignKey(PettyCashStatement, on_delete=models.CASCADE, db_column='pcs_id')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, db_column='event_id')
    nature_of_expense = models.CharField(max_length=100)
    vendor = models.CharField(max_length=100)
    amount_before_tax = models.DecimalField(max_digits=10, decimal_places=2)
    hst = models.DecimalField(max_digits=10, decimal_places=2)
    round_off = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    receipt_number = models.IntegerField(null=True)
    spent_at = models.CharField(max_length=100)
    volunteer_name = models.CharField(max_length=100)
    balance_on_hand_after = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'petty_cash_expense'
        managed = False

class CashCollection(models.Model):
    collection_id = models.AutoField(primary_key=True)
    city = models.ForeignKey(City, on_delete=models.CASCADE, db_column='city_id')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, db_column='event_id')
    amount_collected = models.DecimalField(max_digits=10, decimal_places=2)
    collected_at = models.DateTimeField()
    notes = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = 'cash_collection'
        managed = False

class Deposit(models.Model):
    deposit_id = models.AutoField(primary_key=True)
    collection = models.ForeignKey(CashCollection, on_delete=models.CASCADE, db_column='collection_id')
    bank_ref = models.CharField(max_length=100)
    deposited_at = models.DateTimeField()
    slip_path = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = 'deposit'
        managed = False

class Disbursement(models.Model):
    disb_id = models.AutoField(primary_key=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=100)
    sent_at = models.DateTimeField()
    ref_no = models.IntegerField(null=True)
    reason = models.CharField(max_length=100, null=True)
    city = models.ForeignKey(City, on_delete=models.CASCADE, db_column='city_id')
    request = models.ForeignKey(BudgetRequest, on_delete=models.CASCADE, db_column='request_id')

    class Meta:
        db_table = 'disbursement'
        managed = False
