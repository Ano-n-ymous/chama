const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const Member = require('../models/Member');
const { body, validationResult } = require('express-validator');
const db = require('../db/database'); // ✅ FIX: Import db for direct queries

router.use((req, res, next) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  next();
});

// List all meetings
router.get('/', (req, res) => {
  Meeting.getAll((err, meetings) => {
    if (err) return res.status(500).send('Error loading meetings');
    res.render('meetings/index', { 
      meetings,
      title: 'Meetings',
      user: { role: req.session.userRole }
    });
  });
});

// Show create meeting form
router.get('/create', (req, res) => {
  if (req.session.userRole !== 'admin' && req.session.userRole !== 'secretary') {
    return res.status(403).send('Admin/Secretary only');
  }
  res.render('meetings/create', { 
    title: 'Schedule Meeting',
    error: null,
    user: { role: req.session.userRole }
  });
});

// Handle create meeting
router.post('/create', [
  body('title').trim().notEmpty(),
  body('date').isISO8601(),
  body('agenda').trim().notEmpty()
], (req, res) => {
  if (req.session.userRole !== 'admin' && req.session.userRole !== 'secretary') {
    return res.status(403).send('Admin/Secretary only');
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('meetings/create', { 
      title: 'Schedule Meeting',
      error: 'Invalid input',
      user: { role: req.session.userRole }
    });
  }

  Meeting.create({
    title: req.body.title,
    date: req.body.date,
    agenda: req.body.agenda,
    created_by: req.session.userId
  }, (err) => {
    if (err) return res.status(500).send('Meeting creation failed');
    res.redirect('/meetings');
  });
});

// Mark attendance form
router.get('/attend/:id', (req, res) => {
  const meetingId = req.params.id;
  
  Meeting.getMembersForAttendance(meetingId, (err, members) => {
    if (err) return res.status(500).send('Error loading members');
    
    res.render('meetings/attend', { 
      meetingId,
      members,
      title: 'Mark Attendance',
      user: { role: req.session.userRole }
    });
  });
});

// Handle attendance submission - ✅ FIXED VERSION
router.post('/attend/:id', (req, res) => {
  const meetingId = req.params.id;
  const attendanceData = req.body.attendance || {}; // ✅ FIX: Default to empty object
  
  // Get all members to ensure we update everyone (checked or unchecked)
  Meeting.getMembersForAttendance(meetingId, (err, members) => {
    if (err) return res.status(500).send('Error loading members');
    
    const updates = members.map(member => {
      // Check if this member was checked in the form
      const attended = attendanceData[member.id] === '1';
      
      return new Promise((resolve, reject) => {
        // Use INSERT OR REPLACE to handle both new and existing records
        const sql = `INSERT OR REPLACE INTO attendance (meeting_id, member_id, attended) VALUES (?, ?, ?)`;
        db.run(sql, [meetingId, member.id, attended], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    Promise.all(updates)
      .then(() => res.redirect('/meetings'))
      .catch((err) => {
        console.error('Attendance error:', err);
        res.status(500).send('Attendance update failed');
      });
  });
});

module.exports = router;
