const adminLoginForm = document.getElementById("adminLoginForm");


// Handles the admin login form submission.
adminLoginForm.addEventListener("submit", async function(event) {

    // Prevents the browser from refreshing the page.
    event.preventDefault();

    // Gets the admin email.
    const email = document.getElementById("adminEmail").value.trim();

    // Gets the admin password.
    const password = document.getElementById("adminPassword").value;

    // Checks whether the email is empty.
    if (email === "") {

        alert("Admin email is required.");
        return;

    }

    // Checks whether the password is empty.
    if (password === "") {

        alert("Admin password is required.");
        return;

    }

    // Creates the admin login data.
    const adminLoginData = {
        adminEmail: email,
        adminPassword: password
    };

    try {

        // Sends the admin login request to Express.
        const response = await fetch("/api/admin/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(adminLoginData)

        });

        // Converts the response into a JavaScript object.
        const result = await response.json();

        // Checks whether login was successful.
        if (response.ok) {

            console.log("Admin login successful.");
            console.log("Server response:", result);

            alert(result.message);

            // Opens the admin dashboard.
            window.location.href = "admin-dashboard.html";

        } else {

            console.log("Admin login failed.");
            console.log("Server response:", result);

            alert(result.message);

        }

    } catch (error) {

        // Handles network or server connection errors.
        console.error("Admin login request error:", error);

        alert("Unable to connect to the server.");

    }

});