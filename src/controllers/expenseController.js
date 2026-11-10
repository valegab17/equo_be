const { getAllExpenses, getExpenseById, createExpense, deleteExpense, updateExpense } = require("../services/expenseService");

const getExpenses = async (req, res) => {
    try {
        const expenses = await getAllExpenses();
        res.status(200).json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Errore nel recupero delle spese"
        });
    }
};

const getExpenseByIdController = async (req, res) => {
    try {
        const expense = await getExpenseById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                message: "Spesa non trovata"
            });
        }

        return res.status(200).json(expense);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Errore nel recupero della spesa"
        });
    }
};

const createExpenseController = async (req, res) => {
    try {
        const { details, amount, date_time, group_id, paid_by, shares } = req.body;
        const expenseId = await createExpense({
            details,
            amount,
            date_time,
            group_id,
            paid_by,
            shares
        });
        res.status(201).json({ id: expenseId });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Errore nella creazione della spesa"
        });
    }
};

const deleteExpenseController = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await deleteExpense(id);
        if (!deleted) {
            return res.status(404).json({ message: "Spesa non trovata" });
        }
        res.status(200).json({ message: "Spesa eliminata con successo" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore nell'eliminazione della spesa" });
    }
};

const updateExpenseController = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        if (amount <= 0 || typeof amount === 'string') {
            return res.status(400).json({
                message: "L'importo deve essere un numero maggiore di 0"
            });
        }
        const updated = await updateExpense(id, amount);
        if (!updated) {
            return res.status(404).json({ message: "Spesa non trovata" });
        }
        res.status(200).json({ message: "Spesa aggiornata con successo" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore nell'aggiornamento della spesa" });
    }
};

module.exports = { getExpenses, getExpenseByIdController, createExpenseController, deleteExpenseController, updateExpenseController };