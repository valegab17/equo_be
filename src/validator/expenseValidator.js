const pool = require("../config/db");
const validateExpenseShares = async (group_id, shares) => {
    try {
        for (let i = 0; i < shares.length; i++) {
            let user = shares[i];

            const [rows] = await pool.promise().query(
                "SELECT * FROM group_members WHERE user_id = ? AND group_id = ?",
                [user.user_id, group_id]
            );

            if (rows.length === 0) {
                throw new Error("L'utente non appartiene al gruppo selezionato.")

            }
        }

        return true;
    } catch (err) {
        throw err;
    }
};

module.exports = validateExpenseShares