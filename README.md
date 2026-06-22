[Backend_Ledger_Documentation.docx](https://github.com/user-attachments/files/29192541/Backend_Ledger_Documentation.docx)
<img width="2720" height="3720" alt="transaction_transfer_flow" src="https://github.com/user-attachments/assets/96453fd2-65bb-4800-9439-4ec65282f836" />

<img width="2720" height="3040" alt="backend_ledger_architecture_overview" src="https://github.com/user-attachments/assets/d9322121-97ab-4b50-9b14-41acdbc759b2" />

Backend Ledger Service

A ledger-based banking backend built with Node.js, Express, MongoDB, JWT Authentication, and Double-Entry Accounting principles.

Unlike traditional applications that store balances directly, this system derives balances from immutable ledger entries, following patterns used in real financial systems.

Features
JWT Authentication
User Registration & Login
Multiple Bank Accounts per User
Ledger-Based Balance Calculation
Double Entry Accounting
Immutable Audit Trail
Idempotent Transactions
MongoDB Transactions & Sessions
System User Fund Injection
Email Notifications
Token Blacklisting (Logout Support)
Tech Stack
Layer	Technology
Backend	Node.js
Framework	Express.js
Database	MongoDB
ODM	Mongoose
Authentication	JWT
Password Hashing	bcryptjs
Email Service	Nodemailer + Gmail OAuth2
Deployment Ready	Vercel Frontend + Express Backend
Project Structure

src/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── account.controller.js
│   └── transaction.controller.js
│
├── middlewares/
│   └── auth.middleware.js
│
├── models/
│   ├── user.model.js
│   ├── account.model.js
│   ├── transaction.model.js
│   ├── ledger.model.js
│   └── blackList.model.js
│
├── routes/
│   ├── auth.routes.js
│   ├── account.route.js
│   └── transaction.routes.js
│
├── services/
│   └── email.service.js
│
├── app.js
└── server.js

Source:

System Architecture
Client
   │
   ▼
Express API
   │
   ├── Auth Routes
   ├── Account Routes
   └── Transaction Routes
           │
           ▼
      Controllers
           │
           ▼
       MongoDB
           │
           ├── Users
           ├── Accounts
           ├── Transactions
           ├── Ledgers
           └── Blacklisted Tokens
Core Design Principles
1. Ledger-Derived Balances

Balances are never stored directly.

Instead:

Balance =
Total Credits
-
Total Debits

This ensures balance consistency and prevents corruption.

2. Double Entry Accounting

Every transfer generates:

Sender   → DEBIT
Receiver → CREDIT

Example:

Transfer ₹1000

Account A → DEBIT ₹1000
Account B → CREDIT ₹1000
3. Immutable Ledger

Ledger records cannot be:

Updated
Deleted
Replaced

This creates an append-only audit trail.

4. Idempotent Transfers

Each transaction requires:

idempotencyKey

This prevents duplicate transfers when clients retry requests.

5. Token Revocation

Logout blacklists JWT tokens.

Even if a JWT is still valid:

Token Found In Blacklist
        ↓
Request Rejected

Source:

Authentication Flow
Register
POST /api/auth/register
Flow
User Registration
      │
      ▼
Check Existing Email
      │
      ▼
Hash Password
      │
      ▼
Create User
      │
      ▼
Generate JWT
      │
      ▼
Send Welcome Email
      │
      ▼
Return Token
Login
POST /api/auth/login
Flow
Email + Password
        │
        ▼
Validate Credentials
        │
        ▼
Generate JWT
        │
        ▼
Return Token
Logout
POST /api/auth/logout
Flow
Read Token
    │
    ▼
Store In Blacklist
    │
    ▼
Clear Cookie
    │
    ▼
Logout Successful

Source:

Authorization
JWT Middleware

Protected routes use:

authMiddleware

Validation steps:

Read Token
     │
     ▼
Check Blacklist
     │
     ▼
Verify JWT
     │
     ▼
Load User
     │
     ▼
Attach req.user
System User Middleware

Used for internal operations:

authSystemUserMiddleware

Additional check:

user.systemUser === true

Otherwise:

403 Forbidden

Source:

Accounts Module
Create Account
POST /api/accounts

Creates a new account owned by the authenticated user.

Get User Accounts
GET /api/accounts

Returns all accounts owned by the authenticated user.

Get Balance
GET /api/accounts/balance/:accountId
Flow
Validate Account ID
        │
        ▼
Verify Ownership
        │
        ▼
Calculate Balance
        │
        ▼
Return Balance

Source:

Database Models
User
{
  email,
  name,
  password,
  systemUser
}
Account
{
  user,
  status,
  currency
}

Status values:

ACTIVE
FORZEN
CLOSED
Transaction
{
  fromAccount,
  toAccount,
  amount,
  status,
  idempotencyKey
}

Status values:

PENDING
COMPLETED
FAILED
REVERSED
Ledger
{
  account,
  amount,
  transaction,
  type
}

Types:

CREDIT
DEBIT
Token Blacklist
{
  token
}

Automatically expires after:

3 Days

Source:

Transaction Processing
Transfer Money
POST /api/transactions
Request
{
  "fromAccount": "accountId",
  "toAccount": "accountId",
  "amount": 1000,
  "idempotencyKey": "unique-key"
}
Transaction Flow
1. Validate Request
2. Validate Idempotency Key
3. Check Account Status
4. Verify Balance
5. Create Transaction (PENDING)
6. Create Debit Ledger Entry
7. Create Credit Ledger Entry
8. Mark Transaction COMPLETED
9. Commit Session
10. Send Email Notification

Source:

Example Transfer

Before Transfer:

Account A = ₹5000
Account B = ₹2000

Transfer:

₹1000

Ledger Entries:

Account A → DEBIT ₹1000
Account B → CREDIT ₹1000

After Transfer:

Account A = ₹4000
Account B = ₹3000

Balances are calculated from ledger entries.

Email Notifications

Uses:

Nodemailer
Gmail OAuth2
Events
User Registration
Welcome Email
Transaction Success
Transfer Notification Email

Source:

Environment Variables

Create a .env file:

MONGO_URI=your_mongodb_uri

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email

CLIENT_ID=your_google_client_id

CLIENT_SECRET=your_google_client_secret

REFRESH_TOKEN=your_google_refresh_token

Source:

API Reference
Authentication
Method	Endpoint
POST	/api/auth/register
POST	/api/auth/login
POST	/api/auth/logout
Accounts
Method	Endpoint
POST	/api/accounts
GET	/api/accounts
GET	/api/accounts/balance/:accountId
Transactions
Method	Endpoint
POST	/api/transactions
POST	/api/transactions/system/initial-funds

Source:

Known Issues & Improvements
Race Condition

Balance verification occurs before the database transaction begins, which may allow concurrent overdrafts.

Hardcoded Delay

A 15-second delay exists inside transaction processing and should be removed before production deployment.

Email Failure Handling

Transaction emails are not wrapped in a dedicated try/catch block.

Session Cleanup

Failed transactions should explicitly call:

session.abortTransaction()
session.endSession()
Missing Export Verification

Verify that:

sendTransactionEmail()

is exported correctly from the email service.

Source:

Future Enhancements
Transaction History API
Account Freezing
Admin Dashboard
Audit Reporting
Scheduled Statements
Redis-Based Idempotency Cache
Rate Limiting
Refresh Tokens
Multi-Currency Support
Webhook Notifications
License

MIT License

Author

Bhanu Pratap Singh

Ledger-based Banking Backend built using Node.js, Express, MongoDB, and Double Entry Accounting principles.
