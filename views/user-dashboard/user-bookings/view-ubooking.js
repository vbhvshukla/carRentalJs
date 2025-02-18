import { getItemsWithPagination, getAllItemsByIndex, getItemByKey, updateItem, deleteItem, getTotalItems } from "../../../js/utils/dbUtils.js";
import { getCookie } from "../../../js/utils/cookie.js";
import { checkAuth, logout } from "../../../js/utils/auth.js";
import { showToast } from "../../../js/utils/toastUtils.js";

const userId = getCookie("userId");
if (!userId) window.location.href = "../../login/login.html";

const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let sortColumn = null;
let sortDirection = "asc";

window.sortBookings = function (column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
        sortColumn = column;
        sortDirection = "asc";
    }

    document.querySelectorAll(".sort-arrow").forEach(arrow => arrow.textContent = "↑↓");
    document.getElementById(`sort-${column}`).textContent = sortDirection === "asc" ? "↑" : "↓";

    loadUserBookings();
}
//Apply the fitlers
window.applyFilters = function () {
    const filters = {
        searchCar: document.getElementById("search-car").value,
        startDate: document.getElementById("start-date-filter").value,
        endDate: document.getElementById("end-date-filter").value,
        maxAmount: document.getElementById("booking-amount-filter").value
    };
    loadUserBookings(1, filters);
}
//Get the filters 
function applyFilterConditions(booking, filters) {
    if (filters.searchCar && !booking.car.carName.toLowerCase().includes(filters.searchCar.toLowerCase())) return false;
    if (filters.startDate && new Date(booking.from) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(booking.to) > new Date(filters.endDate)) return false;
    if (filters.maxAmount && booking.bid.bidAmount > filters.maxAmount) return false;

    const currentDate = new Date();
    const bookingStartDate = new Date(booking.fromTimestamp);
    const bookingEndDate = new Date(booking.toTimestamp);

    if (filters.status) {
        if (filters.status === "cancelled" && booking.status !== "cancelled") return false;
        if (filters.status === "active" && (booking.status === "cancelled" || bookingEndDate < currentDate)) return false;
        if (filters.status === "past" && (bookingEndDate >= currentDate || booking.status === "cancelled")) return false;
    }

    return true;
}
//Pagination
function updatePaginationControls(currentPage, totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const paginationControls = document.getElementById("pagination-controls");
    paginationControls.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.disabled = i === currentPage;
        button.onclick = () => loadUserBookings(i);
        paginationControls.appendChild(button);
    }
}

function redirectToChat(chatId) {
    const url = `../messages/view-umessage.html?chatId=${chatId}`;
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
//Soft cancel the booking
async function cancelBooking(bookingId) {
    if (confirm("Are you sure you want to cancel this booking?")) {
        try {
            let booking = await getItemByKey("bookings", bookingId);
            if (!booking) {
                showToast("Booking not found!", "error");
                return;
            }
            booking.status = "cancelled";
            await updateItem("bookings", booking);

            showToast("Booking cancelled successfully!");
            loadUserBookings();
        } catch (error) {
            console.error("Error cancelling booking:", error);
            showToast("Error cancelling booking. Try again later!", "error");
        }
    }
}

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const loginSignupLink = document.getElementById('login-signup-link');
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

async function loadUserBookings(page = 1, filters = {}) {
    const allBookings = await getItemsWithPagination("bookings", page, ITEMS_PER_PAGE);
    const userBookings = allBookings.filter(booking => booking.bid.user.userId === userId && booking.status !== "cancelled");

    // Apply filters
    const filteredBookings = userBookings.filter(booking => applyFilterConditions(booking, filters));

    // Calculate total amount for each booking
    filteredBookings.forEach(booking => {
        const fromDate = new Date(booking.fromTimestamp);
        const toDate = new Date(booking.toTimestamp);
        const diffTime = Math.abs(toDate - fromDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (booking.rentalType === "local") {
            const totalHours = diffTime / (1000 * 60 * 60);
            booking.totalAmount = booking.bid.car.rentalOptions.local.pricePerHour * totalHours + booking.extraKmCharges + booking.extraHourCharges;
        } else if (booking.rentalType === "outstation") {
            booking.totalAmount = booking.bid.car.rentalOptions.outstation.pricePerDay * diffDays + booking.extraKmCharges + booking.extraHourCharges;
        }
    });

    // Apply sorting
    if (sortColumn) {
        filteredBookings.sort((a, b) => {
            let valA = a[sortColumn];
            let valB = b[sortColumn];

            if (sortColumn.includes("date") || sortColumn === "createdAt") {
                valA = new Date(valA);
                valB = new Date(valB);
            }

            return sortDirection === "asc" ? valA - valB : valB - valA;
        });
    }

    // Update table with filtered and sorted bookings
    const tableBody = document.querySelector("#booking-table tbody");
    tableBody.innerHTML = "";

    if (filteredBookings.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 9;
        cell.textContent = "No bookings";
        cell.style.textAlign = "center";
        row.appendChild(cell);
        tableBody.appendChild(row);
    } else {
        filteredBookings.forEach(booking => {
            const chatId = `${userId}_${booking.bid.car.owner.userId}_${booking.bid.car.carId}`;
            const endDate = new Date(booking.toTimestamp);
            const today = new Date();
            const showRatingButton = today > endDate;
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${booking.bookingId}</td>
                <td>${booking.bid.car.carName}</td>
                <td>${booking.bid.car.owner.username}</td>
                <td>$${booking.bid.bidAmount}</td>
                <td>${booking.fromTimestamp}</td>
                <td>${booking.toTimestamp}</td>
                <td>${new Date(booking.createdAt).toLocaleDateString()}</td>
                <td>$${booking.totalAmount.toFixed(2)}</td>
                <td>
                    <button class="chat-button" onclick="redirectToChat('${chatId}')">Chat</button>
                    <button class="cancel-button" onclick="cancelBooking('${booking.bookingId}')">Cancel</button>
                    ${showRatingButton ? `<button class="rate-button" onclick="openRatingModal('${booking.bid.car.carId}', '${booking.bid.car.carName}')">Rate Car</button>` : ""}
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Update pagination controls
    const totalItems = await getTotalItems("bookings");
    updatePaginationControls(page, totalItems);
}
//Open the modal
function openRatingModal(carId, carName) {
    const modal = document.getElementById("rating-modal");
    document.getElementById("modal-car-name").textContent = carName;
    modal.setAttribute("data-car-id", carId);
    modal.classList.remove("hidden");
}
//Submit the rating 
document.getElementById("submit-rating").addEventListener("click", async () => {
    const carId = document.getElementById("rating-modal").getAttribute("data-car-id");
    const rating = parseFloat(document.getElementById("user-rating").value);
    const ratingError = document.getElementById("rating-error");
    if (isNaN(rating) || rating < 0 || rating > 5) {
        ratingError.classList.remove("hidden");
        return;
    }
    ratingError.classList.add("hidden");
    try {
        const car = await getItemByKey("cars", carId);
        if (!car) {
            showToast("Car not found!", "error");
            return;
        }
        car.ratingCount = car.ratingCount ? car.ratingCount + 1 : 1;
        car.avgRating = ((car.avgRating * (car.ratingCount - 1)) + rating) / car.ratingCount;
        await updateItem("cars", car);
        showToast("Rating submitted successfully!");
        document.getElementById("rating-modal").classList.add("hidden");
    } catch (error) {
        console.error("Error submitting rating:", error);
        showToast("Error submitting rating. Try again later!", "error");
    }
});

document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("rating-modal").classList.add("hidden");
});

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

loadUserBookings();
updateNavLinks();
highlightActiveLink();

window.redirectToChat = redirectToChat;
window.cancelBooking = cancelBooking;
window.openRatingModal = openRatingModal;