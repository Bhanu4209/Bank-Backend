require("dotenv").config();

const app = require("./src/app.js");
const connectToDB = require("./src/config/db");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectToDB();

        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
};

startServer();
