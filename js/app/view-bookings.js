import { getAllItemsByIndex, getItemByKey, updateItem } from "../utils/dbUtils.js";
import { checkAuth, logout } from "../utils/auth.js";
import { getCookie } from "../utils/cookie.js";

const userId = getCookie("userId");
const user = await getItemByKey("users", userId);
if (!user || user.role !== "owner" || !user.isApproved) {
    alert("Access Denied: You are not authorized to view this page.");
    window.location.href = user.role === "customer" ? "./udashboard.html" : "./login.html";
}

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const myBiddingsLink = document.getElementById('my-biddings-link');
    const loginSignupLink = document.getElementById('login-signup-link');
    const logoutLink = document.getElementById('logout-link');

    if (isAuthenticated) {
        myBiddingsLink.style.display = 'block';
        loginSignupLink.style.display = 'none';
        logoutLink.style.display = 'block';
    } else {
        myBiddingsLink.style.display = 'none';
        loginSignupLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }
}

async function getBookings() {
    try {
        const ownerId = getCookie("userId");
        const ownerBookings = await getAllItemsByIndex("bookings", "ownerId", ownerId);
        return ownerBookings;
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return [];
    }
}

function createBookingCard(booking) {
    const card = document.createElement("div");
    card.className = "car-card";
    const bookingDetails = `
        <div class="car-details">
            <h3 class="car-name">${booking.carName}</h3>
            <div class="car-features">
                <span class="feature">Bid Price: $${booking.bidPrice}</span>
            </div>
            <div class="car-rating">
                <span class="stars">From: ${booking.from}</span>
                <span class="rating-count">To: ${booking.to}</span>
            </div>
            <div class="car-price-city">
                <span class="price">User: ${booking.username}</span>
                <span class="city">Created At: ${new Date(booking.createdAt).toLocaleDateString()}</span>
                <span class="status">${booking.isValid ? 'Active' : 'Cancelled'}</span>
            </div>
            ${booking.isValid ? '<button class="cancel-booking-btn">Cancel Booking</button>' : ''}
        </div>
    `;
    card.innerHTML = bookingDetails;

    if (booking.isValid) {
        const cancelBookingButton = card.querySelector(".cancel-booking-btn");
        cancelBookingButton.addEventListener("click", () => cancelBooking(booking.bookingId));
    }

    return card;
}

async function renderBookings() {
    const bookings = await getBookings();
    const bookingsContainer = document.getElementById("bookings-container");
    bookingsContainer.innerHTML = "";
    if (bookings.length === 0) {
        bookingsContainer.innerHTML = "<p>No bookings found.</p>";
        return;
    }
    bookings.forEach((booking) => {
        const card = createBookingCard(booking);
        bookingsContainer.appendChild(card);
    });
}

async function cancelBooking(bookingId) {
    try {
        const booking = await getItemByKey("bookings", bookingId);
        booking.isValid = false;
        await updateItem("bookings", booking);
        alert(`Cancelled booking with ID: ${bookingId}`);
        renderBookings();
    } catch (error) {
        console.error(`Error cancelling booking with ID: ${bookingId}`, error);
        alert('Failed to cancel booking. Please try again.');
    }
}
renderBookings();
updateNavLinks();
document.addEventListener("DOMContentLoaded", () => {
    if (checkAuth && userId && role == 'owner') {
        
        document.getElementById('logout-link').addEventListener('click', (event) => {
            event.preventDefault();
            logout();
        });

    }
    else {
        window.location.href = "./index.html";
    }
});