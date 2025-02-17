import { getAllItems, getItemByKey } from "../../../js/utils/dbUtils.js";
import { getCookie } from "../../../js/utils/cookie.js";
import { checkAuth, logout } from "../../../js/utils/auth.js";

const userId = getCookie("userId");
if (!userId) window.location.href = "../../login/login.html";

async function loadConversations() {
    const messageList = document.getElementById("message-list");
    messageList.innerHTML = '<p class="no-messages">Loading conversations...</p>';

    let conversations = await getAllItems("conversations");

    // Filter conversations where the user is either the owner or the user
    conversations = conversations.filter(conversation => conversation.owner.userId === userId || conversation.user.userId === userId);

    if (!conversations.length) {
        messageList.innerHTML = '<p class="no-messages">No conversations found.</p>';
        return;
    }

    conversations.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));

    messageList.innerHTML = "";

    for (const conversation of conversations) {
        const otherParticipant = conversation.owner.userId === userId ? conversation.user : conversation.owner;
        const lastMessage = conversation.lastMessage || "No messages yet.";
        const timestamp = conversation.lastTimestamp ? new Date(conversation.lastTimestamp).toLocaleString() : "N/A";

        const messageItem = document.createElement("div");
        messageItem.className = "message-item";
        messageItem.onclick = () => redirectToChat(conversation.chatId);

        messageItem.innerHTML = `
            <img src="${otherParticipant.profileImage || '../../../assets/images/profile.jpg'}" alt="Profile">
            <div class="message-content">
                <div class="name">${otherParticipant.username}</div>
                <div class="last-message">${lastMessage}</div>
                <div class="timestamp">${timestamp}</div>
            </div>
        `;

        messageList.appendChild(messageItem);
    }
}

function redirectToChat(chatId) {
    window.location.href = `./view-umessage.html?chatId=${chatId}`;
}

document.addEventListener("DOMContentLoaded", () => {
    loadConversations();
    updateNavLinks();
    highlightActiveLink();
    document.getElementById('logout-link').addEventListener('click', (event) => {
        event.preventDefault();
        logout();
    });
});

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const loginSignupLink = document.getElementById('login-signup-link');
    const logoutLink = document.getElementById('logout-link');
    const userDashboard = document.getElementById('user-dashboard-link');
    const ownerDashboard = document.getElementById('owner-dashboard-link');

    if (isAuthenticated) {
        userDashboard.style.display = 'block';
        loginSignupLink.style.display = 'none';
        logoutLink.style.display = 'block';

        const userId = getCookie("userId");
        const user = await getItemByKey("users", userId);
        const role = user.role;
        const isApproved = user.isApproved;

        if (role === "owner" && isApproved) {
            ownerDashboard.style.display = 'block';
        } else {
            ownerDashboard.style.display = 'none';
        }
    } else {
        userDashboard.style.display = 'none';
        ownerDashboard.style.display = 'none';
        loginSignupLink.style.display = 'block';
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
