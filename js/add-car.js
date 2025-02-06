import { getAllItems, addItem } from "../js/utils/dbUtils.js";
import { getCookie } from "../js/utils/cookie.js";
import { checkAuth, logout } from "../js/utils/auth.js";
import { generateRandomId } from "../js/utils/generateId.js";

// List of all cities in India
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

// Populate categories
getAllItems("categories").then(categories => {
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.categoryId;
        option.textContent = category.categoryName;
        categorySelect.appendChild(option);
    });
});

// Populate city list
cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    cityList.appendChild(option);
});

// Add feature to the list
addFeatureBtn.addEventListener('click', () => {
    const feature = featureInput.value.trim();
    if (feature && featuresList.children.length < 3) {
        const li = document.createElement('li');
        li.textContent = feature;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            featuresList.removeChild(li);
        });
        li.appendChild(removeBtn);
        featuresList.appendChild(li);
        featureInput.value = '';
    } else if (featuresList.children.length >= 3) {
        alert("You can add a maximum of 3 features.");
    }
});

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function readFiles(files) {
    const filePromises = Array.from(files).map(file => readFileAsDataURL(file));
    return Promise.all(filePromises);
}

document.getElementById('add-car-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const carName = document.getElementById('car-name').value.trim();
    const categoryId = document.getElementById('category').value.trim();
    const category = await getAllItems("categories").then(categories => categories.find(cat => cat.categoryId === categoryId));
    const city = document.getElementById('city').value.trim();
    const basePrice = parseFloat(document.getElementById('base-price').value.trim());
    const description = document.getElementById('description').value.trim();
    const availability = document.getElementById('availability').value.trim().toLowerCase();
    const images = await readFiles(document.getElementById('images').files);
    const carType = document.getElementById('car-type').value.trim().toLowerCase();
    const features = Array.from(featuresList.children).map(li => li.firstChild.textContent);

    if (features.length > 3) {
        alert("You can add a maximum of 3 features.");
        return;
    }

    const car = {
        carId: generateRandomId(),
        ownerId: getCookie("userId"),
        ownerName : getCookie("username"),
        carName,
        categoryId,
        categoryName: category.categoryName,
        city,
        basePrice,
        description,
        images,
        availability,
        avgRating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        featured: features,
        carType
    };

    await addItem("cars", car);
    alert("Car added successfully!");
    window.location.href = "./odashboard.html";
});

document.addEventListener("DOMContentLoaded", () => {

    if (!checkAuth) {
        window.location.href = "./login.html";
    }


    document.getElementById('logout-link').addEventListener('click', (event) => {
        event.preventDefault();
        logout();
    });
});