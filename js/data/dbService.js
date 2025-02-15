const dbName = "carRental";
const dbVersion = 1;
let db;

function openDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    const request = indexedDB.open(dbName, dbVersion);

    request.onsuccess = function (event) {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = function (event) {
      console.error(`Database error: ${event.target.error?.message}`);
      reject(event.target.error);
    };

    request.onupgradeneeded = function (event) {
      db = event.target.result;

      if (!db.objectStoreNames.contains("users")) {
        const userStore = db.createObjectStore("users", { keyPath: "userId" });
        userStore.createIndex("email", "email", { unique: true });
      }

      if (!db.objectStoreNames.contains("cars")) {
        const carStore = db.createObjectStore("cars", { keyPath: "carId" });
        carStore.createIndex("ownerId", "owner.userId"); // Owner's ID for queries
        carStore.createIndex("categoryId", "category.categoryId"); // Category ID for filtering
        carStore.createIndex("city", "city"); // To allow filtering by city

      }

      if (!db.objectStoreNames.contains("categories")) {
        db.createObjectStore("categories", { keyPath: "categoryId" });
      }

      if (!db.objectStoreNames.contains("superCategories")) {
        db.createObjectStore("superCategories", { keyPath: "supercategoryId" });
      }

      if (!db.objectStoreNames.contains("bookings")) {
        const bookingStore = db.createObjectStore("bookings", {
          keyPath: "bookingId",
        });
        bookingStore.createIndex("userId", "bid.user.userId"); // User making the booking
        bookingStore.createIndex("carId", "bid.car.carId"); // Car being booked
        bookingStore.createIndex("ownerId", "bid.car.owner.userId"); // Owner's ID
        bookingStore.createIndex("fromTimestamp", "fromTimestamp"); // For date range queries
      }

      if (!db.objectStoreNames.contains("messages")) {
        const messageStore = db.createObjectStore("messages", {
          keyPath: "messageId",
        });
        messageStore.createIndex("chatId", "chatId"); // Fetch all messages in a conversation
        messageStore.createIndex("fromUserId", "fromUser.userId"); // Fetch messages by sender
        messageStore.createIndex("toUserId", "toUser.userId"); // Fetch messages by receiver
        messageStore.createIndex("ownerId", "toUser.userId", { unique: false }); // Fetch messages sent to a specific owner
        messageStore.createIndex("createdAt", "createdAt"); // Sort messages by timestamp
      }

      if (!db.objectStoreNames.contains("bids")) {
        const bidStore = db.createObjectStore("bids", { keyPath: "bidId" });
        bidStore.createIndex("carId", "car.carId");
        bidStore.createIndex("userId", "user.userId");
        bidStore.createIndex("ownerId", "car.owner.userId");
        bidStore.createIndex("fromTimestamp", "fromTimestamp");
      }


      if (!db.objectStoreNames.contains("conversations")) {
        const conversationStore = db.createObjectStore("conversations", {
          keyPath: "chatId",
        });
        conversationStore.createIndex("ownerId", "owner.userId"); // Fetch conversations by owner
        conversationStore.createIndex("userId", "user.userId"); // Fetch conversations by user
        conversationStore.createIndex("lastTimestamp", "lastTimestamp"); // Sorting conversations by last activity
      }

      if (!db.objectStoreNames.contains("carAvailability")) {
        const availabilityStore = db.createObjectStore("carAvailability", { keyPath: "carId" });
        availabilityStore.createIndex("fromTimestamp", "fromTimestamp"); // To query available slots
        availabilityStore.createIndex("toTimestamp", "toTimestamp"); // To track availability end
      }
    };
  });
}

function getObjectStore(storeName, mode) {
  if (!db) {
    throw new Error("Database connection is not open. Call openDb() first.");
  }
  return db.transaction(storeName, mode).objectStore(storeName);
}

openDb()
  .then(() => {
    console.log("Database opened successfully");
  })
  .catch((error) => {
    console.error("Failed to open database:", error);
  });

export { openDb, getObjectStore };
