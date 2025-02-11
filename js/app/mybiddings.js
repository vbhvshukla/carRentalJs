import { getAllItemsByIndex, getItemByKey, updateItem } from "../utils/dbUtils.js";
import { getCookie } from "../utils/cookie.js";
import { checkAuth, logout } from "../utils/auth.js";

const userId = getCookie("userId");
if (!userId) window.location.href = "./login.html";

let biddings = [];

async function loadBiddingHistory() {
    try {
        biddings = await getAllItemsByIndex("bids", "userId", userId);
        renderBiddings(biddings);
    } catch (error) {
        console.error("Error loading bidding history:", error);
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

function renderBiddings(biddings) {
    const tableBody = document.querySelector("#bidding-table tbody");
    const noBiddingsRow = document.getElementById("no-biddings-row");

    tableBody.innerHTML = "";
    if (biddings.length === 0) {
        noBiddingsRow.classList.remove("hidden");
    } else {
        noBiddingsRow.classList.add("hidden");
        biddings.forEach(bid => {
            const chatId = `${userId}_${bid.ownerId}_${bid.carId}`;
            const statusClass = bid.status.toLowerCase();
            const statusLabel = {
                "approved": "✔ Approved",
                "pending": "⏳ Pending",
                "rejected": "❌ Rejected",
                "cancelled": "❌ Cancelled"
            }[bid.status.toLowerCase()] || bid.status;

            const startDate = new Date(bid.from);
            const endDate = new Date(bid.to);
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            const totalAmount = (days * bid.bidAmount).toFixed(2);

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${bid.carName}</td>
                <td>${bid.ownerName}</td>
                <td>$${bid.bidAmount} / day</td>
                <td>${bid.from}</td>
                <td>${bid.to}</td>
                <td>${new Date(bid.createdAt).toLocaleDateString()}</td>
                <td>$${totalAmount}</td>
                <td class="status-${statusClass}">${statusLabel}</td>
                <td>
                    <button class="chat-button" onclick="redirectToChat('${chatId}')">Chat</button>
                    ${bid.status.toLowerCase() === "cancelled" ? "" : `<button class="cancel-button" onclick="cancelBid('${bid.bidId}')">Cancel</button>`}
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.getElementById("toast-container").appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function filterByStatus() {
    const selectedStatus = document.getElementById("status-sort").value;
    const filteredBids = selectedStatus
        ? biddings.filter(bid => bid.status.toLowerCase() === selectedStatus)
        : [...biddings];

    renderBiddings(filteredBids);
}

async function cancelBid(bidId) {
    if (confirm("Are you sure you want to cancel this bid?")) {
        try {
            let bid = await getItemByKey("bids", bidId);
            if (!bid) {
                showToast("Bid not found!");
                return;
            }
            bid.status = "cancelled";
            await updateItem("bids", bid);

            showToast("Bid cancelled successfully!");
            loadBiddingHistory();
        } catch (error) {
            console.error("Error cancelling bid:", error);
            showToast("Error cancelling bid. Try again later!");
        }
    }
}

function redirectToChat(chatId) {
    window.location.href = `./view-umessage.html?chatId=${chatId}`;
}

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const logoutLink = document.getElementById('logout-link');
    const userDashboard = document.getElementById('user-dashboard-link');
    const ownerDashboard = document.getElementById('owner-dashboard-link');

    if (isAuthenticated) {
        userDashboard.style.display = 'block';
        logoutLink.style.display = 'block';
        const userId = getCookie("userId");
        const user = await getItemByKey("users", userId);
        if (role === "owner" && isApproved) {
            ownerDashboard.style.display = 'block';
        } else {
            ownerDashboard.style.display = 'none';
        }
    } else {
        userDashboard.style.display = 'none';
        ownerDashboard.style.display = 'none';
        logoutLink.style.display = 'none';
    }
}

loadBiddingHistory();
updateNavLinks();
highlightActiveLink();

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

window.redirectToChat = redirectToChat;
window.cancelBid = cancelBid;
window.filterByStatus = filterByStatus;