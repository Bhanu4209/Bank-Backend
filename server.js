require("dotenv").config();
const app = require("./src/app.js")
const connectToDB = require("./src/config/db")
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

connectToDB()
app.listen(3000, () =>{
    console.log("server is started on 3000")
})