import { getCookie, setCookie } from "../utils/cookie.js";
import { getItemByIndex } from "../utils/dbUtils.js";
import { checkAuth } from "../utils/auth.js";

const carId = new URLSearchParams(window.location.search).get('carId');


if (checkAuth()){
    if (carId) {
        window.location.href = `./booking.html?carId=${carId}`;
    } else {
        window.location.href = "./index.html";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');

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
        emailError.textContent = '';
        passwordError.textContent = '';
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
        const user = await getItemByIndex("users", "email", email);
        if (!user) {
            emailError.textContent = "Email does not exist. Please register to continue!";
            return;
        }
        const hashedPassword = CryptoJS.SHA256(password).toString();
        if (hashedPassword !== user.password) {
            passwordError.textContent = "Invalid Password";
            return;
        }
        setCookie("username", user.username, 1);
        setCookie("userId", user.userId, 1);
        setCookie("role", user.role, 1);

        if (user.role === "admin") {
            window.location.href = "/admin/dashboard.html";
        }
        else if (carId) {
            window.location.href = `./booking.html?carId=${carId}`;
        } 
         else {
            window.location.href = "./index.html";
        }
    });
});