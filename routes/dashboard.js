const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Main Dashboard with real-time stats
router.get('/', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }

  // Query for real stats
  const queries = {
    // Total members
    members: `SELECT COUNT(*) as count FROM members`,
    
    // Total contributions
    funds: `SELECT SUM(amount) as total FROM contributions`,
    
    // Active loans (approved but not fully repaid)
    loans: `SELECT COUNT(*) as count FROM loans WHERE status = 'approved'`,
    
    // Next meeting
    nextMeeting: `SELECT title, date FROM meetings WHERE date >= datetime('now') ORDER BY date LIMIT 1`
  };

  let stats = { members: 0, funds: 0, loans: 0, nextMeeting: null };

  // Execute queries
  db.get(queries.members, (err, row) => {
    stats.members = row?.count || 0;
    
    db.get(queries.funds, (err, row) => {
      stats.funds = row?.total || 0;
      
      db.get(queries.loans, (err, row) => {
        stats.loans = row?.count || 0;
        
        db.get(queries.nextMeeting, (err, row) => {
          stats.nextMeeting = row || null;
          
          // Render dashboard with real data
          res.render('dashboard', {
            title: 'Dashboard',
            user: { role: req.session.userRole },
            stats
          });
        });
      });
    });
  });
});

// Reports page
router.get('/reports', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  
  res.render('reports', {
    title: 'Reports',
    user: { role: req.session.userRole }
  });
});

module.exports = router;
