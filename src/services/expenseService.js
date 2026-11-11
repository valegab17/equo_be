
const pool = require("../config/db");
const validateExpenseShares = require("../validator/expenseValidator");

const getAllExpenses = async () => {
    const [rows] = await pool.promise().query("SELECT * FROM expenses");

    return rows;
};

const getExpenseById = async (id) => {
    const [rows] = await pool.promise().query(
        "SELECT * FROM expenses WHERE id = ?", [id]
    );

    return rows[0];
};

const createExpense = async (expenseData) => {
    const { details, amount, date_time, group_id, paid_by, shares } = expenseData;

    // Mi assicuro che la somma delle quote corrisponda all'importo totale
    const sum = shares.reduce((acc, curr) => {
        if (typeof curr.share_amount !== 'number' || curr.share_amount <= 0) {
            throw new Error("La quota deve essere un numero maggiore di zero");
        }

        return acc + curr.share_amount;
    }, 0);

    if (sum !== amount) {
        throw new Error("La somma delle quote non corrisponde all'importo totale!");
    }

    // Confronto degli importi in centesimi
    const sumInCents = Math.round(sum * 100);
    const amountInCents = Math.round(amount * 100);

    if (sumInCents !== amountInCents) {
        throw new Error("La somma delle quote non corrisponde all'importo totale!");
    }

    await validateExpenseShares(group_id, paid_by, shares);

    let connection;

    try {
        // Otteniamo una connessione dedicata
        connection = await pool.promise().getConnection();

        // Iniziamo la transazione
        await connection.beginTransaction();

        // Inseriamo la spesa
        const [result] = await connection.query(
            "INSERT INTO expenses (details, amount, date_time, group_id, paid_by) VALUES (?, ?, ?, ?, ?)",
            [details, amount, date_time, group_id, paid_by]
        );

        // Inseriamo le quote di partecipazione
        for (let i = 0; i < shares.length; i++) {
            const share = shares[i];

            await createExpenseShare(connection, {
                expense_id: result.insertId,
                user_id: share.user_id,
                share_amount: share.share_amount
            });
        }

        // Confermiamo la transazione
        await connection.commit();

        return result.insertId;

    } catch (err) {
        // In caso di errore annulliamo le operazioni
        if (connection) {
            await connection.rollback();
        }

        throw err;

    } finally {
        // Restituiamo la connessione al pool
        if (connection) {
            connection.release();
        }
    }
};

const deleteExpense = async (id) => {
    const [result] = await pool.promise().query(
        "DELETE FROM expenses WHERE id = ?", [id]
    );

    return result.affectedRows > 0;
};

const updateExpense = async (id, amount) => {
    const [result] = await pool.promise().query(
        "UPDATE expenses SET amount = ? WHERE id = ?", [amount, id]
    );

    return result.affectedRows > 0;
};

const createExpenseShare = async (connection, sharesData) => {
    const { expense_id, user_id, share_amount } = sharesData;

    const [result] = await connection.query(
        "INSERT INTO expenses_shares (expense_id, user_id, share_amount) VALUES (?, ?, ?)",
        [expense_id, user_id, share_amount]
    );

    return result.insertId;
};

module.exports = {
    getAllExpenses,
    getExpenseById,
    createExpense,
    deleteExpense,
    updateExpense,
    createExpenseShare
};
