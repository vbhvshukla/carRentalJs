import { getCookie, setCookie } from "../utils/cookie.js";
import { getItemByIndex } from "../utils/dbUtils.js";
import { checkAuth } from "../utils/auth.js";
import { validateField } from "../utils/validation.js";

const carId = new URLSearchParams(window.location.search).get('carId');

if (checkAuth()) {
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

    const formRules = {
        email: { required: true, email: true },
        password: { required: true }
    };

    const validateInput = (input, rules, errorElement) => {
        const value = input.value.trim();
        errorElement.textContent = '';

        if (!validateField(value, rules)) {
            errorElement.textContent = `Invalid value for ${input.name}`;
        }
    };

    emailInput.addEventListener('input', () => {
        validateInput(emailInput, formRules.email, emailError);
    });

    passwordInput.addEventListener('input', () => {
            validateInput(passwordInput, formRules.password, passwordError);
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(loginForm);
        const email = formData.get('email').trim();
        const password = formData.get('password');

        emailError.textContent = '';
        passwordError.textContent = '';

        if (!validateField(email, formRules.email)) {
            emailError.textContent = 'Please enter a valid email address!';
            return;
        }

        if (!validateField(password, formRules.password)) {
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
        } else if (carId) {
            window.location.href = `./booking.html?carId=${carId}`;
        } else {
            window.location.href = "./index.html";
        }
    });
});