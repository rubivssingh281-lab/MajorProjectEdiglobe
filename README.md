# 🔒 Ediglobe Secure — Full-Stack Authentication System

> A production-grade, security-first web authentication system built with Node.js, Express, and MySQL. Ediglobe Secure features multi-layered protection including Helmet.js headers, bcrypt hashing, server-side session management, rate limiting, XSS sanitization, audit logging, and account lockout — all paired with a clean, responsive vanilla HTML/CSS/JS frontend.

**Author:** Saksham Singh

---

## 📋 Table of Contents

1. [Features Overview](#features-overview)
2. [Tech Stack](#tech-stack)
3. [Security Architecture](#security-architecture)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Installation](#installation)
   - [Step 1 — Clone the Repository](#step-1--clone-the-repository)
   - [Step 2 — Install Node Dependencies](#step-2--install-node-dependencies)
   - [Step 3 — Configure Environment Variables](#step-3--configure-environment-variables)
   - [Step 4 — Set Up MySQL Database](#step-4--set-up-mysql-database)
   - [Step 5 — Run the Server](#step-5--run-the-server)
7. [Environment Variables Reference](#environment-variables-reference)
8. [API Endpoints](#api-endpoints)
9. [Frontend Pages](#frontend-pages)
10. [Password Policy](#password-policy)
11. [Allowed Email Domains](#allowed-email-domains)
12. [Database Schema](#database-schema)
13. [Rate Limiting Rules](#rate-limiting-rules)
14. [Session Management](#session-management)
15. [Troubleshooting](#troubleshooting)
16. [License](#license)

---

## ✨ Features Overview

| Layer | Feature |
|---|---|
| **Authentication** | Secure register, login, logout with server-side sessions |
| **Password Security** | bcrypt hashing (12 salt rounds), real-time strength meter |
| **Rate Limiting** | Global API limiter + strict auth-route limiter |
| **XSS Protection** | Server-side `xss` sanitization + client-side `textContent` rendering |
| **SQL Injection** | 100% parameterized queries via `mysql2/promise` |
| **HTTP Security** | Helmet.js with CSP, HSTS, X-Frame-Options, noSniff, Referrer-Policy |
| **Audit Logging** | Every login, registration, and logout is recorded with IP + User-Agent |
| **Account Locking** | Auto-lock after 10 failed login attempts within 1 hour |
| **Session Timeout** | 30-minute inactivity auto-logout on the client, 24-hour server cookie |
| **Input Validation** | Server-side via `express-validator` + client-side real-time feedback |
| **404 Handling** | Custom branded error page |
| **CORS** | Configurable allowed origins via environment variable |

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | ^4.x | Web framework |
| mysql2 | ^3.x | MySQL driver with promise support |
| bcrypt | ^5.x | Password hashing |
| helmet | ^7.x | Security HTTP headers |
| cors | ^2.x | Cross-Origin Resource Sharing |
| express-session | ^1.x | Server-side session management |
| express-validator | ^7.x | Input validation & sanitization |
| express-rate-limit | ^7.x | API rate limiting |
| xss | ^1.x | Cross-site scripting sanitization |
| dotenv | ^16.x | Environment variable loading |
| crypto | built-in | UUID generation, secret key generation |

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| CSS3 | Styling, animations, responsive layout |
| Vanilla JavaScript (ES2020) | Form validation, fetch API calls, session handling |

### Database
| Technology | Purpose |
|---|---|
| MySQL 8.0+ | User data, audit logs, failed login tracking |

---

## 🛡️ Security Architecture

Ediglobe Secure implements a **defence-in-depth** approach with multiple independent security layers:

```
Client Request
     │
     ▼
[Helmet.js]         ← CSP, HSTS, X-Frame-Options, noSniff headers
     │
     ▼
[Rate Limiter]      ← 100 req/15min global; 5 req/15min on auth routes
     │
     ▼
[XSS Middleware]    ← All req.body & req.query strings sanitized via xss()
     │
     ▼
[Input Sanitizer]   ← Strips HTML tags and SQL meta-characters from input
     │
     ▼
[express-validator] ← Email format, password complexity, domain whitelist
     │
     ▼
[MySQL (Parameterized)] ← No string concatenation; sql injection impossible
     │
     ▼
[bcrypt (12 rounds)]    ← Passwords never stored in plain text
     │
     ▼
[Session (httpOnly Cookie)] ← No JWT in localStorage; sameSite=strict
     │
     ▼
[Audit Log]         ← IP + User-Agent recorded for every auth event
```

---

## 📁 Project Structure

```
ediglobe-secure/
│
├── ediglobe.js              # Main server entry point (Express app)
├── .env                     # Environment variables (never commit this!)
├── .env.example             # Template for required environment variables
├── package.json             # Node dependencies and scripts
├── package-lock.json        # Locked dependency tree
│
└── public/                  # Static files served by Express
    ├── login.html           # Login page
    ├── signup.html          # Registration page
    ├── dashboard.html       # Protected user dashboard
    └── 404.html             # Custom 404 error page
```

---

## ✅ Prerequisites

Before running Ediglobe Secure, make sure you have the following installed:

- **Node.js** v18.0 or higher → https://nodejs.org
- **npm** v9.0 or higher (comes with Node.js)
- **MySQL** 8.0 or higher → https://dev.mysql.com/downloads/mysql/
- **Git** → https://git-scm.com

Check your versions:
```bash
node -v       # Should be v18+
npm -v        # Should be v9+
mysql --version
```

---

## 🚀 Installation

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/ediglobe-secure.git
cd ediglobe-secure
```

Or if you have the files directly, place them in a folder:
```bash
mkdir ediglobe-secure
cd ediglobe-secure
# Place ediglobe.js and public/ folder here
```

---

### Step 2 — Install Node Dependencies

Install all required packages at once:

```bash
npm install
```

Or install each package individually:

```bash
npm install express
npm install mysql2
npm install bcrypt
npm install helmet
npm install cors
npm install express-session
npm install express-validator
npm install express-rate-limit
npm install xss
npm install dotenv
```

**Verify your installation:**
```bash
node -e "require('express'); require('mysql2'); require('bcrypt'); require('helmet'); console.log('All packages OK')"
```

---

### Step 3 — Configure Environment Variables

Create a `.env` file in the root of your project:

```bash
# On Linux / macOS
cp .env.example .env

# On Windows
copy .env.example .env
```

Then open `.env` and fill in your values (see the [Environment Variables Reference](#environment-variables-reference) section below for full details):

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ediglobe_db
DB_SSL=false

# Session
SESSION_SECRET=your_super_secret_key_at_least_32_chars

# App
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
COOKIE_DOMAIN=localhost
```

> **Security Note:** Never commit your `.env` file to version control. Add it to `.gitignore` immediately.

```bash
echo ".env" >> .gitignore
```

---

### Step 4 — Set Up MySQL Database

**1. Log in to MySQL:**
```bash
mysql -u root -p
```

**2. Create the database:**
```sql
CREATE DATABASE ediglobe_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**3. Create a dedicated user (recommended for production):**
```sql
CREATE USER 'ediglobe_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON ediglobe_db.* TO 'ediglobe_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**4. Update your `.env` with the new credentials:**
```env
DB_USER=ediglobe_user
DB_PASSWORD=your_secure_password
DB_NAME=ediglobe_db
```

> **Note:** The application will automatically create all required tables (`users`, `audit_logs`, `failed_logins`) on first startup — no manual schema import is needed.

---

### Step 5 — Run the Server

**Development mode (with auto-restart using nodemon):**
```bash
# Install nodemon globally if you haven't already
npm install -g nodemon

nodemon ediglobe.js
```

**Production mode:**
```bash
NODE_ENV=production node ediglobe.js
```

**Standard start:**
```bash
node ediglobe.js
```

The server will start on `http://localhost:3000` (or the port defined in your `.env`).

You should see:
```
Database connected successfully!
All security tables created/verified
Secure server running on port 3000
Environment: development
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔧 Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_HOST` | ✅ Yes | — | MySQL host (e.g. `localhost` or IP address) |
| `DB_USER` | ✅ Yes | — | MySQL username |
| `DB_PASSWORD` | ✅ Yes | — | MySQL password |
| `DB_NAME` | ✅ Yes | — | MySQL database name |
| `DB_SSL` | No | `false` | Set to `true` to enable SSL for DB connection |
| `SESSION_SECRET` | ✅ Yes | Random (insecure) | Long random string for signing session cookies. Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `PORT` | No | `3000` | Port the Express server listens on |
| `NODE_ENV` | No | `development` | Set to `production` for secure cookies and stricter settings |
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated list of allowed CORS origins (e.g. `https://yourdomain.com`) |
| `COOKIE_DOMAIN` | No | `undefined` | Domain for the session cookie (e.g. `.yourdomain.com`) |

---

## 🌐 API Endpoints

All API routes are prefixed with `/api/`.

### `POST /api/register`

Registers a new user account.

**Request body:**
```json
{
  "email": "user@gmail.com",
  "password": "SecureP@ss1",
  "confirmPassword": "SecureP@ss1"
}
```

**Responses:**

| Status | Body | Meaning |
|---|---|---|
| `200` | `{ success: true, message: "User registered successfully" }` | Account created |
| `400` | `{ error: "Password must contain..." }` | Validation failed |
| `409` | `{ error: "Email already registered" }` | Duplicate account |
| `429` | `{ error: "Too many login attempts..." }` | Rate limit hit |
| `500` | `{ error: "Server error" }` | Internal error |

---

### `POST /api/login`

Authenticates a user and starts a session.

**Request body:**
```json
{
  "email": "user@gmail.com",
  "password": "SecureP@ss1"
}
```

**Responses:**

| Status | Body | Meaning |
|---|---|---|
| `200` | `{ success: true, message: "Login successful", user: { email } }` | Logged in |
| `400` | `{ error: "Invalid input" }` | Validation failed |
| `401` | `{ error: "Invalid credentials" }` | Wrong email or password |
| `423` | `{ error: "Account is locked. Contact support." }` | Account locked |
| `429` | `{ error: "Too many failed attempts..." }` | 5+ failures in 1 hour |
| `500` | `{ error: "Server error" }` | Internal error |

---

### `POST /api/logout`

Destroys the session and clears the session cookie.

**Responses:**

| Status | Body | Meaning |
|---|---|---|
| `200` | `{ success: true, message: "Logged out successfully" }` | Session cleared |
| `500` | `{ error: "Server error" }` | Internal error |

---

### `GET /api/auth/status`

Checks whether the current session is authenticated. Called by the dashboard on load and every 5 minutes.

**Responses:**

| Status | Body | Meaning |
|---|---|---|
| `200` | `{ authenticated: true, user: { email } }` | Valid session |
| `200` | `{ authenticated: false }` | No session or expired |
| `500` | `{ error: "Server error" }` | Internal error |

---

## 📄 Frontend Pages

### `/` or `/login` — Login Page (`login.html`)

- Email + password form with client-side validation
- Displays real-time error and success messages
- Client-side rate limiting: **5 attempts / 15 minutes** tracked in `localStorage`
- Redirects to `/dashboard` on successful login
- Link to the Sign Up page

### `/signup` — Registration Page (`signup.html`)

- Email, password, and confirm password fields
- **Real-time password strength meter** (Weak → Fair → Good → Strong)
- Live checklist of password requirements (updates as you type)
- Real-time email domain validation
- Real-time confirm-password mismatch detection with colour coding (red/green borders)
- Client-side rate limiting: **3 signup attempts / 30 minutes**
- Redirects to Login page after successful account creation

### `/dashboard` — User Dashboard (`dashboard.html`)

- **Protected route** — server redirects to `/login` if not authenticated
- Calls `/api/auth/status` on load to verify session server-side
- Displays welcome message using `textContent` (XSS-safe, no `innerHTML`)
- **30-minute inactivity timeout** — resets on mouse, click, or keypress
- Periodic auth re-check every 5 minutes
- Logout button that calls `POST /api/logout`
- Live session time display

### `/404` — Not Found Page (`404.html`)

- Custom branded 404 page
- "Go Back Home" button linking to `/`

---

## 🔑 Password Policy

All passwords must satisfy **all five** of the following requirements, enforced on both the client and the server:

| Rule | Detail |
|---|---|
| **Minimum length** | At least **8 characters** |
| **Uppercase letter** | At least **one** A–Z character |
| **Lowercase letter** | At least **one** a–z character |
| **Number** | At least **one** digit (0–9) |
| **Special character** | At least one of: `@ $ ! % * ? &` |

Passwords are hashed using **bcrypt with 12 salt rounds** before being stored. Plain-text passwords are never logged or stored anywhere.

---

## 📧 Allowed Email Domains

Registration is restricted to the following email providers (enforced on both client and server):

| Provider | Domain |
|---|---|
| Gmail | `gmail.com` |
| Outlook / Hotmail | `outlook.com` |
| Yahoo Mail | `yahoo.com` |
| iCloud | `icloud.com` |
| ProtonMail | `protonmail.com` |
| Zoho Mail | `zoho.com` |

Attempts to register with any other domain will be rejected with a `400` error.

---

## 🗄️ Database Schema

Tables are auto-created on first server startup. No manual SQL import is needed.

### `users`
```sql
CREATE TABLE users (
    id          VARCHAR(36)  PRIMARY KEY,           -- UUID v4
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,               -- bcrypt hash
    is_locked   BOOLEAN      DEFAULT FALSE,
    ip_address  VARCHAR(45),                         -- Registration IP
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `audit_logs`
```sql
CREATE TABLE audit_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     VARCHAR(36),
    action      VARCHAR(50),       -- 'REGISTRATION', 'LOGIN', 'LOGOUT'
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    details     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `failed_logins`
```sql
CREATE TABLE failed_logins (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    email        VARCHAR(255),
    ip_address   VARCHAR(45),
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_ip (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## ⏱️ Rate Limiting Rules

| Scope | Window | Max Requests | Behaviour on Breach |
|---|---|---|---|
| **All `/api/` routes** | 15 minutes | 100 requests | `429 Too Many Requests` |
| **`/api/login`** | 15 minutes | 5 requests | `429 Too Many Requests` |
| **`/api/register`** | 15 minutes | 5 requests | `429 Too Many Requests` |
| **Client-side login** | 15 minutes | 5 attempts | Shows remaining attempts in UI, blocks form |
| **Client-side signup** | 30 minutes | 3 attempts | Blocks form with countdown |
| **Server-side login lockout** | 1 hour | 5 DB failures | Returns `429` from DB check |
| **Account lockout** | Permanent | 10 DB failures | Sets `is_locked=true`; requires admin reset |

---

## 🔐 Session Management

Sessions use **`express-session`** with a server-side memory store and an `httpOnly` signed cookie.

| Setting | Value |
|---|---|
| Cookie name | `sessionId` |
| `httpOnly` | `true` — inaccessible to JavaScript |
| `sameSite` | `strict` — blocks cross-site request forgery |
| `secure` | `true` in production (requires HTTPS) |
| Server-side expiry | 24 hours |
| Client inactivity timeout | 30 minutes (reset on mouse/key/click) |
| Periodic server check | Every 5 minutes via `/api/auth/status` |

> **Production note:** For multi-server deployments, replace the default in-memory store with a persistent store such as `connect-redis` or `connect-mysql-session` to share sessions across instances.

---

## 🛠️ Troubleshooting

### `Error: connect ECONNREFUSED 127.0.0.1:3306`
- MySQL is not running. Start it:
  ```bash
  # Linux
  sudo systemctl start mysql
  # macOS (Homebrew)
  brew services start mysql
  # Windows
  net start MySQL80
  ```

### `ER_ACCESS_DENIED_ERROR: Access denied for user`
- Your `DB_USER` or `DB_PASSWORD` in `.env` is incorrect.
- Verify with: `mysql -u your_user -p` and enter the password.

### `Error: Cannot find module 'express'`
- Dependencies are not installed. Run `npm install` from the project root.

### Sessions not persisting between requests
- Ensure `credentials: 'same-origin'` is present on every `fetch()` call in the frontend. This is required for cookies to be sent with API requests.
- Check that `SESSION_SECRET` is set in `.env`. Without it, a new secret is generated on every restart, invalidating all existing sessions.

### Account locked and can't log in
- An admin must unlock the account directly in MySQL:
  ```sql
  UPDATE users SET is_locked = false WHERE email = 'user@example.com';
  DELETE FROM failed_logins WHERE email = 'user@example.com';
  ```

### `Too many requests` on login immediately
- The auth limiter allows only 5 requests per 15 minutes on `/api/login`. Wait 15 minutes, or in development, restart the server to clear the in-memory rate-limit counter.

### CORS error in browser console
- Set `ALLOWED_ORIGINS` in `.env` to match the exact origin your frontend is served from, including the protocol and port:
  ```env
  ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
  ```

### Cookies not sent in production (`secure: true` issue)
- In production, `secure: true` requires **HTTPS**. Make sure your server is behind an SSL-terminating reverse proxy (nginx, Caddy, or a load balancer). Set `NODE_ENV=production` in your `.env`.

---

## 📄 License

```
MIT License

Copyright (c) 2025 Saksham Singh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

*Built with Node.js, Express, and MySQL — security-first, front to back.*
*Author: Saksham Singh*
