import { getAllItemsByIndex, getItemByKey, updateItem, addItem, getAllItems } from "../../js/utils/dbUtils.js";
import { checkAuth, getUser, checkOwnerApproved } from "../../js/utils/auth.js";
import { getCookie,setCookie } from "../../js/utils/cookie.js";
import { generateRandomId } from "../../js/utils/generateId.js";

function logout() {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        const [name] = cookies[i].split("=");
        setCookie(name, "", -1); 
    }
    window.location.href = "../index.html";
}

const userId = getCookie("userId");
if (!userId) {
    window.location.href = "../login/login.html";
}

const user = await getItemByKey("users", userId);

if (!user || user.role !== "owner" || !user.isApproved) {
    alert("Access Denied: You are not authorized to view this page.");
    window.location.href = user.role === "customer" ? "../user-dashboard/udashboard.html" : "../login/login.html";
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

function calculateTotalAmount(bid, fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

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

function isDateRangeOverlap(startDate1, endDate1, startDate2, endDate2) {
    return (startDate1 <= endDate2 && endDate1 >= startDate2);
}

async function getPendingBids() {
    const bids = await getAllItems("bids");
    return bids.filter(bid => bid.status.toLowerCase() === "pending" && bid.car.owner.userId === userId);
}

async function acceptBid(acceptedBid) {
    try {
        const bids = await getPendingBids();

        const overlappingBids = bids.filter(bid =>
            bid.car.carId === acceptedBid.car.carId &&
            bid.bidId !== acceptedBid.bidId &&
            isDateRangeOverlap(new Date(bid.fromTimestamp), new Date(bid.toTimestamp), new Date(acceptedBid.fromTimestamp), new Date(acceptedBid.toTimestamp))
        );

        acceptedBid.status = "accepted";
        await updateItem("bids", acceptedBid);

        for (const bid of overlappingBids) {
            bid.status = "rejected";
            await updateItem("bids", bid);
        }

        const totalFare = calculateTotalAmount(acceptedBid, acceptedBid.fromTimestamp, acceptedBid.toTimestamp);

        const booking = {
            bookingId: generateRandomId(),
            fromTimestamp: acceptedBid.fromTimestamp,
            toTimestamp: acceptedBid.toTimestamp,
            status: "confirmed",
            createdAt: new Date().toISOString(),
            rentalType: acceptedBid.rentalType,
            bid: {
                bidId: acceptedBid.bidId,
                fromTimestamp: acceptedBid.fromTimestamp,
                toTimestamp: acceptedBid.toTimestamp,
                status: acceptedBid.status,
                createdAt: acceptedBid.createdAt,
                bidAmount: acceptedBid.bidAmount,
                rentalType: acceptedBid.rentalType,
                bidBaseFare: acceptedBid.bidBaseFare,
                user: {
                    userId: acceptedBid.user.userId,
                    username: acceptedBid.user.username,
                    email: acceptedBid.user.email,
                    role: acceptedBid.user.role,
                    paymentPreference: acceptedBid.user.paymentPreference,
                    avgRating: acceptedBid.user.avgRating,
                    ratingCount: acceptedBid.user.ratingCount
                },
                car: {
                    carId: acceptedBid.car.carId,
                    carName: acceptedBid.car.carName,
                    carType: acceptedBid.car.carType,
                    city: acceptedBid.car.city,
                    createdAt: acceptedBid.car.createdAt,
                    description: acceptedBid.car.description,
                    isAvailableForLocal: acceptedBid.car.isAvailableForLocal,
                    isAvailableForOutstation: acceptedBid.car.isAvailableForOutstation,
                    avgRating: acceptedBid.car.avgRating,
                    ratingCount: acceptedBid.car.ratingCount,
                    images: acceptedBid.car.images,
                    featured: acceptedBid.car.featured,
                    category: {
                        categoryId: acceptedBid.car.category.categoryId,
                        categoryName: acceptedBid.car.category.categoryName
                    },
                    owner: {
                        userId: acceptedBid.car.owner.userId,
                        username: acceptedBid.car.owner.username,
                        email: acceptedBid.car.owner.email,
                        role: acceptedBid.car.owner.role,
                        isApproved: acceptedBid.car.owner.isApproved,
                        avgRating: acceptedBid.car.owner.avgRating,
                        ratingCount: acceptedBid.car.owner.ratingCount,
                        paymentPreference: acceptedBid.car.owner.paymentPreference
                    },
                    rentalOptions: acceptedBid.car.rentalOptions
                }
            },
            baseFare: acceptedBid.bidBaseFare,
            extraKmCharges: 0,
            extraHourCharges: 0,
            totalFare: totalFare.toFixed(2) // Calculated total fare
        };

        await addItem("bookings", booking);

        const carAvailability = {
            carId: acceptedBid.car.carId,
            fromTimestamp: new Date(acceptedBid.fromTimestamp),
            toTimestamp: new Date(acceptedBid.toTimestamp)
        };
        await addItem("carAvailability", carAvailability);

        alert(`Accepted bid`);
        await fetchData();
    } catch (error) {
        console.error(`Error accepting bid with ID: ${acceptedBid.bidId}`, error);
        alert('Failed to accept bid. Please try again.');
    }
}

async function rejectBid(bidId) {
    try {
        const bid = await getItemByKey("bids", bidId);
        bid.status = "rejected";
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
    bookings = await getAllItems("bookings");
    bookings = bookings.filter(booking => booking.bid.car.owner.userId === userId);
    allBids = await getAllItems("bids");
    allBids = allBids.filter(bid => bid.car.owner.userId === userId); // Filter bids by owner userId

    renderPendingBids();
    renderBookings();
    renderAllBids();
}

async function renderPendingBids() {
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
        const totalAmount = calculateTotalAmount(bid, bid.fromTimestamp, bid.toTimestamp);
        const rentalTypeLabel = bid.rentalType === "local" ? "Local" : "Outstation";
        const row = `<tr>
            <td>${bid.car.carName}</td>
            <td>$${bid.bidAmount}</td>
            <td>$${totalAmount.toFixed(2)}</td>
            <td>${bid.user.username}</td>
            <td>${bid.fromTimestamp}</td>
            <td>${bid.toTimestamp}</td>
            <td>${rentalTypeLabel}</td>
            <td class="action-buttons">
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
    togglePaginationButtons("pending-pagination", currentPendingPage, pendingBids.length);
}

async function renderBookings() {
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
        const totalAmount = booking.totalFare ? parseFloat(booking.totalFare) : calculateTotalAmount(booking.bid, booking.fromTimestamp, booking.toTimestamp);
        const rentalTypeLabel = booking.rentalType === "local" ? "Local" : "Outstation";
        const row = `<tr>
            <td>${booking.bid.car.carName}</td>
            <td>₹${booking.baseFare}</td>
            <td>₹${totalAmount.toFixed(2)}</td>
            <td>${booking.bid.user.username}</td>
            <td>${booking.fromTimestamp}</td>
            <td>${booking.toTimestamp}</td>
            <td>${new Date(booking.createdAt).toLocaleDateString()}</td>
            <td>${rentalTypeLabel}</td>
            <td>${isBookingOver(booking.toTimestamp) ? renderExtraChargesButton(booking.bookingId) : '-'}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    document.querySelectorAll(".extra-charges-btn").forEach(button => {
        button.addEventListener("click", () => {
            const bookingId = button.getAttribute("data-booking-id");
            const booking = bookings.find(b => b.bookingId === bookingId);
            document.getElementById("extra-charges-modal").style.display = "block";
            document.getElementById("extra-charges-form").setAttribute("data-booking-id", bookingId);
            if (booking.rentalType === "local") {
                document.getElementById("extraKmField").classList.remove("hidden");
                document.getElementById("extraHoursField").classList.remove("hidden");
                document.getElementById("extraDaysField").classList.add("hidden");
            } else if (booking.rentalType === "outstation") {
                document.getElementById("extraKmField").classList.remove("hidden");
                document.getElementById("extraHoursField").classList.add("hidden");
                document.getElementById("extraDaysField").classList.remove("hidden");
            }
        });
    });

    togglePaginationButtons("bookings-pagination", currentBookingsPage, bookings.length);
    document.getElementById("bookings-page-info").textContent = `Page ${currentBookingsPage} of ${Math.ceil(bookings.length / itemsPerPage)}`;
}

async function renderAllBids() {
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
        const totalAmount = calculateTotalAmount(bid, bid.fromTimestamp, bid.toTimestamp);
        const rentalTypeLabel = bid.rentalType === "local" ? "Local" : "Outstation";
        const row = `<tr>
            <td>${bid.car.carName}</td>
            <td>$${bid.bidAmount}</td>
            <td>$${totalAmount.toFixed(2)}</td>
            <td>${bid.user.username}</td>
            <td>${bid.fromTimestamp}</td>
            <td>${bid.toTimestamp}</td>
            <td>${rentalTypeLabel}</td>
            <td>${bid.status}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    document.getElementById("all-bids-page-info").textContent = `Page ${currentAllBidsPage} of ${Math.ceil(allBids.length / itemsPerPage)}`;
    togglePaginationButtons("all-bids-pagination", currentAllBidsPage, allBids.length);
}

function togglePaginationButtons(paginationId, currentPage, totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationControls = document.getElementById(paginationId);
    const prevButton = paginationControls.querySelector("button:first-child");
    const nextButton = paginationControls.querySelector("button:last-child");

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;

    if (totalPages <= 1) {
        paginationControls.classList.add("hidden");
    } else {
        paginationControls.classList.remove("hidden");
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
document.getElementById("rental-type-sort-bookings").addEventListener("change", async (event) => {
    const rentalType = event.target.value.toLowerCase();
    if (rentalType === "all") {
        bookings = await getAllItemsByIndex("bookings", "ownerId", userId);
    } else {
        bookings = await getAllItemsByIndex("bookings", "ownerId", userId);
        bookings = bookings.filter(booking => booking.rentalType.toLowerCase() === rentalType);
    }
    currentBookingsPage = 1;
    renderBookings();
});

document.getElementById("rental-type-sort-pending").addEventListener("change", async (event) => {
    const rentalType = event.target.value.toLowerCase();
    if (rentalType === "all") {
        pendingBids = await getPendingBids();
    } else {
        pendingBids = await getPendingBids();
        pendingBids = pendingBids.filter(bid => bid.rentalType.toLowerCase() === rentalType);
    }
    currentPendingPage = 1;
    renderPendingBids();
});

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

function isBookingOver(toDate) {
    const now = new Date();
    return new Date(toDate) < now;
}

function renderExtraChargesButton(bookingId) {
    return `<button class="extra-charges-btn" data-booking-id="${bookingId}">Add Extra Charges</button>`;
}

async function updateFare(bookingId) {
    const booking = bookings.find(b => b.bookingId === bookingId);
    const extraKm = parseFloat(document.getElementById("extraKm").value) || 0;
    const extraHours = parseFloat(document.getElementById("extraHours").value) || 0;
    const extraDays = parseFloat(document.getElementById("extraDays").value) || 0;

    console.log("extraKm:", extraKm);
    console.log("extraHours:", extraHours);
    console.log("extraDays:", extraDays);

    let extraDayCharges = 0;

    if (booking.rentalType === "local") {
        const maxKmLimit = booking.bid.car.rentalOptions.local.maxKmPerHour * extraHours;
        booking.extraKmCharges = extraKm > maxKmLimit ? (extraKm - maxKmLimit) * booking.bid.car.rentalOptions.local.extraKmRate : 0;
        booking.extraHourCharges = extraHours * booking.bid.car.rentalOptions.local.extraHourRate;
    } else if (booking.rentalType === "outstation") {
        booking.extraKmCharges = extraKm * booking.bid.car.rentalOptions.outstation.extraKmRate;
        if (extraHours < 8) {
            booking.extraHourCharges = extraHours * booking.bid.car.rentalOptions.outstation.extraHourlyRate;
        } else {
            booking.extraHourCharges = 0;
            extraDayCharges = extraDays * booking.bid.car.rentalOptions.outstation.extraDayRate;
        }

        // Calculate extra km charges if the user exceeds the maxKmLimitPerDay
        const from = new Date(booking.fromTimestamp);
        const to = new Date(booking.toTimestamp);
        const diffTime = Math.abs(to - from);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const maxKmLimit = booking.bid.car.rentalOptions.outstation.maxKmLimitPerDay * diffDays;
        if (extraKm > maxKmLimit) {
            booking.extraKmCharges += (extraKm - maxKmLimit) * booking.bid.car.rentalOptions.outstation.extraKmRate;
        }
    }

    console.log("extraKmCharges:", booking.extraKmCharges);
    console.log("extraHourCharges:", booking.extraHourCharges);
    console.log("extraDayCharges:", extraDayCharges);

    const baseFare = calculateTotalAmount(booking.bid, booking.fromTimestamp, booking.toTimestamp);
    console.log("baseFare:", baseFare);

    booking.totalFare = baseFare + (booking.extraKmCharges || 0) + (booking.extraHourCharges || 0) + extraDayCharges;
    console.log("totalFare:", booking.totalFare);

    // Ensure all required fields are present and correctly formatted
    const updatedBooking = {
        bookingId: booking.bookingId,
        fromTimestamp: booking.fromTimestamp,
        toTimestamp: booking.toTimestamp,
        status: booking.status,
        createdAt: booking.createdAt,
        rentalType: booking.rentalType,
        bid: booking.bid,
        baseFare: booking.baseFare,
        extraKmCharges: booking.extraKmCharges || 0,
        extraHourCharges: booking.extraHourCharges || 0,
        totalFare: booking.totalFare
    };

    await updateItem("bookings", updatedBooking);
    alert(`Total fare updated to $${booking.totalFare.toFixed(2)}`);
    await fetchData();
}

document.getElementById("extra-charges-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const bookingId = event.target.getAttribute("data-booking-id");
    await updateFare(bookingId);
    document.getElementById("extra-charges-modal").style.display = "none";
});

document.querySelector(".close").addEventListener("click", () => {
    document.getElementById("extra-charges-modal").style.display = "none";
});

highlightActiveLink();
fetchData();
updateNavLinks();


