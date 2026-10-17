// auth.js - Register, Login, Logout, Local Storage users

const STUDENTS_KEY = "students";
const CURRENT_USER_KEY = "currentUser";

/* ---------- Helpers ---------- */

function getStudents() {
    return JSON.parse(localStorage.getItem(STUDENTS_KEY)) || [];
}

function saveStudents(students) {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(text, type = "danger") {
    const box = document.querySelector("#message");
    if (!box) return;
    box.className = `alert alert-${type}`;
    box.textContent = text;
}

function clearMessage() {
    const box = document.querySelector("#message");
    if (box) box.className = "alert d-none";
}

function logout() {
    // Remove only the session user, keep the students list
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = "index.html";
}

/* ---------- Register ---------- */

function handleRegister(event) {
    event.preventDefault();
    clearMessage();

    const name = document.querySelector("#fullName").value.trim();
    const email = document.querySelector("#email").value.trim().toLowerCase();
    const password = document.querySelector("#password").value;
    const confirmPassword = document.querySelector("#confirmPassword").value;

    if (!name || !email || !password || !confirmPassword) {
        return showMessage("Please fill in all fields.");
    }
    if (!isValidEmail(email)) {
        return showMessage("Please enter a valid email address.");
    }
    if (password.length < 6) {
        return showMessage("Password must be at least 6 characters.");
    }
    if (password !== confirmPassword) {
        return showMessage("Password and confirm password do not match.");
    }

    const students = getStudents();
    const exists = students.some((student) => student.email === email);
    if (exists) {
        return showMessage("This email is already registered.");
    }

    const newStudent = { id: Date.now(), name, email, password };
    students.push(newStudent);
    saveStudents(students);

    showMessage("Account created! Redirecting to login...", "success");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1200);
}

/* ---------- Login ---------- */

function handleLogin(event) {
    event.preventDefault();
    clearMessage();

    const email = document.querySelector("#email").value.trim().toLowerCase();
    const password = document.querySelector("#password").value;

    if (!email || !password) {
        return showMessage("Please enter your email and password.");
    }

    const student = getStudents().find((s) => s.email === email);

    if (!student || student.password !== password) {
        return showMessage("Invalid email or password.");
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(student));
    window.location.href = "quiz.html";
}

/* ---------- Attach events depending on the page ---------- */

const registerForm = document.querySelector("#registerForm");
if (registerForm) registerForm.addEventListener("submit", handleRegister);

const loginForm = document.querySelector("#loginForm");
if (loginForm) loginForm.addEventListener("submit", handleLogin);

const logoutBtn = document.querySelector("#logoutBtn");
if (logoutBtn) logoutBtn.addEventListener("click", logout);