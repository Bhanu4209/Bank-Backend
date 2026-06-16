const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service") 
const mongoose = require("mongoose")

// Create a new transaction
// THE 10 step transfer flow:
// 1 validate request
// 2 validate idempotency
// 3 check account status
// 4 Derive sender balance from ledger
// 5 create transaction (PENDING)
// 6 create debit ledger entry
// 7 create credit ledger entry
// 8 marks transaction completed
// 9 commit MongoDB session
// 10 send email Notification


// validate request code
async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount, idempotencyKey are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json(({
            message: "Invalid fromAccount or toAccount"
        }))
    }



    // validate idempotency code

    const isTransactionExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction Already completed",
                transaction: isTransactionAlreadyExists
            })
        }
        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still pending",
                transaction: isTransactionExists
            })
        }
        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }
        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, plese retry"
            })
        }
    }

    // check account status code
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTION") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    //Derive sender balance from ledger code
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        res.status(400).json({
            message: `Insufficient Balance Your current balance is ${balance} and you tried to transfer ${amount}`
        })
    }

    // Create transaction in PENDING state

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }, { session })

    const debitLedgerEntry = await ledgerModel.create({
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"

    }, { session })

    const creditLedgerEntry = await ledgerModel.create({
        account: toAccount,
        amount: amount,

    }, { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    // send email notification
    await emailService.sendTransactionEmail(req.user.emai, req.user.name, amount, toUserAccount._id)

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })


}

async function createInitialFundsTransaction(req,res){
    const {toAccount , amount, idempotencyKey} =req.body

    if (!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }
    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if(!toUserAccount){
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    console.log("req.user =", req.user);
    console.log("req.user._id =", req.user._id);
    console.log("req.user._id string =", req.user._id.toString());

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id.toString()
    });

    console.log("fromUserAccount =", fromUserAccount);

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        });
    }   
    // const fromUserAccount = await accountModel.findOne({
    //     User: String(req.user._id),
    //     user: req.user._id.toString()
    // })

    // if (!fromUserAccount){
    //     return res.status(400).json({
    //         message: "System user account not found"
    //     })
    // }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        });

        await transaction.save({ session });

        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction
        });

    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message:"Initial funds transaction  completed successful",
        transaction: transaction
    })
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
};
