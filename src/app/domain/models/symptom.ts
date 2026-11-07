import { BodyRegionId } from './body-region';

export interface SymptomCategory {
  readonly id: string;
  readonly name: string;
}

export interface Symptom {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly categoryId: string;
  readonly regionIds: readonly BodyRegionId[];
  readonly custom: boolean;
}

export const CUSTOM_CATEGORY: SymptomCategory = { id: 'custom', name: 'Adicionados por você' };
