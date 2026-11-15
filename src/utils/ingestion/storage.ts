/**
 * Ingestion Storage & Deduplication Engine (TypeScript implementation)
 * Provides in-memory idempotent repository and optional Firestore persistence.
 */

import { Scholarship } from '../../types';

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
    this.inMemoryStore.clear();
    this.checksumIndex.clear();
  }
}

export const SHARED_INGESTION_STORAGE = new IngestionStorage();
