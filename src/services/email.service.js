require("dotenv").config();
const nodemailer = require("nodemailer");

// console.log({
//   EMAIL_USER: process.env.EMAIL_USER,
//   CLIENT_ID: process.env.CLIENT_ID,
// });

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
    }

});

transporter.verify((error, success) => {
    if (error) {
        console.error("Email server error:", error);
    } else {
        console.log("Email server ready");
    }
});

async function sendEmail(to, subject, text, html) {
    try {
        const info = await transporter.sendMail({
            from: `"Back Ledger" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        });

        console.log("Message sent:", info.messageId);

    } catch (error) {
        console.error("Send Mail Error:", error);
        throw error;
    }
}

async function sendRegistrationEmail(userEmail, name) {

    const text = `
Hello ${name}

Thank you for registering at Backend Ledger.
We're excited to have you on board!

Best regards,
Backend Ledger Team
`;

    const html = `
        <h2>Hello ${name}</h2>
        <p>Thank you for registering at Backend Ledger.</p>
        <p>We're excited to have you on board!</p>
        <p>Best Regards,<br/>Backend Ledger Team</p>
    `;

    const subject = "Welcome to Backend Ledger";

    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendEmail,
    sendRegistrationEmail
};