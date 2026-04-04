require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const xss = require("xss");
const crypto = require("crypto");
const app = express();

//middleware
// Helmet security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts, please try again later.' },
    skipSuccessfulRequests: true,
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

// Static files
app.use(express.static("public", {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=86400');
    }
}));

//Database

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
});

// Setup security tables
async function setupSecurityTriggers() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                is_locked BOOLEAN DEFAULT FALSE,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(36),
                action VARCHAR(50),
                ip_address VARCHAR(45),
                user_agent TEXT,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS failed_logins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255),
                ip_address VARCHAR(45),
                attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_ip (ip_address)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log("All security tables created/verified");
    } catch (err) {
        console.error("Error setting up security tables:", err);
    }
}

// Test connection and setup tables
async function testConnection() {
    try {
        const connection = await db.getConnection();
        console.log("Database connected successfully!");
        connection.release();
        await setupSecurityTriggers();
    } catch (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1);
    }
}
testConnection();

//Session time Middleware

app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        domain: process.env.COOKIE_DOMAIN || undefined
    },
    name: 'sessionId'
}));

//Security Middleware

// XSS Protection
const xssProtection = (req, res, next) => {
    if (req.body) {
        for (let key in req.body) {
            if (typeof req.body[key] === 'string') req.body[key] = xss(req.body[key]);
        }
    }
    if (req.query) {
        for (let key in req.query) {
            if (typeof req.query[key] === 'string') req.query[key] = xss(req.query[key]);
        }
    }
    next();
};
app.use(xssProtection);

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'PHP/7.4');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

// Input sanitization
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].replace(/<[^>]*>/g, '').replace(/['";`]/g, '').trim();
            }
        }
    };
    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    next();
};
app.use(sanitizeInput);

//Routes

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "public", "signup.html")));
app.get("/dashboard", (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Registers
app.post("/api/register",
    [
        body('email').isEmail().normalizeEmail().withMessage('Invalid email format')
            .custom(value => {
                const allowedDomains = ["gmail.com", "outlook.com", "yahoo.com", "icloud.com", "protonmail.com", "zoho.com"];
                const domain = value.split('@')[1];
                if (!allowedDomains.includes(domain)) throw new Error('Email domain not allowed');
                return true;
            }),
        body('password')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one uppercase, one lowercase, one number, and one special character'),
        body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

            const { email, password } = req.body;
            const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
            if (existing.length > 0) return res.status(409).json({ error: "Email already registered" });

            const hashedPassword = await bcrypt.hash(password, 12);
            const userId = crypto.randomUUID();
            await db.execute(
                'INSERT INTO users (id, email, password, created_at, ip_address) VALUES (?, ?, ?, NOW(), ?)',
                [userId, email.toLowerCase(), hashedPassword, req.ip || req.connection.remoteAddress]
            );
            await db.execute(
                'INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)',
                [userId, 'REGISTRATION', req.ip, req.headers['user-agent']]
            );
            res.json({ success: true, message: "User registered successfully" });
        } catch (err) {
            console.error("Registration error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
);

// Login
app.post("/api/login",
    [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid input" });

            const { email, password } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;

            // Check failed attempts
            const [failedAttempts] = await db.execute(
                `SELECT COUNT(*) as count FROM failed_logins WHERE email = ? AND attempt_time > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
                [email.toLowerCase()]
            );
            if (failedAttempts[0].count >= 5) {
                return res.status(429).json({ error: "Too many failed attempts. Please try again later." });
            }

            const [users] = await db.execute(
                'SELECT id, email, password, is_locked FROM users WHERE email = ?',
                [email.toLowerCase()]
            );
            if (users.length === 0) {
                await db.execute('INSERT INTO failed_logins (email, ip_address) VALUES (?, ?)', [email.toLowerCase(), ipAddress]);
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const user = users[0];
            if (user.is_locked) return res.status(423).json({ error: "Account is locked. Contact support." });

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                await db.execute('INSERT INTO failed_logins (email, ip_address) VALUES (?, ?)', [email.toLowerCase(), ipAddress]);
                const [newAttempts] = await db.execute(
                    `SELECT COUNT(*) as count FROM failed_logins WHERE email = ? AND attempt_time > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
                    [email.toLowerCase()]
                );
                if (newAttempts[0].count >= 10) {
                    await db.execute('UPDATE users SET is_locked = true WHERE id = ?', [user.id]);
                    return res.status(423).json({ error: "Account locked due to too many failed attempts" });
                }
                return res.status(401).json({ error: "Invalid credentials" });
            }

// Successful login
            req.session.userId = user.id;
            req.session.userEmail = user.email;
            req.session.createdAt = Date.now();

            await db.execute('DELETE FROM failed_logins WHERE email = ?', [email.toLowerCase()]);
            await db.execute(
                'INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)',
                [user.id, 'LOGIN', ipAddress, req.headers['user-agent']]
            );
            res.json({ success: true, message: "Login successful", user: { email: user.email } });
        } catch (err) {
            console.error("Login error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
);

// Logout
app.post("/api/logout", async (req, res) => {
    try {
        if (req.session.userId) {
            await db.execute(
                'INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)',
                [req.session.userId, 'LOGOUT', req.ip, req.headers['user-agent']]
            );
        }
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout error:", err);
                return res.status(500).json({ error: "Logout failed" });
            }
            res.clearCookie('sessionId');
            res.json({ success: true, message: "Logged out successfully" });
        });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Auth status
app.get("/api/auth/status", async (req, res) => {
    try {
        if (!req.session.userId) return res.json({ authenticated: false });
        const [users] = await db.execute(
            'SELECT email FROM users WHERE id = ? AND is_locked = false',
            [req.session.userId]
        );
        if (users.length === 0) {
            req.session.destroy();
            return res.json({ authenticated: false });
        }
        res.json({ authenticated: true, user: { email: users[0].email } });
    } catch (err) {
        console.error("Auth status error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

//Error Handling

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Starting server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Secure server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        console.log('HTTP server closed');
        await db.end();
        process.exit(0);
    });
});
