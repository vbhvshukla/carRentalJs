import { getAllItems, addItem, getItemByKey } from "../utils/dbUtils.js";
import { getCookie } from "../utils/cookie.js";
import { checkAuth, logout } from "../utils/auth.js";
import { generateRandomId } from "../utils/generateId.js";
import { readFileAsDataURL } from "../utils/readFile.js";

const userId = getCookie("userId");
const user = await getItemByKey("users", userId);
if (!user || user.role !== "owner" || !user.isApproved) {
    alert("Access Denied: You are not authorized to view this page.");
    window.location.href = user.role === "customer" ? "./udashboard.html" : "./login.html";
}


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

const categorySelect = document.getElementById('category');
const cityList = document.getElementById('city-list');
const featuresList = document.getElementById('features-list');
const featureInput = document.getElementById('feature-input');
const addFeatureBtn = document.getElementById('add-feature-btn');

getAllItems("categories").then(categories => {
    if (categories.length === 0) {
        alert("No categories found. Please add categories first.");
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
        alert("Feature is empty or already added!");
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
        alert("You can add a maximum of 3 features.");
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

document.getElementById('add-car-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const carName = document.getElementById('car-name').value.trim();
    const categoryId = document.getElementById('category').value.trim();
    const category = await getAllItems("categories").then(categories => categories.find(cat => cat.categoryId === categoryId));
    const city = document.getElementById('city').value.trim();
    const basePrice = parseFloat(document.getElementById('base-price').value.trim());
    const description = document.getElementById('description').value.trim();
    const carType = document.getElementById('car-type').value.trim().toLowerCase();
    const features = Array.from(featuresList.children).map(li => li.querySelector('span').textContent.trim());

    if (selectedImages.length === 0) {
        alert("Please upload at least one image.");
        return;
    }

    if (selectedImages.length > 5) {
        alert("You can upload a maximum of 5 images.");
        return;
    }

    if (!category) {
        alert("Invalid category selected.");
        return;
    }

    if (!carName || !categoryId || !city || isNaN(basePrice) || !description || !carType) {
        alert("Please fill in all required fields.");
        return;
    }

    if (features.length > 3) {
        alert("You can add a maximum of 3 features.");
        return;
    }

    const car = {
        carId: generateRandomId(),
        ownerId: getCookie("userId"),
        ownerName: getCookie("username"),
        carName,
        categoryId,
        categoryName: category.categoryName,
        city,
        basePrice,
        description,
        images: selectedImages.map(img => img.data),
        availability: "available",
        avgRating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        featured: features,
        carType
    };

    await addItem("cars", car);
    alert("Car added successfully!");
    window.location.href = "./view-cars.html";
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
