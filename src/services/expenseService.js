
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

const updateExpense = async (id, expenseData) => {
    const { details, amount, paid_by, shares } = expenseData;

    // Controllo che le quote siano numeriche e positive
    const sum = shares.reduce((acc, curr) => {
        if (typeof curr.share_amount !== "number" || curr.share_amount <= 0) {
            throw new Error("La quota deve essere un numero maggiore di zero");
        }
        return acc + curr.share_amount;
    }, 0);

    // Confronto degli importi in centesimi
    const sumInCents = Math.round(sum * 100);
    const amountInCents = Math.round(amount * 100);

    if (sumInCents !== amountInCents) {
        throw new Error("La somma delle quote non corrisponde all'importo totale");
    }

    let connection;

    try {
        // Otteniamo una connessione dedicata
        connection = await pool.promise().getConnection();

        // Iniziamo la transazione
        await connection.beginTransaction();

        // Verifichiamo che la spesa esista e recuperiamo il gruppo
        const [expenseRows] = await connection.query(
            "SELECT group_id FROM expenses WHERE id = ?",
            [id]
        );

        if (expenseRows.length === 0) {
            throw new Error("Spesa non trovata");
        }

        const group_id = expenseRows[0].group_id;

        // Validiamo il pagante e i partecipanti
        await validateExpenseShares(group_id, paid_by, shares);

        // Aggiorniamo i dati della spesa
        await connection.query(
            "UPDATE expenses SET details = ?, amount = ?, paid_by = ? WHERE id = ?",
            [details, amount, paid_by, id]
        );

        // Eliminiamo le vecchie quote
        await connection.query(
            "DELETE FROM expenses_shares WHERE expense_id = ?",
            [id]
        );

        // Inseriamo le nuove quote
        for (let i = 0; i < shares.length; i++) {
            const share = shares[i];

            await createExpenseShare(connection, {
                expense_id: id,
                user_id: share.user_id,
                share_amount: share.share_amount
            });
        }

        // Confermiamo la transazione
        await connection.commit();

        return true;

    } catch (err) {
        // In caso di errore annulliamo tutte le modifiche
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
