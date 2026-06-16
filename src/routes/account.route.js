const express = require("express")
const authMiddleware = require("../middlewares/auth.Middleware")
const accountController = require("../controllers/account.controller")

console.log(authMiddleware);
console.log(accountController);

const router = express.Router()

router.post("/",authMiddleware.authMiddleware,accountController.createAccountController)

//GET /api/account

router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController)

module.exports = router