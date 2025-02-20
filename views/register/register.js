import { checkAuth } from "../../js/utils/auth.js";
import { addItem, getItemByIndex } from "../../js/utils/dbUtils.js";
import { generateRandomId } from "../../js/utils/generateId.js";
import { validateField, validateForm } from "../../js/utils/validation.js";
import { dbSchema } from "../../dbSchema.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (await checkAuth()) window.location.href = "../index.html";

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
    //For central validation
    const formRules = {
        username: { required: true, minLength: 3 },
        email: { required: true, email: true },
        password: { required: true, minLength: 8 },
        confirmPassword: { required: true, minLength: 8 },
        role: { required: true },
        verificationFile: { required: (value, formData) => formData.role === "owner" }
    };
    //get the data from the formData validate the schema and add the item in the DB.
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        errorMessage.textContent = "";

        const formData = new FormData(registerForm);
        const formObject = Object.fromEntries(formData.entries());

        const errors = validateForm(formObject, formRules);

        if (Object.keys(errors).length > 0) {
            errorMessage.textContent = Object.values(errors).join(", ");
            return;
        }

        const { username, email, role, password, confirmPassword } = formObject;
        const verificationFile = verificationFileInput.files[0];

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
        //Hash the password before proceeding
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
            ratingCount: 0,
            paymentPreference: "",
            verificationFile: ""
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
    //Save the user
    function saveUser(user) {
        addItem("users", user)
            .then(() => {
                alert("User registered successfully!");
                window.location.href = "../login/login.html";
            })
            .catch((error) => {
                errorMessage.textContent = `Error: ${error.message}`;
            });
    }
});