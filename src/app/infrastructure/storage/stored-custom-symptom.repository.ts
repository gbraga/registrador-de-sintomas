import { Injectable, inject } from '@angular/core';
import { Symptom } from '../../domain/models/symptom';
import { CustomSymptomRepository } from '../../domain/ports/custom-symptom.repository';
import { KeyValueStore } from './key-value-store';

const KEY = 'custom-symptoms';

@Injectable()
export class StoredCustomSymptomRepository extends CustomSymptomRepository {
  private readonly store = inject(KeyValueStore);

  getAll(): Symptom[] {
    return this.store.read<Symptom[]>(KEY) ?? [];
  }

  add(symptom: Symptom): void {
    this.replaceAll([...this.getAll(), symptom]);
  }

  replaceAll(symptoms: readonly Symptom[]): void {
    this.store.write(KEY, symptoms);
  }
}
