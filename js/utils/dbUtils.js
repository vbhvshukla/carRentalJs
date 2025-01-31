import { openDb, getObjectStore } from '../data/dbService.js';

function addItem(storeName, item) {
    return new Promise((resolve, reject) => {
        openDb().then(() => {
            const store = getObjectStore(storeName, "readwrite");
            const request = store.add(item);
            request.onsuccess = function () {
                resolve(item);
            };
            request.onerror = function (event) {
                reject(event.target.error);
            };
        }).catch((error) => {
            reject(error);
        });
    });
}

function getItemByIndex(storeName, indexName, key) {
    return new Promise((resolve, reject) => {
        openDb().then(() => {
            const store = getObjectStore(storeName, "readonly");
            const index = store.index(indexName);
            const request = index.get(key);
            request.onsuccess = function () {
                resolve(request.result);
            };
            request.onerror = function (event) {
                reject(event.target.error);
            };
        }).catch((error) => {
            reject(error);
        });
    });
}

function getAllItems(storeName) {
    return new Promise((resolve, reject) => {
        openDb().then(() => {
            const store = getObjectStore(storeName, "readonly");
            const request = store.getAll();
            request.onsuccess = function () {
                resolve(request.result);
            };
            request.onerror = function (event) {
                reject(event.target.error);
            };
        }).catch((error) => {
            reject(error);
        });
    });
}

function updateItem(storeName, item) {
    return new Promise((resolve, reject) => {
        openDb().then(() => {
            const store = getObjectStore(storeName, "readwrite");
            const request = store.put(item);
            request.onsuccess = function () {
                resolve(item);
            };
            request.onerror = function (event) {
                reject(event.target.error);
            };
        }).catch((error) => {
            reject(error);
        });
    });
}

export { addItem, getItemByIndex, getAllItems, updateItem };
