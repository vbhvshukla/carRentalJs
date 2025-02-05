import { getCookie,setCookie } from "./cookie.js";
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

export { checkAuth ,logout};