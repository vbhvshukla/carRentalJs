import { getAllItems, getItemByKey } from "../../../js/utils/dbUtils.js";
import { getCookie,setCookie } from "../../../js/utils/cookie.js";
import { checkAuth } from "../../../js/utils/auth.js";

const userId = getCookie("userId");
const user = await getItemByKey("users", userId);
if (!user || user.role !== "owner" || !user.isApproved) {
    alert("Access Denied: You are not authorized to view this page.");
    window.location.href = user.role === "customer" ? "../../user-dashboard/udashboard.html" : "../../login/login.html";
}

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const logoutLink = document.getElementById('logout-link');
    const userDashboard = document.getElementById('user-dashboard-link');

    if (isAuthenticated) {
        userDashboard.style.display = 'block';
        logoutLink.style.display = 'block';
    } else {
        userDashboard.style.display = 'none';
        logoutLink.style.display = 'none';
    }
}

//Load all conversations of the users
async function loadConversations() {
    const conversations = await getAllItems("conversations");
    const messageList = document.getElementById("message-list");
    const noConversations = document.getElementById("no-conversations");
    messageList.innerHTML = "";

    // console.log(conversations);
    console.log("User id is :: ", userId);
    const ownerConversations = conversations.filter(conversation => conversation.owner.userId === userId);

    // console.log(ownerConversations);

    if (ownerConversations.length === 0) {
        noConversations.classList.remove("hidden");
    } else {
        noConversations.classList.add("hidden");
        for (const conversation of ownerConversations) {
            const lastMessage = conversation.lastMessage;
            const timestamp = new Date(conversation.lastTimestamp).toLocaleString();

            const messageItem = document.createElement("div");
            messageItem.className = "message-item";
            messageItem.onclick = () => redirectToChat(conversation.chatId);

            messageItem.innerHTML = `
                <img src="${conversation.userProfileImage || '../../../assets/images/profile.jpg'}" alt="Profile Image">
                <div class="message-content">
                    <div class="name">${conversation.user.username}</div>
                    <div class="last-message">${lastMessage}</div>
                    <div class="timestamp">${timestamp}</div>
                </div>
            `;

            messageList.appendChild(messageItem);
        }
    }
}
//Redirect function
function redirectToChat(chatId) {
    const url = `./view-omessage.html?chatId=${chatId}`;
    window.location.href = url;
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


function logout() {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        const [name] = cookies[i].split("=");
        setCookie(name, "", -1); 
    }
    window.location.href = "../../index.html";
}

highlightActiveLink();
loadConversations();
updateNavLinks();

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});