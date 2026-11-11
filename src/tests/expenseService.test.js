const validateExpenseShares = require("../validator/expenseValidator");


test("L'utente appartiene al gruppo selezionato", async () => {
    const result = await validateExpenseShares(1, 2, [{ user_id: 2 }]);

    expect(result).toBe(true);
});

test("L'utente non appartiene al gruppo selezionato", async () => {
    await expect(
        validateExpenseShares(1, 2, [{ user_id: 1 }])
    ).rejects.toThrow("L'utente non appartiene al gruppo selezionato.");
});