import { getCookie, setCookie } from "../utils/cookie.js";
import { getItemByIndex } from "../utils/dbUtils.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const errorMessage = document.getElementById('error-message');
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const role = document.querySelector('input[name="role"]:checked')?.value;
        if (!email || !password) {
            errorMessage.textContent = 'All fields are required!';
            return;
        }

        const user = await getItemByIndex("users", "email", email);
        if (!user) {
            errorMessage.textContent = "Email does not exist. Please register to continue!";
            return;
        }
        const hashedPassword = CryptoJS.SHA256(password).toString();
        if (role === "owner" && user.role !== role) {
            errorMessage.textContent = "You are not an owner! Please select user to continue";
            return;
        }
        if (!hashedPassword === user.password) {
            errorMessage.textContent = "Invalid Password"
            return;
        }
        setCookie("username", user.username, 1);
        setCookie("userId", user.userId, 1);
        setCookie("role", user.role, 1);

        window.location.href="./index.html";
    })
})