export type SaveQueueItem = {
  id: string;
  type: 'section' | 'title';
  sectionId?: string;
  resumeId: string;
  payload: Record<string, unknown>;
  timestamp: number;
};

const DB = 'pks-resume-queue';
const STORE = 'items';

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains(STORE))
        r.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function enqueue(item: SaveQueueItem): Promise<void> {
  const db = await open();
  const tx = db.transaction(STORE, 'readwrite');
  await req(tx.objectStore(STORE).put(item));
}

export async function dequeue(id: string): Promise<void> {
  const db = await open();
  const tx = db.transaction(STORE, 'readwrite');
  await req(tx.objectStore(STORE).delete(id));
}

export async function getAll(): Promise<SaveQueueItem[]> {
  const db = await open();
  const tx = db.transaction(STORE, 'readonly');
  const items: SaveQueueItem[] = await req(tx.objectStore(STORE).getAll());
  return items.sort((a, b) => a.timestamp - b.timestamp);
}

export async function clearAll(): Promise<void> {
  const db = await open();
  const tx = db.transaction(STORE, 'readwrite');
  await req(tx.objectStore(STORE).clear());
}
