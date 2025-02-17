import { getItemByKey, getAllItemsByIndex, addItem, updateItem } from "../../../js/utils/dbUtils.js";
import { generateRandomId } from "../../../js/utils/generateId.js";
import { getCookie } from "../../../js/utils/cookie.js";
import { checkAuth, logout } from "../../../js/utils/auth.js";
import { readFileAsDataURL } from "../../../js/utils/readFile.js";

const userId = getCookie("userId");
const user = await getItemByKey("users", userId);
if (!user || user.role !== "owner" || !user.isApproved) {
    window.location.href = user.role === "customer" ? "../../user-dashboard/udashboard.html" : "../../login/login.html";
}

async function renderMessages() {
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chatId');
    const conversation = await getItemByKey("conversations", chatId);

    if (!conversation) {
        const newConversation = {
            chatId,
            owner: {
                userId: urlParams.get('userId'),
                username: urlParams.get('username'),
                email: '' // Assuming the email is not available, you can update this if needed
            },
            user: {
                userId,
                username: user.username,
                email: user.email // Assuming the email is available in the user object
            },
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
        console.log(`Message from user ID: ${msg.fromUser.userId}`);
        const user = await getItemByKey("users", msg.fromUser.userId);
        const messageElement = document.createElement("div");
        messageElement.className = `chat-message ${msg.fromUser.userId === userId ? 'message-you' : 'message-owner'}`;
        messageElement.innerHTML = `
            <img src="${user.profileImage || '../../../assets/images/profile.jpg'}" alt="Profile Image">
            <div class="message-content">
                <div><strong>${msg.fromUser.userId === userId ? 'You' : user.username}:</strong> ${msg.message}</div>
                ${msg.hasAttachment ? (msg.attachment.startsWith('data:image/') ? `<div class="attachment"><img src="${msg.attachment}" alt="Attachment"></div>` : `<div><a href="${msg.attachment}" download>Download</a></div>`) : ''}
            </div>
            <div class="timestamp">${new Date(msg.createdAt).toLocaleString()}</div>
        `;
        chatMessagesContainer.appendChild(messageElement);
    }

    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

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

async function sendMessage(chatId, fromUserId, fromUsername, message, file = null) {
    console.log(`Sending message from ${fromUserId} in chat ${chatId}`);
    
    // Fetch conversation details to get the toUserId
    const conversation = await getItemByKey("conversations", chatId);
    if (!conversation) {
        console.error(`Conversation with ID ${chatId} not found`);
        return;
    }

    const toUserId = conversation.owner.userId === fromUserId ? conversation.user.userId : conversation.owner.userId;

    // Fetch toUser details from the database
    const toUser = await getItemByKey("users", toUserId);
    if (!toUser) {
        console.error(`User with ID ${toUserId} not found`);
        return;
    }

    const newMessage = {
        messageId: generateRandomId('msg'),
        chatId,
        message,
        hasAttachment: !!file,
        attachment: file ? await readFileAsDataURL(file) : null,
        createdAt: new Date().toISOString(),
        fromUser: {
            userId: fromUserId,
            username: fromUsername,
            email: user.email // Assuming the email is available in the user object
        },
        toUser: {
            userId: toUser.userId,
            username: toUser.username,
            email: toUser.email
        }
    };

    console.log(`New message: ${JSON.stringify(newMessage)}`);

    await addItem("messages", newMessage);

    conversation.lastMessage = message;
    conversation.lastTimestamp = newMessage.createdAt;

    await updateItem("conversations", conversation);
}

document.getElementById("send-chat-message-btn").addEventListener("click", async () => {
    const messageInput = document.getElementById("chat-message-input");
    const fileInput = document.getElementById("chat-file-input");
    const message = messageInput.value.trim();
    const file = fileInput.files[0];
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chatId');

    if (message || file) {
        await sendMessage(chatId, userId, user.username, message, file);
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
