import { getAllItems, getItemByKey, getAllItemsByIndex, getItemsByTimeRange } from "../../../js/utils/dbUtils.js";
import { checkAuth } from "../../../js/utils/auth.js";
import { getCookie,setCookie } from "../../../js/utils/cookie.js";

const userId = getCookie("userId");

if(!userId){
    window.location.href="../../index.html";
}
const user = await getItemByKey("users", userId);
if (!user || user.role !== "owner" || !user.isApproved) {
    window.location.href = user.role === "customer" ? "../../user-dashboard/udashboard.html" : "../../login/login.html";
}

let chartInstances = {};
let chartData = {};

async function initAnalytics() {
    const userId = getCookie("userId");
    const days = parseInt(document.getElementById("time-range").value, 10);
    const bookings = await getItemsByTimeRange("bookings", "ownerId", userId, days);
    const bids = await getItemsByTimeRange("bids", "ownerId", userId, days);
    const cars = await getAllItemsByIndex("cars", "ownerId", userId);
    chartData = { bookings, bids, cars };
    displayTotals(chartData);
    setupLazyLoading();
    document.getElementById("time-range").addEventListener("change", async (event) => {
        const days = parseInt(event.target.value, 10);
        const filteredBookings = await getItemsByTimeRange("bookings", "ownerId", userId, days);
        const filteredBids = await getItemsByTimeRange("bids", "ownerId", userId, days);
        chartData = { bookings: filteredBookings, bids: filteredBids, cars };
        displayTotals(chartData);
        setupLazyLoading();
    });
}

function displayTotals({ bookings, bids, cars }) {
    document.getElementById("totalCarsCount").textContent = cars.length;
    document.getElementById("totalBiddingsCount").textContent = bids.length;
    document.getElementById("totalBookingsCount").textContent = bookings.length;
}

function setupLazyLoading() {
    const chartContainers = document.querySelectorAll(".chart-container");
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const canvas = entry.target.querySelector("canvas");
                const chartId = canvas.getAttribute("data-chart");
                generateChart(chartId, chartData);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    chartContainers.forEach(container => observer.observe(container));
}

function generateChart(chartId, data) {
    switch (chartId) {
        case "topBookedCarsChart":
            createChart(chartId, "bar", getTopBookedCars(data.bookings), "Top Booked Cars");
            break;
        case "bookingsOverTimeChart":
            createChart(chartId, "line", getBookingsOverTime(data.bookings), "Bookings Over Time");
            break;
        case "bookingRevenueChart":
            createChart(chartId, "bar", getRevenueOverMonths(data.bookings), "Booking Revenue Over Months");
            break;
        case "bidAmountOverTimeChart":
            createChart(chartId, "line", getBidAmountOverTime(data.bids), "Bid Amount Over Time");
            break;
        case "bidAcceptanceRateChart":
            createChart(chartId, "doughnut", getBidAcceptanceRate(data.bids), "Bid Acceptance Rate");
            break;
        case "carsPerCityChart":
            createChart(chartId, "pie", getCarsPerCity(data.cars), "Cars Per City");
            break;
        case "bidsVsBookingsChart":
            createChart(chartId, "bar", getBidsVsBookings(data.bids, data.bookings), "Bids vs Bookings");
            break;
        case "popularCarCategoriesChart":
            createChart(chartId, "bar", getPopularCarCategories(data.cars), "Popular Car Categories");
            break;
        case "avgBidAmountChart":
            createChart(chartId, "bar", getAvgBidAmountPerCar(data.bids), "Average Bid Amount Per Car");
            break;
        case "mostActiveRentersChart":
            createChart(chartId, "bar", getMostActiveRenters(data.bookings), "Frequently Booking Users");
            break;
        case "totalRevenueOverTimeChart":
            createChart(chartId, "line", getTotalRevenueOverTime(data.bookings, data.bids), "Total Revenue Over Time");
            break;
        case "avgRevenuePerCarChart":
            createChart(chartId, "bar", getAvgRevenuePerCar(data.bookings), "Average Revenue Per Car");
            break;
        case "revenueByRentalTypeChart":
            createChart(chartId, "bar", getRevenueByRentalType(data.bookings), "Revenue by Rental Type");
            break;
        case "avgRentalDurationChart":
            createChart(chartId, "bar", getAvgRentalDuration(data.bookings), "Average Rental Duration");
            break;
        case "popularRentalTypeChart":
            createChart(chartId, "pie", getPopularRentalType(data.bookings), "Most Popular Rental Type");
            break;
        case "revenueByCityChart":
            createChart(chartId, "bar", getRevenueByCity(data.bookings), "Revenue by City");
            break;
        case "carUtilizationRateChart":
            createChart(chartId, "bar", getCarUtilizationRate(data.bookings, data.cars), "Car Utilization Rate");
            break;
        default:
            console.error(`Unknown chart ID: ${chartId}`);
    }
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
    bookings.forEach(b => counts[b.bid.car.carName] = (counts[b.bid.car.carName] || 0) + 1);
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
        revenue[month] = (revenue[month] || 0) + b.bid.bidAmount;
    });
    return { labels: Object.keys(revenue), datasets: [{ label: "Revenue (₹)", data: Object.values(revenue), backgroundColor: "purple" }] };
}

function getBidAmountOverTime(bids) {
    const amounts = {};
    bids.forEach(b => {
        const date = new Date(b.createdAt).toISOString().split("T")[0];
        amounts[date] = (amounts[date] || 0) + b.bidAmount;
    });
    return { labels: Object.keys(amounts), datasets: [{ label: "Bid Amount ($)", data: Object.values(amounts), borderColor: "red", fill: false }] };
}

function getBidsVsBookings(bids, bookings) {
    return { labels: ["Bids", "Bookings"], datasets: [{ label: "Count", data: [bids.length, bookings.length], backgroundColor: ["blue", "green"] }] };
}

function getPopularCarCategories(cars) {
    const data = {};
    cars.forEach(c => data[c.category.categoryName] = (data[c.category.categoryName] || 0) + 1);
    return { labels: Object.keys(data), datasets: [{ label: "Cars", data: Object.values(data), backgroundColor: "orange" }] };
}

function getAvgBidAmountPerCar(bids) {
    const data = {};
    bids.forEach(b => {
        data[b.car.carName] = data[b.car.carName] || { total: 0, count: 0 };
        data[b.car.carName].total += b.bidAmount;
        data[b.car.carName].count += 1;
    });

    const carNames = Object.keys(data);
    const avgBids = carNames.map(c => data[c].total / data[c].count);

    return { labels: carNames, datasets: [{ label: "Avg. Bid Amount ($)", data: avgBids, backgroundColor: "brown" }] };
}

function getMostActiveRenters(bookings) {
    const data = {};
    bookings.forEach(b => data[b.bid.user.username] = (data[b.bid.user.username] || 0) + 1);

    return { labels: Object.keys(data), datasets: [{ label: "Bookings", data: Object.values(data), backgroundColor: "pink" }] };
}

function getTotalRevenueOverTime(bookings, bids) {
    const revenue = {};
    bookings.forEach(b => {
        const date = new Date(b.createdAt).toISOString().split("T")[0];
        revenue[date] = (revenue[date] || 0) + b.bid.bidAmount;
    });
    bids.forEach(b => {
        const date = new Date(b.createdAt).toISOString().split("T")[0];
        revenue[date] = (revenue[date] || 0) + b.bidAmount;
    });
    return { labels: Object.keys(revenue), datasets: [{ label: "Revenue (₹)", data: Object.values(revenue), borderColor: "blue", fill: false }] };
}

function getAvgRevenuePerCar(bookings) {
    const revenue = {};
    bookings.forEach(b => {
        revenue[b.bid.car.carName] = (revenue[b.bid.car.carName] || 0) + b.bid.bidAmount;
    });
    const carNames = Object.keys(revenue);
    const avgRevenue = carNames.map(car => revenue[car]);
    return { labels: carNames, datasets: [{ label: "Avg. Revenue (₹)", data: avgRevenue, backgroundColor: "green" }] };
}

function getRevenueByRentalType(bookings) {
    const revenue = { local: 0, outstation: 0 };
    bookings.forEach(b => {
        if (b.rentalType === "local") {
            revenue.local += b.bid.bidAmount;
        } else if (b.rentalType === "outstation") {
            revenue.outstation += b.bid.bidAmount;
        }
    });
    return { labels: ["Local", "Outstation"], datasets: [{ label: "Revenue (₹)", data: [revenue.local, revenue.outstation], backgroundColor: ["blue", "green"] }] };
}

function getAvgRentalDuration(bookings) {
    const durations = { local: 0, outstation: 0 };
    const counts = { local: 0, outstation: 0 };
    bookings.forEach(b => {
        const fromDate = new Date(b.fromTimestamp);
        const toDate = new Date(b.toTimestamp);
        const diffTime = Math.abs(toDate - fromDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (b.rentalType === "local") {
            durations.local += diffDays;
            counts.local += 1;
        } else if (b.rentalType === "outstation") {
            durations.outstation += diffDays;
            counts.outstation += 1;
        }
    });
    return { labels: ["Local", "Outstation"], datasets: [{ label: "Avg. Duration (days)", data: [durations.local / counts.local, durations.outstation / counts.outstation], backgroundColor: ["purple", "orange"] }] };
}

function getPopularRentalType(bookings) {
    const counts = { local: 0, outstation: 0 };
    bookings.forEach(b => {
        if (b.rentalType === "local") {
            counts.local += 1;
        } else if (b.rentalType === "outstation") {
            counts.outstation += 1;
        }
    });
    return { labels: ["Local", "Outstation"], datasets: [{ label: "Count", data: [counts.local, counts.outstation], backgroundColor: ["blue", "green"] }] };
}

function getRevenueByCity(bookings) {
    const revenue = {};
    bookings.forEach(b => {
        const city = b.bid.car.city;
        revenue[city] = (revenue[city] || 0) + b.bid.bidAmount;
    });
    return { labels: Object.keys(revenue), datasets: [{ label: "Revenue (₹)", data: Object.values(revenue), backgroundColor: "red" }] };
}

function getCarUtilizationRate(bookings, cars) {
    const utilization = {};
    cars.forEach(car => {
        utilization[car.carName] = { totalDays: 0, bookedDays: 0 };
    });
    bookings.forEach(b => {
        const carName = b.bid.car.carName;
        const fromDate = new Date(b.fromTimestamp);
        const toDate = new Date(b.toTimestamp);
        const diffTime = Math.abs(toDate - fromDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        utilization[carName].bookedDays += diffDays;
    });
    cars.forEach(car => {
        const createdAt = new Date(car.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - createdAt);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        utilization[car.carName].totalDays = diffDays;
    });
    const carNames = Object.keys(utilization);
    const utilizationRates = carNames.map(car => (utilization[car].bookedDays / utilization[car].totalDays) * 100);
    return { labels: carNames, datasets: [{ label: "Utilization Rate (%)", data: utilizationRates, backgroundColor: "yellow" }] };
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

function getBidAcceptanceRate(bids) {
    const total = bids.length;
    const accepted = bids.filter(b => b.status === "accepted").length;
    return { labels: ["Accepted", "Rejected"], datasets: [{ data: [accepted, total - accepted], backgroundColor: ["green", "red"] }] };
}

function getCarsPerCity(cars) {
    const data = {};
    cars.forEach(c => data[c.city] = (data[c.city] || 0) + 1);
    return { labels: Object.keys(data), datasets: [{ label: "Cars", data: Object.values(data), backgroundColor: ["blue", "orange", "yellow", "pink"] }] };
}

function logout() {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        const [name] = cookies[i].split("=");
        setCookie(name, "", -1); 
    }
    window.location.href = "../../index.html";
}

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

highlightActiveLink();
initAnalytics();
updateNavLinks();


