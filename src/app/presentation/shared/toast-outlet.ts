import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-outlet',
  template: `
    <div class="region" role="status" aria-live="polite">
      @if (toasts.current(); as toast) {
        <div class="toast">
          <span>{{ toast.message }}</span>
          @if (toast.actionLabel) {
            <button type="button" (click)="toasts.runAction()">{{ toast.actionLabel }}</button>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .region {
      position: fixed;
      inset-inline: 0;
      bottom: calc(var(--nav-height) + 16px + env(safe-area-inset-bottom));
      display: flex;
      justify-content: center;
      pointer-events: none;
      z-index: 50;
      padding-inline: 16px;
    }
    @media (min-width: 900px) {
      .region {
        bottom: 24px;
      }
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 1rem;
      max-width: 32rem;
      padding: 0.75rem 0.75rem 0.75rem 1.25rem;
      border-radius: 999px;
      background: var(--mist);
      color: var(--dusk);
      font-weight: 600;
      animation: rise 220ms var(--ease-out);
    }
    button {
      border: 0;
      border-radius: 999px;
      min-height: 40px;
      padding: 0 1rem;
      background: var(--dusk);
      color: var(--mist);
      font-weight: 700;
    }
    @keyframes rise {
      from {
        transform: translateY(12px);
        opacity: 0;
      }
    }
  `,
})
export class ToastOutlet {
  protected readonly toasts = inject(ToastService);
}
