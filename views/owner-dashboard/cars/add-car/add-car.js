import { getAllItems, addItem, getItemByKey } from "../../../../js/utils/dbUtils.js";
import { getCookie } from "../../../../js/utils/cookie.js";
import { checkAuth, logout } from "../../../../js/utils/auth.js";
import { generateRandomId } from "../../../../js/utils/generateId.js";
import { readFileAsDataURL } from "../../../../js/utils/readFile.js";
import { validateForm, validateField } from "../../../../js/utils/validation.js";
import { showToast } from "../../../../js/utils/toastUtils.js";
import { cities } from "../../../../js/utils/cities.js";

const userId = getCookie("userId");
const user = await getItemByKey("users", userId);
if (!user || user.role !== "owner" || !user.isApproved) {
    showToast("Access Denied: You are not authorized to view this page.", "error");
    window.location.href = user.role === "customer" ? "../../../user-dashboard/udashboard.html" : "../../../login/login.html";
}

const categorySelect = document.getElementById('category');
const cityList = document.getElementById('city-list');
const featuresList = document.getElementById('features-list');
const featureInput = document.getElementById('feature-input');
const addFeatureBtn = document.getElementById('add-feature-btn');

getAllItems("categories").then(categories => {
    if (categories.length === 0) {
        showToast("No categories found. Please add categories first.", "error");
        return;
    }
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.categoryId;
        option.textContent = category.categoryName;
        categorySelect.appendChild(option);
    });
});

cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    cityList.appendChild(option);
});

addFeatureBtn.addEventListener("click", () => {
    const feature = featureInput.value.trim();
    const existingFeatures = Array.from(featuresList.children).map(li => li.firstChild.textContent.trim());

    if (!feature || existingFeatures.includes(feature)) {
        showToast("Feature is empty or already added!", "error");
        return;
    }

    if (featuresList.children.length < 3) {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = feature;
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", () => {
            featuresList.removeChild(li);
        });
        li.appendChild(span);
        li.appendChild(removeBtn);
        featuresList.appendChild(li);
        featureInput.value = "";
    } else {
        showToast("You can add a maximum of 3 features.", "error");
    }
});

async function readFiles(files) {
    const filePromises = Array.from(files).map(file => readFileAsDataURL(file));
    return Promise.all(filePromises);
}

const addImageBtn = document.getElementById("add-image-btn");
const imageUploadInput = document.getElementById("image-upload");
const imageFileList = document.getElementById("image-file-list");
const imageWarning = document.getElementById("image-warning");

let selectedImages = [];

addImageBtn.addEventListener("click", () => {
    imageUploadInput.click();
});

imageUploadInput.addEventListener("change", async function () {
    if (selectedImages.length + this.files.length > 5) {
        imageWarning.style.display = "block";
        this.value = "";
        return;
    }
    imageWarning.style.display = "none";

    const newImages = await Promise.all(Array.from(this.files).map(async (file) => {
        return {
            name: file.name,
            data: await readFileAsDataURL(file)
        };
    }));

    selectedImages.push(...newImages);
    updateImageList();
    this.value = "";
});

function updateImageList() {
    imageFileList.innerHTML = "";
    selectedImages.forEach((imageObj, index) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.marginBottom = "5px";

        const span = document.createElement("span");
        span.textContent = imageObj.name;
        span.style.marginRight = "10px";
        span.style.fontWeight = "500";

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.style.backgroundColor = "#ff4d4d";
        removeBtn.style.color = "white";
        removeBtn.style.border = "none";
        removeBtn.style.borderRadius = "4px";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.padding = "5px";
        removeBtn.addEventListener("click", () => {
            selectedImages.splice(index, 1);
            updateImageList();
        });

        li.appendChild(span);
        li.appendChild(removeBtn);
        imageFileList.appendChild(li);
    });
}

const formRules = {
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
};



document.getElementById('add-car-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formElement = document.getElementById('add-car-form');
    const formData = new FormData(formElement);

    const formObject = {
        carName: formData.get('car-name').trim(),
        categoryId: formData.get('category').trim(),
        city: formData.get('city').trim(),
        description: formData.get('description').trim(),
        carType: formData.get('car-type').trim().toLowerCase(),
        features: Array.from(featuresList.children).map(li => li.querySelector('span').textContent.trim()),
        isAvailableForLocal: formData.get('available-local') === 'on',
        isAvailableForOutstation: formData.get('available-outstation') === 'on',
        localPrice: parseFloat(formData.get('local-price')) || 0,
        maxKmPerHour: parseFloat(formData.get('max-km-per-hour')) || 0,
        extraHourRate: parseFloat(formData.get('extra-hour-rate')) || 0,
        extraKmRate: parseFloat(formData.get('extra-km-rate')) || 0,
        outstationPrice: parseFloat(formData.get('outstation-price')) || 0,
        pricePerKm: parseFloat(formData.get('price-per-km')) || 0,
        minimumKmChargeable: parseFloat(formData.get('minimum-km-chargeable')) || 0,
        maxKmLimitPerDay: parseFloat(formData.get('minimum-km-chargeable')) + 100 || 0,
        extraDayRate: parseFloat(formData.get('extra-day-rate')) || 0,
        extraHourlyRate: parseFloat(formData.get('extra-hourly-rate')) || 0,
        extraKmRateOutstation: parseFloat(formData.get('extra-km-rate-outstation')) || 0
    };

    const errors = validateForm(formObject, formRules);

    if (Object.keys(errors).length > 0) {
        Object.keys(errors).forEach(field => {
            const errorElement = document.getElementById(`${field}-error`);
            errorElement.textContent = errors[field];
            errorElement.style.display = "block";
        });
        showToast("Please fill in all required fields correctly.", "error");
        return;
    }

    if (selectedImages.length === 0) {
        showToast("Please upload at least one image.", "error");
        return;
    }

    if (selectedImages.length > 5) {
        showToast("You can upload a maximum of 5 images.", "error");
        return;
    }

    if (formObject.features.length > 3) {
        showToast("You can add a maximum of 3 features.", "error");
        return;
    }

    const category = await getAllItems("categories").then(categories => categories.find(cat => cat.categoryId === formObject.categoryId));
    if (!category) {
        showToast("Invalid category selected.", "error");
        return;
    }

    const car = {
        carId: generateRandomId(),
        owner: {
            userId: user.userId,
            username: user.username,
            email: user.email,
            role: user.role,
            isApproved: user.isApproved,
            avgRating: user.avgRating,
            ratingCount: user.ratingCount,
            paymentPreference: user.paymentPreference
        },
        carName: formObject.carName,
        category: {
            categoryId: formObject.categoryId,
            categoryName: category.categoryName
        },
        city: formObject.city,
        description: formObject.description,
        images: selectedImages.map(img => img.data),
        isAvailableForLocal: formObject.isAvailableForLocal,
        isAvailableForOutstation: formObject.isAvailableForOutstation,
        avgRating: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString(),
        featured: formObject.features,
        carType: formObject.carType,
        rentalOptions: {
            local: {
                pricePerHour: formObject.localPrice,
                maxKmPerHour: formObject.maxKmPerHour,
                extraHourRate: formObject.extraHourRate,
                extraKmRate: formObject.extraKmRate
            },
            outstation: {
                pricePerDay: formObject.outstationPrice,
                pricePerKm: formObject.pricePerKm,
                minimumKmChargeable: formObject.minimumKmChargeable,
                maxKmLimitPerDay: formObject.maxKmLimitPerDay,
                extraDayRate: formObject.extraDayRate,
                extraHourlyRate: formObject.extraHourlyRate,
                extraKmRate: formObject.extraKmRateOutstation
            }
        }
    };

    await addItem("cars", car);
    showToast("Car added successfully!", "success");
    window.location.href = "../view/view-cars.html";
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

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

highlightActiveLink();
