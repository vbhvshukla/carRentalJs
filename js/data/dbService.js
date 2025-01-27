const dbName = "carRental";
const dbVersion = 1;
let db;
function openDb() {
  const request = indexedDB.open(dbName, dbVersion);
  // If everything succeeds, a success event (that is, a DOM event whose type property is set to "success") is fired with request as its target.
  // Once it is fired, the onsuccess() function on request is triggered with the success event as its argument
  request.onsuccess = function (event) {
    db = event.target.result;
  };

  request.onerror = function (event) {
    console.error(`Database error: ${event.target.error?.message}`);
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
      messageStore.createIndex("forCarId", "forCarId");
    }

    if(!db.objectStoreNames.contains("reviews")){}
  };
}
