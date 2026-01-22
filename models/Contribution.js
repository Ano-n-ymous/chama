const db = require('../db/database');

class Contribution {
  // Record a new contribution
  static record(data, callback) {
    const sql = `INSERT INTO contributions (member_id, amount, date) VALUES (?, ?, ?)`;
    db.run(sql, [data.member_id, data.amount, data.date], callback);
  }

  // Get all contributions with member names
  static getAll(callback) {
    const sql = `
      SELECT c.*, m.name as member_name 
      FROM contributions c
      JOIN members m ON c.member_id = m.id
      ORDER BY c.date DESC
    `;
    db.all(sql, callback);
  }

  // Get member's total contributions
  static getTotalForMember(memberId, callback) {
    const sql = `SELECT SUM(amount) as total FROM contributions WHERE member_id = ?`;
    db.get(sql, [memberId], (err, row) => {
      callback(err, row?.total || 0);
    });
  }

  // Get members with arrears (no contribution in last 30 days)
  static getMembersWithArrears(callback) {
    const sql = `
      SELECT m.*, u.email, MAX(c.date) as last_contribution
      FROM members m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN contributions c ON m.id = c.member_id
      GROUP BY m.id
      HAVING last_contribution IS NULL 
         OR last_contribution < date('now', '-30 days')
    `;
    db.all(sql, callback);
  }

  // Delete a contribution (admin only)
  static delete(id, callback) {
    db.run(`DELETE FROM contributions WHERE id = ?`, [id], callback);
  }
}

module.exports = Contribution;
