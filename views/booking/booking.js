import { getItemByKey, getAllItemsByIndex, addItem, updateItem } from "../../js/utils/dbUtils.js";
import { generateRandomId } from "../../js/utils/generateId.js";
import { getCookie } from "../../js/utils/cookie.js";
import { checkAuth, logout } from "../../js/utils/auth.js";
import { showToast } from "../../js/utils/toastUtils.js";

const carId = getCarIdFromURL();
const userId = getCookie("userId");
if (!userId) window.location.href = `../login/login.html?carId=${carId}`;

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
//Render car details
async function renderCarDetails() {
    const totalPriceDiv = document.getElementById("total-price-container");
    totalPriceDiv.style.display = "none";
    const carId = getCarIdFromURL();
    if (!carId) {
        showToast("Car not found.", "error");
        return;
    }

    const car = await getItemByKey("cars", carId);
    
    if (!car) {
        showToast("Car not found.", "error");
        return;
    }

    if (car.owner.userId === userId) {
        showToast("You cannot book your own car.", "error");
        window.location.href = "../index.html";
        return;
    }

    document.getElementById("car-name").textContent = car.carName;
    document.getElementById("car-description").textContent = car.description;
    document.getElementById("owner-name").textContent = car.owner.username;
    document.getElementById("car-city").textContent = car.city;
    document.getElementById("category-name").textContent = car.category.categoryName;
    document.getElementById("featured").textContent = car.featured.join(', ');

    const carImages = document.getElementById("car-images");
    carImages.innerHTML = car.images.map(image => `<img src="${image}" alt="Car Image">`).join('');

    document.getElementById("local-charges").textContent = `Local: ₹${car.rentalOptions.local.pricePerHour} per hour`;
    document.getElementById("outstation-charges").textContent = `Outstation: ₹${car.rentalOptions.outstation.pricePerDay} per day`;

    if (car.isAvailableForLocal) {
        document.getElementById("local-charges").style.display = "inline-block";
    } else {
        document.getElementById("local-charges").style.display = "none";
    }

    if (car.isAvailableForOutstation) {
        document.getElementById("outstation-charges").style.display = "inline-block";
    } else {
        document.getElementById("outstation-charges").style.display = "none";
    }

    await disableBookedDates(carId);

    document.getElementById("start-date-local").addEventListener("change", handleDateChange);
    document.getElementById("end-date-local").addEventListener("change", handleDateChange);
    document.getElementById("start-date-outstation").addEventListener("change", handleDateChange);
    document.getElementById("end-date-outstation").addEventListener("change", handleDateChange);
    document.getElementById("bid-amount").addEventListener("input", handleDateChange);
    document.getElementById("local-button").addEventListener("click", () => toggleRentalType("local", car));
    document.getElementById("outstation-button").addEventListener("click", () => toggleRentalType("outstation", car));

    if (car.isAvailableForLocal) {
        toggleRentalType("local", car);
    } else if (car.isAvailableForOutstation) {
        toggleRentalType("outstation", car);
    }

    document.getElementById("submit-bid").addEventListener("click", async (event) => {
        event.preventDefault();
        const localForm = document.getElementById("local-form");
        const outstationForm = document.getElementById("outstation-form");
        const rentalType = localForm.style.display === "block" ? "local" : "outstation";
        const startDate = rentalType === "local" ? document.getElementById("start-date-local").value : document.getElementById("start-date-outstation").value;
        const endDate = rentalType === "local" ? document.getElementById("end-date-local").value : document.getElementById("end-date-outstation").value;
        const bidAmount = parseFloat(document.getElementById("bid-amount").value);


        // Validate each field individually
        if (rentalType === "local" && (new Date(endDate) - new Date(startDate)) < 60 * 60 * 1000) {
            showToast("Local rentals must be booked for at least 1 hour.", "error");
            return;
        }        if (!startDate) {
            showToast("Start date is required.", "error");
            return;
        }
        if (isNaN(Date.parse(startDate))) {
            showToast("Start date must be a valid date.", "error");
            return;
        }
        if (!endDate) {
            showToast("End date is required.", "error");
            return;
        }
        if (isNaN(Date.parse(endDate))) {
            showToast("End date must be a valid date.", "error");
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            showToast("End date must be after start date.", "error");
            return;
        }
        if (isNaN(bidAmount) || bidAmount <= 0) {
            showToast("Bid amount must be a valid number greater than 0.", "error");
            return;
        }
        if (!rentalType) {
            showToast("Rental type is required.", "error");
            return;
        }

        const existingBookings = await getAllItemsByIndex("bookings", "carId", carId);
        const isOverlapping = existingBookings.some(booking =>
            isDateRangeOverlap(new Date(booking.fromTimestamp), new Date(booking.toTimestamp), new Date(startDate), new Date(endDate))
        );
        if (isOverlapping) {
            showToast("This car is already booked for the selected dates. Please choose a different date range.", "error");
            return;
        }
        if (new Date(startDate) < new Date().setHours(0, 0, 0, 0)) {
            showToast("Start date cannot be before today's date.", "error");
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            showToast("Start date must be before end date.", "error");
            return;
        }
        if (rentalType === "local" && (new Date(endDate) - new Date(startDate)) > 24 * 60 * 60 * 1000) {
            showToast("Local rentals can only be booked for less than 24 hours.", "error");
            return;
        }
        const basePrice = rentalType === "local" ? car.rentalOptions.local.pricePerHour : car.rentalOptions.outstation.pricePerDay;
        if (bidAmount < basePrice) {
            showToast(`Your bid must be higher than the base price of the car! (₹${basePrice})`, "error");
            return;
        }

        const user = await getItemByKey("users", userId);

        const bid = {
            bidId: generateRandomId('bid'),
            fromTimestamp: startDate,
            toTimestamp: endDate,
            status: "pending",
            createdAt: new Date().toISOString(),
            bidAmount,
            rentalType,
            bidBaseFare: basePrice,
            user: {
                userId: user.userId,
                username: user.username,
                email: user.email,
                role: user.role,
                paymentPreference: user.paymentPreference,
                avgRating: user.avgRating,
                ratingCount: user.ratingCount
            },
            car: {
                carId,
                carName: car.carName,
                carType: car.carType,
                city: car.city,
                createdAt: car.createdAt,
                description: car.description,
                isAvailableForLocal: car.isAvailableForLocal,
                isAvailableForOutstation: car.isAvailableForOutstation,
                avgRating: car.avgRating,
                ratingCount: car.ratingCount,
                images: car.images,
                featured: car.featured,
                category: {
                    categoryId: car.category.categoryId,
                    categoryName: car.category.categoryName
                },
                owner: {
                    userId: car.owner.userId,
                    username: car.owner.username,
                    email: car.owner.email,
                    role: car.owner.role,
                    isApproved: car.owner.isApproved,
                    avgRating: car.owner.avgRating,
                    ratingCount: car.owner.ratingCount,
                    paymentPreference: car.owner.paymentPreference
                },
                rentalOptions: car.rentalOptions
            }
        };
        await addItem("bids", bid);
        showToast("Bid placed successfully!", "info");
        window.location.href = "../user-dashboard/mybiddings/mybiddings.html"; 
    });

    async function handleDateChange() {
        const localForm = document.getElementById("local-form");
        const outstationForm = document.getElementById("outstation-form");
        const rentalType = localForm.style.display === "block" ? "local" : "outstation";
        const startDate = rentalType === "local" ? document.getElementById("start-date-local").value : document.getElementById("start-date-outstation").value;
        const endDate = rentalType === "local" ? document.getElementById("end-date-local").value : document.getElementById("end-date-outstation").value;
        const bidAmount = parseFloat(document.getElementById("bid-amount").value);
        const totalPriceDiv = document.getElementById("total-price-container");
        const priceBreakupDiv = document.getElementById("price-breakup-container");
        const currentPriceSpan = document.getElementById("current-price");

        const basePrice = rentalType === "local" ? car.rentalOptions.local.pricePerHour : car.rentalOptions.outstation.pricePerDay;
        currentPriceSpan.textContent = basePrice.toFixed(2);

        if (startDate && endDate && new Date(startDate) <= new Date(endDate) && !isNaN(bidAmount) && bidAmount > 0) {
            const overlappingBids = await getOverlappingBids(carId, startDate, endDate);
            const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
            const totalPrice = rentalType === "local" ? basePrice * ((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60)) : days * basePrice;
            const totalBidAmount = rentalType === "local" ? bidAmount * ((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60)) : days * bidAmount;

            document.getElementById('total-price').textContent = totalBidAmount.toFixed(2);
            totalPriceDiv.style.display = "block";
            priceBreakupDiv.innerHTML = `
                <p>Base total: ₹${totalPrice.toFixed(2)}</p>
                
            `;
            priceBreakupDiv.style.display = "block";
            renderOverlappingBids(overlappingBids);
        } else {
            totalPriceDiv.style.display = "none";
            priceBreakupDiv.style.display = "none";
            document.getElementById('total-price').textContent = '';
            document.getElementById("other-bids-list").innerHTML = "";
        }
    }

    async function getOverlappingBids(carId, startDate, endDate) {
        const allBids = await getAllItemsByIndex("bids", "carId", carId);
        return allBids.filter(bid => isDateRangeOverlap(new Date(bid.fromTimestamp), new Date(bid.toTimestamp), new Date(startDate), new Date(endDate)));
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
            li.textContent = `Rental Type : ${rentalTypeText} -> Current Highest Bid : ₹${bid.bidAmount} ->From ${bid.fromTimestamp} to ${bid.toTimestamp}`;
            otherBidsList.appendChild(li);
        });
    }

    const chatId = `${userId}_${car.owner.userId}_${carId}`;

    document.getElementById("send-chat-message-btn").addEventListener("click", async () => {
        const messageInput = document.getElementById("chat-message-input");
        const fileInput = document.getElementById("chat-file-input");
        const message = messageInput.value.trim();
        const file = fileInput.files[0];
        if (message || file) {
            await sendMessage(chatId, userId, car.owner.userId, message, file);
            messageInput.value = "";
            fileInput.value = "";
            renderChatMessages(car.owner.userId);
        }
    });

    renderChatMessages(car.owner.userId);
}
//Toggle the rental type
function toggleRentalType(type, car) {
    const localForm = document.getElementById("local-form");
    const outstationForm = document.getElementById("outstation-form");
    const currentPriceSpan = document.getElementById("current-price");
    const localButton = document.getElementById("local-button");
    const outstationButton = document.getElementById("outstation-button");

    if (type === "local") {
        localForm.style.display = "block";
        outstationForm.style.display = "none";
        currentPriceSpan.textContent = car.rentalOptions.local.pricePerHour.toFixed(2);
        localButton.classList.add("active");
        outstationButton.classList.remove("active");
    } else {
        localForm.style.display = "none";
        outstationForm.style.display = "block";
        currentPriceSpan.textContent = car.rentalOptions.outstation.pricePerDay.toFixed(2);
        localButton.classList.remove("active");
        outstationButton.classList.add("active");
    }
}

//Message
async function sendMessage(chatId, fromUserId, toUserId, message, file) {
    const newMessage = {
        messageId: generateRandomId(),
        chatId,
        message,
        hasAttachment: !!file,
        attachment: file ? await readFileAsDataURL(file) : null,
        createdAt: new Date().toISOString(),
        fromUser: {
            userId: fromUserId,
            username: (await getItemByKey("users", fromUserId)).username,
            email: (await getItemByKey("users", fromUserId)).email
        },
        toUser: {
            userId: toUserId,
            username: (await getItemByKey("users", toUserId)).username,
            email: (await getItemByKey("users", toUserId)).email
        }
    };

    await addItem("messages", newMessage);

    const conversation = await getItemByKey("conversations", chatId) || {
        chatId,
        lastMessage: '',
        lastTimestamp: '',
        owner: {
            userId: toUserId,
            username: (await getItemByKey("users", toUserId)).username,
            email: (await getItemByKey("users", toUserId)).email
        },
        user: {
            userId: fromUserId,
            username: (await getItemByKey("users", fromUserId)).username,
            email: (await getItemByKey("users", fromUserId)).email
        }
    };
    conversation.lastMessage = message;
    conversation.lastTimestamp = newMessage.createdAt;
    await updateItem("conversations", conversation);
}
//Render all messages
async function renderChatMessages(ownerId) {
    const allMessages = await getAllItemsByIndex("messages", "chatId", `${userId}_${ownerId}_${getCarIdFromURL()}`);
    const chatMessagesContainer = document.getElementById("chat-messages");
    chatMessagesContainer.innerHTML = "";
    allMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (allMessages.length === 0) {
        const car = await getItemByKey("cars", getCarIdFromURL());
        chatMessagesContainer.innerHTML = `<div class="chat-message">Say Hi to ${car.owner.username}</div>`;
        return;
    }
    allMessages.forEach(msg => {
        const messageElement = document.createElement("div");
        messageElement.className = `chat-message ${msg.fromUser.userId === userId ? 'message-you' : 'message-owner'}`;
        messageElement.innerHTML = `
    <div class="message-content">
        <span class="message-text">
            <strong>${msg.fromUser.userId === userId ? 'You' : 'Owner'}:</strong> ${msg.message}
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

async function disableBookedDates(carId) {
    const bookings = await getAllItemsByIndex("bookings", "carId", carId);
    const startDateLocalInput = document.getElementById("start-date-local");
    const endDateLocalInput = document.getElementById("end-date-local");
    const startDateOutstationInput = document.getElementById("start-date-outstation");
    const endDateOutstationInput = document.getElementById("end-date-outstation");

    const disabledDates = new Set();
    bookings.forEach(booking => {
        let currentDate = new Date(booking.fromTimestamp);
        const toDate = new Date(booking.toTimestamp);
        while (currentDate <= toDate) {
            disabledDates.add(currentDate.toISOString().split("T")[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    function handleDateInput(input, endDateInput) {
        endDateInput.disabled = false;
        endDateInput.min = input.value;

        const selectedStartDate = new Date(input.value);
        let minValidEndDate = new Date(selectedStartDate);
        minValidEndDate.setDate(minValidEndDate.getDate() + 1);

        while (disabledDates.has(minValidEndDate.toISOString().split("T")[0])) {
            minValidEndDate.setDate(minValidEndDate.getDate() + 1);
        }

        endDateInput.min = minValidEndDate.toISOString().split("T")[0];
    }

    startDateLocalInput.addEventListener("input", function () {
        handleDateInput(this, endDateLocalInput);
    });

    startDateOutstationInput.addEventListener("input", function () {
        handleDateInput(this, endDateOutstationInput);
    });

    function handleDateFocus(input) {
        input.setAttribute("min", new Date().toISOString().split("T")[0]);

        input.addEventListener("change", function () {
            if (disabledDates.has(this.value)) {
                showToast("This date is already booked. Please select a different date.", "error");
                this.value = "";
            }
        });
    }

    startDateLocalInput.addEventListener("focus", function () {
        handleDateFocus(this);
    });

    startDateOutstationInput.addEventListener("focus", function () {
        handleDateFocus(this);
    });

    endDateLocalInput.addEventListener("focus", function () {
        handleDateFocus(this);
    });

    endDateOutstationInput.addEventListener("focus", function () {
        handleDateFocus(this);
    });
}

document.getElementById('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    logout();
});

document.getElementById("send-chat-message-btn").addEventListener("click", function (event) {
    const message = document.getElementById("chat-message-input").value.trim();
    const file = document.getElementById("chat-file-input").files[0];

    if (!message && !file) {
        showToast("Please enter a message or select a file.", "error");
        event.preventDefault();
    }
});

document.getElementById('bid-amount').addEventListener('input', function () {
    if (this.value.includes('-')) {
        showToast("Please enter a valid number", "error");
this.value = '';
    }
    else if (parseFloat(this.value) > 5000) {
        showToast("Bid amount cannot exceed 5000", "error");
        this.value = '';
    }
});

document.getElementById('start-date-local').addEventListener('change', function () {
    const startDate = this.value;
    const endDateInput = document.getElementById('end-date-local');
    endDateInput.min = startDate;
});

document.getElementById('start-date-outstation').addEventListener('change', function () {
    const startDate = this.value;
    const endDateInput = document.getElementById('end-date-outstation');
    endDateInput.min = startDate;
});

// Function to open the modal
function openModal() {
    const modal = document.getElementById("info-modal");
    modal.style.display = "block";
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById("info-modal");
    modal.style.display = "none";
}


// Event listener for the info button
document.getElementById("info-button").addEventListener("click", () => {
    const carId = getCarIdFromURL();
    getItemByKey("cars", carId).then(car => {
        const priceInfoDiv = document.getElementById("price-info");
        priceInfoDiv.innerHTML = `
            <h3>Local Charges</h3>
            <p>Price per Hour: ₹${car.rentalOptions.local.pricePerHour}</p>
            <p>Max Km per Hour: ${car.rentalOptions.local.maxKmPerHour} km</p>
            <p>Extra Hour Rate: ₹${car.rentalOptions.local.extraHourRate}</p>
            <p>Extra Km Rate: ₹${car.rentalOptions.local.extraKmRate}</p>
            <h3>Outstation Charges</h3>
            <p>Price per Day: ₹${car.rentalOptions.outstation.pricePerDay}</p>
            <p>Price per Km: ₹${car.rentalOptions.outstation.pricePerKm}</p>
            <p>Minimum Km Chargeable: ${car.rentalOptions.outstation.minimumKmChargeable} km</p>
            <p>Max Km Limit per Day: ${car.rentalOptions.outstation.maxKmLimitPerDay} km</p>
            <p>Extra Day Rate: ₹${car.rentalOptions.outstation.extraDayRate}</p>
            <p>Extra Hourly Rate: ₹${car.rentalOptions.outstation.extraHourlyRate}</p>
            <p>Extra Km Rate: ₹${car.rentalOptions.outstation.extraKmRate}</p>
        `;
        openModal();
    });
});

// Event listener for the close button
document.querySelector(".close").addEventListener("click", closeModal);

renderCarDetails();
updateNavLinks();