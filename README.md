# Non-Profit Financial Management System

A full-stack financial workflow system developed for YM Sisters Canada to streamline budget requests, approvals, reporting, and financial record management across multiple cities.

The platform was designed to replace a fragmented process involving PDFs, Google Forms, private messages, and manual approvals with a centralized role-based application.

## Project Overview

YM Sisters Canada operates across multiple cities, where local treasurers submit funding requests and national board members review and approve them.

This system centralizes that workflow by providing separate interfaces for:

- City Treasurers
- National Board Members / Admins

## Features

### Treasurer
- Secure login
- Submit budget requests
- View request status
- Edit and resubmit rejected requests
- Delete pending or rejected requests
- View admin comments
- View dashboard statistics

### Admin
- Secure role-based login
- Review submitted budget requests
- Approve or reject requests
- Add approval/rejection comments
- Create users
- View monthly financial reports
- View dashboard statistics
- Delete pending or rejected requests

## Tech Stack

### Frontend
- React
- JavaScript
- HTML
- CSS

### Backend
- Django
- Python
- REST API

### Database
- PostgreSQL
- PL/pgSQL
- Stored procedures
- Triggers
- Views
- Foreign key constraints
- Check constraints
- Indexes

## System Architecture

React Frontend
      ↓
Django REST Backend
      ↓
PostgreSQL Database

## Database Design

<img width="824" height="694" alt="image" src="https://github.com/user-attachments/assets/900e1274-ff4e-436d-836c-d57d1f8a94d1" />

The schema models financial workflows including:

- Users
- Cities
- Budget Requests
- Requested Events
- Approvals
- Expenses
- Receipts
- Petty Cash
- Deposits
- Disbursements
- Categories

## Database Features

The PostgreSQL layer includes:

- Normalized relational schema
- Primary and foreign keys
- Check constraints
- Indexed lookup fields
- Stored procedures
- Database views
- Automated triggers

Examples include:

- Automatically updating petty cash totals
- Creating receipt records from expenses
- Recording budget approvals
- Calculating petty cash closing balances

## Role-Based Workflow

Treasurer
   ↓
Create Budget Request
   ↓
Admin Review
   ↓
Approve / Reject
   ↓
Treasurer Views Status
   ↓
Edit / Resubmit if Rejected

## Screenshots

### Login
<img width="502" height="235" alt="image" src="https://github.com/user-attachments/assets/4a75cfa4-08aa-4b1e-8da6-b2169d7fe9a8" />

### Create User
<img width="448" height="218" alt="image" src="https://github.com/user-attachments/assets/3a747a21-8732-4d80-908f-ac0a3104272f" />

### Treasurer Dashboard

<img width="469" height="171" alt="image" src="https://github.com/user-attachments/assets/36363dbf-ad54-4f19-b98c-9bf6123c65b3" />

### Admin Dashboard
<img width="452" height="161" alt="image" src="https://github.com/user-attachments/assets/2dcea2f2-88c0-4619-8e0d-971fa4a73a10" />


### Monthly Budget Reports
<img width="440" height="189" alt="image" src="https://github.com/user-attachments/assets/ccd38579-a472-46ff-a95f-a9d4d270b90e" />


### Pending Requests
<img width="458" height="211" alt="image" src="https://github.com/user-attachments/assets/d3fc4c26-5bc8-4e7f-9c20-227df5e9e0dd" />


## Project Status

The core budget request and approval workflow is functional.

Current functionality includes:
- authentication
- role-based dashboards
- budget request CRUD
- approval/rejection workflow
- monthly reporting
- user creation

Planned work:
- receipt upload
- full expense tracking
- petty cash workflow
- audit views
- production deployment

## Contributors

- Hadiyah Arif
- Faria Islam

