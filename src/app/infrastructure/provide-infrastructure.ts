import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { FileGateway } from '../application/ports/file-gateway';
import { Clock } from '../domain/ports/clock';
import { CustomSymptomRepository } from '../domain/ports/custom-symptom.repository';
import { IdGenerator } from '../domain/ports/id-generator';
import { SymptomCatalog } from '../domain/ports/symptom-catalog';
import { SymptomEntryRepository } from '../domain/ports/symptom-entry.repository';
import { FibromyalgiaCatalog } from './catalog/fibromyalgia-catalog';
import { KeyValueStore } from './storage/key-value-store';
import { LocalStorageKeyValueStore } from './storage/local-storage-key-value-store';
import { StoredCustomSymptomRepository } from './storage/stored-custom-symptom.repository';
import { StoredSymptomEntryRepository } from './storage/stored-symptom-entry.repository';
import { BrowserFileGateway } from './system/browser-file-gateway';
import { CryptoIdGenerator } from './system/crypto-id-generator';
import { SystemClock } from './system/system-clock';

/** Liga as portas do domínio às implementações do navegador. */
export function provideInfrastructure(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: KeyValueStore, useClass: LocalStorageKeyValueStore },
    { provide: SymptomEntryRepository, useClass: StoredSymptomEntryRepository },
    { provide: CustomSymptomRepository, useClass: StoredCustomSymptomRepository },
    { provide: SymptomCatalog, useClass: FibromyalgiaCatalog },
    { provide: Clock, useClass: SystemClock },
    { provide: IdGenerator, useClass: CryptoIdGenerator },
    { provide: FileGateway, useClass: BrowserFileGateway },
  ]);
}
