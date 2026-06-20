// Minimal IndexedDB key-value store for file metadata.
// Stores { path, mode, mtime, atime } records, keyed by path.
class MetaDB {
    constructor(dbName, storeName) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
    }

    async _initDB() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onerror = () => reject(new Error('Failed to open MetaDB'));
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'path' });
                }
            };
        });
    }

    async put(key, value) {
        const db = await this._initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.storeName], 'readwrite');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.objectStore(this.storeName).put({ path: key, ...value });
        });
    }

    async get(key) {
        const db = await this._initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.storeName], 'readonly');
            const request = tx.objectStore(this.storeName).get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(key) {
        const db = await this._initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.storeName], 'readwrite');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.objectStore(this.storeName).delete(key);
        });
    }

    async getAll() {
        const db = await this._initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.storeName], 'readonly');
            const results = [];
            const request = tx.objectStore(this.storeName).openCursor();
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
}

globalThis.MetaDB = MetaDB;
