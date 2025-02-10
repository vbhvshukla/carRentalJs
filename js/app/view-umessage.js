import { getItemByIndex, getItemByKey, getAllItemsByIndex, addItem, updateItem } from "../utils/dbUtils.js";
import { generateRandomId } from "../utils/generateId.js";
import { getCookie } from "../utils/cookie.js";
import { checkAuth, logout } from "../utils/auth.js";

const userId = getCookie("userId");
if (!userId) window.location.href = "./login.html";

function getChatIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chatId');
    return chatId;
}

function getCarIdFromChatId(chatId) {
    const parts = chatId.split('_');
    return parts[parts.length - 1];
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
                alert("This date is already booked. Please select a different date.");
                this.value = "";
            }
        });
    });

    endDateInput.addEventListener("focus", function () {
        this.addEventListener("change", function () {
            if (disabledDates.has(this.value)) {
                alert("This date is already booked. Please select a different date.");
                this.value = "";
            }
        });
    });
}

async function renderCarDetails() {
    const totalPriceDiv = document.getElementById("total-price-container");
    totalPriceDiv.style.display = "none";
    const chatId = getChatIdFromURL();
    const carId = getCarIdFromChatId(chatId);
    if (!carId) {
        alert("Car not found.");
        return;
    }
    const car = await getItemByKey("cars", carId);
    if (!car) {
        alert("Car not found.");
        return;
    }
    await disableBookedDates(carId);
    document.getElementById("start-date").addEventListener("change", handleDateChange);
    document.getElementById("end-date").addEventListener("change", handleDateChange);
    document.getElementById("bid-amount").addEventListener("input", handleDateChange);

    document.getElementById("current-price").textContent = car.basePrice;
    document.getElementById("owner-name").textContent = car.ownerName;

    document.getElementById("bid-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const startDate = document.getElementById("start-date").value;
        const endDate = document.getElementById("end-date").value;
        const bidAmount = parseFloat(document.getElementById("bid-amount").value);
        const existingBookings = await getAllItemsByIndex("bookings", "carId", carId);
        const isOverlapping = existingBookings.some(booking =>
            isDateRangeOverlap(new Date(booking.from), new Date(booking.to), new Date(startDate), new Date(endDate))
        );

        if (isOverlapping) {
            alert("This car is already booked for the selected dates. Please choose a different date range.");
            return;
        }
        if (!startDate || !endDate || !bidAmount) {
            alert("Please fill all fields.");
            return;
        }

        if (new Date(startDate) < new Date()) return alert("Start date cannot be before today's date.");


        if (new Date(startDate) >= new Date(endDate)) {
            alert("Start date must be before end date.");
            return;
        }

        if (bidAmount < car.basePrice) {
            alert("Your bid must be higher than the base price of the car!");
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
        const message = `New bid placed by ${getCookie("username")} for ${car.carName} from ${startDate} to ${endDate} with a bid amount of $${bidAmount}.`;
        await sendMessage(chatId, userId, car.ownerId, message);
        alert("Bid placed successfully!");
    });
    async function handleDateChange() {
        const startDate = document.getElementById("start-date").value;
        const endDate = document.getElementById("end-date").value;
        const bidAmount = parseFloat(document.getElementById("bid-amount").value);
        const totalPriceDiv = document.getElementById("total-price-container");

        if (startDate && endDate && new Date(startDate) < new Date(endDate)) {
            const overlappingBids = await getOverlappingBids(carId, startDate, endDate);
            const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
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
            li.textContent = `Existing Bids from ${bid.from} to ${bid.to} Current highest bid :  $${bid.bidAmount}`;
            otherBidsList.appendChild(li);
        });
    }

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

async function sendMessage(chatId, fromUserId, toUserId, message, file = null) {
    const newMessage = {
        messageId: generateRandomId(),
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

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

document.getElementById('bid-amount').addEventListener('input', function () {
    if (this.value < 0) {
        alert("Please enter a valid number");
        this.value = '';
    }
});

async function renderChatMessages(ownerId) {
    const allMessages = await getAllItemsByIndex("messages", "chatId", `${userId}_${ownerId}_${getCarIdFromChatId(getChatIdFromURL())}`);
    const ownerName = await getItemByKey("users", ownerId);
    const chatMessagesContainer = document.getElementById("chat-messages");
    chatMessagesContainer.innerHTML = "";
    allMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    allMessages.forEach(msg => {
        const messageElement = document.createElement("div");
        messageElement.className = `chat-message ${msg.fromUserId === userId ? 'message-you' : 'message-owner'}`;
        messageElement.innerHTML = `
            <div><strong>${msg.fromUserId === userId ? 'You' : ownerName.username}:</strong> ${msg.message}</div>
${msg.hasAttachment ?
                (msg.attachment.startsWith('data:image/') ?
                    `<div><img src="${msg.attachment}" class="chat-attachment"></div>` :
                    `<div><strong>Attachment:</strong> <a href="${msg.attachment}" download><svg>📎</svg></a></div>`)
                : ''
            }                    <div class="timestamp"> ${new Date(msg.createdAt).toLocaleString()}</div>
        `;
        chatMessagesContainer.appendChild(messageElement);
    });
}

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});


document.getElementById('start-date').addEventListener('change', function () {
    const startDate = this.value;
    const endDateInput = document.getElementById('end-date');
    endDateInput.min = startDate;
});

renderCarDetails();
updateNavLinks();

const modal = document.getElementById("bid-modal");
const btn = document.getElementById("place-bid-btn");
const span = document.getElementsByClassName("close")[0];

btn.onclick = function () {
    modal.style.display = "block";
}

span.onclick = function () {
    modal.style.display = "none";
}


async function updateNavLinks() {
    const isAuthenticated = await checkAuth();
    const logoutLink = document.getElementById('logout-link');
    const userDashboard = document.getElementById('user-dashboard-link');
    const ownerDashboard = document.getElementById('owner-dashboard-link');

    if (isAuthenticated) {
        userDashboard.style.display = 'block';
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
        logoutLink.style.display = 'none';
    }
}

