/**
 * IndexedDB persistence layer for dashboard projects.
 * Provides more robust local storage than localStorage (no 5MB limit).
 */

const DB_NAME = 'dashboard-designer';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const CURRENT_PROJECT_KEY = '__current__';

interface ProjectData {
  canvas: { width: number; height: number; background: { type: string; value: string } };
  components: unknown[];
  dataSources?: unknown[];
  savedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveProjectToIDB(data: Omit<ProjectData, 'savedAt'>, key = CURRENT_PROJECT_KEY): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ ...data, savedAt: new Date().toISOString() }, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadProjectFromIDB(key = CURRENT_PROJECT_KEY): Promise<ProjectData | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProjectFromIDB(key = CURRENT_PROJECT_KEY): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listProjectsFromIDB(): Promise<{ key: string; data: ProjectData }[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const keys: string[] = [];
    const values: ProjectData[] = [];

    const cursorReq = store.openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        keys.push(cursor.key as string);
        values.push(cursor.value);
        cursor.continue();
      } else {
        resolve(keys.map((k, i) => ({ key: k, data: values[i] })));
      }
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
}
