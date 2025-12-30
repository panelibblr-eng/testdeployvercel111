// Minimal IndexedDB helper for storing hero images as blobs
(function () {
    const DB_NAME = 'HeroImagesDB';
    const STORE_NAME = 'images';
    const DB_VERSION = 1;

    function openDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function (event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error); };
        });
    }

    async function putBlob(blob) {
        const db = await openDb();
        const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ('img-' + Date.now() + '-' + Math.random().toString(36).slice(2));
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put({ id, blob });
            tx.oncomplete = function () { resolve(id); };
            tx.onerror = function () { reject(tx.error); };
        });
    }

    async function getBlob(id) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(id);
            req.onsuccess = function () { resolve(req.result ? req.result.blob : null); };
            req.onerror = function () { reject(req.error); };
        });
    }

    async function getObjectURL(id) {
        const blob = await getBlob(id);
        if (!blob) return null;
        return URL.createObjectURL(blob);
    }

    async function clear() {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.clear();
            req.onsuccess = function () { resolve(); };
            req.onerror = function () { reject(req.error); };
        });
    }

    window.idbStore = { putBlob, getBlob, getObjectURL, clear };
})();


