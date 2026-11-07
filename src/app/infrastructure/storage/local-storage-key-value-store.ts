import { Injectable } from '@angular/core';
import { KeyValueStore } from './key-value-store';

@Injectable()
export class LocalStorageKeyValueStore extends KeyValueStore {
  private readonly prefix = 'diario-fibro:v1:';

  read<T>(key: string): T | null {
    const raw = localStorage.getItem(this.prefix + key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  write<T>(key: string, value: T): void {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }
}
