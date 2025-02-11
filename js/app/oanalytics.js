import { getAllItems, getItemByKey, getAllItemsByIndex, getItemsByTimeRange } from "../utils/dbUtils.js";
import { checkAuth, logout } from "../utils/auth.js";
import { getCookie } from "../utils/cookie.js";

const userId = getCookie("userId");
const user = await getItemByKey("users", userId);
if (!user || user.role !== "owner" || !user.isApproved) {
    window.location.href = user.role === "customer" ? "./udashboard.html" : "./login.html";
}

let chartInstances = {};

async function initAnalytics() {
    const userId = getCookie("userId");
    const days = parseInt(document.getElementById("time-range").value, 10);
    const bookings = await getItemsByTimeRange("bookings", "ownerId", userId, days);
    const bids = await getItemsByTimeRange("bids", "ownerId", userId, days);
    const cars = await getAllItemsByIndex("cars", "ownerId", userId);
    displayTotals({ bookings, bids, cars });
    generateCharts({ bookings, bids, cars });
    document.getElementById("time-range").addEventListener("change", async (event) => {
        const days = parseInt(event.target.value, 10);
        const filteredBookings = await getItemsByTimeRange("bookings", "ownerId", userId, days);
        const filteredBids = await getItemsByTimeRange("bids", "ownerId", userId, days);
        displayTotals({ bookings: filteredBookings, bids: filteredBids, cars });
        generateCharts({ bookings: filteredBookings, bids: filteredBids, cars });
    });
}

function displayTotals({ bookings, bids, cars }) {
    document.getElementById("totalCarsCount").textContent = cars.length;
    document.getElementById("totalBiddingsCount").textContent = bids.length;
    document.getElementById("totalBookingsCount").textContent = bookings.length;
}

function generateCharts({ bookings, bids, cars }) {
    createChart("topBookedCarsChart", "bar", getTopBookedCars(bookings), "Top Booked Cars");
    createChart("bookingsOverTimeChart", "line", getBookingsOverTime(bookings), "Bookings Over Time");
    createChart("bookingRevenueChart", "bar", getRevenueOverMonths(bookings), "Booking Revenue Over Months");
    createChart("bidAmountOverTimeChart", "line", getBidAmountOverTime(bids), "Bid Amount Over Time");
    createChart("bidAcceptanceRateChart", "doughnut", getBidAcceptanceRate(bids), "Bid Acceptance Rate");
    createChart("carsPerCityChart", "pie", getCarsPerCity(cars), "Cars Per City");
    createChart("bidsVsBookingsChart", "bar", getBidsVsBookings(bids, bookings), "Bids vs Bookings");
    createChart("popularCarCategoriesChart", "bar", getPopularCarCategories(cars), "Popular Car Categories");
    createChart("avgBidAmountChart", "bar", getAvgBidAmountPerCar(bids), "Average Bid Amount Per Car");
    createChart("mostActiveRentersChart", "bar", getMostActiveRenters(bookings), "Frequently Booking Users");
    createChart("totalRevenueOverTimeChart", "line", getTotalRevenueOverTime(bookings, bids), "Total Revenue Over Time");
    createChart("avgRevenuePerCarChart", "bar", getAvgRevenuePerCar(bookings), "Average Revenue Per Car");
    
}

function createChart(id, type, data, title) {
    const ctx = document.getElementById(id).getContext("2d");

    if (chartInstances[id]) {
        chartInstances[id].data = data;
        chartInstances[id].update();
    } else {
        chartInstances[id] = new Chart(ctx, {
            type,
            data,
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "top" },
                    title: { display: true, text: title },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function (tooltipItem) {
                                let value = tooltipItem.raw;
                                let total = tooltipItem.dataset.data.reduce((a, b) => a + b, 0);
                                let percentage = ((value / total) * 100).toFixed(1) + "%";
                                return `${tooltipItem.label}: ${value} (${percentage})`;
                            },
                        },
                    },
                    datalabels: type === "pie" || type === "doughnut" ? {
                        color: "#fff",
                        formatter: (value, ctx) => {
                            let sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            let percentage = ((value / sum) * 100).toFixed(1) + "%";
                            return percentage;
                        },
                    } : false
                },

                scales: type === "pie" || type === "doughnut" ? {} : {
                    x: { grid: { display: false } },
                    y: {
                        grid: { display: true, color: "rgba(200,200,200,0.2)" },
                        ticks: { beginAtZero: true, stepSize: 1, precision: 0 },
                    },
                },
                scales: type === "bar" ? {
                    x: { grid: { display: false }, barPercentage: 0.5, categoryPercentage: 0.6 },
                    y: {
                        grid: { display: true, color: "rgba(200,200,200,0.2)" },
                        ticks: { beginAtZero: true, stepSize: 1, precision: 0 },
                    },
                } : {}
            },
        });
    }
}

function getTopBookedCars(bookings) {
    const counts = {};
    bookings.forEach(b => counts[b.carName] = (counts[b.carName] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { labels: sorted.map(c => c[0]), datasets: [{ label: "Bookings", data: sorted.map(c => c[1]), backgroundColor: "blue" }] };
}

function getBookingsOverTime(bookings) {
    const counts = {};
    bookings.forEach(b => {
        const date = new Date(b.createdAt).toISOString().split("T")[0];
        counts[date] = (counts[date] || 0) + 1;
    });
    return { labels: Object.keys(counts), datasets: [{ label: "Bookings", data: Object.values(counts), borderColor: "green", fill: false }] };
}

function getRevenueOverMonths(bookings) {
    const revenue = {};
    bookings.forEach(b => {
        const month = new Date(b.createdAt).toISOString().slice(0, 7);
        revenue[month] = (revenue[month] || 0) + b.bidPrice;
    });
    return { labels: Object.keys(revenue), datasets: [{ label: "Revenue ($)", data: Object.values(revenue), backgroundColor: "purple" }] };
}

function getBidAmountOverTime(bids) {
    const amounts = {};
    bids.forEach(b => {
        const date = new Date(b.createdAt).toISOString().split("T")[0];
        amounts[date] = (amounts[date] || 0) + b.bidAmount;
    });
    return { labels: Object.keys(amounts), datasets: [{ label: "Bid Amount ($)", data: Object.values(amounts), borderColor: "red", fill: false }] };
}

function getBidAcceptanceRate(bids) {
    const total = bids.length;
    const accepted = bids.filter(b => b.status === "Accepted").length;
    return { labels: ["Accepted", "Rejected"], datasets: [{ data: [accepted, total - accepted], backgroundColor: ["green", "red"] }] };
}

function getCarsPerCity(cars) {
    const data = {};
    cars.forEach(c => data[c.city] = (data[c.city] || 0) + 1);
    return { labels: Object.keys(data), datasets: [{ label: "Cars", data: Object.values(data), backgroundColor: ["blue", "orange", "yellow", "pink"] }] };
}

function getBidsVsBookings(bids, bookings) {
    return { labels: ["Bids", "Bookings"], datasets: [{ label: "Count", data: [bids.length, bookings.length], backgroundColor: ["blue", "green"] }] };
}

function getPopularCarCategories(cars) {
    const data = {};
    cars.forEach(c => data[c.categoryName] = (data[c.categoryName] || 0) + 1);
    return { labels: Object.keys(data), datasets: [{ label: "Cars", data: Object.values(data), backgroundColor: "orange" }] };
}

function getAvgBidAmountPerCar(bids) {
    const data = {};
    bids.forEach(b => {
        data[b.carName] = data[b.carName] || { total: 0, count: 0 };
        data[b.carName].total += b.bidAmount;
        data[b.carName].count += 1;
    });

    const carNames = Object.keys(data);
    const avgBids = carNames.map(c => data[c].total / data[c].count);

    return { labels: carNames, datasets: [{ label: "Avg. Bid Amount ($)", data: avgBids, backgroundColor: "brown" }] };
}

function getMostActiveRenters(bookings) {
    const data = {};
    bookings.forEach(b => data[b.username] = (data[b.username] || 0) + 1);

    return { labels: Object.keys(data), datasets: [{ label: "Bookings", data: Object.values(data), backgroundColor: "pink" }] };
}

function getTotalRevenueOverTime(bookings, bids) {
    const revenue = {};
    bookings.forEach(b => {
        const date = new Date(b.createdAt).toISOString().split("T")[0];
        revenue[date] = (revenue[date] || 0) + b.bidPrice;
    });
    bids.forEach(b => {
        const date = new Date(b.createdAt).toISOString().split("T")[0];
        revenue[date] = (revenue[date] || 0) + b.bidAmount;
    });
    return { labels: Object.keys(revenue), datasets: [{ label: "Revenue ($)", data: Object.values(revenue), borderColor: "blue", fill: false }] };
}

function getAvgRevenuePerCar(bookings) {
    const revenue = {};
    bookings.forEach(b => {
        revenue[b.carName] = (revenue[b.carName] || 0) + b.bidPrice;
    });
    const carNames = Object.keys(revenue);
    const avgRevenue = carNames.map(car => revenue[car]);
    return { labels: carNames, datasets: [{ label: "Avg. Revenue ($)", data: avgRevenue, backgroundColor: "green" }] };
}

function getTotalBookings(bookings) {
    return { labels: ["Total Bookings"], datasets: [{ data: [bookings.length], backgroundColor: ["purple"] }] };
}

function getTotalBiddings(bids) {
    return { labels: ["Total Biddings"], datasets: [{ data: [bids.length], backgroundColor: ["orange"] }] };
}

function getTotalCars(cars) {
    return { labels: ["Total Cars"], datasets: [{ data: [cars.length], backgroundColor: ["red"] }] };
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

    } else {
        userDashboard.style.display = 'none';

        logoutLink.style.display = 'none';
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

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

highlightActiveLink();
initAnalytics();
updateNavLinks();


