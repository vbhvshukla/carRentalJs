import { getCookie, setCookie } from "./cookie.js";
import { getItemByKey } from "./dbUtils.js";

function checkAuth() {
    const userId = getCookie("userId");
    return !!userId;
}

//Get user's role
async function getUserRole() {
    const userId = getCookie("userId");
    if (!userId) return null;
    const user = await getItemByKey("users", userId);
    return user ? user.role : null;
}

//Get the current logged in user's object.
async function getUser() {
    const userId = getCookie("userId");
    if (!userId) return null;
    return await getItemByKey("users", userId);
}

//Logout function
function logout() {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        const [name] = cookies[i].split("=");
        setCookie(name, "", -1); 
    }
    window.location.href = "../index.html";
}

//Check the status of role if the user is admin
async function checkAdmin() {
    const role = await getUserRole();
    return role === "admin";
}

//Check if owner is approved
async function checkOwnerApproved() {
    const user = await getUser();
    return user && user.role === "owner" && user.isApproved;
}

//Check if the user is an owner
async function checkOwner() {
    const role = await getUserRole();
    return role === "owner";
}

//Check if the user is a customer
async function checkCustomer() {
    const role = await getUserRole();
    return role === "customer";
}

export { checkAuth, getUserRole, getUser, logout, checkAdmin,checkOwner, checkOwnerApproved, checkCustomer };