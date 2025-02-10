import { getAllItemsByIndex, getItemByKey, updateItem, addItem, getAllItems } from "../utils/dbUtils.js";
import { checkAuth, logout } from "../utils/auth.js";
import { getCookie } from "../utils/cookie.js";
import { generateRandomId } from "../utils/generateId.js";

const userId = getCookie("userId");
if (!userId) {
    window.location.href = "./login.html";
}

const user = await getItemByKey("users", userId);

if (!user || user.role !== "owner" || !user.isApproved) {
    alert("Access Denied: You are not authorized to view this page.");
    window.location.href = user.role === "customer" ? "./udashboard.html" : "./login.html";
}

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const userDashboardLink = document.getElementById('user-dashboard-link');
    const logoutLink = document.getElementById('logout-link');

    if (isAuthenticated) {
        userDashboardLink.style.display = 'block';
        logoutLink.style.display = 'block';
    } else {
        userDashboardLink.style.display = 'none';
        logoutLink.style.display = 'none';
    }
}

function calculateTotalAmount(bidAmount, fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return bidAmount * diffDays;
}


function isDateRangeOverlap(startDate1, endDate1, startDate2, endDate2) {
    return (startDate1 <= endDate2 && endDate1 >= startDate2);
}

async function getPendingBids() {
    const bids = await getAllItemsByIndex("bids", "ownerId", userId);
    return bids.filter(bid => bid.status.toLowerCase() === "pending");
}

async function acceptBid(acceptedBid) {
    try {
        const bids = await getPendingBids();
        const overlappingBids = bids.filter(bid =>
            bid.carId === acceptedBid.carId &&
            bid.bidId !== acceptedBid.bidId &&
            isDateRangeOverlap(new Date(bid.from), new Date(bid.to), new Date(acceptedBid.from), new Date(acceptedBid.to))
        );

        acceptedBid.status = "Accepted";
        await updateItem("bids", acceptedBid);

        for (const bid of overlappingBids) {
            bid.status = "Rejected";
            await updateItem("bids", bid);
        }

        const booking = {
            bid: acceptedBid.bidId,
            bookingId: generateRandomId(),
            userId: acceptedBid.userId,
            username: acceptedBid.username,
            carId: acceptedBid.carId,
            carName: acceptedBid.carName,
            ownerId: acceptedBid.ownerId,
            ownerName: acceptedBid.ownerName,
            bidPrice: acceptedBid.bidAmount,
            from: acceptedBid.from,
            to: acceptedBid.to,
            isValid: true,
            createdAt: new Date().toISOString().split('T')[0]
        };

        await addItem("bookings", booking);

        const car = await getItemByKey("cars", acceptedBid.carId);
        car.availability = "unavailable";
        await updateItem("cars", car);

        alert(`Accepted bid with ID: ${acceptedBid.bidId}`);
        await fetchData();
    } catch (error) {
        console.error(`Error accepting bid with ID: ${acceptedBid.bidId}`, error);
        alert('Failed to accept bid. Please try again.');
    }
}

async function rejectBid(bidId) {
    try {
        const bid = await getItemByKey("bids", bidId);
        bid.status = "Rejected";
        await updateItem("bids", bid);
        alert(`Rejected bid with ID: ${bidId}`);
        await fetchData();
    } catch (error) {
        console.error(`Error rejecting bid with ID: ${bidId}`, error);
        alert('Failed to reject bid. Please try again.');
    }
}

let pendingBids = [], bookings = [], allBids = [];
let currentPendingPage = 1, currentBookingsPage = 1, currentAllBidsPage = 1;
const itemsPerPage = 5;

async function fetchData() {
    pendingBids = await getPendingBids();
    bookings = await getAllItemsByIndex("bookings", "ownerId", userId);
    allBids = await getAllItemsByIndex("bids", "ownerId", userId);
    renderPendingBids();
    renderBookings();
    renderAllBids();
}

function renderPendingBids() {
    const tableBody = document.querySelector("#pending-bids-table tbody");
    tableBody.innerHTML = "";
    const start = (currentPendingPage - 1) * itemsPerPage;
    const paginatedBids = pendingBids.slice(start, start + itemsPerPage);

    if (paginatedBids.length === 0) {
        document.getElementById("pending-pagination").classList.add("hidden");
        document.getElementById("no-pending-bids").classList.remove("hidden");
    } else {
        document.getElementById("pending-pagination").classList.remove("hidden");
        document.getElementById("no-pending-bids").classList.add("hidden");
    }

    paginatedBids.forEach(bid => {
        const totalAmount = calculateTotalAmount(bid.bidAmount, bid.from, bid.to);

        const row = `<tr>
            <td>${bid.carName}</td>
            <td>$${bid.bidAmount}</td>
            <td>$${totalAmount}</td>
            <td>${bid.username}</td>
            <td>${bid.from}</td>
            <td>${bid.to}</td>
            <td>
                <button class="accept-btn" data-id="${bid.bidId}">Accept</button>
                <button class="reject-btn" data-id="${bid.bidId}">Reject</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    document.getElementById("pending-page-info").textContent = `Page ${currentPendingPage} of ${Math.ceil(pendingBids.length / itemsPerPage)}`;

    document.querySelectorAll(".accept-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const bidId = button.getAttribute("data-id");
            const bid = pendingBids.find(bid => bid.bidId === bidId);
            await acceptBid(bid);
        });
    });

    document.querySelectorAll(".reject-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const bidId = button.getAttribute("data-id");
            await rejectBid(bidId);
        });
    });
}

function renderBookings() {
    const tableBody = document.querySelector("#bookings-table tbody");
    tableBody.innerHTML = "";
    const start = (currentBookingsPage - 1) * itemsPerPage;
    const paginatedBookings = bookings.slice(start, start + itemsPerPage);

    if (paginatedBookings.length === 0) {
        document.getElementById("bookings-pagination").classList.add("hidden");
        document.getElementById("no-bookings").classList.remove("hidden");
    } else {
        document.getElementById("bookings-pagination").classList.remove("hidden");
        document.getElementById("no-bookings").classList.add("hidden");
    }

    paginatedBookings.forEach(booking => {
        const totalAmount = calculateTotalAmount(booking.bidPrice, booking.from, booking.to);
        const row = `<tr>
            <td>${booking.carName}</td>
            <td>$${booking.bidPrice}</td>
            <td>$${totalAmount}</td>
            <td>${booking.username}</td>
            <td>${booking.from}</td>
            <td>${booking.to}</td>
            <td>${new Date(booking.createdAt).toLocaleDateString()}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    document.getElementById("bookings-page-info").textContent = `Page ${currentBookingsPage} of ${Math.ceil(bookings.length / itemsPerPage)}`;
}

function renderAllBids() {
    const tableBody = document.querySelector("#all-bids-table tbody");
    tableBody.innerHTML = "";
    const start = (currentAllBidsPage - 1) * itemsPerPage;
    const paginatedBids = allBids.slice(start, start + itemsPerPage);

    if (paginatedBids.length === 0) {
        document.getElementById("all-bids-pagination").classList.add("hidden");
        document.getElementById("no-all-bids").classList.remove("hidden");
    } else {
        document.getElementById("all-bids-pagination").classList.remove("hidden");
        document.getElementById("no-all-bids").classList.add("hidden");
    }

    paginatedBids.forEach(bid => {
        const totalAmount = calculateTotalAmount(bid.bidAmount, bid.from, bid.to);
        const row = `<tr>
            <td>${bid.carName}</td>
            <td>$${bid.bidAmount}</td>
                                <td>$${totalAmount}</td>

            <td>${bid.username}</td>
            <td>${bid.from}</td>
            <td>${bid.to}</td>
            <td>${bid.status}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    document.getElementById("all-bids-page-info").textContent = `Page ${currentAllBidsPage} of ${Math.ceil(allBids.length / itemsPerPage)}`;
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


document.getElementById("prev-pending").addEventListener("click", () => { if (currentPendingPage > 1) currentPendingPage--; renderPendingBids(); });
document.getElementById("next-pending").addEventListener("click", () => { if (currentPendingPage < Math.ceil(pendingBids.length / itemsPerPage)) currentPendingPage++; renderPendingBids(); });
document.getElementById("prev-bookings").addEventListener("click", () => { if (currentBookingsPage > 1) currentBookingsPage--; renderBookings(); });
document.getElementById("next-bookings").addEventListener("click", () => { if (currentBookingsPage < Math.ceil(bookings.length / itemsPerPage)) currentBookingsPage++; renderBookings(); });
document.getElementById("prev-all-bids").addEventListener("click", () => { if (currentAllBidsPage > 1) currentAllBidsPage--; renderAllBids(); });
document.getElementById("next-all-bids").addEventListener("click", () => { if (currentAllBidsPage < Math.ceil(allBids.length / itemsPerPage)) currentAllBidsPage++; renderAllBids(); });


document.getElementById("status-sort").addEventListener("change", async (event) => {
    allBids = await getAllItemsByIndex("bids", "ownerId", userId);
    const status = event.target.value.toLowerCase();
    if (status === "all") {
        allBids = allBids;
    } else {
        allBids = allBids.filter(bid => bid.status.toLowerCase() === status.toLowerCase());
    }
    currentAllBidsPage = 1;
    renderAllBids();
});


document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

highlightActiveLink();
fetchData();
updateNavLinks();

