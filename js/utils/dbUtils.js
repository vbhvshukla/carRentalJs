import { openDb, getObjectStore } from "../data/dbService.js";

async function addItem(storeName, item) {
    try {
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

async function updateItem(storeName, item) {
    try {
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

export { addItem, getItemByIndex, getAllItems, updateItem, deleteItem ,getItemByKey};
