import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Registrar | Diário de sintomas',
    loadComponent: () => import('./presentation/pages/record/record-page'),
  },
  {
    path: 'historico',
    title: 'Histórico | Diário de sintomas',
    loadComponent: () => import('./presentation/pages/history/history-page'),
  },
  {
    path: 'painel',
    title: 'Painel | Diário de sintomas',
    loadComponent: () => import('./presentation/pages/dashboard/dashboard-page'),
  },
  { path: '**', redirectTo: '' },
];
