import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastOutlet } from './presentation/shared/toast-outlet';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly nav: readonly NavItem[] = [
    {
      path: '/',
      label: 'Registrar',
      icon: 'M12 3.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4ZM8.5 9.5h7l-.6 6h-1.6l-.3 5h-2l-.3-5H9.1z',
    },
    {
      path: '/historico',
      label: 'Histórico',
      icon: 'M5 6h14M5 12h14M5 18h9',
    },
    {
      path: '/painel',
      label: 'Painel',
      icon: 'M5 19V11M10 19V5M15 19v-6M20 19V9',
    },
  ];
}
