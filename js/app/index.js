import { getAllItems, getItemByKey } from "../utils/dbUtils.js";
import { checkAuth, logout } from "../utils/auth.js";
import { getCookie } from "../utils/cookie.js";
import { cities } from "../utils/cities.js";

const userId = getCookie("userId");

if (userId) {
    const user = getItemByKey("users", userId);
    if (user.role === "admin") {
        window.location.href = "./admin/dashboard.html";
    }
}

let features = [];

const cityList = document.getElementById('city-list');

cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    cityList.appendChild(option);
});

function generateStarRating(avgRating) {
    const fullStars = Math.floor(avgRating);
    const halfStar = avgRating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    return (
        "★".repeat(fullStars) +
        "⯨".repeat(halfStar) +
        "☆".repeat(emptyStars)
    );
}

function redirectToBookingPage(carId) {
    window.location.href = `/views/booking.html?carId=${carId}`;
}

function createCarCard(car) {
    const card = document.createElement("div");
    card.className = "car-card";
    const carousel = document.createElement("div");
    carousel.className = "carousel";

    const carouselImages = document.createElement("div");
    carouselImages.className = "carousel-images";

    car.images.forEach((image, index) => {
        const img = document.createElement("img");
        img.src = image;
        img.alt = `Car Image ${index + 1}`;
        img.className = `carousel-image ${index === 0 ? "active" : ""}`;
        carouselImages.appendChild(img);
    });

    carousel.appendChild(carouselImages);

    let currentImageIndex = 0;
    let carouselInterval;

    function updateCarousel(index) {
        const images = carouselImages.querySelectorAll(".carousel-image");
        images.forEach((img, i) => {
            img.classList.toggle("active", i === index);
        });
    }

    function startCarousel() {
        carouselInterval = setInterval(() => {
            const images = carouselImages.querySelectorAll(".carousel-image");
            currentImageIndex = (currentImageIndex + 1) % images.length;
            updateCarousel(currentImageIndex);
        }, 3000); // Change image every 3 seconds
    }

    function stopCarousel() {
        clearInterval(carouselInterval);
    }

    card.addEventListener("mouseenter", startCarousel);
    card.addEventListener("mouseleave", stopCarousel);

    const carDetails = `
        <div class="car-details">
            <h3 class="car-name">${car.carName}</h3>
            <div class="car-features">
                ${car.featured.map((feature) => `<span class="feature">${feature}</span>`).join("")}
            </div>
            <div class="rating-container">
                <div class="car-rating">
                    <span class="stars">${generateStarRating(car.avgRating)}</span>
                    <span class="rating-count">(${car.avgRating.toFixed(1)}/5, ${car.ratingCount || "0"} reviews)</span>
                </div>
            </div>
            <div class="user-info">
                <svg class="user-icon" viewBox="0 0 24 24" width="16" height="16">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span class="user-name">${car.owner.username}</span>
            </div>
            <div class="car-price-city">Starts from 
                <span class="price">₹${car.rentalOptions.local.pricePerHour}/hour (Local)</span>
                <span class="city">${car.city}</span>
            </div>
            <button class="book-now-btn">Book Now</button>
        </div>
    `;

    card.appendChild(carousel);
    card.innerHTML += carDetails;

    const bookNowButton = card.querySelector(".book-now-btn");
    bookNowButton.addEventListener("click", () => redirectToBookingPage(car.carId));

    return card;
}

function renderFilteredCars(cars) {
    const carsContainer = document.getElementById("cars-container");
    carsContainer.innerHTML = "";
    if (cars.length === 0) {
        carsContainer.innerHTML = "<p>No cars match your search criteria.</p>";
        return;
    }
    cars.forEach((car) => {
        const card = createCarCard(car);
        carsContainer.appendChild(card);
    });
}

async function getAvailableCars() {
    const today = new Date();
    const carAvailability = await getAllItems("carAvailability");
    const allCars = await getAllItems("cars");
    const availableCars = allCars.filter(car => {
        const carAvailabilityEntries = carAvailability.filter(entry => entry.carId === car.carId);
        const isBooked = carAvailabilityEntries.some(entry => {
            const fromDate = new Date(entry.fromTimeStamp);
            const toDate = new Date(entry.toTimeStamp);
            return today >= fromDate && today <= toDate;
        });

        return !isBooked && !car.isDeleted;
    });

    features = [...new Set(availableCars.flatMap((car) => car.featured))];
    populateFeaturesDatalist(features);
    return availableCars;
}

function populateFeaturesDatalist(features) {
    const featuresList = document.getElementById('features-list');
    featuresList.innerHTML = "";
    features.forEach(feature => {
        const option = document.createElement('option');
        option.value = feature;
        featuresList.appendChild(option);
    });
}

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const loginSignupLink = document.getElementById('login-signup-link');
    const logoutLink = document.getElementById('logout-link');
    const userDashboard = document.getElementById('user-dashboard-link');
    const ownerDashboard = document.getElementById('owner-dashboard-link');

    if (isAuthenticated) {
        userDashboard.style.display = 'block';
        loginSignupLink.style.display = 'none';
        logoutLink.style.display = 'block';

        const userId = getCookie("userId");
        const user = await getItemByKey("users", userId);
        const role = user.role;
        const isApproved = user.isApproved;

        if (user.role === "owner" && isApproved) {
            ownerDashboard.style.display = 'block';
        } else {
            ownerDashboard.style.display = 'none';
        }
    } else {
        userDashboard.style.display = 'none';
        ownerDashboard.style.display = 'none';
        loginSignupLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }
}

async function renderCars() {
    const cars = await getAvailableCars();
    const carsContainer = document.getElementById("cars-container");
    carsContainer.innerHTML = "";
    cars.forEach((car) => {
        const card = createCarCard(car);
        carsContainer.appendChild(card);
    });
}

async function getFilteredCars(filters) {
    const today = new Date();
    const carAvailability = await getAllItems("carAvailability");
    const allCars = await getAllItems('cars');
    const filteredCars = allCars.filter(car => {
        const carAvailabilityEntries = carAvailability.filter(entry => entry.carId === car.carId);
        const isBooked = carAvailabilityEntries.some(entry => {
            const fromDate = new Date(entry.fromTimeStamp);
            const toDate = new Date(entry.toTimeStamp);
            return today >= fromDate && today <= toDate;
        });

        const locationMatch = filters.location
            ? filters.location.toLowerCase().split(' ').some(word => car.city?.toLowerCase().includes(word))
            : true;

        const categoryMatch = filters.carCategory
            ? car.category.categoryName?.toLowerCase() === filters.carCategory.toLowerCase()
            : true;

        const priceMatch = filters.priceRange
            ? car.rentalOptions.local.pricePerHour <= filters.priceRange || car.rentalOptions.outstation.pricePerDay <= filters.priceRange
            : true;

        const carTypeMatch = filters.carType
            ? car.carType?.toLowerCase() === filters.carType.toLowerCase()
            : true;

        const availabilityMatch = filters.availability
            ? (filters.availability.toLowerCase() === "local" && car.isAvailableForLocal) ||
              (filters.availability.toLowerCase() === "outstation" && car.isAvailableForOutstation)
            : true;

        const featuresMatch = filters.features.length > 0
            ? filters.features.every(f => car.featured?.map(ft => ft.toLowerCase()).includes(f.toLowerCase()))
            : true;

        const ratingMatch = filters.rating
            ? car.avgRating >= filters.rating
            : true;

        return locationMatch &&
            categoryMatch &&
            priceMatch &&
            carTypeMatch &&
            availabilityMatch &&
            featuresMatch &&
            ratingMatch;
    });

    return filteredCars;
}

async function populateCategoryOptions() {
    const categories = await getAllItems("categories");
    const categorySelect = document.getElementById('car-category');
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.categoryId;
        option.textContent = category.categoryName;
        categorySelect.appendChild(option);
    });
}

window.updatePriceRangeValue = function (value) {
    document.getElementById('price-range-value').textContent = value;
}

document.getElementById('search-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const filters = {
        location: formData.get('location').trim(),
        carCategory: formData.get('car-category').trim(),
        priceRange: parseFloat(formData.get('price-range').trim()),
        carType: formData.get('car-type').trim(),
        availability: formData.get('availability').trim(),
        features: formData.get('features') ? formData.get('features').split(',').map(f => f.trim()).filter(f => f !== '') : [],
        rating: parseFloat(formData.get('rating').trim())
    };

    if (isNaN(filters.priceRange)) delete filters.priceRange;
    if (isNaN(filters.rating)) delete filters.rating;

    const cars = await getFilteredCars(filters);
    renderFilteredCars(cars);
});

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

renderCars();
updateNavLinks();
populateCategoryOptions();