import { getAllItems, getAllItemsByTimeRange, getItemByKey, updateItem } from "../utils/dbUtils.js";
import { checkAuth, checkAdmin } from "../utils/auth.js";
import { getCookie, setCookie } from "../utils/cookie.js";

const userId = getCookie("userId");
if (!userId) {
    window.location.href = "../views/login.html";
}

const isAdmin = await checkAdmin();
if (!isAdmin) {
    window.location.href = "../views/index.html";
}

let chartInstances = {};

async function initAnalytics() {
    const days = parseInt(document.getElementById("time-range").value, 10);
    const users = await getAllItems("users");
    const cars = await getAllItems("cars");
    const categories = await getAllItems("categories");
    const bookings = await getAllItemsByTimeRange("bookings", "createdAt", days);
    const bids = await getAllItemsByTimeRange("bids", "createdAt", days);
    displayTotals({ users, bookings, bids, cars });
    generateCharts({ bookings, bids, cars, categories, users, days });
    document.getElementById("time-range").addEventListener("change", async (event) => {
        const days = parseInt(event.target.value, 10);
        const filteredBookings = await getAllItemsByTimeRange("bookings", "createdAt", days);
        const filteredBids = await getAllItemsByTimeRange("bids", "createdAt", days);
        displayTotals({ users, bookings: filteredBookings, bids: filteredBids, cars });
        generateCharts({ bookings: filteredBookings, bids: filteredBids, cars, categories, users, days });
    });
}

function displayTotals({ users, bookings, bids, cars }) {
    document.getElementById("totalUsersCount").textContent = users.length;
    document.getElementById("totalBookingsCount").textContent = bookings.length;
    document.getElementById("totalBiddingsCount").textContent = bids.length;
    document.getElementById("totalCarsCount").textContent = cars.length;
    document.getElementById("top3Bidders").textContent = getTop3BiddersText(bids);
}

function getTop3BiddersText(bids) {
    const counts = {};
    bids.forEach(b => counts[b.username] = (counts[b.username] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return sorted.map(c => `${c[0]} (${c[1]})`).join(", ");
}

function generateCharts({ bookings, bids, cars, categories, users, days }) {
    createChart("averageRevenuePerUserChart", "bar", getAverageRevenuePerUser(bookings, bids, users), "Average Revenue Per User");
    createChart("carsPerCategoryChart", "bar", getCarsPerCategory(cars, categories), "Cars Per Category");
    createChart("highestRatedCarCategoryWiseChart", "bar", getHighestRatedCarCategoryWise(cars, categories), "Highest Rated Car Category Wise");
    createChart("bidsPerCategoryChart", "bar", getBidsPerCategory(bids, categories), "Bids Per Category");
    createChart("totalBiddedPricePerCategoryChart", "bar", getTotalBiddedPricePerCategory(bids, categories), "Total Bidded Price Per Category");
    createChart("carsPerCityChart", "pie", getCarsPerCity(cars), "Cars Per City");
    createChart("top3BiddersChart", "bar", getTop3Bidders(bids), "Top 3 Bidders");
    createChart("totalRevenuePerCategoryChart", "bar", getTotalRevenuePerCategory(bookings, bids, categories), "Total Revenue Per Category");
    createChart("totalRevenuePerCityChart", "bar", getTotalRevenuePerCity(bookings, bids, cars), "Total Revenue Per City");
    createChart("bookingsOverTimeChart", "line", getBookingsOverTime(bookings, days), "Bookings Over Time");
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
                    datalabels: type === "pie" || type === "doughnut" || type === "polarArea" ? {
                        color: "#fff",
                        formatter: (value, ctx) => {
                            let sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            let percentage = ((value / sum) * 100).toFixed(1) + "%";
                            return percentage;
                        },
                    } : false
                },

                scales: type === "pie" || type === "doughnut" || type === "polarArea" ? {} : {
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

function getCarsPerCategory(cars, categories) {
    const counts = categories.map(category => ({
        categoryName: category.categoryName,
        count: cars.filter(car => car.categoryId === category.categoryId).length
    }));
    return { labels: counts.map(c => c.categoryName), datasets: [{ label: "Cars", data: counts.map(c => c.count), backgroundColor: "blue" }] };
}

function getHighestRatedCarCategoryWise(cars, categories) {
    const ratings = categories.map(category => ({
        categoryName: category.categoryName,
        rating: Math.max(...cars.filter(car => car.categoryId === category.categoryId).map(car => car.rating || 0))
    }));
    return { labels: ratings.map(r => r.categoryName), datasets: [{ label: "Rating", data: ratings.map(r => r.rating), backgroundColor: "green" }] };
}

function getBidsPerCategory(bids, categories) {
    const counts = categories.map(category => ({
        categoryName: category.categoryName,
        count: bids.filter(bid => bid.categoryId === category.categoryId).length
    }));
    return { labels: counts.map(c => c.categoryName), datasets: [{ label: "Bids", data: counts.map(c => c.count), backgroundColor: "orange" }] };
}

function getTotalBiddedPricePerCategory(bids, categories) {
    const prices = categories.map(category => ({
        categoryName: category.categoryName,
        total: bids.filter(bid => bid.categoryId === category.categoryId).reduce((sum, bid) => sum + bid.bidAmount, 0)
    }));
    return { labels: prices.map(p => p.categoryName), datasets: [{ label: "Total Bidded Price ($)", data: prices.map(p => p.total), backgroundColor: "purple" }] };
}

function getCarsPerCity(cars) {
    const data = {};
    cars.forEach(c => data[c.city] = (data[c.city] || 0) + 1);
    return { labels: Object.keys(data), datasets: [{ label: "Cars", data: Object.values(data), backgroundColor: ["blue", "orange", "yellow", "pink"] }] };
}

function getTop3Bidders(bids) {
    const counts = {};
    bids.forEach(b => counts[b.username] = (counts[b.username] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { labels: sorted.map(c => c[0]), datasets: [{ label: "Bids", data: sorted.map(c => c[1]), backgroundColor: "red" }] };
}

function getLeastBiddedCategory(bids, categories) {
    const counts = categories.map(category => ({
        categoryName: category.categoryName,
        count: bids.filter(bid => bid.categoryId === category.categoryId).length
    }));
    const sorted = counts.sort((a, b) => a.count - b.count).slice(0, 3);
    return { labels: sorted.map(c => c.categoryName), datasets: [{ label: "Bids", data: sorted.map(c => c.count), backgroundColor: "brown" }] };
}

function getLeastBookedCategory(bookings, categories) {
    const counts = categories.map(category => ({
        categoryName: category.categoryName,
        count: bookings.filter(booking => booking.categoryId === category.categoryId).length
    }));
    const sorted = counts.sort((a, b) => a.count - b.count).slice(0, 3);
    return { labels: sorted.map(c => c.categoryName), datasets: [{ label: "Bookings", data: sorted.map(c => c.count), backgroundColor: "pink" }] };
}

function getTotalRevenuePerCategory(bookings, bids, categories) {
    const revenue = categories.map(category => ({
        categoryName: category.categoryName,
        total: bookings.filter(booking => booking.categoryId === category.categoryId).reduce((sum, booking) => sum + booking.bidPrice, 0) +
               bids.filter(bid => bid.categoryId === category.categoryId).reduce((sum, bid) => sum + bid.bidAmount, 0)
    }));
    return { labels: revenue.map(r => r.categoryName), datasets: [{ label: "Total Revenue ($)", data: revenue.map(r => r.total), backgroundColor: "cyan" }] };
}

function getTotalRevenuePerCity(bookings, bids, cars) {
    const revenue = {};
    cars.forEach(car => {
        const carRevenue = bookings.filter(booking => booking.carId === car.carId).reduce((sum, booking) => sum + booking.bidPrice, 0) +
                           bids.filter(bid => bid.carId === car.carId).reduce((sum, bid) => sum + bid.bidAmount, 0);
        if (revenue[car.city]) {
            revenue[car.city] += carRevenue;
        } else {
            revenue[car.city] = carRevenue;
        }
    });
    return { labels: Object.keys(revenue), datasets: [{ label: "Total Revenue ($)", data: Object.values(revenue), backgroundColor: "magenta" }] };
}

function getBookingsOverTime(bookings, days) {
    const counts = {};
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i <= days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        counts[dateString] = 0;
    }

    bookings.forEach(booking => {
        const bookingDate = new Date(booking.createdAt).toISOString().split('T')[0];
        if (counts[bookingDate] !== undefined) {
            counts[bookingDate]++;
        }
    });

    return { labels: Object.keys(counts), datasets: [{ label: "Bookings", data: Object.values(counts), backgroundColor: "blue", borderColor: "blue", fill: false }] };
}

function getAverageRevenuePerUser(bookings, bids, users) {
    const revenue = {};
    bookings.forEach(b => revenue[b.userId] = (revenue[b.userId] || 0) + b.bidPrice);
    bids.forEach(b => revenue[b.userId] = (revenue[b.userId] || 0) + b.bidAmount);
    const userIds = Object.keys(revenue);
    const avgRevenue = userIds.map(userId => revenue[userId]);
    const userNames = userIds.map(userId => users.find(user => user.userId === userId).username);
    return { labels: userNames, datasets: [{ label: "Avg. Revenue ($)", data: avgRevenue, backgroundColor: "green" }] };
}

function logout() {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        const [name] = cookies[i].split("=");
        setCookie(name, "", -1); 
    }
    window.location.href = "../views/index.html";
}

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const logoutLink = document.getElementById('logout-link');

    if (isAuthenticated) {
        logoutLink.style.display = 'block';
    } else {
        logoutLink.style.display = 'none';
    }
}

initAnalytics();
updateNavLinks();
document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});