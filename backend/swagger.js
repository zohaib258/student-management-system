
const swaggerJsdoc = require("swagger-jsdoc");

// Configure the API documentation.
const options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "Student Management System API",
            version: "1.0.0",
            description: "API documentation for our student management system."
        },

        servers: [
            {
                url: "http://localhost:3000",
                description: "Local development server"
            }
        ]
    },

    // Search route files for Swagger documentation comments.
    apis: ["./routes/*.js"]
};

// Generate the API specification.
const swaggerSpec = swaggerJsdoc(options);

// Make the specification available to server.js.
module.exports = swaggerSpec;