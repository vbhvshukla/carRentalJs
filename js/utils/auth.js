import { getCookie, setCookie } from "./cookie.js";
import { getItemByKey } from "./dbUtils.js";

function checkAuth() {
    const userId = getCookie("userId");
    return !!userId;
}

async function getUserRole() {
    const userId = getCookie("userId");
    if (!userId) return null;
    const user = await getItemByKey("users", userId);
    return user ? user.role : null;
}

async function getUser() {
    const userId = getCookie("userId");
    if (!userId) return null;
    return await getItemByKey("users", userId);
}

function logout() {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        const [name] = cookies[i].split("=");
        setCookie(name, "", -1); 
    }
    window.location.href = "../index.html";
}

async function checkAdmin() {
    const role = await getUserRole();
    return role === "admin";
}

async function checkOwnerApproved() {
    const user = await getUser();
    return user && user.role === "owner" && user.isApproved;
}

async function checkOwner() {
    const role = await getUserRole();
    return role === "owner";
}

async function checkCustomer() {
    const role = await getUserRole();
    return role === "customer";
}

export { checkAuth, getUserRole, getUser, logout, checkAdmin,checkOwner, checkOwnerApproved, checkCustomer };