const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');

const router = express.Router();

// === LOGIN ROUTES ===
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/login', { error: 'Invalid input' });
  }

  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) {
      return res.render('auth/login', { error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('auth/login', { error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;
    res.redirect('/');
  });
});

// === REGISTRATION ROUTES ===
// 🔓 TEMPORARILY UNPROTECTED for first admin setup
router.get('/register', (req, res) => {
  // After you create first admin, uncomment these lines:
  // if (!req.session.userId || req.session.userRole !== 'admin') {
  //   return res.redirect('/auth/login');
  // }
  res.render('auth/register', { error: null });
});

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'secretary', 'member'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/register', { error: 'Validation failed. Password must be 6+ chars.' });
  }

  const { email, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 
    [email, hashedPassword, role], 
    function(err) {
      if (err) {
        return res.render('auth/register', { 
          error: 'Email already exists. Try another.' 
        });
      }
      // After registration, go to login
      res.redirect('/auth/login');
    }
  );
});

// === LOGOUT ===
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
