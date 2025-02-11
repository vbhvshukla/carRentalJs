import { getAllItemsByIndex, updateItem, getAllItems, getItemByKey } from "../utils/dbUtils.js";
import { checkAuth, logout } from "../utils/auth.js";
import { getCookie } from "../utils/cookie.js";
import { readFileAsDataURL } from "../utils/readFile.js";
const userId = getCookie("userId");
const user = await getItemByKey("users", userId);

if (!user || user.role !== "owner" || !user.isApproved) {
    alert("Access Denied: You are not authorized to view this page.");
    window.location.href = user.role === "customer" ? "./udashboard.html" : "./login.html";
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
        const role = user.role;
        const isApproved = user.isApproved;

    } else {
        userDashboard.style.display = 'none';
        logoutLink.style.display = 'none';
    }
}

async function renderOwnerCars() {
    const ownerId = getCookie("userId");
    const cars = await getAllItemsByIndex("cars", "ownerId", ownerId);
    const carsContainer = document.getElementById("cars-container");
    carsContainer.innerHTML = "";
    if (cars.length === 0) {
        carsContainer.innerHTML = "<p>No cars found.</p>";
        return;
    }
    cars.forEach((car) => {
        const card = createCarCard(car);
        carsContainer.appendChild(card);
    });
}

async function populateCategoryOptions() {
    const categories = await getAllItems("categories");
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.categoryId;
        option.textContent = category.categoryName;
        categorySelect.appendChild(option);
    });
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
    card.appendChild(carousel);

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
            <div class="car-rating">
                <span class="stars">${generateStarRating(car.avgRating)}</span>
                <span class="rating-count">(${car.avgRating.toFixed(1)}/5, ${car.ratingCount || 0} reviews)</span>
            </div>
            <div class="car-price-city">
                <span class="price">$${car.basePrice}/day</span>
                <span class="city">${car.city}</span>
            </div>
            <div class="car-description">
                <p>${car.description}</p>
            </div>
            <div class="car-info">
                <p>Type: ${car.carType}</p>
                <p>Category: ${car.categoryName}</p>
                <p>Created At: ${new Date(car.createdAt).toLocaleDateString()}</p>
            </div>
            <button class="edit-car-btn">Edit Car</button>
        </div>
    `;
    card.innerHTML += carDetails;

    const editCarButton = card.querySelector(".edit-car-btn");
    editCarButton.addEventListener("click", () => editCar(car));

    return card;
}

window.prevImage = function (button) {
    const carousel = button.closest(".carousel");
    const images = carousel.querySelectorAll(".carousel-image");
    let activeIndex = Array.from(images).findIndex((img) =>
        img.classList.contains("active")
    );

    images[activeIndex].classList.remove("active");
    activeIndex = (activeIndex - 1 + images.length) % images.length;
    images[activeIndex].classList.add("active");
}

window.nextImage = function (button) {
    const carousel = button.closest(".carousel");
    const images = carousel.querySelectorAll(".carousel-image");
    let activeIndex = Array.from(images).findIndex((img) =>
        img.classList.contains("active")
    );

    images[activeIndex].classList.remove("active");
    activeIndex = (activeIndex + 1) % images.length;
    images[activeIndex].classList.add("active");
}

function generateStarRating(avgRating) {
    const fullStars = Math.floor(avgRating);
    const halfStar = avgRating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    return (
        "★".repeat(fullStars) +
        "⯪".repeat(halfStar) +
        "☆".repeat(emptyStars)
    );
}

function editCar(car) {
    const carDetails = `
        <div class="car-edit-form">
            <h3>Edit Car: ${car.carName}</h3>
            <form id="edit-car-form">
                <div class="form-group">
                    <label for="carName">Car Name:</label>
                    <input type="text" id="carName" name="carName" value="${car.carName}">
                </div>
                <div class="form-group">
                    <label for="category">Category:</label>
                    <select id="category" name="category" required></select>
                </div>
                <div class="form-group">
                    <label for="basePrice">Base Price:</label>
                    <input type="number" id="basePrice" name="basePrice"  min="1" value="${car.basePrice}">
                </div>
                <div class="form-group">
                    <label for="description">Description:</label>
                    <textarea id="description" name="description">${car.description}</textarea>
                </div>
                <div class="form-group">
                    <label for="availability">Availability:</label>
                    <select id="availability" name="availability" required>
                        <option value="Available" ${car.availability === 'Available' ? 'selected' : ''}>Available</option>
                        <option value="Unavailable" ${car.availability === 'Unavailable' ? 'selected' : ''}>Save As Draft</option>
                    </select>
                </div>
               <div class="form-group">
            <label for="existing-images">Current Images:</label>
            <div id="existing-images">
                ${car.images.map((img, index) => `
                    <div class="image-wrapper">
                        <img src="${img}" class="edit-image-preview">
                        <button type="button" onclick="removeExistingImage(${index})">❌</button>
                    </div>
                `).join("")}
            </div>
        </div>
         <div class="form-group">
            <label for="new-images">Add New Images:</label>
            <input type="file" id="new-images" name="new-images" accept="image/*" multiple>
        </div>
                <div class="form-group">
                    <label for="city">City:</label>
                    <input type="text" id="city" name="city" list="city-list" value="${car.city}" required>
                    <datalist id="city-list"></datalist>
                </div>
                <div class="form-group">
                    <label for="features">Featured:</label>
                    <div id="features-container">
                        <input type="text" id="feature-input" placeholder="Enter a feature">
                        <button type="button" id="add-feature-btn">Add New Feature</button>
                    </div>
                    <ul id="features-list">
                        ${car.featured.map((feature) => `<li>${feature} <button type="button" onclick="removeFeature(this)">Remove</button></li>`).join("")}
                    </ul>
                </div>
                <div class="form-group">
                    <label for="car-type">Car Type:</label>
                    <select id="car-type" name="car-type" required>
                        <option value="Automatic" ${car.carType === 'Automatic' ? 'selected' : ''}>Automatic</option>
                        <option value="Manual" ${car.carType === 'Manual' ? 'selected' : ''}>Manual</option>
                    </select>
                </div>
                <button type="submit" class="button">Save Changes</button>
            </form>
        </div>
    `;

    const carsContainer = document.getElementById("cars-container");
    carsContainer.innerHTML = carDetails;
    populateCategoryOptions(car.categoryName);

    document.getElementById("edit-car-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        const categorySelect = document.getElementById("category");
        const categoryId = categorySelect.value;
        const categoryName = categorySelect.options[categorySelect.selectedIndex].textContent;

        const updatedCar = {
            ...car,
            carName: document.getElementById("carName").value,
            basePrice: parseFloat(document.getElementById("basePrice").value),
            availability: document.getElementById("availability").value.toLowerCase(),
            carType: document.getElementById("car-type").value,
            categoryId,
            categoryName,
            city: document.getElementById("city").value,
            description: document.getElementById("description").value,
            featured: Array.from(document.querySelectorAll("#features-list li")).map(li => li.firstChild.textContent),
        };

        const newImages = document.getElementById("new-images").files;
        if (newImages.length > 0) {
            const newImageBase64 = await Promise.all(Array.from(newImages).map(file => readFileAsDataURL(file)));
            updatedCar.images.push(...newImageBase64);
        }

        await updateItem("cars", updatedCar);
        alert("Car details updated successfully!");
        renderOwnerCars();
    });

    document.getElementById("add-feature-btn").addEventListener("click", () => {
        const featureInput = document.getElementById("feature-input");
        const feature = featureInput.value.trim();
        if (feature) {
            const featureList = document.getElementById("features-list");
            const li = document.createElement("li");
            li.innerHTML = `${feature} <button type="button" onclick="removeFeature(this)">Remove</button>`;
            featureList.appendChild(li);
            featureInput.value = "";
        }
    });
}

window.removeExistingImage = function (index) {
    const updatedCar = { ...currentEditingCar };
    updatedCar.images.splice(index, 1);
    editCar(updatedCar);
};

window.removeFeature = function (button) {
    const li = button.parentElement;
    li.remove();
}

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

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
updateNavLinks();
renderOwnerCars();
highlightActiveLink();
