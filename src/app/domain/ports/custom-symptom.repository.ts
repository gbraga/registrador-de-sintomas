import { Symptom } from '../models/symptom';

export abstract class CustomSymptomRepository {
  abstract getAll(): Symptom[];
  abstract add(symptom: Symptom): void;
  abstract replaceAll(symptoms: readonly Symptom[]): void;
}
