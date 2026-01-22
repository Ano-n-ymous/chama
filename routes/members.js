const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../db/database');

// Protect all routes
router.use((req, res, next) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  next();
});

// List all members
router.get('/', (req, res) => {
  Member.getAll((err, members) => {
    if (err) return res.status(500).send('Database error');
    res.render('members/index', { 
      members, 
      title: 'Members',
      user: { role: req.session.userRole }
    });
  });
});

// Show add member form
router.get('/add', (req, res) => {
  if (req.session.userRole === 'member') {
    return res.status(403).send('Access denied');
  }
  res.render('members/add', { 
    title: 'Add Member', 
    error: null,
    user: { role: req.session.userRole }  // ✅ FIX: Added user object
  });
});

// Handle add member
router.post('/add', [
  body('name').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('join_date').isDate()
], (req, res) => {
  if (req.session.userRole === 'member') {
    return res.status(403).send('Access denied');
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('members/add', { 
      title: 'Add Member', 
      error: 'Invalid input',
      user: { role: req.session.userRole }  // ✅ FIX: Added user object
    });
  }

  const { name, phone, join_date } = req.body;
  
  // Create a user account with temporary email
  const tempEmail = `member_${Date.now()}@chama.local`;
  
  bcrypt.hash('changeme123', 10, (err, hash) => {
    if (err) return res.status(500).send('Error creating user');
    
    db.run(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`, 
      [tempEmail, hash, 'member'], 
      function(err) {
        if (err) return res.status(500).send('User creation failed');
        
        const userId = this.lastID;
        Member.create({ name, phone, join_date, user_id: userId }, (err, memberId) => {
          if (err) return res.status(500).send('Member creation failed');
          res.redirect('/members');
        });
      }
    );
  });
});

// Show edit member form
router.get('/edit/:id', (req, res) => {
  Member.getById(req.params.id, (err, member) => {
    if (err || !member) return res.status(404).send('Member not found');
    res.render('members/edit', { 
      member, 
      title: 'Edit Member',
      error: null,
      user: { role: req.session.userRole }  // ✅ FIX: Added user object
    });
  });
});

// Handle edit member
router.post('/edit/:id', [
  body('name').trim().notEmpty(),
  body('phone').trim().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('members/edit', { 
      member: req.body, 
      title: 'Edit Member', 
      error: 'Invalid input',
      user: { role: req.session.userRole }  // ✅ FIX: Added user object
    });
  }

  Member.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).send('Update failed');
    res.redirect('/members');
  });
});

// Delete member
router.post('/delete/:id', (req, res) => {
  if (req.session.userRole !== 'admin') {
    return res.status(403).send('Admin only');
  }
  
  Member.delete(req.params.id, (err) => {
    if (err) return res.status(500).send('Delete failed');
    res.redirect('/members');
  });
});

module.exports = router;
