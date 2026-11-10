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
    const { details, amount, date_time, group_id, paid_by, shares } = expenseData;
    const [result] = await pool.promise().query(
        "INSERT INTO expenses (details, amount, date_time, group_id, paid_by) VALUES (?, ?, ?, ?, ?)",
        [details, amount, date_time, group_id, paid_by]
    );
    for (let i = 0; i < shares.length; i++) {
    const share = shares[i];
     await createExpenseShare({
    expense_id: result.insertId,
    user_id: share.user_id,
    share_amount: share.share_amount
});
}
    return result.insertId;
};

const deleteExpense = async (id) => {
    const [result] = await pool.promise().query("DELETE FROM expenses WHERE id = ?", [id]);
    return result.affectedRows > 0;
}

const updateExpense = async (id, amount) => {
    const [result] = await pool.promise().query("UPDATE expenses SET amount = ? WHERE id = ?", [amount, id]);
    return result.affectedRows > 0;
}   

const createExpenseShare = async(sharesData) => {
    const { expense_id, user_id, share_amount } = sharesData;
    const [result] = await pool.promise().query(
        "INSERT INTO expense_shares (expense_id, user_id, share_amount) VALUES (?, ?, ?)",
        [expense_id, user_id, share_amount]
    );
    return result.insertId;

}

module.exports = { getAllExpenses, getExpenseById, createExpense, deleteExpense, updateExpense, createExpenseShare };