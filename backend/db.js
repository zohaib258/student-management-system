const mysql = require("mysql2");

const dotenv = require("dotenv");


// Loads the values stored inside the .env file.
dotenv.config();


// Creates a connection pool for communicating with MySQL.
const db = mysql.createPool({

    host: process.env.DB_HOST,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    port: process.env.DB_PORT

}).promise();


// Makes the database connection available to other files.
module.exports = db;