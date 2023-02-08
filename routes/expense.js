const express = require('express');

const router = express.Router();

const expenseController = require('../controllers/expense');

const authenticator = require('../middleware/auth');

router.post('/add-expense', authenticator.authenticate, expenseController.addExpense);

router.get('/get-expense', authenticator.authenticate, expenseController.getExpense);

router.get('/get-leaderboard', authenticator.authenticate, expenseController.getLeaderboradData);

router.delete('/delete-expense/:id', authenticator.authenticate, expenseController.deleteExpense);

module.exports = router;