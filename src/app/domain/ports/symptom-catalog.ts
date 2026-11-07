import { Symptom, SymptomCategory } from '../models/symptom';

/** Fonte dos sintomas conhecidos da condição acompanhada. */
export abstract class SymptomCatalog {
  abstract categories(): readonly SymptomCategory[];
  abstract symptoms(): readonly Symptom[];
}
