import { getAllItems, getItemByKey, updateItem } from "../utils/dbUtils.js";
import { checkAuth, logout } from "../utils/auth.js";
import { getCookie } from "../utils/cookie.js";

const userId = getCookie("userId");

if (userId) {
    const user = getItemByKey("users", userId);
    if (user.role === "admin") {
        console.log("Something")
        window.location.href = "./admin/dashboard.html";
    }
}

let features = [];

const cities = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur",
    "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna",
    "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli",
    "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad",
    "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur",
    "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli-Dharwad", "Bareilly", "Mysore", "Moradabad", "Gurgaon",
    "Aligarh", "Jalandhar", "Tiruchirappalli", "Bhubaneswar", "Salem", "Mira-Bhayandar", "Thiruvananthapuram",
    "Bhiwandi", "Saharanpur", "Guntur", "Amravati", "Bikaner", "Noida", "Jamshedpur", "Bhilai", "Cuttack",
    "Firozabad", "Kochi", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Nanded", "Kolhapur", "Ajmer",
    "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi", "Ulhasnagar", "Nellore", "Jammu", "Sangli",
    "Belgaum", "Mangalore", "Ambattur", "Tirunelveli", "Malegaon", "Gaya", "Jalgaon", "Udaipur", "Maheshtala",
    "Tiruppur", "Davanagere", "Kozhikode", "Akola", "Kurnool", "Bokaro", "South Dumdum"
];

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

    const prevButton = document.createElement("button");
    prevButton.className = "carousel-button prev";
    prevButton.innerHTML = "&#10094;";

    const nextButton = document.createElement("button");
    nextButton.className = "carousel-button next";
    nextButton.innerHTML = "&#10095;";

    carousel.appendChild(carouselImages);
    carousel.appendChild(prevButton);
    carousel.appendChild(nextButton);

    let currentImageIndex = 0;

    function updateCarousel(index) {
        const images = carouselImages.querySelectorAll(".carousel-image");
        images.forEach((img, i) => {
            img.classList.toggle("active", i === index);
        });
    }

    prevButton.addEventListener("click", () => {
        const images = carouselImages.querySelectorAll(".carousel-image");
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateCarousel(currentImageIndex);
    });

    nextButton.addEventListener("click", () => {
        const images = carouselImages.querySelectorAll(".carousel-image");
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateCarousel(currentImageIndex);
    });

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
                <span class="user-name">${car.ownerName}</span>
            </div>
            <div class="car-price-city">
                <span class="price">$${car.basePrice}/day</span>
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

async function updateCarAvailability() {
    const today = new Date();
    const bookings = await getAllItems("bookings");
    const cars = await getAllItems("cars");
    const updatedCars = cars.map(car => {
        const carBookings = bookings.filter(b => b.carId === car.carId);
        const isBooked = carBookings.some(booking => {
            const fromDate = new Date(booking.from);
            const toDate = new Date(booking.to);
            return today >= fromDate && today <= toDate;
        });

        if (isBooked) {
            car.availability = "unavailable";
        } else {
            car.availability = "available";
        }

        return car;
    });

    for (const car of updatedCars) {
        await updateItem("cars", car);
    }
}

async function getAvailableCars() {
    const allCars = await getAllItems("cars");
    features = [...new Set(allCars.flatMap((car) => car.featured))];
    populateFeaturesDatalist(features);
    return allCars.filter(car => car.availability === "Available" || "available" && !car.isDeleted);
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
    await updateCarAvailability();
    const cars = await getAvailableCars();
    const carsContainer = document.getElementById("cars-container");
    carsContainer.innerHTML = "";
    cars.forEach((car) => {
        const card = createCarCard(car);
        carsContainer.appendChild(card);
    });
}

async function getFilteredCars(filters) {
    const allCars = await getAllItems('cars');
    const filteredCars = allCars.filter(car => {
        const locationMatch = filters.location
            ? filters.location.toLowerCase().split(' ').some(word => car.city?.toLowerCase().includes(word))
            : true;

        const categoryMatch = filters.carCategory
            ? car.categoryName?.toLowerCase() === filters.carCategory.toLowerCase()
            : true;

        const priceMatch = filters.priceRange
            ? car.basePrice <= filters.priceRange
            : true;

        const carTypeMatch = filters.carType
            ? car.carType?.toLowerCase() === filters.carType.toLowerCase()
            : true;

        const availabilityMatch = filters.availability
            ? car.availability?.toLowerCase() === filters.availability.toLowerCase()
            : true;

        const featuresMatch = filters.features
            ? filters.features.some(f => car.featured?.map(ft => ft.toLowerCase()).includes(f.toLowerCase()))
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

    const filters = {};
    const location = document.getElementById('location').value.trim();
    const carCategory = document.getElementById('car-category').value.trim();
    const priceRange = document.getElementById('price-range').value.trim();
    const carType = document.getElementById('car-type').value.trim();
    const availability = document.getElementById('availability').value.trim();
    const features = document.getElementById('features').value
        .split(',')
        .map(f => f.trim())
        .filter(f => f !== '');
    const rating = parseFloat(document.getElementById('rating').value.trim());

    if (location) filters.location = location;
    if (carCategory) filters.carCategory = carCategory;
    if (priceRange) filters.priceRange = parseFloat(priceRange);
    if (carType) filters.carType = carType;
    if (availability) filters.availability = availability;
    if (features.length > 0) filters.features = features;
    if (!isNaN(rating)) filters.rating = rating;

    const cars = await getFilteredCars(filters);
    renderFilteredCars(cars);
});

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

updateCarAvailability().then(() => {
    renderCars();
});
updateNavLinks();
populateCategoryOptions();


