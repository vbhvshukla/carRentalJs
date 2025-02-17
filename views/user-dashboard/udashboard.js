import { getAllItemsByIndex, getItemByKey, updateItem } from "../../js/utils/dbUtils.js";
import { checkAuth, logout } from "../../js/utils/auth.js";
import { getCookie } from "../../js/utils/cookie.js";
import { showToast } from "../../js/utils/toastUtils.js";
async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const logoutLink = document.getElementById('logout-link');
    const ownerDashboard = document.getElementById('owner-dashboard-link');

    if (isAuthenticated) {
        logoutLink.style.display = 'block';

        const userId = getCookie("userId");
        const user = await getItemByKey("users", userId);
        const role = user.role;
        const isApproved = user.isApproved;

        if (user.role === "owner" && isApproved) {
            ownerDashboard.style.display = 'block';
        } else {
            ownerDashboard.style.display = 'none';
        }
    } else {
        ownerDashboard.style.display = 'none';
        logoutLink.style.display = 'none';
    }
}

function highlightActiveLink() {
    const links = document.querySelectorAll('.sidebar ul li a');
    const currentPath = window.location.pathname.split('/').pop();

    links.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) {
        window.location.href = "../index.html";
    }
    const userId = getCookie("userId");
    const user = await getItemByKey("users", userId);
    updateNavLinks();
    highlightActiveLink();

    if (user) {
        document.getElementById("username").value = user.username;
        document.getElementById("email").value = user.email;
        document.getElementById("avgRating").textContent = user.avgRating || "N/A";
        document.getElementById("ratingCount").textContent = user.ratingCoun || "N/A";

        if (user.verificationFile) {
            document.getElementById("verificationFile").innerHTML =
                user.verificationFile.startsWith("data:image/") ?
                    `<img src="${user.verificationFile}" alt="Verification File" width="100">` :
                    `<a href="${user.verificationFile}" target="_blank">View Document</a>`;
        }
    }

    document.getElementById("old-password").addEventListener("input", () => {
        const inputPassword = document.getElementById("old-password").value;
        const hashedInput = CryptoJS.SHA256(inputPassword).toString();

        if (hashedInput === user.password) {
            document.getElementById("new-password-container").classList.remove("hidden");
            document.getElementById("old-password-error").textContent = "";
        } else {
            document.getElementById("new-password-container").classList.add("hidden");
            document.getElementById("old-password-error").textContent = "Incorrect old password.";
        }
    });

    document.getElementById("update-password").addEventListener("click", async () => {
        const newPassword = document.getElementById("new-password").value;
        if (!validateNewPassword(newPassword)) return;

        const hashedNewPassword = CryptoJS.SHA256(newPassword).toString();
        await updateItem("users", { ...user, password: hashedNewPassword });
        showToast("Password updated successfully!");
    });

    function validateNewPassword(password) {
        const errorField = document.getElementById("new-password-error");

        if (password.length < 6) {
            errorField.textContent = "Password must be at least 6 characters.";
            return false;
        }
        if (!/[A-Z]/.test(password)) {
            errorField.textContent = "Password must contain an uppercase letter.";
            return false;
        }
        if (!/\d/.test(password)) {
            errorField.textContent = "Password must contain a number.";
            return false;
        }

        errorField.textContent = "";
        return true;
    }

    document.getElementById('logout-link').addEventListener('click', (event) => {
        event.preventDefault();
        logout();
    });
});
