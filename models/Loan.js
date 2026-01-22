const db = require('../db/database');

class Loan {
  // Apply for a loan
  static apply(data, callback) {
    const sql = `INSERT INTO loans (member_id, amount, applied_date) VALUES (?, ?, ?)`;
    db.run(sql, [data.member_id, data.amount, data.applied_date], callback);
  }

  // Get all loans with member names
  static getAll(callback) {
    const sql = `
      SELECT l.*, m.name as member_name 
      FROM loans l
      JOIN members m ON l.member_id = m.id
      ORDER BY l.applied_date DESC
    `;
    db.all(sql, callback);
  }

  // Get pending loans for approval
  static getPending(callback) {
    const sql = `
      SELECT l.*, m.name as member_name 
      FROM loans l
      JOIN members m ON l.member_id = m.id
      WHERE l.status = 'pending'
    `;
    db.all(sql, callback);
  }

  // Approve or reject loan
  static updateStatus(id, status, callback) {
    const sql = `UPDATE loans SET status = ? WHERE id = ?`;
    db.run(sql, [status, id], callback);
  }

  // Record loan payment
  static recordPayment(data, callback) {
    const sql = `INSERT INTO loan_payments (loan_id, amount, date) VALUES (?, ?, ?)`;
    db.run(sql, [data.loan_id, data.amount, data.date], callback);
  }

  // Get total repaid amount for a loan
  static getTotalRepaid(loanId, callback) {
    const sql = `SELECT SUM(amount) as total FROM loan_payments WHERE loan_id = ?`;
    db.get(sql, [loanId], (err, row) => {
      callback(err, row?.total || 0);
    });
  }

  // Get loan balance (amount + interest - repaid)
  static getBalance(loanId, callback) {
    const sql = `SELECT amount, interest_rate FROM loans WHERE id = ?`;
    db.get(sql, [loanId], (err, loan) => {
      if (err || !loan) return callback(err, null);
      
      this.getTotalRepaid(loanId, (err, repaid) => {
        if (err) return callback(err, null);
        
        const interest = (loan.amount * loan.interest_rate) / 100;
        const balance = loan.amount + interest - repaid;
        callback(null, { balance, repaid, totalDue: loan.amount + interest });
      });
    });
  }
}

module.exports = Loan;
