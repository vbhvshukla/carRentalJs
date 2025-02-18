import { openDb, getObjectStore } from "../data/dbService.js";
import { dbSchema } from "../../dbSchema.js";

// Function to validate an object against a schema
function validateSchema(schema, data) {
    if (typeof schema !== "object" || schema === null) return false;

    const schemaKeys = Object.keys(schema);
    const dataKeys = Object.keys(data);

    // Ensure no extra or missing fields
    if (schemaKeys.length !== dataKeys.length || !dataKeys.every(key => schemaKeys.includes(key))) {
        return false;
    }

    return true;
}

//While adding item or updating item validate the schema
async function addItem(storeName, item) {
    try {
        if (!dbSchema[storeName]) {
            throw new Error(`Invalid store: ${storeName}`);
        }

        if (!validateSchema(dbSchema[storeName], item)) {
            throw new Error(`Invalid schema for ${storeName}. Data rejected: ${JSON.stringify(item)}`);
        }

        await openDb();
        const store = getObjectStore(storeName, "readwrite");
        return new Promise((resolve, reject) => {
            const request = store.add(item);
            request.onsuccess = () => resolve(item);
            request.onerror = (event) => reject(new Error(`Add failed: ${event.target.error}`));
        });
    } catch (error) {
        return Promise.reject(new Error(`Database error: ${error.message}`));
    }
}
//Update function
async function updateItem(storeName, item) {
    try {
        if (!dbSchema[storeName]) {
            throw new Error(`Invalid store: ${storeName}`);
        }

        if (!validateSchema(dbSchema[storeName], item)) {
            throw new Error(`Invalid schema for ${storeName}. Data rejected: ${JSON.stringify(item)}`);
        }

        await openDb();
        const store = getObjectStore(storeName, "readwrite");
        return new Promise((resolve, reject) => {
            const request = store.put(item);
            request.onsuccess = () => resolve(item);
            request.onerror = (event) => reject(new Error(`Update failed: ${event.target.error}`));
        });
    } catch (error) {
        return Promise.reject(new Error(`Database error: ${error.message}`));
    }
}
//Get the item by it's index
async function getItemByIndex(storeName, indexName, key) {
    try {
        await openDb();
        const store = getObjectStore(storeName, "readonly");
        const index = store.index(indexName);
        return new Promise((resolve, reject) => {
            const request = index.get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = (event) => reject(new Error(`Fetch failed: ${event.target.error}`));
        });
    } catch (error) {
        return Promise.reject(new Error(`Database error: ${error.message}`));
    }
}

async function getAllItemsByIndex(storeName, indexName, key) {
    try {
        await openDb();
        const store = getObjectStore(storeName, "readonly");
        const index = store.index(indexName);

        return new Promise((resolve, reject) => {
            const request = index.getAll(key);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (event) => reject(new Error(`Fetch failed: ${event.target.error}`));
        });
    } catch (error) {
        return Promise.reject(new Error(`Database error: ${error.message}`));
    }
}

async function getItemByKey(storeName, key) {
    try {
        await openDb();
        const store = getObjectStore(storeName, "readonly");
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = function (e) {
                resolve(request.result);
            }
            request.onerror = (event) => reject(new Error(`Fetch failed: ${event.target.error}`))
        })
    }
    catch (err) {
        return Promise.reject(new Error(`Data error : ${err.message}`))
    }
}

async function getAllItems(storeName) {
    try {
        await openDb();
        const store = getObjectStore(storeName, "readonly");
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (event) => reject(new Error(`Fetch failed: ${event.target.error}`));
        });
    } catch (error) {
        return Promise.reject(new Error(`Database error: ${error.message}`));
    }
}

async function deleteItem(storeName, key) {
    try {
        await openDb();
        const store = getObjectStore(storeName, "readwrite");
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(new Error(`Delete failed: ${event.target.error}`));
        });
    } catch (error) {
        return Promise.reject(new Error(`Database error: ${error.message}`));
    }
}

async function getItemsWithPagination(storeName, page = 1, itemsPerPage = 5) {
    try {
        await openDb();
        const store = getObjectStore(storeName, "readonly");
        return new Promise((resolve, reject) => {
            const request = store.openCursor();
            const items = [];
            let count = 0;
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (count >= start && count < end) {
                        items.push(cursor.value);
                    }
                    count++;
                    if (count < end) {
                        cursor.continue();
                    } else {
                        resolve(items);
                    }
                } else {
                    resolve(items);
                }
            };
            request.onerror = (event) => reject(new Error(`Fetch Failed :: ${event.target.error}`))
        });
    }
    catch (error) {
        return Promise.reject(new Error(`Database error: ${error.message}`));
    }
}

async function getTotalItems(storeName) {
    try {
        await openDb();
        const store = getObjectStore(storeName, "readonly");
        return new Promise((resolve, reject) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(new Error(`Count failed: ${event.target.error}`));
        });
    } catch (error) {
        return Promise.reject(new Error(`Database error: ${error.message}`));
    }
}

async function getItemsByTimeRange(storeName, indexName, key, days) {
    console.log(storeName, indexName, key, days)
    return new Promise((resolve, reject) => {
        openDb().then(() => {
            const store = getObjectStore(storeName, "readonly");
            const index = store.index(indexName);
            const range = IDBKeyRange.only(key);
            const request = index.openCursor(range);
            const result = [];
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            request.onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    const itemDate = new Date(cursor.value.createdAt);
                    if (itemDate >= cutoffDate) {
                        result.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(result);
                }
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    });
}

async function getAllItemsByTimeRange(storeName, indexName, days) {
    return new Promise((resolve, reject) => {
        openDb().then(() => {
            const store = getObjectStore(storeName, "readonly");
            const index = store.index(indexName);
            const request = index.openCursor();
            const result = [];
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            request.onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    const itemDate = new Date(cursor.value.createdAt);
                    if (itemDate >= cutoffDate) {
                        result.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(result);
                }
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };
        });
    });
}

async function updateCarInAllStores(updatedCar) {
    const db = await openDb();
    const transaction = db.transaction(["cars", "bookings", "bids"], "readwrite");

    // Update car in cars store
    const carsStore = transaction.objectStore("cars");
    carsStore.put(updatedCar);

    // Update car in bookings store
    const bookingsStore = transaction.objectStore("bookings");
    const bookingsRequest = bookingsStore.openCursor();

    bookingsRequest.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            const booking = cursor.value;
            if (booking.bid && booking.bid.car && booking.bid.car.carId === updatedCar.carId) {
                booking.bid.car = updatedCar;
                if (validateSchema(dbSchema.bookings, booking)) {
                    cursor.update(booking);
                } else {
                    console.error("Invalid schema for booking:", booking);
                }
            }
            cursor.continue();
        }
    };

    // Update car in bids store
    const bidsStore = transaction.objectStore("bids");
    const bidsRequest = bidsStore.openCursor();

    bidsRequest.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            const bid = cursor.value;
            if (bid.car && bid.car.carId === updatedCar.carId) {
                bid.car = updatedCar;
                if (validateSchema(dbSchema.bids, bid)) {
                    cursor.update(bid);
                } else {
                    console.error("Invalid schema for bid:", bid);
                }
            }
            cursor.continue();
        }
    };

    transaction.oncomplete = function () {
        console.log("All updates completed successfully.");
    };

    transaction.onerror = function () {
        console.error("Transaction failed: ", transaction.error);
    };
}

export { addItem, getItemByIndex, getAllItems, updateItem, deleteItem, getItemByKey, getAllItemsByIndex, getItemsWithPagination, getTotalItems, getItemsByTimeRange, getAllItemsByTimeRange, updateCarInAllStores };