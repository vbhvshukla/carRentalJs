import { getCookie, setCookie } from "./cookie.js";
import { getItemByKey } from "./dbUtils.js";

function checkAuth() {
    const userId = getCookie("userId");
    if (!userId || userId == null) {
        return false;
    }
    return true;
}

function logout() {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        const [name] = cookies[i].split("=");
        setCookie(name, "", -1); 
    }
    window.location.href = "./index.html";
}

async function checkAdmin() {
    const userId = getCookie("userId");
    if (!userId) return false;
    const user = await getItemByKey("users", userId);
    return user && user.role === "admin";
}

async function checkOwnerApproved() {
    const userId = getCookie("userId");
    if (!userId) return false;
    const user = await getItemByKey("users", userId);
    return user && user.role === "owner" && user.isApproved;
}

export { checkAuth, logout, checkAdmin, checkOwnerApproved };