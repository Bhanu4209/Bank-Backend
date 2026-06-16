const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlackListModel = require("../models/blackList.model")

async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body;

        const isExists = await userModel.findOne({
            email: email
        });

        if (isExists) {
            return res.status(422).json({
                message: "User already exists with email.",
                status: false
            });
        }

        const user = await userModel.create({
            email,
            password,
            name
        });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        try {
            console.log("Sending registration email...");

            await emailService.sendRegistrationEmail(
                user.email,
                user.name
            );

            console.log("Registration email sent successfully");
        } catch (emailError) {
            console.error(
                "Registration Email Error:",
                emailError
            );
        }

        res.cookie("token", token);

        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;

        const user = await userModel
            .findOne({ email })
            .select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Email or password is INVALID"
            });
        }

        const isValidPassword =
            await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Email or password is INVALID"
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        res.cookie("token", token);

        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function userLogoutController(req,res){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(400).json({

        })
    }

    res.cookie("token", "")

    await tokenBlackListModel.create({
        token: token
    })

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
};