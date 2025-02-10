import { checkAuth } from "../utils/auth.js";
import { addItem, getItemByIndex } from "../utils/dbUtils.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (await checkAuth()) window.location.href = "./index.html";

    const roleSelect = document.getElementById("role");
    const ownerFileInput = document.getElementById("owner-file-input");
    const verificationFileInput = document.getElementById("verificationFile");
    const registerForm = document.getElementById("registerForm");
    const errorMessage = document.getElementById("error-message");

    ownerFileInput.style.display = "none";

    roleSelect.addEventListener("change", () => {
        if (roleSelect.value === "owner") {
            ownerFileInput.style.display = "block";
            verificationFileInput.setAttribute("required", "required");
        } else {
            ownerFileInput.style.display = "none";
            verificationFileInput.removeAttribute("required");
        }
    });

    function generateRandomId() {
        return `${Math.floor(1000 + Math.random() * 9000)}${Date.now().toString().slice(-6)}`;
    }

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        errorMessage.textContent = "";

        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const role = roleSelect.value.toLowerCase();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const verificationFile = verificationFileInput.files[0];

        if (!username || !email || !password || !confirmPassword || !role) {
            errorMessage.textContent = "All fields are required!";
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = "Passwords do not match!";
            return;
        }

        const existingUser = await getItemByIndex("users", "email", email);
        if (existingUser) {
            errorMessage.textContent = "Email is already registered!";
            return;
        }

        if (role === "owner" && !verificationFile) {
            errorMessage.textContent = "Verification file is required for Owner registration!";
            return;
        }

        const hashedPassword = CryptoJS.SHA256(password).toString();
        const userId = generateRandomId();

        const user = {
            userId,
            username,
            email,
            password: hashedPassword,
            role,
            isApproved: role === "owner" ? false : true,
            avgRating: 0,
            reviewCount: 0,
            paymentPreference: "",
        };

        if (role === "owner" && verificationFile) {
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
            if (!allowedTypes.includes(verificationFile.type)) {
                errorMessage.textContent = "Invalid file format. Upload PNG, JPG, JPEG, or PDF.";
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                user.verificationFile = e.target.result;
                saveUser(user);
            };
            reader.readAsDataURL(verificationFile);
        } else {
            saveUser(user);
        }
    });

    function saveUser(user) {
        addItem("users", user)
            .then(() => {
                alert("User registered successfully!");
                window.location.href = "./login.html";
            })
            .catch((error) => {
                errorMessage.textContent = `Error: ${error.message}`;
            });
    }
});