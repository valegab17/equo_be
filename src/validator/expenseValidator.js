
const pool = require("../config/db");

const validateExpenseShares = async (group_id, paid_by, shares) => {
    try {
        // Controllo che il pagante appartenga al gruppo
        const [payerRows] = await pool.promise().query(
            "SELECT * FROM group_members WHERE user_id = ? AND group_id = ?",
            [paid_by, group_id]
        );

        if (payerRows.length === 0) {
            throw new Error("L'utente che ha pagato la spesa non appartiene al gruppo selezionato.");
        }

        // Controllo gli utenti delle quote
        for (let i = 0; i < shares.length; i++) {
            let user = shares[i];

            // Controllo che non ci siano utenti duplicati
            for (let j = i + 1; j < shares.length; j++) {
                if (user.user_id === shares[j].user_id) {
                    throw new Error("Un utente non può comparire più volte nelle quote.");
                }
            }

            // Controllo che l'utente appartenga al gruppo
            const [rows] = await pool.promise().query(
                "SELECT * FROM group_members WHERE user_id = ? AND group_id = ?",
                [user.user_id, group_id]
            );

            if (rows.length === 0) {
                throw new Error("L'utente non appartiene al gruppo selezionato.");
            }
        }

        return true;

    } catch (err) {
        throw err;
    }
};

module.exports = validateExpenseShares;
