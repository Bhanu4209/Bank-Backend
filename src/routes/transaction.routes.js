const { Router } = require('express')
const transactionController = require('../controllers/transaction.controller')
const authMiddleware = require('../middlewares/auth.middleware');

const transactionRoutes = Router();


//POST/api/transactions/

transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

//POST.api/transactions/system/initial-funds

transactionRoutes.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;