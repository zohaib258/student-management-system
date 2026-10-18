const db = require("./db");


// Tests whether Node.js can successfully communicate with MySQL.
db.query("SELECT 1", function(error, results) {

    // Checks whether MySQL returned an error.
    if (error) {

        console.error("Database connection failed:");
        console.error(error);

        return;
    }

    // Confirms that the database connection is working.
    console.log("Database connection successful.");
    console.log("Test result:", results);

});