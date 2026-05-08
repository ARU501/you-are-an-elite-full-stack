import { openDB } from "idb";

import { PersistedAppData } from "@/lib/types";

const DB_NAME = "landlordforge-offline";
const STORE_NAME = "snapshots";
const SNAPSHOT_KEY = "app-state";

interface SnapshotRecord {
  id: string;
  value: PersistedAppData;
  updatedAt: string;
}

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
}

export async function loadSnapshot() {
  const db = await getDb();
  const snapshot = (await db.get(STORE_NAME, SNAPSHOT_KEY)) as SnapshotRecord | undefined;
  return snapshot?.value ?? null;
}

export async function saveSnapshot(value: PersistedAppData) {
  const db = await getDb();
  await db.put(STORE_NAME, {
    id: SNAPSHOT_KEY,
    value,
    updatedAt: new Date().toISOString(),
  } satisfies SnapshotRecord);
}
