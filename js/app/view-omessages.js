import { getAllItemsByIndex, getItemByKey } from "../utils/dbUtils.js";
import { getCookie } from "../utils/cookie.js";
import { checkAuth, logout } from "../utils/auth.js";

const userId = getCookie("userId");
const user = await getItemByKey("users", userId);
if (!user || user.role !== "owner" || !user.isApproved) {
    alert("Access Denied: You are not authorized to view this page.");
    window.location.href = user.role === "customer" ? "./udashboard.html" : "./login.html";
}

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const logoutLink = document.getElementById('logout-link');
    const userDashboard = document.getElementById('user-dashboard-link');

    if (isAuthenticated) {
        userDashboard.style.display = 'block';
        logoutLink.style.display = 'block';

        const userId = getCookie("userId");
        const user = await getItemByKey("users", userId);
        const role = user.role;
        const isApproved = user.isApproved;

       
    } else {
        userDashboard.style.display = 'none';
        logoutLink.style.display = 'none';
    }
}

async function getUserNames(participants) {
    const userPromises = participants.map(participantId => getItemByKey("users", participantId));
    const users = await Promise.all(userPromises);
    return users.map(user => user.username).join(", ");
}

async function loadConversations() {
    const conversations = await getAllItemsByIndex("conversations", "participants", userId);
    const messageList = document.getElementById("message-list");
    const noConversations = document.getElementById("no-conversations");
    messageList.innerHTML = "";

    if (conversations.length === 0) {
        console.log("getting inside");
        noConversations.classList.remove("hidden");
    } else {
        noConversations.classList.add("hidden");
        for (const conversation of conversations) {
            const otherParticipantId = conversation.participants.find(id => id !== userId);
            const otherUser = await getItemByKey("users", otherParticipantId);
            const lastMessage = conversation.lastMessage;
            const timestamp = new Date(conversation.lastTimestamp).toLocaleString();

            const messageItem = document.createElement("div");
            messageItem.className = "message-item";
            messageItem.onclick = () => redirectToChat(conversation.chatId);

            messageItem.innerHTML = `
                <img src="${otherUser.profileImage || '../assets/images/profile.jpg'}" alt="Profile Image">
                <div class="message-content">
                    <div class="name">${otherUser.username}</div>
                    <div class="last-message">${lastMessage}</div>
                    <div class="timestamp">${timestamp}</div>
                </div>
            `;

            messageList.appendChild(messageItem);
        }
    }
}

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

highlightActiveLink();

loadConversations();
updateNavLinks();

document.getElementById('logout-link').addEventListener('click', (event) => {
        event.preventDefault();
        logout();
});
