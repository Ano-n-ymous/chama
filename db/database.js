const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('❌ Database error:', err);
  else console.log('✅ Connected to SQLite database');
});

// Add init method directly to db instance
db.init = () => {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'member'
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
      status TEXT DEFAULT 'pending',
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

    console.log('✅ Database tables initialized');
  });
};

module.exports = db;
