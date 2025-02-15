import { getAllItemsByIndex, getItemByKey, updateItem } from "../utils/dbUtils.js";
import { getCookie } from "../utils/cookie.js";
import { checkAuth, logout } from "../utils/auth.js";
import { showToast } from "../utils/toastUtils.js";

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
    tableBody.innerHTML = "";
    if (biddings.length === 0) {
        // document.getElementById("no-biddings-row").classList.remove("hidden");
    } else {
        // document.getElementById("no-biddings-row").classList.add("hidden");
        biddings.forEach(bid => {
            const chatId = `${userId}_${bid.car.owner.userId}_${bid.car.carId}`;
            const statusClass = bid.status.toLowerCase();
            const statusLabel = {
                "approved": "✔ Approved",
                "pending": "⏳ Pending",
                "rejected": "❌ Rejected",
                "cancelled": "❌ Cancelled"
            }[bid.status.toLowerCase()] || bid.status;

            const rentalTypeLabel = bid.rentalType === "local" ? "Local Rental" : "Outstation Rental";

            const startDate = new Date(bid.fromTimestamp);
            const endDate = new Date(bid.toTimestamp);
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            const totalAmount = (days * bid.bidAmount).toFixed(2);

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${bid.car.carName}</td>
                <td>${bid.car.owner.username}</td>
                <td>₹${bid.bidAmount} / day</td>
                <td>${bid.fromTimestamp}</td>
                <td>${bid.toTimestamp}</td>
                <td>${new Date(bid.createdAt).toLocaleDateString()}</td>
                <td>₹${totalAmount}</td>
                <td>${rentalTypeLabel}</td>
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

function filterByStatus() {
    const selectedStatus = document.getElementById("status-sort").value;
    const filteredBids = selectedStatus
        ? biddings.filter(bid => bid.status.toLowerCase() === selectedStatus)
        : [...biddings];
    renderBiddings(filteredBids);
}

function filterByRentalType() {
    const selectedRentalType = document.getElementById("rental-type-sort").value;
    const filteredBids = selectedRentalType
        ? biddings.filter(bid => bid.rentalType === selectedRentalType)
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
        logoutLink.style.display = 'none';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadBiddingHistory();
    updateNavLinks();
    highlightActiveLink();
    window.redirectToChat = redirectToChat;
    window.cancelBid = cancelBid;
    window.filterByStatus = filterByStatus;
    window.filterByRentalType = filterByRentalType;
    document.getElementById('logout-link').addEventListener('click', (event) => {
        event.preventDefault();
        logout();
    });
});