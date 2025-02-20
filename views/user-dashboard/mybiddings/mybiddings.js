import { getAllItemsByIndex, getItemByKey, updateItem } from "../../../js/utils/dbUtils.js";
import { getCookie,setCookie } from "../../../js/utils/cookie.js";
import { checkAuth ,checkOwner} from "../../../js/utils/auth.js";
import { showToast } from "../../../js/utils/toastUtils.js";

const userId = getCookie("userId");
if (!userId) window.location.href = "../../login/login.html";

async function checkAndRedirectOwner() {
    const isOwnerApproved = await checkOwner();
    if (isOwnerApproved) {
        window.location.href = "../../owner-dashboard/odashboard.html";
    }
}

checkAndRedirectOwner();

let biddings = [];

async function loadBiddingHistory() {
    try {
        biddings = await getAllItemsByIndex("bids", "userId", userId);
        // console.log(biddings);
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
    // console.log(biddings.length);
    if (biddings.length === 0) {
        console.log("getting in here");
        console.log(noBiddingsRow);
        // noBiddingsRow.style.display = "table-row";
    } else {
        // noBiddingsRow.style.display = "none";
        biddings.forEach(bid => {
            const chatId = `${userId}_${bid.car.owner.userId}_${bid.car.carId}`;
            const statusClass = bid.status.toLowerCase();
            const statusLabel = {
                "accepted": "✔ Approved",
                "pending": "⏳ Pending",
                "rejected": "❌ Rejected",
                "cancelled": "❌ Cancelled"
            }[bid.status.toLowerCase()] || bid.status;

            const rentalTypeLabel = bid.rentalType === "local" ? "Local" : "Outstation";

            const startDate = new Date(bid.fromTimestamp);
            const endDate = new Date(bid.toTimestamp);
            const totalAmount = calculateTotalAmount(bid,startDate,endDate).toFixed(2);
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${bid.car.carName}</td>
                <td>${bid.car.owner.username}</td>
                <td>₹${bid.bidAmount}</td>
                <td>${bid.fromTimestamp}</td>
                <td>${bid.toTimestamp}</td>
                <td>${new Date(bid.createdAt).toLocaleDateString()}</td>
                <td>₹${totalAmount}</td>
                <td>${rentalTypeLabel}</td>
                <td class="status-${statusClass}">${statusLabel}</td>
                <td class="action-buttons">
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
    console.log(selectedStatus);
    const filteredBids = selectedStatus
        ? biddings.filter(bid => bid.status.toLowerCase() === selectedStatus)
        : [...biddings];
    renderBiddings(filteredBids);
}

//Calculate the total amount for a bid based on rental type and duration.
function calculateTotalAmount(bid, fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) ;

    if (bid.rentalType === "local") {
        const totalHours = diffTime / (1000 * 60 * 60);
        const baseFare = bid.car.rentalOptions.local.pricePerHour * totalHours;
        const extraKmCharges = bid.extraKmCharges || 0;
        const extraHourCharges = bid.extraHourCharges || 0;
        return baseFare + extraKmCharges + extraHourCharges;
    } else if (bid.rentalType === "outstation") {
        const baseFare = bid.car.rentalOptions.outstation.pricePerDay * diffDays;
        const extraKmCharges = bid.extraKmCharges || 0;
        const extraDayCharges = bid.extraDayCharges || 0;
        return baseFare + extraKmCharges + extraDayCharges;
    }
    return 0;
}
//Filter function to filter by rental type
function filterByRentalType() {
    const selectedRentalType = document.getElementById("rental-type-sort").value;
    console.log(selectedRentalType);
    const filteredBids = selectedRentalType
        ? biddings.filter(bid => bid.rentalType === selectedRentalType)
        : [...biddings];
    renderBiddings(filteredBids);
}

//Cancel bid 
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
    window.location.href = `../messages/view-umessage.html?chatId=${chatId}`;
}

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const logoutLink = document.getElementById('logout-link');
    // const userDashboard = document.getElementById('user-dashboard-link');
    const ownerDashboard = document.getElementById('owner-dashboard-link');

    if (isAuthenticated) {
        // userDashboard.style.display = 'block';
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

function logout() {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        const [name] = cookies[i].split("=");
        setCookie(name, "", -1); 
    }
    window.location.href = "../../index.html";
}

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
