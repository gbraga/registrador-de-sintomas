import { Service, signal } from '@angular/core';

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly actionLabel?: string;
  readonly action?: () => void;
}

/** Mensagens curtas de confirmação, com uma ação opcional (ex.: Desfazer). */
@Service()
export class ToastService {
  private readonly state = signal<Toast | null>(null);
  private timer?: ReturnType<typeof setTimeout>;
  private counter = 0;

  readonly current = this.state.asReadonly();

  show(message: string, options: { actionLabel?: string; action?: () => void } = {}): void {
    clearTimeout(this.timer);
    this.state.set({ id: ++this.counter, message, ...options });
    this.timer = setTimeout(() => this.dismiss(), options.action ? 7000 : 4000);
  }

  runAction(): void {
    this.state()?.action?.();
    this.dismiss();
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.state.set(null);
  }
}
