const express = require('express');
const router = express.Router();
const db = require('../db/database');

// LANDING PAGE (Public) - WITH REAL STATS
router.get('/', (req, res) => {
  // Get real stats for landing page or dashboard
  const queries = {
    members: `SELECT COUNT(*) as count FROM members`,
    funds: `SELECT SUM(amount) as total FROM contributions`,
    loans: `SELECT COUNT(*) as count FROM loans WHERE status = 'approved'`,
    nextMeeting: `SELECT title, date FROM meetings WHERE date >= datetime('now') ORDER BY date LIMIT 1`
  };

  let stats = { members: 0, funds: 0, loans: 0, nextMeeting: null };

  db.get(queries.members, (err, row) => {
    stats.members = row?.count || 0;
    db.get(queries.funds, (err, row) => {
      stats.funds = row?.total || 0;
      db.get(queries.loans, (err, row) => {
        stats.loans = row?.count || 0;
        db.get(queries.nextMeeting, (err, row) => {
          stats.nextMeeting = row || null;
          
          // If logged in, show dashboard, else show landing with real stats
          if (req.session.userId) {
            res.render('dashboard', {
              title: 'Dashboard',
              user: { role: req.session.userRole },
              stats
            });
          } else {
            res.render('landing', { 
              title: 'Welcome to Chama Yetu',
              stats: stats // Pass real stats to landing page
            });
          }
        });
      });
    });
  });
});

// Reports page
router.get('/reports', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  
  res.render('reports', {
    title: 'Reports',
    user: { role: req.session.userRole }
  });
});

module.exports = router;
