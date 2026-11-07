import { Service, inject } from '@angular/core';
import { RemoveEntriesUseCase } from '../../application/use-cases/remove-entries.use-case';
import { SymptomEntry } from '../../domain/models/symptom-entry';
import { ToastService } from './toast.service';

/** Apaga registros e oferece "Desfazer" na mensagem de confirmação. */
@Service()
export class RemoveEntriesController {
  private readonly removeEntries = inject(RemoveEntriesUseCase);
  private readonly toasts = inject(ToastService);

  remove(entries: readonly SymptomEntry[], message = 'Registro apagado'): void {
    this.removeEntries.execute(entries.map((e) => e.id));
    this.toasts.show(message, {
      actionLabel: 'Desfazer',
      action: () => this.removeEntries.restore(entries),
    });
  }
}
