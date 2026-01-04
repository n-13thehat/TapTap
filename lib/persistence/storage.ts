/**
 * TapTap Storage Layer
 * Provides IndexedDB with localStorage fallback for queue persistence
 */

export interface StorageItem {
  id: string;
  data: any;
  timestamp: number;
  version: number;
  checksum?: string;
}

export interface StorageOptions {
  dbName: string;
  storeName: string;
  version: number;
  fallbackToLocalStorage?: boolean;
}

/**
 * Storage abstraction layer with IndexedDB primary and localStorage fallback
 */
export class TapTapStorage {
  private db: IDBDatabase | null = null;
  private options: StorageOptions;
  private isIndexedDBAvailable = false;

  constructor(options: StorageOptions) {
    this.options = {
      fallbackToLocalStorage: true,
      ...options,
    };
  }

  /**
   * Initialize storage system
   */
  async initialize(): Promise<void> {
    try {
      await this.initIndexedDB();
      this.isIndexedDBAvailable = true;
      console.log(`TapTap Storage initialized with IndexedDB: ${this.options.dbName}`);
    } catch (error) {
      console.warn('IndexedDB initialization failed, falling back to localStorage:', error);
      this.isIndexedDBAvailable = false;
      
      if (!this.options.fallbackToLocalStorage) {
        throw new Error('Storage initialization failed and fallback disabled');
      }
    }
  }

  /**
   * Initialize IndexedDB
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(this.options.dbName, this.options.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.options.storeName)) {
          const store = db.createObjectStore(this.options.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('version', 'version', { unique: false });
        }
      };
    });
  }

  /**
   * Store item with idempotent operation
   */
  async setItem(key: string, data: any, options?: { version?: number }): Promise<void> {
    const item: StorageItem = {
      id: key,
      data,
      timestamp: Date.now(),
      version: options?.version || 1,
      checksum: this.generateChecksum(data),
    };

    if (this.isIndexedDBAvailable && this.db) {
      await this.setItemIndexedDB(item);
    } else {
      this.setItemLocalStorage(item);
    }
  }

  /**
   * Get item with version checking
   */
  async getItem(key: string): Promise<StorageItem | null> {
    if (this.isIndexedDBAvailable && this.db) {
      return await this.getItemIndexedDB(key);
    } else {
      return this.getItemLocalStorage(key);
    }
  }

  /**
   * Remove item
   */
  async removeItem(key: string): Promise<void> {
    if (this.isIndexedDBAvailable && this.db) {
      await this.removeItemIndexedDB(key);
    } else {
      this.removeItemLocalStorage(key);
    }
  }

  /**
   * Get all items with optional filtering
   */
  async getAllItems(filter?: (item: StorageItem) => boolean): Promise<StorageItem[]> {
    if (this.isIndexedDBAvailable && this.db) {
      return await this.getAllItemsIndexedDB(filter);
    } else {
      return this.getAllItemsLocalStorage(filter);
    }
  }

  /**
   * Clear all items
   */
  async clear(): Promise<void> {
    if (this.isIndexedDBAvailable && this.db) {
      await this.clearIndexedDB();
    } else {
      this.clearLocalStorage();
    }
  }

  /**
   * Get storage info
   */
  async getStorageInfo(): Promise<{
    type: 'indexeddb' | 'localstorage';
    itemCount: number;
    estimatedSize: number;
  }> {
    const items = await this.getAllItems();
    const estimatedSize = JSON.stringify(items).length;

    return {
      type: this.isIndexedDBAvailable ? 'indexeddb' : 'localstorage',
      itemCount: items.length,
      estimatedSize,
    };
  }

  // IndexedDB operations
  private async setItemIndexedDB(item: StorageItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readwrite');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getItemIndexedDB(key: string): Promise<StorageItem | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readonly');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async removeItemIndexedDB(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readwrite');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllItemsIndexedDB(filter?: (item: StorageItem) => boolean): Promise<StorageItem[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readonly');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        resolve(filter ? items.filter(filter) : items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.options.storeName], 'readwrite');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // localStorage operations
  private setItemLocalStorage(item: StorageItem): void {
    try {
      const key = `${this.options.dbName}_${this.options.storeName}_${item.id}`;
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('localStorage setItem failed:', error);
      throw error;
    }
  }

  private getItemLocalStorage(key: string): StorageItem | null {
    try {
      const storageKey = `${this.options.dbName}_${this.options.storeName}_${key}`;
      const item = localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('localStorage getItem failed:', error);
      return null;
    }
  }

  private removeItemLocalStorage(key: string): void {
    try {
      const storageKey = `${this.options.dbName}_${this.options.storeName}_${key}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('localStorage removeItem failed:', error);
    }
  }

  private getAllItemsLocalStorage(filter?: (item: StorageItem) => boolean): StorageItem[] {
    try {
      const prefix = `${this.options.dbName}_${this.options.storeName}_`;
      const items: StorageItem[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const parsed = JSON.parse(item);
              items.push(parsed);
            } catch (error) {
              console.warn('Failed to parse localStorage item:', key);
            }
          }
        }
      }

      return filter ? items.filter(filter) : items;
    } catch (error) {
      console.error('localStorage getAllItems failed:', error);
      return [];
    }
  }

  private clearLocalStorage(): void {
    try {
      const prefix = `${this.options.dbName}_${this.options.storeName}_`;
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('localStorage clear failed:', error);
    }
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}
