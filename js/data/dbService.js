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
        userStore.createIndex("username", "username", { unique: true });
      }
      if (!db.objectStoreNames.contains("cars")) {
        const carStore = db.createObjectStore("cars", { keyPath: "carId" });
        carStore.createIndex("ownerId", "ownerId");
        carStore.createIndex("categoryId", "categoryId");
        carStore.createIndex("location", "location");
      }
      if (!db.objectStoreNames.contains("categories")) {
        db.createObjectStore("categories", { keyPath: "categoryId" });
      }
      if (!db.objectStoreNames.contains("bookings")) {
        const bookingStore = db.createObjectStore("bookings", {
          keyPath: "bookingId",
        });
        bookingStore.createIndex("userId", "userId");
        bookingStore.createIndex("carId", "carId");
        bookingStore.createIndex("status", "status");
      }
      if (!db.objectStoreNames.contains("messages")) {
        const messageStore = db.createObjectStore("messages", {
          keyPath: "messageId",
        });
        messageStore.createIndex("fromUserId", "fromUserId");
        messageStore.createIndex("toUserId", "toUserId");
        messageStore.createIndex("forBookingId", "forBookingId");
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