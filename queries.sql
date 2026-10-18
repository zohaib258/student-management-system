USE student_management_system;

SELECT id, email, password_hash, role, status, created_at
FROM users;

SELECT id, email, role, status, last_login
FROM users;

SELECT * FROM users where role='user';

SELECT id, email, role, status
FROM users
WHERE role = 'admin';



SELECT
    id,
    email,
    role,
    status
FROM users
ORDER BY id;