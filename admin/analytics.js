import { getTotalItems, getAllItems, getItemByKey } from "../js/utils/dbUtils.js";
import { checkAuth, logout } from "../js/utils/auth.js";

async function getNumberOfCarsPerCategory() {
    const cars = await getAllItems("cars");
    const categories = await getAllItems("categories");
    const categoryCounts = categories.map(category => ({
        categoryName: category.categoryName,
        count: cars.filter(car => car.categoryId === category.categoryId).length
    }));
    return categoryCounts;
}

async function getNumberOfAvailableCars() {
    const cars = await getAllItems("cars");
    return cars.filter(car => car.availability === "available").length;
}

async function getHighestNumberOfCarsAmongUsers() {
    const cars = await getAllItems("cars");
    const userCarCounts = cars.reduce((acc, car) => {
        acc[car.ownerId] = (acc[car.ownerId] || 0) + 1;
        return acc;
    }, {});
    const highestUserId = Object.keys(userCarCounts).reduce((a, b) => userCarCounts[a] > userCarCounts[b] ? a : b);
    const user = await getItemByKey("users", highestUserId);
    return { username: user.username, count: userCarCounts[highestUserId] };
}

async function getHighestRatedCarCategoryWise() {
    const cars = await getAllItems("cars");
    const categories = await getAllItems("categories");
    const highestRatedCars = categories.map(category => {
        const carsInCategory = cars.filter(car => car.categoryId === category.categoryId);
        const highestRatedCar = carsInCategory.reduce((a, b) => (a.avgRating || 0) > (b.avgRating || 0) ? a : b, {});
        return { categoryName: category.categoryName, carName: highestRatedCar.carName, rating: highestRatedCar.avgRating };
    });
    return highestRatedCars;
}

async function getHighestRatedUserWithNumberOfUsersPerRating() {
    const users = await getAllItems("users");
    const highestRatedUser = users.reduce((a, b) => (a.avgRating || 0) > (b.avgRating || 0) ? a : b, {});
    const usersPerRating = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: users.filter(user => user.avgRating === rating).length
    }));
    return { highestRatedUser: highestRatedUser.username, usersPerRating };
}

async function getTotalNumberOfBids() {
    const bids = await getAllItems("bids");
    return bids.length;
}

async function getBidsPerCategory() {
    const bids = await getAllItems("bids");
    const cars = await getAllItems("cars");
    const categories = await getAllItems("categories");
    const bidsPerCategory = categories.map(category => ({
        categoryName: category.categoryName,
        count: bids.filter(bid => cars.find(car => car.carId === bid.carId && car.categoryId === category.categoryId)).length
    }));
    return bidsPerCategory;
}

async function getCarsBookedAutomaticOrManual() {
    const bookings = await getAllItems("bookings");
    const cars = await getAllItems("cars");
    const automaticCount = bookings.filter(booking => cars.find(car => car.carId === booking.carId && car.carType === "automatic")).length;
    const manualCount = bookings.filter(booking => cars.find(car => car.carId === booking.carId && car.carType === "manual")).length;
    return { automatic: automaticCount, manual: manualCount };
}

async function getHighestNumberOfBookingsPerCategory() {
    const bookings = await getAllItems("bookings");
    const cars = await getAllItems("cars");
    const categories = await getAllItems("categories");
    const bookingsPerCategory = categories.map(category => ({
        categoryName: category.categoryName,
        count: bookings.filter(booking => cars.find(car => car.carId === booking.carId && car.categoryId === category.categoryId)).length
    }));
    const highestCategory = bookingsPerCategory.reduce((a, b) => a.count > b.count ? a : b, {});
    return highestCategory;
}

async function getTotalBiddedPricePerCategory() {
    const bookings = await getAllItems("bookings");
    const cars = await getAllItems("cars");
    const categories = await getAllItems("categories");

    const revenuePerCategory = categories.map(category => ({
        categoryName: category.categoryName,
        totalRevenue: bookings.reduce((acc, booking) => {
            const car = cars.find(car => car.carId === booking.carId && car.categoryId === category.categoryId);
            if (car) {
                const startDate = new Date(booking.from);
                const endDate = new Date(booking.to);
                const days = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1; // Calculate the number of days
                return acc + (booking.bidPrice * days);
            }
            return acc;
        }, 0)
    }));

    return revenuePerCategory;
}

async function getCarsPerCity() {
    const cars = await getAllItems("cars");

    const carsPerCity = cars.reduce((acc, car) => {
        if (!acc[car.city]) {
            acc[car.city] = 0;
        }
        acc[car.city]++;
        return acc;
    }, {});

    return Object.keys(carsPerCity).map(city => ({
        city,
        count: carsPerCity[city]
    }));
}

async function getTop3Bidders() {
    const bids = await getAllItems("bids");
    const users = await getAllItems("users");

    const userBidCounts = bids.reduce((acc, bid) => {
        acc[bid.userId] = (acc[bid.userId] || 0) + 1;
        return acc;
    }, {});

    const top3UserIds = Object.keys(userBidCounts)
        .sort((a, b) => userBidCounts[b] - userBidCounts[a])
        .slice(0, 3);

    return top3UserIds.map(userId => {
        const user = users.find(user => user.userId === userId);
        return { username: user.username, count: userBidCounts[userId] };
    });
}

async function getLeastBiddedCategory() {
    const bidsPerCategory = await getBidsPerCategory();
    return bidsPerCategory.reduce((a, b) => a.count < b.count ? a : b, {});
}

async function getLeastBookedCategory() {
    const bookings = await getAllItems("bookings");
    const cars = await getAllItems("cars");
    const categories = await getAllItems("categories");
    const bookingsPerCategory = categories.map(category => ({
        categoryName: category.categoryName,
        count: bookings.filter(booking => cars.find(car => car.carId === booking.carId && car.categoryId === category.categoryId)).length
    }));
    return bookingsPerCategory.reduce((a, b) => a.count < b.count ? a : b, {});
}

async function loadAnalytics() {
    const numberOfCarsPerCategory = await getNumberOfCarsPerCategory();
    const numberOfAvailableCars = await getNumberOfAvailableCars();
    const highestNumberOfCarsAmongUsers = await getHighestNumberOfCarsAmongUsers();
    const highestRatedCarCategoryWise = await getHighestRatedCarCategoryWise();
    const highestRatedUserWithNumberOfUsersPerRating = await getHighestRatedUserWithNumberOfUsersPerRating();
    const totalNumberOfBids = await getTotalNumberOfBids();
    const bidsPerCategory = await getBidsPerCategory();
    const carsBookedAutomaticOrManual = await getCarsBookedAutomaticOrManual();
    const highestNumberOfBookingsPerCategory = await getHighestNumberOfBookingsPerCategory();
    const totalBiddedPricePerCategory = await getTotalBiddedPricePerCategory();
    const carsPerCity = await getCarsPerCity();
    const top3Bidders = await getTop3Bidders();
    const leastBiddedCategory = await getLeastBiddedCategory();
    const leastBookedCategory = await getLeastBookedCategory();

    new Chart(document.getElementById('carsPerCategoryChart'), {
        type: 'bar',
        data: {
            labels: numberOfCarsPerCategory.map(item => item.categoryName),
            datasets: [{
                label: 'Number of Cars',
                data: numberOfCarsPerCategory.map(item => item.count),
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

    // Highest Rated Car Category Wise (Bar Chart)
    new Chart(document.getElementById('highestRatedCarCategoryWiseChart'), {
        type: 'bar',
        data: {
            labels: highestRatedCarCategoryWise.map(item => item.categoryName),
            datasets: [{
                label: 'Highest Rated Car',
                data: highestRatedCarCategoryWise.map(item => item.rating),
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

    // Bids Per Category (Bar Chart)
    new Chart(document.getElementById('bidsPerCategoryChart'), {
        type: 'bar',
        data: {
            labels: bidsPerCategory.map(item => item.categoryName),
            datasets: [{
                label: 'Number of Bids',
                data: bidsPerCategory.map(item => item.count),
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
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

    // Total Bidded Price Per Category (Bar Chart)
    new Chart(document.getElementById('totalBiddedPricePerCategoryChart'), {
        type: 'bar',
        data: {
            labels: totalBiddedPricePerCategory.map(item => item.categoryName),
            datasets: [{
                label: 'Total Bidded Price',
                data: totalBiddedPricePerCategory.map(item => item.totalRevenue),
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

    new Chart(document.getElementById('carsPerCityChart'), {
        type: 'bar',
        data: {
            labels: carsPerCity.map(item => item.city),
            datasets: [{
                label: 'Number of Cars',
                data: carsPerCity.map(item => item.count),
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

    new Chart(document.getElementById('top3BiddersChart'), {
        type: 'bar',
        data: {
            labels: top3Bidders.map(item => item.username),
            datasets: [{
                label: 'Number of Bids',
                data: top3Bidders.map(item => item.count),
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

    new Chart(document.getElementById('leastBiddedCategoryChart'), {
        type: 'bar',
        data: {
            labels: [leastBiddedCategory.categoryName],
            datasets: [{
                label: 'Number of Bids',
                data: [leastBiddedCategory.count],
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
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

    new Chart(document.getElementById('leastBookedCategoryChart'), {
        type: 'bar',
        data: {
            labels: [leastBookedCategory.categoryName],
            datasets: [{
                label: 'Number of Bookings',
                data: [leastBookedCategory.count],
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