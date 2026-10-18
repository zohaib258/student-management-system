
const express = require("express");
const path = require("path");
const session = require("express-session");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

// Imports the existing authentication and student routes.
const authRoutes = require("./routes/authRoutes");

// Imports the Swagger API specification.
const swaggerSpec = require("./swagger");

const app = express();


// Allows React frontend to communicate with Express.
app.use(
    cors({
        origin: "http://localhost:3001",
        credentials: true
    })
);


// Allows Express to read JSON request bodies.
app.use(express.json());


// Allows Express to read form-style data.
app.use(express.urlencoded({ extended: true }));


// Creates a session for each logged-in user.
app.use(
    session({
        secret: "student-management-system-secret",
        resave: false,
        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 60 * 60 * 1000
        }
    })
);


// Serves the old frontend files if needed.
app.use(
    express.static(
        path.join(__dirname, "..", "frontend-old")
    )
);


// NEW: Displays interactive Swagger API documentation.
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);


app.use((req, res, next) => {
    console.log("Incoming request:", req.method, req.url);
    next();
});
console.log("Registering authentication routes");

// Connects existing authentication, profile and admin routes.
app.use("/api", authRoutes);


// Root route.
app.get("/", function(req, res) {
    res.send("Student Management System backend is running.");
});


// Starts the Express server.
const PORT = 3000;

app.listen(PORT, function() {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Swagger documentation: http://localhost:${PORT}/api-docs`);
});