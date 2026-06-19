export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: Blob;
  category: 'pdf' | 'image' | 'video' | 'audio' | 'document' | 'other';
  uploadedAt: number;
  tags: string[];
  description?: string;
  starred?: boolean;
}

const DB_NAME = 'FileVaultDB';
const STORE_NAME = 'files';
const DB_VERSION = 1;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is not available in server context'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(new Error(`Failed to open IndexedDB: ${(event.target as IDBRequest).error?.message}`));
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result as IDBDatabase);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBRequest).result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function storeFile(file: Omit<StoredFile, 'uploadedAt'> & { uploadedAt?: number }): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const fileWithTime: StoredFile = {
      ...file,
      uploadedAt: file.uploadedAt || Date.now()
    };

    const request = store.put(fileWithTime);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(new Error(`Error storing file: ${(event.target as IDBRequest).error?.message}`));
    };
  });
}

export async function getAllFiles(): Promise<StoredFile[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort: recent first
      const files = request.result as StoredFile[];
      files.sort((a, b) => b.uploadedAt - a.uploadedAt);
      resolve(files);
    };

    request.onerror = (event) => {
      reject(new Error(`Error fetching files: ${(event.target as IDBRequest).error?.message}`));
    };
  });
}

export async function getFile(id: string): Promise<StoredFile | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = (event) => {
      reject(new Error(`Error fetching file details: ${(event.target as IDBRequest).error?.message}`));
    };
  });
}

export async function deleteFileFromDB(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(new Error(`Error deleting file: ${(event.target as IDBRequest).error?.message}`));
    };
  });
}

export function detectCategory(type: string, name: string): StoredFile['category'] {
  const lowerType = type.toLowerCase();
  const lowerName = name.toLowerCase();

  if (lowerType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return 'pdf';
  }
  if (lowerType.startsWith('image/')) {
    return 'image';
  }
  if (lowerType.startsWith('video/')) {
    return 'video';
  }
  if (lowerType.startsWith('audio/')) {
    return 'audio';
  }
  if (
    lowerType.startsWith('text/') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc') ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.pptx') ||
    lowerName.endsWith('.ppt') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.json')
  ) {
    return 'document';
  }
  return 'other';
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
