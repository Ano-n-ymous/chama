#!/bin/bash

# Create Chama Yetu Project Structure
# Run this script inside your empty "chama-yetu" folder

echo "🚀 Creating Chama Yetu project structure..."

# Root files with initial content
cat > package.json << 'EOF'
{
  "name": "chama-yetu",
  "version": "1.0.0",
  "description": "Chama Management System - Semester Project",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "seed": "node scripts/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9",
    "sqlite3": "^5.1.6",
    "express-session": "^1.17.3",
    "express-validator": "^7.0.1",
    "bcryptjs": "^2.4.3",
    "method-override": "^3.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

cat > app.js << 'EOF'
const express = require('express');
const session = require('express-session');
const path = require('path');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'chama-yetu-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set true with HTTPS in production
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes (we'll create these files next)
app.use('/', require('./routes/dashboard'));
app.use('/auth', require('./routes/auth'));
app.use('/members', require('./routes/members'));
app.use('/contributions', require('./routes/contributions'));
app.use('/loans', require('./routes/loans'));
app.use('/meetings', require('./routes/meetings'));

// Initialize DB
const db = require('./db/database');
db.init();

app.listen(PORT, () => {
  console.log(`🌐 Chama Yetu running on http://localhost:${PORT}`);
});
EOF

cat > .gitignore << 'EOF'
node_modules/
db/database.sqlite
.env
*.log
EOF

cat > README.md << 'EOF'
# CHAMA YETU MANAGEMENT SYSTEM
## Semester Project - [Your Name]

### Overview
A web-based platform for managing chama groups with member tracking, contributions, loans, and meetings.

### Tech Stack
- Node.js + Express
- SQLite (file-based database)
- EJS Templates
- Bootstrap 5

### Setup
1. `npm install`
2. `npm run seed` (optional: adds sample data)
3. `npm run dev`

### Features Implemented
- Member management (CRUD)
- Contribution tracking & arrears detection
- Loan application & approval
- Meeting scheduling & attendance

### Login Credentials (from seed data)
- Admin: admin@chama.com | password: admin123
- Member: member@chama.com | password: member123

### Project Structure
[See provided structure document]
EOF

# Database
mkdir -p db
cat > db/database.js << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('❌ Database error:', err);
  else console.log('✅ Connected to SQLite database');
});

exports.init = () => {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'member' -- admin, secretary, member
    )`);

    // Members table
    db.run(`CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      join_date DATE,
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Contributions table
    db.run(`CREATE TABLE IF NOT EXISTS contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      amount REAL,
      date DATE,
      FOREIGN KEY (member_id) REFERENCES members(id)
    )`);

    // Loans table
    db.run(`CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      amount REAL,
      interest_rate REAL DEFAULT 10,
      status TEXT DEFAULT 'pending', -- pending, approved, repaid
      applied_date DATE,
      FOREIGN KEY (member_id) REFERENCES members(id)
    )`);

    // Loan payments table
    db.run(`CREATE TABLE IF NOT EXISTS loan_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER,
      amount REAL,
      date DATE,
      FOREIGN KEY (loan_id) REFERENCES loans(id)
    )`);

    // Meetings table
    db.run(`CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      date DATETIME,
      agenda TEXT,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    // Attendance table
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER,
      member_id INTEGER,
      attended BOOLEAN DEFAULT 0,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id),
      FOREIGN KEY (member_id) REFERENCES members(id)
    )`);
  });
};

module.exports = db;
EOF

touch db/schema.sql # Reference file

# Models
mkdir -p models
touch models/Member.js
touch models/Contribution.js
touch models/Loan.js
touch models/Meeting.js

# Routes
mkdir -p routes
touch routes/auth.js
touch routes/dashboard.js
touch routes/members.js
touch routes/contributions.js
touch routes/loans.js
touch routes/meetings.js

# Middleware
cat > middleware/requireAuth.js << 'EOF'
module.exports = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect('/auth/login');
  }
};
EOF

# Views directories
mkdir -p views/partials
mkdir -p views/auth
mkdir -p views/members
mkdir -p views/contributions
mkdir -p views/loans
mkdir -p views/meetings

# View files (empty templates)
touch views/partials/header.ejs
touch views/partials/footer.ejs
touch views/auth/login.ejs
touch views/auth/register.ejs
touch views/dashboard.ejs
touch views/members/index.ejs
touch views/members/add.ejs
touch views/members/edit.ejs
touch views/contributions/index.ejs
touch views/contributions/record.ejs
touch views/loans/apply.ejs
touch views/loans/pending.ejs
touch views/loans/view.ejs
touch views/meetings/index.ejs
touch views/meetings/create.ejs
touch views/meetings/attend.ejs

# Public directories
mkdir -p public/css
mkdir -p public/js
touch public/css/style.css
touch public/js/main.js

# Scripts
mkdir -p scripts
touch scripts/seed.js

echo "✅ Project structure created successfully!"
echo "📂 Run 'npm install' to install dependencies"
echo "📂 Run 'npm run dev' to start development server"
echo "🎯 Next: I'll help you code each file phase by phase"
