const express = require("express");
const router = express.Router();

const { getExpenses, getExpenseByIdController, createExpenseController, deleteExpenseController } = require("../controllers/expenseController");
router.get("/", getExpenses);
router.get("/:id", getExpenseByIdController);
router.post("/", createExpenseController);
router.delete("/:id", deleteExpenseController);

module.exports = router;