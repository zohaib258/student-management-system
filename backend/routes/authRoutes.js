
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../db");

// =====================================================
// MIDDLEWARE: CHECK WHETHER A USER IS LOGGED IN
// =====================================================
function requireLogin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            message: "Please log in first."
        });
    }

    next();
}

// =====================================================
// MIDDLEWARE: CHECK WHETHER THE LOGGED-IN USER IS ADMIN
// =====================================================
function requireAdmin(req, res, next) {
    if (
        !req.session ||
        !req.session.userId ||
        req.session.role !== "admin"
    ) {
        return res.status(403).json({
            message: "Admin access required."
        });
    }

    next();
}

// =====================================================
// HELPER: CONVERT DATABASE PROFILE FIELDS TO CAMEL CASE
// =====================================================
function formatProfile(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        userId: row.userId,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        fatherName: row.fatherName,
        phone: row.phone,
        dateOfBirth: row.dateOfBirth,
        gender: row.gender,
        city: row.city,
        department: row.department,
        semester: row.semester,
        enrollmentDate: row.enrollmentDate,
        status: row.status,
        cgpa: row.cgpa,
        address: row.address,
        accountStatus: row.accountStatus
    };
}

// =====================================================
// STUDENT REGISTRATION
// POST /api/register
// =====================================================
router.post("/register", async function (req, res) {
    console.log("Registration handler started");

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        if (
            !/[A-Z]/.test(password) ||
            !/[a-z]/.test(password) ||
            !/[0-9]/.test(password) ||
            !/[^A-Za-z0-9]/.test(password)
        ) {
            return res.status(400).json({
                message:
                    "Password must include uppercase, lowercase, number, and special character."
            });
        }

        // Check whether this email is already registered.
        const [existingUsers] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        // Never store the original password in the database.
        console.log("Starting password hashing");

        const passwordHash = await bcrypt.hash(password, 10);

        console.log("Password hashing completed; starting database query");

        // New accounts are student accounts by default.
        await db.query(
            `INSERT INTO users (email, password_hash, role, status)
             VALUES (?, ?, 'user', 'active')`,
            [cleanEmail, passwordHash]
        );

        console.log("Registration successful");

        return res.status(201).json({
            message: "Registration successful. You can now log in."
        });
    } catch (error) {
        console.error("Student registration error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        return res.status(500).json({
            message: "Registration failed. Please try again."
        });
    }
});

// =====================================================
// STUDENT LOGIN
// POST /api/login
// =====================================================
router.post("/login", async function (req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const [users] = await db.query(
            `SELECT id, email, password_hash, role, status
             FROM users
             WHERE email = ?`,
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (user.role !== "user") {
            return res.status(403).json({
                message: "Please use the admin login page."
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                message: "Your account is inactive. Contact the administrator."
            });
        }

        // Regenerate the session to help prevent session fixation.
        req.session.regenerate(async function (sessionError) {
            if (sessionError) {
                console.error("Session regeneration error:", sessionError);

                return res.status(500).json({
                    message: "Unable to start your session."
                });
            }

            req.session.userId = user.id;
            req.session.email = user.email;
            req.session.role = user.role;

            try {
                await db.query(
                    "UPDATE users SET last_login = NOW() WHERE id = ?",
                    [user.id]
                );

                req.session.save(function (saveError) {
                    if (saveError) {
                        console.error("Session save error:", saveError);

                        return res.status(500).json({
                            message: "Unable to save your login session."
                        });
                    }

                    return res.status(200).json({
                        message: "Login successful.",
                        user: {
                            id: user.id,
                            email: user.email,
                            role: user.role
                        }
                    });
                });
            } catch (error) {
                console.error("Student login update error:", error);

                return res.status(500).json({
                    message: "Login failed. Please try again."
                });
            }
        });
    } catch (error) {
        console.error("Student login error:", error);

        return res.status(500).json({
            message: "Login failed. Please try again."
        });
    }
});

// =====================================================
// CHECK CURRENT LOGIN SESSION
// GET /api/session
// =====================================================

router.get("/session", async function (req, res) {
    try {
        // Check whether the user has a valid login session.
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                authenticated: false,
                message: "No active login session."
            });
        }

        // Get the user's email and profile name from MySQL.
        const [rows] = await db.query(
            `SELECT
                u.id,
                u.email,
                u.role,
                up.first_name AS firstName,
                up.last_name AS lastName
             FROM users u
             LEFT JOIN user_profiles up ON up.user_id = u.id
             WHERE u.id = ?`,
            [req.session.userId]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                authenticated: false,
                message: "User account not found."
            });
        }

        const user = rows[0];

        return res.status(200).json({
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                name: [user.firstName, user.lastName]
                    .filter(Boolean)
                    .join(" ")
            }
        });
    } catch (error) {
        console.error("Session check error:", error);

        return res.status(500).json({
            message: "Unable to retrieve session information."
        });
    }
});


// =====================================================
// LOGOUT
// POST /api/logout
// =====================================================
router.post("/logout", function (req, res) {
    if (!req.session) {
        return res.status(200).json({
            message: "Logged out successfully."
        });
    }

    req.session.destroy(function (error) {
        if (error) {
            console.error("Logout error:", error);

            return res.status(500).json({
                message: "Unable to log out."
            });
        }

        res.clearCookie("connect.sid");

        return res.status(200).json({
            message: "Logged out successfully."
        });
    });
});

// =====================================================
// GET STUDENT PROFILE
// GET /api/profile
// =====================================================
router.get("/profile", requireLogin, async function (req, res) {
    try {
        const [rows] = await db.query(
            `SELECT
                u.id AS userId,
                u.email AS email,
                u.status AS accountStatus,
                up.id AS id,
                up.first_name AS firstName,
                up.last_name AS lastName,
                up.father_name AS fatherName,
                up.phone AS phone,
                up.date_of_birth AS dateOfBirth,
                up.gender AS gender,
                up.city AS city,
                up.department AS department,
                up.semester AS semester,
                up.enrollment_date AS enrollmentDate,
                up.status AS status,
                up.cgpa AS cgpa,
                up.address AS address
             FROM users u
             LEFT JOIN user_profiles up ON up.user_id = u.id
             WHERE u.id = ?`,
            [req.session.userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            profile: formatProfile(rows[0])
        });
    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            message: "Unable to load your profile."
        });
    }
});


// =====================================================
// CREATE OR SAVE STUDENT PROFILE
// POST /api/profile
// =====================================================
router.post("/profile", requireLogin, async function (req, res) {
    try {
        const {
            firstName,
            lastName,
            fatherName,
            phone,
            dateOfBirth,
            gender,
            city,
            department,
            semester,
            enrollmentDate,
            status,
            cgpa,
            address
        } = req.body;

        const profileStatus = status || "active";
        const profileSemester =
            profileStatus === "graduated" ? "completed" : (semester || null);

        // Create a profile if one does not exist; otherwise update it.
        await db.query(
            `INSERT INTO user_profiles (
                user_id,
                first_name,
                last_name,
                father_name,
                phone,
                date_of_birth,
                gender,
                city,
                department,
                semester,
                enrollment_date,
                status,
                cgpa,
                address
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                father_name = VALUES(father_name),
                phone = VALUES(phone),
                date_of_birth = VALUES(date_of_birth),
                gender = VALUES(gender),
                city = VALUES(city),
                department = VALUES(department),
                semester = VALUES(semester),
                enrollment_date = VALUES(enrollment_date),
                status = VALUES(status),
                cgpa = VALUES(cgpa),
                address = VALUES(address)`,
            [
                req.session.userId,
                firstName || null,
                lastName || null,
                fatherName || null,
                phone || null,
                dateOfBirth || null,
                gender || null,
                city || null,
                department || null,
                profileSemester,
                enrollmentDate || null,
                profileStatus,
                cgpa === "" || cgpa === undefined ? null : (cgpa ?? null),
                address || null
            ]
        );

        // A graduated student should not retain an active account.
        if (profileStatus === "graduated") {
            await db.query(
                "UPDATE users SET status = 'inactive' WHERE id = ?",
                [req.session.userId]
            );
        }

        return res.status(200).json({
            message: "Profile saved successfully."
        });
    } catch (error) {
        console.error("Save profile error:", error);

        return res.status(500).json({
            message: "Unable to save your profile."
        });
    }
});

// =====================================================
// UPDATE STUDENT PROFILE
// PUT /api/profile
// =====================================================
router.put("/profile", requireLogin, async function (req, res) {
    try {
        const {
            firstName,
            lastName,
            fatherName,
            phone,
            dateOfBirth,
            gender,
            city,
            department,
            semester,
            enrollmentDate,
            status,
            cgpa,
            address
        } = req.body;

        const profileStatus = status || "active";
        const profileSemester =
            profileStatus === "graduated" ? "completed" : (semester || null);

        await db.query(
            `INSERT INTO user_profiles (
                user_id,
                first_name,
                last_name,
                father_name,
                phone,
                date_of_birth,
                gender,
                city,
                department,
                semester,
                enrollment_date,
                status,
                cgpa,
                address
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                father_name = VALUES(father_name),
                phone = VALUES(phone),
                date_of_birth = VALUES(date_of_birth),
                gender = VALUES(gender),
                city = VALUES(city),
                department = VALUES(department),
                semester = VALUES(semester),
                enrollment_date = VALUES(enrollment_date),
                status = VALUES(status),
                cgpa = VALUES(cgpa),
                address = VALUES(address)`,
            [
                req.session.userId,
                firstName || null,
                lastName || null,
                fatherName || null,
                phone || null,
                dateOfBirth || null,
                gender || null,
                city || null,
                department || null,
                profileSemester,
                enrollmentDate || null,
                profileStatus,
                cgpa === "" || cgpa === undefined ? null : (cgpa ?? null),
                address || null
            ]
        );

        // if (profileStatus === "graduated") {
        //     await db.query(
        //         "UPDATE users SET status = 'inactive' WHERE id = ?",
        //         [req.session.userId]
        //     );
        // }

        return res.status(200).json({
            message: "Profile updated successfully."
        });
    } catch (error) {
        console.error("Update profile error:", error);

        return res.status(500).json({
            message: "Unable to update your profile."
        });
    }
});

// =====================================================
// CHANGE STUDENT PASSWORD
// POST /api/change-password
// =====================================================
router.post("/change-password", requireLogin, async function (req, res) {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required."
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "New password must contain at least 8 characters."
            });
        }

        if (
            !/[A-Z]/.test(newPassword) ||
            !/[a-z]/.test(newPassword) ||
            !/[0-9]/.test(newPassword) ||
            !/[^A-Za-z0-9]/.test(newPassword)
        ) {
            return res.status(400).json({
                message:
                    "New password must include uppercase, lowercase, number, and special character."
            });
        }

        const [users] = await db.query(
            "SELECT password_hash FROM users WHERE id = ?",
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const matches = await bcrypt.compare(
            currentPassword,
            users[0].password_hash
        );

        if (!matches) {
            return res.status(400).json({
                message: "Current password is incorrect."
            });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await db.query(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            [newPasswordHash, req.session.userId]
        );

        return res.status(200).json({
            message: "Password changed successfully."
        });
    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            message: "Unable to change your password."
        });
    }
});

// =====================================================
// ADMIN REGISTRATION
// POST /api/admin/register
// Maximum of three admin accounts
// =====================================================
router.post("/admin/register", async function (req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        const [admins] = await db.query(
            "SELECT COUNT(*) AS total FROM users WHERE role = 'admin'"
        );

        if (admins[0].total >= 3) {
            return res.status(403).json({
                message: "The maximum number of admin accounts has been reached."
            });
        }

        const [existingUsers] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users (email, password_hash, role, status)
             VALUES (?, ?, 'admin', 'active')`,
            [cleanEmail, passwordHash]
        );

        return res.status(201).json({
            message: "Admin registered successfully.",
            admin: {
                id: result.insertId,
                email: cleanEmail,
                role: "admin"
            }
        });
    } catch (error) {
        console.error("Admin registration error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        return res.status(500).json({
            message: "Admin registration failed."
        });
    }
});

// =====================================================
// ADMIN LOGIN
// POST /api/admin/login
// =====================================================
router.post("/admin/login", async function (req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const [admins] = await db.query(
            `SELECT id, email, password_hash, role, status
             FROM users
             WHERE email = ? AND role = 'admin'`,
            [cleanEmail]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                message: "Invalid admin email or password."
            });
        }

        const admin = admins[0];

        const passwordMatches = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid admin email or password."
            });
        }

        if (admin.status !== "active") {
            return res.status(403).json({
                message: "This admin account is inactive."
            });
        }

        req.session.regenerate(function (sessionError) {
            if (sessionError) {
                console.error("Admin session error:", sessionError);

                return res.status(500).json({
                    message: "Unable to start your admin session."
                });
            }

            req.session.userId = admin.id;
            req.session.email = admin.email;
            req.session.role = "admin";

            req.session.save(function (saveError) {
                if (saveError) {
                    console.error("Admin session save error:", saveError);

                    return res.status(500).json({
                        message: "Unable to save your admin session."
                    });
                }

                return res.status(200).json({
                    message: "Admin login successful.",
                    admin: {
                        id: admin.id,
                        email: admin.email,
                        role: admin.role
                    }
                });
            });
        });
    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(500).json({
            message: "Admin login failed."
        });
    }
});

// =====================================================
// ADMIN: GET ALL STUDENTS
// GET /api/admin/students
// Supports optional ?search=email-or-name
// =====================================================
router.get("/admin/students", requireAdmin, async function (req, res) {
    try {
        const search = (req.query.search || "").trim();
        const searchValue = `%${search}%`;

        const [students] = await db.query(
            `SELECT
                u.id AS id,
                u.email AS email,
                u.status AS accountStatus,
                u.created_at AS createdAt,
                u.last_login AS lastLogin,
                up.first_name AS firstName,
                up.last_name AS lastName,
                up.father_name AS fatherName,
                up.phone AS phone,
                up.date_of_birth AS dateOfBirth,
                up.gender AS gender,
                up.city AS city,
                up.department AS department,
                up.semester AS semester,
                up.enrollment_date AS enrollmentDate,
                up.status AS status,
                up.cgpa AS cgpa,
                up.address AS address
             FROM users u
             LEFT JOIN user_profiles up ON up.user_id = u.id
             WHERE u.role = 'user'
               AND (
                    ? = ''
                    OR u.email LIKE ?
                    OR up.first_name LIKE ?
                    OR up.last_name LIKE ?
                    OR CONCAT(
                        COALESCE(up.first_name, ''),
                        ' ',
                        COALESCE(up.last_name, '')
                    ) LIKE ?
               )
             ORDER BY u.id DESC`,
            [search, searchValue, searchValue, searchValue, searchValue]
        );

        return res.status(200).json({
            students: students.map(formatProfile)
        });
    } catch (error) {
        console.error("Get students error:", error);

        return res.status(500).json({
            message: "Unable to load students."
        });
    }
});

// =====================================================
// ADMIN: GET ONE STUDENT
// GET /api/admin/students/:id
// =====================================================
router.get("/admin/students/:id", requireAdmin, async function (req, res) {
    try {
        const [students] = await db.query(
            `SELECT
                u.id AS id,
                u.id AS userId,
                u.email AS email,
                u.status AS accountStatus,
                up.first_name AS firstName,
                up.last_name AS lastName,
                up.father_name AS fatherName,
                up.phone AS phone,
                up.date_of_birth AS dateOfBirth,
                up.gender AS gender,
                up.city AS city,
                up.department AS department,
                up.semester AS semester,
                up.enrollment_date AS enrollmentDate,
                up.status AS status,
                up.cgpa AS cgpa,
                up.address AS address
             FROM users u
             LEFT JOIN user_profiles up ON up.user_id = u.id
             WHERE u.id = ? AND u.role = 'user'`,
            [req.params.id]
        );

        if (students.length === 0) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        return res.status(200).json({
            student: formatProfile(students[0])
        });
    } catch (error) {
        console.error("Get student error:", error);

        return res.status(500).json({
            message: "Unable to load student details."
        });
    }
});

// =====================================================
// ADMIN: UPDATE STUDENT
// PUT /api/admin/students/:id
// =====================================================
router.put("/admin/students/:id", requireAdmin, async function (req, res) {
    const connection = await db.getConnection();

    try {
        const studentId = req.params.id;

        const {
            email,
            firstName,
            lastName,
            fatherName,
            phone,
            dateOfBirth,
            gender,
            city,
            department,
            semester,
            enrollmentDate,
            status,
            cgpa,
            address,
            accountStatus
        } = req.body;

        await connection.beginTransaction();

        const [users] = await connection.query(
            "SELECT id FROM users WHERE id = ? AND role = 'user' FOR UPDATE",
            [studentId]
        );

        if (users.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Student not found."
            });
        }

        if (email) {
            const cleanEmail = email.trim().toLowerCase();

            const [duplicates] = await connection.query(
                "SELECT id FROM users WHERE email = ? AND id <> ?",
                [cleanEmail, studentId]
            );

            if (duplicates.length > 0) {
                await connection.rollback();

                return res.status(409).json({
                    message: "That email is already in use."
                });
            }

            await connection.query(
                "UPDATE users SET email = ? WHERE id = ?",
                [cleanEmail, studentId]
            );
        }

        const profileStatus = status || "active";
        const profileSemester =
            profileStatus === "graduated" ? "completed" : (semester || null);

        await connection.query(
            `INSERT INTO user_profiles (
                user_id,
                first_name,
                last_name,
                father_name,
                phone,
                date_of_birth,
                gender,
                city,
                department,
                semester,
                enrollment_date,
                status,
                cgpa,
                address
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                father_name = VALUES(father_name),
                phone = VALUES(phone),
                date_of_birth = VALUES(date_of_birth),
                gender = VALUES(gender),
                city = VALUES(city),
                department = VALUES(department),
                semester = VALUES(semester),
                enrollment_date = VALUES(enrollment_date),
                status = VALUES(status),
                cgpa = VALUES(cgpa),
                address = VALUES(address)`,
            [
                studentId,
                firstName || null,
                lastName || null,
                fatherName || null,
                phone || null,
                dateOfBirth || null,
                gender || null,
                city || null,
                department || null,
                profileSemester,
                enrollmentDate || null,
                profileStatus,
                cgpa === "" || cgpa === undefined ? null : (cgpa ?? null),
                address || null
            ]
        );

        // Decide which account status should be saved.
       // Account status is controlled independently by the admin.
// Graduation must not automatically deactivate the account.
                const newAccountStatus = accountStatus;

                if (["active", "inactive"].includes(newAccountStatus)) {
                    await connection.query(
                        `UPDATE users
                        SET status = ?
                        WHERE id = ?
                        AND role = 'user'`,
                        [newAccountStatus, studentId]
                    );
                } else {
                            console.log(
                "Account status was missing or invalid:",
                accountStatus
            );
        }

        await connection.commit();

        return res.status(200).json({
            message: "Student updated successfully."
        });
    } catch (error) {
        await connection.rollback();

        console.error("Update student error:", error);

        return res.status(500).json({
            message: "Unable to update student."
        });
    } finally {
        connection.release();
    }
});

/* =====================================================
   ADMIN: ACTIVATE OR DEACTIVATE A STUDENT ACCOUNT
   PATCH /api/admin/students/:id/status
===================================================== */

router.patch(
    "/admin/students/:id/status",
    requireAdmin,
    async function (req, res) {
        try {
            const studentId = Number(req.params.id);
            const { status } = req.body;

            // Validate the student ID.
            if (!Number.isInteger(studentId) || studentId <= 0) {
                return res.status(400).json({
                    message: "Invalid student ID."
                });
            }

            // Only these two account statuses are allowed.
            if (!["active", "inactive"].includes(status)) {
                return res.status(400).json({
                    message: "Status must be active or inactive."
                });
            }

            // Confirm that this account exists and is a student.
            const [students] = await db.query(
                `SELECT
                    u.id,
                    u.status AS accountStatus,
                    up.status AS academicStatus
                 FROM users u
                 LEFT JOIN user_profiles up
                    ON up.user_id = u.id
                 WHERE u.id = ?
                   AND u.role = 'user'`,
                [studentId]
            );

            if (students.length === 0) {
                return res.status(404).json({
                    message: "Student account not found."
                });
            }

            const student = students[0];

            // Graduated students cannot be activated.
            if (
                student.academicStatus === "graduated" &&
                status === "active"
            ) {
                return res.status(400).json({
                    message: "Graduated students must remain inactive."
                });
            }

            // Update the account status in the users table.
            await db.query(
                `UPDATE users
                 SET status = ?
                 WHERE id = ?
                   AND role = 'user'`,
                [status, studentId]
            );

            // Read the saved value back from MySQL.
            const [updatedRows] = await db.query(
                `SELECT id, email, status AS accountStatus
                 FROM users
                 WHERE id = ?
                   AND role = 'user'`,
                [studentId]
            );

            if (
                updatedRows.length === 0 ||
                updatedRows[0].accountStatus !== status
            ) {
                return res.status(500).json({
                    message: "The account status could not be verified."
                });
            }

            console.log(
                `Student ${studentId} account status saved as:`,
                updatedRows[0].accountStatus
            );

            return res.status(200).json({
                message: `Student account ${
                    status === "active" ? "activated" : "deactivated"
                } successfully.`,
                student: updatedRows[0]
            });
        } catch (error) {
            console.error(
                "Change student account status error:",
                error
            );

            return res.status(500).json({
                message: "Unable to change student account status."
            });
        }
    }
);


// =====================================================
// ADMIN: DELETE STUDENT
// DELETE /api/admin/students/:id
// =====================================================
router.delete("/admin/students/:id", requireAdmin, async function (req, res) {
    const connection = await db.getConnection();

    try {
        const studentId = req.params.id;

        await connection.beginTransaction();

        const [students] = await connection.query(
            "SELECT id FROM users WHERE id = ? AND role = 'user' FOR UPDATE",
            [studentId]
        );

        if (students.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Student not found."
            });
        }

        await connection.query(
            "DELETE FROM user_profiles WHERE user_id = ?",
            [studentId]
        );

        await connection.query(
            "DELETE FROM users WHERE id = ? AND role = 'user'",
            [studentId]
        );

        await connection.commit();

        return res.status(200).json({
            message: "Student deleted successfully."
        });
    } catch (error) {
        await connection.rollback();

        console.error("Delete student error:", error);

        return res.status(500).json({
            message: "Unable to delete student."
        });
    } finally {
        connection.release();
    }
});
/*
 * ADMIN: GET DASHBOARD STATISTICS
 * GET /api/admin/stats
 * Returns live student counts from MySQL.
 */
router.get("/admin/stats", requireAdmin, async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS totalStudents,
                SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END)
                    AS activeAccounts,
                SUM(CASE WHEN u.status = 'inactive' THEN 1 ELSE 0 END)
                    AS inactiveAccounts,
                SUM(CASE WHEN up.status = 'graduated' THEN 1 ELSE 0 END)
                    AS graduatedStudents
            FROM users u
            LEFT JOIN user_profiles up ON up.user_id = u.id
            WHERE u.role = 'user'
        `);

        const stats = rows[0];

        return res.status(200).json({
            stats: {
                totalStudents: Number(stats.totalStudents || 0),
                activeAccounts: Number(stats.activeAccounts || 0),
                inactiveAccounts: Number(stats.inactiveAccounts || 0),
                graduatedStudents: Number(stats.graduatedStudents || 0),
            },
        });
    } catch (error) {
        console.error("Admin statistics error:", error);

        return res.status(500).json({
            message: "Unable to load dashboard statistics.",
        });
    }
});

module.exports = router;
