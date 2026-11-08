/**
 * Ingestion Storage & Deduplication Engine (TypeScript implementation)
 * Provides in-memory idempotent repository and optional Firestore persistence.
 */

import { Scholarship } from '../../types';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';

export class IngestionStorage {
  private inMemoryStore: Map<string, Scholarship> = new Map();
  private checksumIndex: Map<string, string> = new Map();

  /**
   * Upserts a scholarship record idempotently.
   * Returns true if newly inserted, false if already existed (duplicate updated/prevented).
   */
  upsert(record: Scholarship, checksum?: string): boolean {
    const key = record.id;
    const isNew = !this.inMemoryStore.has(key);

    this.inMemoryStore.set(key, record);
    if (checksum) {
      this.checksumIndex.set(key, checksum);
    }

    return isNew;
  }

  get(id: string): Scholarship | undefined {
    return this.inMemoryStore.get(id);
  }

  count(): number {
    return this.inMemoryStore.size;
  }

  all(): Scholarship[] {
    return Array.from(this.inMemoryStore.values());
  }

  clear(): void {
    this.inMemoryStore.clear;
    this.inMemoryStore.clear();
    this.checksumIndex.clear();
  }

  /**
   * Optional Firestore persistence for seamless database integration.
   */
  async persistToFirestore(record: Scholarship): Promise<void> {
    try {
      const docRef = doc(db, 'scholarships', record.id);
      await setDoc(docRef, record, { merge: true });
    } catch (error) {
      // Catch and log without crashing in-memory pipeline if offline
      console.warn(`Firestore sync note for ${record.id}:`, error);
    }
  }
}

export const SHARED_INGESTION_STORAGE = new IngestionStorage();
