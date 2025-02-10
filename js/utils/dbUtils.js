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

async function getItemsWithPagination(storeName,page=1,itemsPerPage = 5){
    try {
        await openDb();
        const store = getObjectStore(storeName,"readonly");
        return new Promise((resolve,reject)=>{
            const request = store.openCursor();
            const items = [];
            let count = 0;
            const start = (page-1)*itemsPerPage;
            const end = start+itemsPerPage;

            request.onsuccess=(event)=>{
                const cursor = event.target.result;
                if(cursor){
                    //what we are doing is if the cursor's current item is added to the
                    //items if it falls within the current page range and then the counter is incremented
                    if(count>=start && count < end){
                        items.push(cursor.value);
                    }
                    count++;
                    if(count<end){
                        cursor.continue();
                    }
                    else{
                        resolve(items);
                    }
                }
                else{
                    resolve(items);
                }
            };
            request.onerror = (event) =>reject(new Error(`Fetch Failed :: ${event.target.error}`))
        });
    }
    catch(error){
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
export { addItem, getItemByIndex, getAllItems, updateItem, deleteItem ,getItemByKey,getAllItemsByIndex,getItemsWithPagination,getTotalItems,getItemsByTimeRange,getAllItemsByTimeRange};
