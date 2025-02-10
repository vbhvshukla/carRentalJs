import { getAllItemsByIndex, getItemByKey } from "../utils/dbUtils.js";
import { getCookie } from "../utils/cookie.js";
import { checkAuth, logout } from "../utils/auth.js";

const userId = getCookie("userId");
if (!userId) window.location.href = "./login.html";

async function loadConversations() {
    const messageList = document.getElementById("message-list");
    messageList.innerHTML = '<p class="no-messages">Loading conversations...</p>';

    let conversations = await getAllItemsByIndex("conversations", "participants", userId);

    if (!conversations.length) {
        messageList.innerHTML = '<p class="no-messages">No conversations found.</p>';
        return;
    }

    conversations.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));

    messageList.innerHTML = "";

    for (const conversation of conversations) {
        const otherParticipantId = conversation.participants.find(id => id !== userId);
        const otherUser = await getItemByKey("users", otherParticipantId);
        const lastMessage = conversation.lastMessage || "No messages yet.";
        const timestamp = conversation.lastTimestamp ? new Date(conversation.lastTimestamp).toLocaleString() : "N/A";

        const messageItem = document.createElement("div");
        messageItem.className = "message-item";
        messageItem.onclick = () => redirectToChat(conversation.chatId);

        messageItem.innerHTML = `
            <img src="${otherUser.profileImage || '../assets/images/profile.jpg'}" alt="Profile">
            <div class="message-content">
                <div class="name">${otherUser.username}</div>
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
