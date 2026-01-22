const express = require('express');
const router = express.Router();
const Contribution = require('../models/Contribution');
const Member = require('../models/Member');
const { body, validationResult } = require('express-validator');

router.use((req, res, next) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  next();
});

// View all contributions and arrears
router.get('/', (req, res) => {
  Contribution.getAll((err, contributions) => {
    if (err) return res.status(500).send('Error loading contributions');
    
    Contribution.getMembersWithArrears((err, arrears) => {
      if (err) return res.status(500).send('Error loading arrears');
      
      res.render('contributions/index', { 
        contributions,
        arrears,
        title: 'Contributions',
        user: { role: req.session.userRole }  // ✅ FIX: Added user object
      });
    });
  });
});

// Show form to record contribution
router.get('/record', (req, res) => {
  Member.getAll((err, members) => {
    if (err) return res.status(500).send('Error loading members');
    res.render('contributions/record', { 
      members,
      title: 'Record Contribution',
      error: null,
      user: { role: req.session.userRole }  // ✅ FIX: Added user object
    });
  });
});

// Handle recording contribution
router.post('/record', [
  body('member_id').isInt(),
  body('amount').isFloat({ min: 1 }),
  body('date').isDate()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return Member.getAll((err, members) => {
      res.render('contributions/record', { 
        members,
        title: 'Record Contribution',
        error: 'Invalid input',
        user: { role: req.session.userRole }  // ✅ FIX: Added user object
      });
    });
  }

  Contribution.record(req.body, (err) => {
    if (err) return res.status(500).send('Failed to record contribution');
    res.redirect('/contributions');
  });
});

module.exports = router;
