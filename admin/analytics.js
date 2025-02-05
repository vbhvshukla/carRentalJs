import { getTotalItems, getAllItems, getItemByKey } from "../js/utils/dbUtils.js";
import { checkAuth, logout } from "../js/utils/auth.js";

async function getHighestBid() {
    const bids = await getAllItems("bids");
    if (bids.length === 0) return 0;
    return Math.max(...bids.map(bid => bid.bidAmount));
}

async function getMostPopularCarByBids() {
    const bids = await getAllItems("bids");
    if (bids.length === 0) return "N/A";
    const carBids = bids.reduce((acc, bid) => {
        acc[bid.carId] = (acc[bid.carId] || 0) + 1;
        return acc;
    }, {});
    const mostPopularCarId = Object.keys(carBids).reduce((a, b) => carBids[a] > carBids[b] ? a : b);
    const car = await getItemByKey("cars", mostPopularCarId);
    return car ? car.carName : "N/A";
}

async function getMostPopularUserByRating() {
    const users = await getAllItems("users");
    if (users.length === 0) return "N/A";
    const mostPopularUser = users.reduce((a, b) => (a.avgRating || 0) > (b.avgRating || 0) ? a : b);
    return mostPopularUser.username;
}

async function getMostPopularCategory() {
    const categories = await getAllItems("categories");
    if (categories.length === 0) return "N/A";
    const cars = await getAllItems("cars");
    const categoryCounts = cars.reduce((acc, car) => {
        acc[car.categoryId] = (acc[car.categoryId] || 0) + 1;
        return acc;
    }, {});
    const mostPopularCategoryId = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b);
    const category = await getItemByKey("categories", mostPopularCategoryId);
    return category ? category.categoryName : "N/A";
}

async function getAverageBidPrice() {
    const bids = await getAllItems("bids");
    if (bids.length === 0) return 0;
    const totalBidPrice = bids.reduce((acc, bid) => acc + bid.bidAmount, 0);
    return (totalBidPrice / bids.length).toFixed(2);
}

async function getTotalUsers() {
    return await getTotalItems("users");
}

async function getTotalCars() {
    return await getTotalItems("cars");
}

async function getTotalCategories() {
    return await getTotalItems("categories");
}

async function getTotalBookings() {
    return await getTotalItems("bookings");
}

async function getTotalMessages() {
    return await getTotalItems("messages");
}

async function loadAnalytics() {
    const highestBid = await getHighestBid();
    const mostPopularCar = await getMostPopularCarByBids();
    const mostPopularUser = await getMostPopularUserByRating();
    const mostPopularCategory = await getMostPopularCategory();
    const averageBidPrice = await getAverageBidPrice();
    const totalUsers = await getTotalUsers();
    const totalCars = await getTotalCars();
    const totalCategories = await getTotalCategories();
    const totalBookings = await getTotalBookings();
    const totalMessages = await getTotalMessages();

    // Highest Bid Chart (Bar Chart)
    new Chart(document.getElementById('highestBidChart'), {
        type: 'bar',
        data: {
            labels: ['Highest Bid'],
            datasets: [{
                label: 'Highest Bid',
                data: [highestBid],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Most Popular Car Chart (Pie Chart)
    new Chart(document.getElementById('popularCarChart'), {
        type: 'pie',
        data: {
            labels: ['Most Popular Car'],
            datasets: [{
                label: 'Most Popular Car',
                data: [mostPopularCar],
                backgroundColor: ['rgba(153, 102, 255, 0.2)'],
                borderColor: ['rgba(153, 102, 255, 1)'],
                borderWidth: 1
            }]
        }
    });

    // Most Popular User Chart (Doughnut Chart)
    new Chart(document.getElementById('popularUserChart'), {
        type: 'doughnut',
        data: {
            labels: ['Most Popular User'],
            datasets: [{
                label: 'Most Popular User',
                data: [mostPopularUser],
                backgroundColor: ['rgba(255, 159, 64, 0.2)'],
                borderColor: ['rgba(255, 159, 64, 1)'],
                borderWidth: 1
            }]
        }
    });

    // Most Popular Category Chart (Line Chart)
    new Chart(document.getElementById('popularCategoryChart'), {
        type: 'line',
        data: {
            labels: ['Most Popular Category'],
            datasets: [{
                label: 'Most Popular Category',
                data: [mostPopularCategory],
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Average Bid Price Chart (Bar Chart)
    new Chart(document.getElementById('averageBidPriceChart'), {
        type: 'bar',
        data: {
            labels: ['Average Bid Price'],
            datasets: [{
                label: 'Average Bid Price',
                data: [averageBidPrice],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Total Users Chart (Bar Chart)
    new Chart(document.getElementById('totalUsersChart'), {
        type: 'bar',
        data: {
            labels: ['Total Users'],
            datasets: [{
                label: 'Total Users',
                data: [totalUsers],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Total Cars Chart (Line Chart)
    new Chart(document.getElementById('totalCarsChart'), {
        type: 'line',
        data: {
            labels: ['Total Cars'],
            datasets: [{
                label: 'Total Cars',
                data: [totalCars],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Total Categories Chart (Pie Chart)
    new Chart(document.getElementById('totalCategoriesChart'), {
        type: 'pie',
        data: {
            labels: ['Total Categories'],
            datasets: [{
                label: 'Total Categories',
                data: [totalCategories],
                backgroundColor: ['rgba(153, 102, 255, 0.2)'],
                borderColor: ['rgba(153, 102, 255, 1)'],
                borderWidth: 1
            }]
        }
    });

    // Total Bookings Chart (Doughnut Chart)
    new Chart(document.getElementById('totalBookingsChart'), {
        type: 'doughnut',
        data: {
            labels: ['Total Bookings'],
            datasets: [{
                label: 'Total Bookings',
                data: [totalBookings],
                backgroundColor: ['rgba(255, 159, 64, 0.2)'],
                borderColor: ['rgba(255, 159, 64, 1)'],
                borderWidth: 1
            }]
        }
    });

    // Total Messages Chart (Bar Chart)
    new Chart(document.getElementById('totalMessagesChart'), {
        type: 'bar',
        data: {
            labels: ['Total Messages'],
            datasets: [{
                label: 'Total Messages',
                data: [totalMessages],
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadAnalytics();
    document.getElementById('logout-link').addEventListener('click', (event) => {
        event.preventDefault();
        logout();
    });
});