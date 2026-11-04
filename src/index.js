require('dotenv').config();

const express = require('express');
const pool = require('./config/db');
const app = express();
const port = process.env.PORT || 3000;
const expenseRoutes = require('./routes/expenseRoutes');

app.use(express.json());
app.use('/api/expenses', expenseRoutes);

app.get('/', (req, res) => {
    res.send(' Equo API is running!');
});




app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});