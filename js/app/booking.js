import { getItemByKey, getAllItemsByIndex, addItem, updateItem } from "../utils/dbUtils.js";
import { generateRandomId } from "../utils/generateId.js";
import { getCookie } from "../utils/cookie.js";
import { checkAuth, logout } from "../utils/auth.js";
import { showToast } from "../utils/toastUtils.js";



const carId = getCarIdFromURL();
const userId = getCookie("userId");
if (!userId) window.location.href = `./login.html?carId=${carId}`;

function getCarIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('carId');
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function renderCarDetails() {
    const totalPriceDiv = document.getElementById("total-price-container");
    totalPriceDiv.style.display = "none";
    const carId = getCarIdFromURL();
    if (!carId) {
        showToast("Car not found.","error");
        return;
    }

    const car = await getItemByKey("cars", carId);
    if (!car) {
        showToast("Car not found.","error");
        return;
    }

    if (car.ownerId === userId) {
        showToast("You cannot book your own car.","error");
        window.location.href = "./index.html";
        return;
    }

    document.getElementById("car-name").textContent = car.carName;
    document.getElementById("base-price").textContent = car.basePrice;
    document.getElementById("car-description").textContent = car.description;
    document.getElementById("owner-name").textContent = car.ownerName;
    document.getElementById("car-city").textContent = car.city;
    document.getElementById("category-name").textContent = car.categoryName;
    document.getElementById("featured").textContent = car.featured.join(', ');
    document.getElementById("current-price").textContent = car.basePrice;

    const carImages = document.getElementById("car-images");
    carImages.innerHTML = car.images.map(image => `<img src="${image}" alt="Car Image">`).join('');

    await disableBookedDates(carId);

    document.getElementById("start-date").addEventListener("change", handleDateChange);
    document.getElementById("end-date").addEventListener("change", handleDateChange);
    document.getElementById("bid-amount").addEventListener("input", handleDateChange);

    document.getElementById("submit-bid").addEventListener("click", async (event) => {
        event.preventDefault();
        const startDate = document.getElementById("start-date").value;
        const endDate = document.getElementById("end-date").value;
        const bidAmount = parseFloat(document.getElementById("bid-amount").value);
        const existingBookings = await getAllItemsByIndex("bookings", "carId", carId);
        const isOverlapping = existingBookings.some(booking =>
            isDateRangeOverlap(new Date(booking.from), new Date(booking.to), new Date(startDate), new Date(endDate))
        );

        if (isOverlapping) {
            showToast("This car is already booked for the selected dates. Please choose a different date range.","error");
            return;
        }
        if (!startDate || !endDate || !bidAmount) {
            showToast("Please fill all fields.","error");
            return;
        }

        if (new Date(startDate) < new Date()) return showToast("Start date cannot be before today's date.","error");


        if (new Date(startDate) > new Date(endDate)) {
            showToast("Start date must be before end date.","error");
            return;
        }

        if (bidAmount < car.basePrice) {
            showToast("Your bid must be higher than the base price of the car!","error");
            return;
        }

        const bid = {
            bidId: generateRandomId('bid'),
            userId,
            username: getCookie("username"),
            carId,
            carName: car.carName,
            ownerId: car.ownerId,
            categoryId: car.categoryId,
            ownerName: car.ownerName,
            bidAmount,
            from: startDate,
            to: endDate,
            status: "pending",
            createdAt: new Date().toISOString().split('T')[0]
        };

        await addItem("bids", bid);
        showToast("Bid placed successfully!","info");
        window.location.href = "./mybiddings.html";
    });

    async function handleDateChange() {
        const startDate = document.getElementById("start-date").value;
        const endDate = document.getElementById("end-date").value;
        const bidAmount = parseFloat(document.getElementById("bid-amount").value);
        const totalPriceDiv = document.getElementById("total-price-container");

        if (startDate && endDate && new Date(startDate) <= new Date(endDate)) {
            const overlappingBids = await getOverlappingBids(carId, startDate, endDate);
            const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
            const price = bidAmount || car.basePrice;
            const totalPrice = days * price;
            document.getElementById('total-price').textContent = totalPrice.toFixed(2);
            totalPriceDiv.style.display = "block";
            renderOverlappingBids(overlappingBids);
        } else {
            totalPriceDiv.style.display = "none";
            document.getElementById('total-price').textContent = '';
            document.getElementById("other-bids-list").innerHTML = "";
        }
    }

    async function getOverlappingBids(carId, startDate, endDate) {
        const allBids = await getAllItemsByIndex("bids", "carId", carId);
        return allBids.filter(bid => isDateRangeOverlap(new Date(bid.from), new Date(bid.to), new Date(startDate), new Date(endDate)));
    }

    function isDateRangeOverlap(startDate1, endDate1, startDate2, endDate2) {
        return (startDate1 <= endDate2 && endDate1 >= startDate2);
    }

    function renderOverlappingBids(bids) {
        const otherBidsList = document.getElementById("other-bids-list");
        otherBidsList.innerHTML = "";
        if (bids.length === 0) {
            otherBidsList.innerHTML = "<li>No other bids in the selected date range.</li>";
            return;
        }
        bids.forEach(bid => {
            const li = document.createElement("li");
            li.textContent = `Current Highest Bid : $${bid.bidAmount} -> Date Range ${bid.from} to ${bid.to}`;
            otherBidsList.appendChild(li);
        });
    }

    const chatId = `${userId}_${car.ownerId}_${carId}`;

    document.getElementById("send-chat-message-btn").addEventListener("click", async () => {
        const messageInput = document.getElementById("chat-message-input");
        const fileInput = document.getElementById("chat-file-input");
        const message = messageInput.value.trim();
        const file = fileInput.files[0];
        if (message || file) {
            await sendMessage(chatId, userId, car.ownerId, message, file);
            messageInput.value = "";
            fileInput.value = "";
            renderChatMessages(car.ownerId);
        }
    });

    renderChatMessages(car.ownerId);
}

async function sendMessage(chatId, fromUserId, toUserId, message, file) {
    const newMessage = {
        messageId: generateRandomId('msg'),
        chatId,
        fromUserId,
        toUserId,
        message,
        createdAt: new Date().toISOString(),
        hasAttachment: !!file,
        attachment: file ? await readFileAsDataURL(file) : null
    };

    await addItem("messages", newMessage);

    const conversation = await getItemByKey("conversations", chatId) || {
        chatId,
        participants: [fromUserId, toUserId],
        lastMessage: '',
        lastTimestamp: ''
    };

    conversation.lastMessage = message;
    conversation.lastTimestamp = newMessage.createdAt;

    await updateItem("conversations", conversation);
}

async function renderChatMessages(ownerId) {
    const allMessages = await getAllItemsByIndex("messages", "chatId", `${userId}_${ownerId}_${getCarIdFromURL()}`);
    const chatMessagesContainer = document.getElementById("chat-messages");
    chatMessagesContainer.innerHTML = "";

    allMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (allMessages.length === 0) {
        const car = await getItemByKey("cars", getCarIdFromURL());
        chatMessagesContainer.innerHTML = `<div class="chat-message">Say Hi to ${car.ownerName}</div>`;
        return;
    }

    allMessages.forEach(msg => {
        const messageElement = document.createElement("div");
        messageElement.className = `chat-message ${msg.fromUserId === userId ? 'message-you' : 'message-owner'}`;
        messageElement.innerHTML = `
    <div class="message-content">
        <span class="message-text">
            <strong>${msg.fromUserId === userId ? 'You' : 'Owner'}:</strong> ${msg.message}
        </span>
        <span class="timestamp">${new Date(msg.createdAt).toLocaleString()}</span>
    </div>
    ${msg.hasAttachment ? (msg.attachment.startsWith('data:image/') ?
                `<div class="attachment"><img src="${msg.attachment}" alt="Attachment"></div>` :
                `<div class="attachment"><a href="${msg.attachment}" download>Download</a></div>`) : ''}
    `;
        chatMessagesContainer.appendChild(messageElement);
    });

}

async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    // const loginSignupLink = document.getElementById('login-signup-link');
    const logoutLink = document.getElementById('logout-link');
    const userDashboard = document.getElementById('user-dashboard-link');
    const ownerDashboard = document.getElementById('owner-dashboard-link');

    if (isAuthenticated) {
        userDashboard.style.display = 'block';
        // loginSignupLink.style.display = 'none';
        logoutLink.style.display = 'block';

        const userId = getCookie("userId");
        const user = await getItemByKey("users", userId);
        const role = user.role;
        const isApproved = user.isApproved;

        if (role === "owner" && isApproved) {
            ownerDashboard.style.display = 'block';
        } else {
            ownerDashboard.style.display = 'none';
        }
    } else {
        userDashboard.style.display = 'none';
        ownerDashboard.style.display = 'none';
        // loginSignupLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }
}

async function disableBookedDates(carId) {
    const bookings = await getAllItemsByIndex("bookings", "carId", carId);
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");

    const disabledDates = new Set();
    bookings.forEach(booking => {
        let currentDate = new Date(booking.from);
        const toDate = new Date(booking.to);
        while (currentDate <= toDate) {
            disabledDates.add(currentDate.toISOString().split("T")[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    startDateInput.addEventListener("input", function () {
        endDateInput.disabled = false;
        endDateInput.min = this.value;

        const selectedStartDate = new Date(this.value);
        let minValidEndDate = new Date(selectedStartDate);
        minValidEndDate.setDate(minValidEndDate.getDate() + 1);

        while (disabledDates.has(minValidEndDate.toISOString().split("T")[0])) {
            minValidEndDate.setDate(minValidEndDate.getDate() + 1);
        }

        endDateInput.min = minValidEndDate.toISOString().split("T")[0];
    });

    startDateInput.addEventListener("focus", function () {
        this.setAttribute("min", new Date().toISOString().split("T")[0]);

        this.addEventListener("change", function () {
            if (disabledDates.has(this.value)) {
                showToast("This date is already booked. Please select a different date.","error");
                this.value = "";
            }
        });
    });

    endDateInput.addEventListener("focus", function () {
        this.addEventListener("change", function () {
            if (disabledDates.has(this.value)) {
                showToast("This date is already booked. Please select a different date.","error");
                this.value = "";
            }
        });
    });
}

renderCarDetails();
updateNavLinks();
document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

document.getElementById("send-chat-message-btn").addEventListener("click", function (event) {
    const message = document.getElementById("chat-message-input").value.trim();
    const file = document.getElementById("chat-file-input").files[0];

    if (!message && !file) {
        showToast("Please enter a message or select a file.","error");
        event.preventDefault();
    }
});

document.getElementById('bid-amount').addEventListener('input', function () {
    if (this.value.includes('-')) {
        showToast("Please enter a valid number", "error");
        this.value = '';
    }
    else if (parseFloat(this.value) > 1000) {
        showToast("Bid amount cannot exceed 1000", "error");
        this.value = '';
    }
});

document.getElementById('start-date').addEventListener('change', function () {
    const startDate = this.value;
    const endDateInput = document.getElementById('end-date');
    endDateInput.min = startDate;
});