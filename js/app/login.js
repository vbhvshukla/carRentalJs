import { getCookie, setCookie } from "../utils/cookie.js";
import { getItemByIndex } from "../utils/dbUtils.js";
import { checkAuth } from "../utils/auth.js";

if (checkAuth()) window.location.href = "./index.html";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');

    // Validate email input
    emailInput.addEventListener('input', () => {
        const email = emailInput.value.trim();
        emailError.textContent = '';

        if (!email) {
            emailError.textContent = 'Email is required!';
        } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                emailError.textContent = 'Please enter a valid email address!';
            }
        }
    });

    // Validate password input
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        passwordError.textContent = '';

        if (!password) {
            passwordError.textContent = 'Password is required!';
        }
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Clear previous error messages
        emailError.textContent = '';
        passwordError.textContent = '';

        // Validate email and password fields
        if (!email) {
            emailError.textContent = 'Email is required!';
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            emailError.textContent = 'Please enter a valid email address!';
            return;
        }

        if (!password) {
            passwordError.textContent = 'Password is required!';
            return;
        }

        // Fetch user by email
        const user = await getItemByIndex("users", "email", email);
        if (!user) {
            emailError.textContent = "Email does not exist. Please register to continue!";
            return;
        }

        // Validate password
        const hashedPassword = CryptoJS.SHA256(password).toString();
        if (hashedPassword !== user.password) {
            passwordError.textContent = "Invalid Password";
            return;
        }

        // Set cookies and redirect based on role
        setCookie("username", user.username, 1);
        setCookie("userId", user.userId, 1);
        setCookie("role", user.role, 1);

        if (user.role === "admin") {
            window.location.href = "/admin/dashboard.html";
        } else {
            window.location.href = "./index.html";
        }
    });
});