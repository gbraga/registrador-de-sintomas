import { Service, inject } from '@angular/core';
import { BodyRegionId } from '../../domain/models/body-region';
import { CUSTOM_CATEGORY, Symptom } from '../../domain/models/symptom';
import { CustomSymptomRepository } from '../../domain/ports/custom-symptom.repository';
import { IdGenerator } from '../../domain/ports/id-generator';
import { JournalStore } from '../journal.store';

@Service()
export class AddCustomSymptomUseCase {
  private readonly repository = inject(CustomSymptomRepository);
  private readonly store = inject(JournalStore);
  private readonly ids = inject(IdGenerator);

  /** Cria o sintoma na região, ou devolve o existente com o mesmo nome. */
  execute(rawName: string, regionId: BodyRegionId): Symptom {
    const name = rawName.trim().replace(/\s+/g, ' ');
    if (!name) throw new Error('Informe o nome do sintoma.');

    const existing = this.store
      .symptomsIn(regionId)
      .find((s) => s.name.localeCompare(name, 'pt-BR', { sensitivity: 'base' }) === 0);
    if (existing) return existing;

    const symptom: Symptom = {
      id: `custom-${this.ids.next()}`,
      name,
      description: '',
      categoryId: CUSTOM_CATEGORY.id,
      regionIds: [regionId],
      custom: true,
    };
    this.repository.add(symptom);
    this.store.reload();
    return symptom;
  }
}
