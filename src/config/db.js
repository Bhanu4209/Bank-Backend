const mongoose = require("mongoose")

function connectToDB(){
    mongoose.connect(process.env.MONGO_URI)
       .then(() =>{
        console.log("server is connect")
       })
       .catch(err=>{
        console.log("server is not connection to DB")
        console.error(err);
        process.exit(1)
       })
}

module.exports = connectToDB;