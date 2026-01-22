const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const Member = require('../models/Member');
const { body, validationResult } = require('express-validator');

router.use((req, res, next) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  next();
});

// Member: Apply for loan
router.get('/apply', (req, res) => {
  res.render('loans/apply', { 
    title: 'Apply for Loan', 
    error: null,
    user: { role: req.session.userRole }  // ✅ FIX: Added user object
  });
});

router.post('/apply', [
  body('amount').isFloat({ min: 100, max: 50000 }),
  body('reason').trim().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('loans/apply', { 
      title: 'Apply for Loan', 
      error: 'Amount must be 100-50,000 and reason required',
      user: { role: req.session.userRole }  // ✅ FIX: Added user object
    });
  }

  const db = require('../db/database');
  db.get(`SELECT id FROM members WHERE user_id = ?`, [req.session.userId], (err, member) => {
    if (err || !member) {
      return res.status(500).send('You must be a member to apply for a loan');
    }

    Loan.apply({
      member_id: member.id,
      amount: req.body.amount,
      applied_date: new Date().toISOString().split('T')[0]
    }, (err) => {
      if (err) return res.status(500).send('Loan application failed');
      res.render('loans/apply', { 
        title: 'Apply for Loan', 
        error: null,
        success: '✅ Loan application submitted successfully!',
        user: { role: req.session.userRole }  // ✅ FIX: Added user object
      });
    });
  });
});

// Admin: View pending loans
router.get('/pending', (req, res) => {
  if (req.session.userRole !== 'admin') {
    return res.status(403).send('Admin only');
  }

  Loan.getPending((err, loans) => {
    if (err) return res.status(500).send('Error loading loans');
    res.render('loans/pending', { 
      loans,
      title: 'Pending Loans',
      user: { role: req.session.userRole }  // ✅ FIX: Added user object
    });
  });
});

// Admin: Approve/Reject loan
router.post('/approve/:id', (req, res) => {
  if (req.session.userRole !== 'admin') {
    return res.status(403).send('Admin only');
  }

  Loan.updateStatus(req.params.id, 'approved', (err) => {
    if (err) return res.status(500).send('Approval failed');
    res.redirect('/loans/pending');
  });
});

router.post('/reject/:id', (req, res) => {
  if (req.session.userRole !== 'admin') {
    return res.status(403).send('Admin only');
  }

  Loan.updateStatus(req.params.id, 'rejected', (err) => {
    if (err) return res.status(500).send('Rejection failed');
    res.redirect('/loans/pending');
  });
});

// View loan details
router.get('/view/:id', (req, res) => {
  const loanId = req.params.id;
  
  Loan.getAll((err, loans) => {
    if (err) return res.status(500).send('Error');
    
    const loan = loans.find(l => l.id == loanId);
    if (!loan) return res.status(404).send('Loan not found');
    
    const db = require('../db/database');
    db.get(`SELECT id FROM members WHERE user_id = ?`, [req.session.userId], (err, member) => {
      if (err) return res.status(500).send('Error');
      
      const isOwner = member && loan.member_id === member.id;
      const isAdmin = req.session.userRole === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).send('Access denied');
      }
      
      Loan.getBalance(loanId, (err, balance) => {
        if (err) return res.status(500).send('Error loading balance');
        
        res.render('loans/view', { 
          loan,
          balance,
          title: 'Loan Details',
          user: { role: req.session.userRole }  // ✅ FIX: Added user object
        });
      });
    });
  });
});

module.exports = router;
