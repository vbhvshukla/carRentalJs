import { getAllItemsByIndex, updateItem, getAllItems, getItemByKey, updateCarInAllStores } from "../../../../js/utils/dbUtils.js";
import { checkAuth } from "../../../../js/utils/auth.js";
import { getCookie ,setCookie} from "../../../../js/utils/cookie.js";
import { readFileAsDataURL } from "../../../../js/utils/readFile.js";
import { validateForm } from "../../../../js/utils/validation.js";

const userId = getCookie("userId");
if(!userId){window.location.href="../../../index.html"}
const user = await getItemByKey("users", userId);

if (!user || user.role !== "owner" || !user.isApproved) {
    alert("Access Denied: You are not authorized to view this page.");
    window.location.href = user.role === "customer" ? "../../../user-dashboard/udashboard.html" : "../../../login/login.html";
}

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const logoutLink = document.getElementById('logout-link');
    const userDashboard = document.getElementById('user-dashboard-link');

    if (isAuthenticated) {
        userDashboard.style.display = 'block';
        logoutLink.style.display = 'block';
    } else {
        userDashboard.style.display = 'none';
        logoutLink.style.display = 'none';
    }
}

function logout() {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        const [name] = cookies[i].split("=");
        setCookie(name, "", -1); 
    }
    window.location.href = "../../../index.html";
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

async function populateCategoryOptions(selectedCategory) {
    const categories = await getAllItems("categories");
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.categoryId;
        option.textContent = category.categoryName;
        if (category.categoryName === selectedCategory) {
            option.selected = true;
        }
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
                <span class="price">₹${car.rentalOptions.local.pricePerHour}/hour (Local)</span>
                <span class="price">₹${car.rentalOptions.outstation.pricePerDay}/day (Outstation)</span>
                <span class="city">${car.city}</span>
            </div>
            <div class="car-description">
                <p>${car.description}</p>
            </div>
            <div class="car-info">
                <p>Type: ${car.carType}</p>
                <p>Category: ${car.category.categoryName}</p>
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
                <div class="form-group">
                    <label for="local-price">Local Rental Price Per Hour:</label>
                    <input type="number" id="local-price" name="local-price" min="0" max="5000" value="${car.rentalOptions.local.pricePerHour}">
                </div>
                <div class="form-group">
                    <label for="max-km-per-hour">Max Km Per Hour (Local):</label>
                    <input type="number" id="max-km-per-hour" name="max-km-per-hour" min="0" max="5000" value="${car.rentalOptions.local.maxKmPerHour}">
                </div>
                <div class="form-group">
                    <label for="extra-hour-rate">Extra Hour Rate (Local):</label>
                    <input type="number" id="extra-hour-rate" name="extra-hour-rate" min="0" max="5000" value="${car.rentalOptions.local.extraHourRate}">
                </div>
                <div class="form-group">
                    <label for="extra-km-rate">Extra Km Rate (Local):</label>
                    <input type="number" id="extra-km-rate" name="extra-km-rate" min="0" max="5000" value="${car.rentalOptions.local.extraKmRate}">
                </div>
                <div class="form-group">
                    <label for="outstation-price">Outstation Rental Price Per Day:</label>
                    <input type="number" id="outstation-price" name="outstation-price" min="0" max="5000" value="${car.rentalOptions.outstation.pricePerDay}">
                </div>
                <div class="form-group">
                    <label for="price-per-km">Price Per Km (Outstation):</label>
                    <input type="number" id="price-per-km" name="price-per-km" min="0" max="5000" value="${car.rentalOptions.outstation.pricePerKm}">
                </div>
                <div class="form-group">
                    <label for="minimum-km-chargeable">Minimum Km Chargeable (Outstation):</label>
                    <input type="number" id="minimum-km-chargeable" name="minimum-km-chargeable" min="0" max="5000" value="${car.rentalOptions.outstation.minimumKmChargeable}">
                </div>
                <div class="form-group">
                    <label for="max-km-limit-per-day">Max Km Limit Per Day (Outstation):</label>
                    <input type="number" id="max-km-limit-per-day" name="max-km-limit-per-day" min="0" max="5000" value="${car.rentalOptions.outstation.maxKmLimitPerDay}">
                </div>
                <div class="form-group">
                    <label for="extra-day-rate">Extra Day Rate (Outstation):</label>
                    <input type="number" id="extra-day-rate" name="extra-day-rate" min="0" max="5000" value="${car.rentalOptions.outstation.extraDayRate}">
                </div>
                <div class="form-group">
                    <label for="extra-hourly-rate">Extra Hourly Rate (Outstation):</label>
                    <input type="number" id="extra-hourly-rate" name="extra-hourly-rate" min="0" max="5000" value="${car.rentalOptions.outstation.extraHourlyRate}">
                </div>
                <div class="form-group">
                    <label for="extra-km-rate-outstation">Extra Km Rate (Outstation):</label>
                    <input type="number" id="extra-km-rate-outstation" name="extra-km-rate-outstation" min="0" max="5000" value="${car.rentalOptions.outstation.extraKmRate}">
                </div>
                <button type="submit" class="button">Save Changes</button>
            </form>
        </div>
    `;

    const carsContainer = document.getElementById("cars-container");
    carsContainer.innerHTML = carDetails;
    populateCategoryOptions(car.category.categoryName);

    document.getElementById("edit-car-form").addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = new FormData(event.target);
const formObject = {
            carName: formData.get("carName").trim(),
            categoryId: formData.get("category").trim(),
            city: formData.get("city").trim(),
            description: formData.get("description").trim(),
            carType: formData.get("car-type").trim().toLowerCase(),
            features: Array.from(document.querySelectorAll("#features-list li")).map(li => li.firstChild.textContent),
            isAvailableForLocal: formData.get("available-local") === "on",
            isAvailableForOutstation: formData.get("available-outstation") === "on",
            localPrice: parseFloat(formData.get("local-price")) || 0,
            maxKmPerHour: parseFloat(formData.get("max-km-per-hour")) || 0,
            extraHourRate: parseFloat(formData.get("extra-hour-rate")) || 0,
            extraKmRate: parseFloat(formData.get("extra-km-rate")) || 0,
            outstationPrice: parseFloat(formData.get("outstation-price")) || 0,
            pricePerKm: parseFloat(formData.get("price-per-km")) || 0,
            minimumKmChargeable: parseFloat(formData.get("minimum-km-chargeable")) || 0,
            maxKmLimitPerDay: parseFloat(formData.get("minimum-km-chargeable")) + 100 || 0,
            extraDayRate: parseFloat(formData.get("extra-day-rate")) || 0,
            extraHourlyRate: parseFloat(formData.get("extra-hourly-rate")) || 0,
            extraKmRateOutstation: parseFloat(formData.get("extra-km-rate-outstation")) || 0
        };

        const errors = validateForm(formObject, {
            carName: { required: true, carName: true },
            categoryId: { required: true },
            city: { required: true, citySelect: true },
            description: { required: true, maxLength: 500 },
            carType: { required: true, carType: true },
            localPrice: { number: true },
            maxKmPerHour: { number: true },
            extraHourRate: { number: true },
            extraKmRate: { number: true },
            outstationPrice: { number: true },
            pricePerKm: { number: true },
            minimumKmChargeable: { number: true },
            maxKmLimitPerDay: { number: true },
            extraDayRate: { number: true },
            extraHourlyRate: { number: true },
            extraKmRateOutstation: { number: true }
        });

        if (Object.keys(errors).length > 0) {
            Object.keys(errors).forEach(field => {
                const errorElement = document.getElementById(`${field}-error`);
                errorElement.textContent = errors[field];
                errorElement.style.display = "block";
            });
            alert("Please fill in all required fields correctly.");
            return;
        }

        // const formObject = {
        //     carName: formData.get("carName").trim(),
        //     categoryId: formData.get("category").trim(),
        //     city: formData.get("city").trim(),
        //     description: formData.get("description").trim(),
        //     carType: formData.get("car-type").trim().toLowerCase(),
        //     features: Array.from(document.querySelectorAll("#features-list li")).map(li => li.firstChild.textContent),
        //     isAvailableForLocal: formData.get("available-local") === "on",
        //     isAvailableForOutstation: formData.get("available-outstation") === "on",
        //     localPrice: parseFloat(formData.get("local-price")) || 0,
        //     maxKmPerHour: parseFloat(formData.get("max-km-per-hour")) || 0,
        //     extraHourRate: parseFloat(formData.get("extra-hour-rate")) || 0,
        //     extraKmRate: parseFloat(formData.get("extra-km-rate")) || 0,
        //     outstationPrice: parseFloat(formData.get("outstation-price")) || 0,
        //     pricePerKm: parseFloat(formData.get("price-per-km")) || 0,
        //     minimumKmChargeable: parseFloat(formData.get("minimum-km-chargeable")) || 0,
        //     maxKmLimitPerDay: parseFloat(formData.get("minimum-km-chargeable")) + 100 || 0,
        //     extraDayRate: parseFloat(formData.get("extra-day-rate")) || 0,
        //     extraHourlyRate: parseFloat(formData.get("extra-hourly-rate")) || 0,
        //     extraKmRateOutstation: parseFloat(formData.get("extra-km-rate-outstation")) || 0
        // };

        // const errors = validateForm(formObject, {
        //     carName: { required: true, carName: true },
        //     categoryId: { required: true },
        //     city: { required: true, citySelect: true },
        //     description: { required: true, maxLength: 500 },
        //     carType: { required: true, carType: true },
        //     localPrice: { number: true },
        //     maxKmPerHour: { number: true },
        //     extraHourRate: { number: true },
        //     extraKmRate: { number: true },
        //     outstationPrice: { number: true },
        //     pricePerKm: { number: true },
        //     minimumKmChargeable: { number: true },
        //     maxKmLimitPerDay: { number: true },
        //     extraDayRate: { number: true },
        //     extraHourlyRate: { number: true },
        //     extraKmRateOutstation: { number: true }
        // });

        if (Object.keys(errors).length > 0) {
            Object.keys(errors).forEach(field => {
                const errorElement = document.getElementById(`${field}-error`);
                errorElement.textContent = errors[field];
                errorElement.style.display = "block";
            });
            alert("Please fill in all required fields correctly.");
            return;
        }

        const updatedCar = {
            ...car,
            carName: formData.get("carName").trim(),
                        carType: formData.get("car-type").trim(),
                        city: formData.get("city").trim(),
            description: formData.get("description").trim(),
            featured: Array.from(document.querySelectorAll("#features-list li")).map(li => li.firstChild.textContent),
            rentalOptions: {
                local: {
                    pricePerHour: parseFloat(formData.get("local-price")) || 0,
                    maxKmPerHour: parseFloat(formData.get("max-km-per-hour")) || 0,
                    extraHourRate: parseFloat(formData.get("extra-hour-rate")) || 0,
                    extraKmRate: parseFloat(formData.get("extra-km-rate")) || 0
                },
                outstation: {
                    pricePerDay: parseFloat(formData.get("outstation-price")) || 0,
                    pricePerKm: parseFloat(formData.get("price-per-km")) || 0,
                    minimumKmChargeable: parseFloat(formData.get("minimum-km-chargeable")) || 0,
                    maxKmLimitPerDay: parseFloat(formData.get("minimum-km-chargeable")) + 100 || 0,
                    extraDayRate: parseFloat(formData.get("extra-day-rate")) || 0,
                    extraHourlyRate: parseFloat(formData.get("extra-hourly-rate")) || 0,
                    extraKmRate: parseFloat(formData.get("extra-km-rate-outstation")) || 0
                }
            }
        };

                const newImages = document.getElementById("new-images").files;
        if (newImages.length > 0) {
            const newImageBase64 = await Promise.all(Array.from(newImages).map(file => readFileAsDataURL(file)));
            updatedCar.images.push(...newImageBase64);
        }

        // Remove extra fields that are not part of the schema
        delete updatedCar.availability;
        delete updatedCar.categoryId;
        delete updatedCar.categoryName;

        await updateItem("cars", updatedCar);
        await updateCarInAllStores(updatedCar);
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
