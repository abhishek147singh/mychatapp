const mysql = require('mysql');
const dbConnection = mysql.createPool({
    host     : process.env.HOST, // MYSQL HOST NAME
    user     : process.env.USER, // MYSQL USERNAME
    password : process.env.PASSWORD, // MYSQL PASSWORD
    database : process.env.DATABASE // MYSQL DB NAME
});
module.exports = dbConnection;