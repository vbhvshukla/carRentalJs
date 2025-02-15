import { getTotalItems, getAllItems, getItemByKey, updateItem, deleteItem, addItem, getItemsWithPagination } from "../utils/dbUtils.js";
import { setCookie, getCookie } from "../utils/cookie.js";
import { checkAuth } from "../utils/auth.js";
import { generateRandomId } from "../utils/generateId.js";

const ITEMS_PER_PAGE = 5;
const userId = getCookie("userId");
if (!userId) {
    window.location.href = "../views/login.html";
}
const user = await getItemByKey("users", userId);
let currentPageUsers = 1;
let currentPageCars = 1;
let userSortField = null;
let userSortDirection = 'asc';
let carSortField = null;
let carSortDirection = 'asc';

// if (!user || user.role !== "admin") {
//     window.location.href = "../views/login.html";
// }

async function loadUsers() {
    const users = await getAllItems("users");
    const userTableBody = document.getElementById("user-table").querySelector("tbody");
    userTableBody.innerHTML = "";

    if (userSortField) {
        users.sort((a, b) => {
            if (a[userSortField] < b[userSortField]) return userSortDirection === 'asc' ? -1 : 1;
            if (a[userSortField] > b[userSortField]) return userSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    const paginatedUsers = users.slice((currentPageUsers - 1) * ITEMS_PER_PAGE, currentPageUsers * ITEMS_PER_PAGE);

    paginatedUsers.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.rating || "N/A"}</td>
            <td>${user.ratingCount || 0}</td>
            <td>${user.isApproved ? "Yes" : "No"}</td>
            <td>
                <button class="button" onclick="showUserApprovalModal('${user.userId}')" ${user.isApproved ? "disabled" : ""}>Approve</button>
            </td>
        `;
        userTableBody.appendChild(row);
    });

    updatePaginationControls("user-pagination", currentPageUsers, users.length);
}

async function loadCars() {
    const cars = await getAllItems("cars");
    const carTableBody = document.getElementById("car-table").querySelector("tbody");
    carTableBody.innerHTML = "";

    if (carSortField) {
        cars.sort((a, b) => {
            if (a[carSortField] < b[carSortField]) return carSortDirection === 'asc' ? -1 : 1;
            if (a[carSortField] > b[carSortField]) return carSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    const paginatedCars = cars.slice((currentPageCars - 1) * ITEMS_PER_PAGE, currentPageCars * ITEMS_PER_PAGE);

    paginatedCars.forEach(car => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${car.carName}</td>
            <td>${car.categoryName}</td>
            <td>${car.ownerName}</td>
            <td>${car.city}</td>
            <td>$${car.basePrice}</td>
            <td>${car.rating || "N/A"}</td>
            <td>${car.ratingCount || 0}</td>
            <td>${car.availability ? "Yes" : "No"}</td>
        `;
        carTableBody.appendChild(row);
    });

    updatePaginationControls("car-pagination", currentPageCars, cars.length);
}

async function loadCategories() {
    const categories = await getAllItems("categories");
    const categoryTableBody = document.getElementById("category-table").querySelector("tbody");
    categoryTableBody.innerHTML = "";

    categories.forEach(category => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${category.categoryName}</td>
            <td>
                <button class="button button-danger" onclick="deleteCategory('${category.categoryId}')">Delete</button>
            </td>
        `;
        categoryTableBody.appendChild(row);
    });
}

async function loadAnalytics() {
    const analytics = [
        { title: "Total Users", value: 100 },
        { title: "Total Cars", value: 50 },
        { title: "Total Categories", value: 10 },
    ];
    const analyticsContainer = document.getElementById("analytics");
    analyticsContainer.innerHTML = "";

    analytics.forEach(item => {
        const div = document.createElement("div");
        div.innerHTML = `<strong>${item.title}:</strong> ${item.value}`;
        analyticsContainer.appendChild(div);
    });
}

function showUserApprovalModal(userId) {
    const modal = document.getElementById("user-approval-modal");
    const userDetails = document.getElementById("user-details");
    const approvalButtons = document.getElementById("approval-buttons");
    userDetails.innerHTML = "Loading...";
    approvalButtons.innerHTML = "";

    getItemByKey("users", userId).then(user => {
        userDetails.innerHTML = `
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Rating:</strong> ${user.rating || "N/A"}</p>
            <p><strong>Approved:</strong> ${user.isApproved ? "Yes" : "No"}</p>
            ${user.verificationFile ? (user.verificationFile.startsWith('data:image/') ? `<img src="${user.verificationFile}" alt="Verification Image" class="verification-image">` : `<a href="${user.verificationFile}" download>Download Verification File</a>`) : ''}
        `;
        approvalButtons.innerHTML = `
            <button class="button" onclick="approveUser()" ${user.isApproved ? "disabled" : ""}>Approve</button>
        `;
        modal.style.display = "block";
        modal.setAttribute("data-user-id", userId);
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "none";
}

async function approveUser() {
    const modal = document.getElementById("user-approval-modal");
    const userId = modal.getAttribute("data-user-id");
    const user = await getItemByKey("users", userId);
    user.isApproved = true;
    await updateItem("users", user);
    closeModal("user-approval-modal");
    loadUsers();
}

async function invalidateUser() {
    const modal = document.getElementById("user-approval-modal");
    const userId = modal.getAttribute("data-user-id");
    const user = await getItemByKey("users", userId);
    user.isApproved = false;
    await updateItem("users", user);
    closeModal("user-approval-modal");
    loadUsers();
}

async function deleteUser(userId) {
    if (confirm("Are you sure you want to delete this user?")) {
        const user = await getItemByKey("users", userId);
        user.isDeleted = true;
        await updateItem("users", user);
        loadUsers();
    }
}

async function deleteCar(carId) {
    if (confirm("Are you sure you want to delete this car?")) {
        const car = await getItemByKey("cars", carId);
        car.isDeleted = true;
        await updateItem("cars", car);
        loadCars();
    }
}

async function deleteCategory(categoryId) {
    if (confirm("Are you sure you want to delete this category?")) {
        await deleteItem("categories", categoryId);
        loadCategories();
    }
}

function showAddCategoryModal() {
    const modal = document.getElementById("add-category-modal");
    modal.style.display = "block";
}

function showAddUserModal() {
    const modal = document.getElementById("add-user-modal");
    modal.style.display = "block";
}

function showChangeRatingModal(type, id, currentRating, currentRatingCount) {
    const modal = document.getElementById("change-rating-modal");
    document.getElementById("new-rating").value = currentRating;
    document.getElementById("new-rating-count").value = currentRatingCount;
    modal.setAttribute("data-type", type);
    modal.setAttribute("data-id", id);
    modal.style.display = "block";
}

function logout() {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        const [name] = cookies[i].split("=");
        setCookie(name, "", -1);
    }
    window.location.href = "../views/index.html";
}

function updatePaginationControls(paginationId, currentPage, totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const paginationControls = document.getElementById(paginationId);
    paginationControls.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.className = "pagination-button";
        if (i === currentPage) {
            button.disabled = true;
        }
        button.addEventListener("click", () => {
            if (paginationId === "user-pagination") {
                currentPageUsers = i;
                loadUsers();
            } else if (paginationId === "car-pagination") {
                currentPageCars = i;
                loadCars();
            }
        });
        paginationControls.appendChild(button);
    }
}

document.getElementById("add-category-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const categoryName = document.getElementById("category-name").value.trim();
    if (categoryName) {
        await addItem("categories", { categoryId: generateRandomId(), categoryName: categoryName });
        closeModal("add-category-modal");
        loadCategories();
    }
});

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const loginSignupLink = document.getElementById('login-signup-link');
    const logoutLink = document.getElementById('logout-link');

    if (isAuthenticated) {
        loginSignupLink.style.display = 'none';
        logoutLink.style.display = 'block';
    } else {
        loginSignupLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }
}

async function loadCarsWithPagination(page = 1) {
    const cars = await getItemsWithPagination("cars", page, ITEMS_PER_PAGE);
    const carTableBody = document.getElementById("car-table").querySelector("tbody");
    carTableBody.innerHTML = "";

    if (carSortField) {
        cars.sort((a, b) => {
            if (a[carSortField] < b[carSortField]) return carSortDirection === 'asc' ? -1 : 1;
            if (a[carSortField] > b[carSortField]) return carSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    cars.forEach(car => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${car.carName}</td>
            <td>${car.categoryName}</td>
            <td>${car.ownerName}</td>
            <td>${car.city}</td>
            <td>${car.basePrice}</td>
            <td>${car.rating || "N/A"}</td>
            <td>${car.ratingCount || 0}</td>
            <td>${car.availability ? "Yes" : "No"}</td>
        `;
        carTableBody.appendChild(row);
    });

    updatePaginationControls("car-pagination", page, await getTotalItems("cars"));
}

async function loadUsersWithPagination(page = 1) {
    const users = await getItemsWithPagination("users", page, ITEMS_PER_PAGE);
    const userTableBody = document.getElementById("user-table").querySelector("tbody");
    userTableBody.innerHTML = "";

    if (userSortField) {
        users.sort((a, b) => {
            if (a[userSortField] < b[userSortField]) return userSortDirection === 'asc' ? -1 : 1;
            if (a[userSortField] > b[userSortField]) return userSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.rating || "N/A"}</td>
            <td>${user.ratingCount || 0}</td>
            <td>${user.isApproved ? "Yes" : "No"}</td>
            <td>
                <button class="button" onclick="showUserApprovalModal('${user.userId}')" ${user.isApproved ? "disabled" : ""}>Approve</button>
            </td>
        `;
        userTableBody.appendChild(row);
    });

    updatePaginationControls("user-pagination", page, await getTotalItems("users"));
}

function addSortingEventListeners() {
    const userTableHeaders = document.querySelectorAll("#user-table th[data-field]");
    userTableHeaders.forEach(header => {
        header.addEventListener("click", () => {
            const field = header.getAttribute("data-field");
            if (userSortField === field) {
                userSortDirection = userSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                userSortField = field;
                userSortDirection = 'asc';
            }
            loadUsers();
        });
    });

    const carTableHeaders = document.querySelectorAll("#car-table th[data-field]");
    carTableHeaders.forEach(header => {
        header.addEventListener("click", () => {
            const field = header.getAttribute("data-field");
            if (carSortField === field) {
                carSortDirection = carSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                carSortField = field;
                carSortDirection = 'asc';
            }
            loadCars();
        });
    });
}

loadUsersWithPagination();
loadCarsWithPagination();
loadCategories();
updateNavLinks();
addSortingEventListeners();

window.showUserApprovalModal = showUserApprovalModal;
window.closeModal = closeModal;
window.approveUser = approveUser;
window.invalidateUser = invalidateUser;
window.deleteUser = deleteUser;
window.deleteCar = deleteCar;
window.deleteCategory = deleteCategory;
window.showAddCategoryModal = showAddCategoryModal;
window.showAddUserModal = showAddUserModal;
window.showChangeRatingModal = showChangeRatingModal;