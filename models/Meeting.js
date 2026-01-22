const db = require('../db/database');

class Meeting {
  // Create meeting
  static create(data, callback) {
    const sql = `INSERT INTO meetings (title, date, agenda, created_by) VALUES (?, ?, ?, ?)`;
    db.run(sql, [data.title, data.date, data.agenda, data.created_by], callback);
  }

  // Get all meetings
  static getAll(callback) {
    const sql = `
      SELECT m.*, u.email as creator_name 
      FROM meetings m
      JOIN users u ON m.created_by = u.id
      ORDER BY m.date DESC
    `;
    db.all(sql, callback);
  }

  // Get single meeting
  static getById(id, callback) {
    db.get(`SELECT * FROM meetings WHERE id = ?`, [id], callback);
  }

  // Record attendance
  static markAttendance(meetingId, memberId, attended, callback) {
    const sql = `INSERT OR REPLACE INTO attendance (meeting_id, member_id, attended) VALUES (?, ?, ?)`;
    db.run(sql, [meetingId, memberId, attended], callback);
  }

  // Get attendance for a meeting
  static getAttendance(meetingId, callback) {
    const sql = `
      SELECT a.*, m.name as member_name 
      FROM attendance a
      JOIN members m ON a.member_id = m.id
      WHERE a.meeting_id = ?
    `;
    db.all(sql, [meetingId], callback);
  }

  // Get members for attendance marking
  static getMembersForAttendance(meetingId, callback) {
    const sql = `
      SELECT m.id, m.name, 
             (SELECT attended FROM attendance WHERE meeting_id = ? AND member_id = m.id) as attended
      FROM members m
    `;
    db.all(sql, [meetingId], callback);
  }
}

module.exports = Meeting;
