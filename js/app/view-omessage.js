import { getItemByKey, getAllItemsByIndex, addItem, updateItem } from "../utils/dbUtils.js";
import { generateRandomId } from "../utils/generateId.js";
import { getCookie } from "../utils/cookie.js";
import { checkAuth, logout } from "../utils/auth.js";

const userId = getCookie("userId");
const user = await getItemByKey("users", userId);
if (!user || user.role !== "owner" || !user.isApproved) {
    window.location.href = user.role === "customer" ? "./udashboard.html" : "./login.html";
}

function getContextFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const contextParam = urlParams.get('context');
    if (contextParam) {
        return JSON.parse(decodeURIComponent(contextParam));
    } else {
        return { chatId: urlParams.get('chatId') };
    }
}

async function renderMessages() {
    const context = getContextFromURL();
    const chatId = context.chatId;
    const conversation = await getItemByKey("conversations", chatId);

    if (!conversation) {
        const newConversation = {
            chatId,
            participants: [userId, context.ownerId],
            lastMessage: '',
            lastTimestamp: ''
        };
        await addItem("conversations", newConversation);
    }

    const allMessages = await getAllItemsByIndex("messages", "chatId", chatId);
    const chatMessagesContainer = document.getElementById("chat-messages");
    chatMessagesContainer.innerHTML = "";

    allMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    for (const msg of allMessages) {
        const user = await getItemByKey("users", msg.fromUserId);
        const messageElement = document.createElement("div");
        messageElement.className = `chat-message ${msg.fromUserId === userId ? 'message-you' : 'message-owner'}`;
        messageElement.innerHTML = `
                    <img src="${user.profileImage || '../assets/images/profile.jpg'}" alt="Profile Image">
                    <div class="message-content">
                        <div><strong>${msg.fromUserId === userId ? 'You' : user.username}:</strong> ${msg.message}</div>
                        ${msg.hasAttachment ? (msg.attachment.startsWith('data:image/') ? `<div class="attachment"><img src="${msg.attachment}" alt="Attachment"></div>` : `<div><a href="${msg.attachment}" download>Download</a></div>`) : ''}
                    </div>
                    <div class="timestamp">${new Date(msg.createdAt).toLocaleString()}</div>
                `;
        chatMessagesContainer.appendChild(messageElement);
    }

    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

async function sendMessage(chatId, fromUserId, toUserId, message, file = null) {
    const newMessage = {
        messageId: generateRandomId('msg'),
        chatId,
        fromUserId,
        toUserId,
        message,
        createdAt: new Date().toISOString(),
        hasAttachment: !!file,
        attachment: file ? await readFileAsDataURL(file) : null
    };

    await addItem("messages", newMessage);

    const conversation = await getItemByKey("conversations", chatId) || {
        chatId,
        participants: [fromUserId, toUserId],
        lastMessage: '',
        lastTimestamp: ''
    };

    conversation.lastMessage = message;
    conversation.lastTimestamp = newMessage.createdAt;

    await updateItem("conversations", conversation);
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

document.getElementById("send-chat-message-btn").addEventListener("click", async () => {
    const messageInput = document.getElementById("chat-message-input");
    const fileInput = document.getElementById("chat-file-input");
    const message = messageInput.value.trim();
    const file = fileInput.files[0];
    const context = getContextFromURL();
    const chatId = context.chatId;
    const toUserId = context.userId;

    if (message || file) {
        await sendMessage(chatId, userId, toUserId, message, file);
        messageInput.value = "";
        fileInput.value = "";
        renderMessages();
    }
});

document.getElementById("chat-message-input").addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("send-chat-message-btn").click();
    }
});

renderMessages();
updateNavLinks();
document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const loginSignupLink = document.getElementById('login-signup-link');
    const logoutLink = document.getElementById('logout-link');

    if (isAuthenticated) {
        loginSignupLink.style.display = 'none';
        logoutLink.style.display = 'block';
    } else {
        loginSignupLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }
}