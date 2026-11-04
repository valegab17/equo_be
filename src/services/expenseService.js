const pool = require("../config/db");

const getAllExpenses = async () => {
    const [rows] = await pool.promise().query("SELECT * FROM expenses");

    return rows;
};

const getExpenseById = async (id) => {
    const [rows] = await pool.promise().query("SELECT * FROM expenses WHERE id = ?", [id]); 
    return rows[0];
};

const createExpense = async (expenseData) => {
    const { details, amount, date_time, group_id, paid_by } = expenseData;
    const [result] = await pool.promise().query(
        "INSERT INTO expenses (details, amount, date_time, group_id, paid_by) VALUES (?, ?, ?, ?, ?)",
        [details, amount, date_time, group_id, paid_by]
    );
    return result.insertId;
};

const deleteExpense = async (id) => {
    const [result] = await pool.promise().query("DELETE FROM expenses WHERE id = ?", [id]);
    return result.affectedRows > 0;
}

module.exports = { getAllExpenses, getExpenseById, createExpense, deleteExpense };