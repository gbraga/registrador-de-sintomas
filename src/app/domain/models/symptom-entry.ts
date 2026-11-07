import { BodyRegionId } from './body-region';
import { Intensity } from './intensity';

/** Uma ocorrência de sintoma registrada pelo usuário. */
export interface SymptomEntry {
  readonly id: string;
  readonly symptomId: string;
  readonly regionId: BodyRegionId;
  readonly intensity: Intensity;
  /** Momento em que o sintoma foi sentido (ISO 8601). */
  readonly occurredAt: string;
  /** Momento em que o registro foi feito (ISO 8601). */
  readonly recordedAt: string;
}

/** Dados necessários para registrar um sintoma, antes de receber id e data de registro. */
export interface SymptomEntryDraft {
  readonly symptomId: string;
  readonly regionId: BodyRegionId;
  readonly intensity: Intensity;
  readonly occurredAt: Date;
}
