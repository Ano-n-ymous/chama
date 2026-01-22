const db = require('../db/database');

class Member {
  // Get all members with their user emails
  static getAll(callback) {
    const sql = `
      SELECT m.*, u.email, u.role 
      FROM members m 
      JOIN users u ON m.user_id = u.id
      ORDER BY m.name
    `;
    db.all(sql, callback);
  }

  // Get single member
  static getById(id, callback) {
    const sql = `
      SELECT m.*, u.email 
      FROM members m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = ?
    `;
    db.get(sql, [id], callback);
  }

  // Create member (after user is created)
  static create(data, callback) {
    const sql = `INSERT INTO members (name, phone, join_date, user_id) VALUES (?, ?, ?, ?)`;
    db.run(sql, [data.name, data.phone, data.join_date, data.user_id], function(err) {
      callback(err, this?.lastID);
    });
  }

  // Update member
  static update(id, data, callback) {
    const sql = `UPDATE members SET name = ?, phone = ? WHERE id = ?`;
    db.run(sql, [data.name, data.phone, id], callback);
  }

  // Delete member
  static delete(id, callback) {
    // First delete contributions, loans, attendance
    db.run(`DELETE FROM contributions WHERE member_id = ?`, [id], () => {
      db.run(`DELETE FROM loans WHERE member_id = ?`, [id], () => {
        db.run(`DELETE FROM attendance WHERE member_id = ?`, [id], () => {
          db.run(`DELETE FROM members WHERE id = ?`, [id], callback);
        });
      });
    });
  }

  // Get members without user accounts (for linking)
  static getUnlinked(callback) {
    db.all(`SELECT * FROM members WHERE user_id IS NULL`, callback);
  }

  // Link member to user
  static linkUser(memberId, userId, callback) {
    db.run(`UPDATE members SET user_id = ? WHERE id = ?`, [userId, memberId], callback);
  }
}

module.exports = Member;
