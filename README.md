# Diário de sintomas — fibromialgia

PWA em Angular para registrar, em poucos toques, quando e onde os sintomas da fibromialgia aparecem,
com intensidade de 1 a 5, e acompanhar a evolução num painel.

## Rodar

```bash
npm start            # desenvolvimento em http://localhost:4200 (service worker desligado)
npm run build        # build de produção com service worker em dist/registro-de-sintomas/browser
npx ng test --watch=false
```

Para testar a instalação como app e o modo offline, sirva o build de produção (ex.: `npx http-server dist/registro-de-sintomas/browser`).

## Arquitetura (Clean Architecture)

```
src/app/
  domain/           regras puras, sem Angular nem navegador
    models/         Symptom, SymptomEntry, Intensity, BodyRegion, DayPeriod, datas
    ports/          contratos (classes abstratas): repositórios, catálogo, relógio, ids
    statistics/     cálculos do painel (funções puras, testadas)
  application/      casos de uso e estado reativo (signals)
    journal.store.ts
    use-cases/      registrar, apagar/desfazer, sintoma personalizado, backup .json
  infrastructure/   implementações das portas (localStorage, catálogo, arquivos)
    provide-infrastructure.ts   liga cada porta à implementação
  presentation/     componentes, páginas e a cena 3D (Three.js)
```

As dependências apontam para dentro: a apresentação usa casos de uso, que dependem só das portas do domínio.
Trocar `localStorage` por IndexedDB, por exemplo, exige só um novo repositório em `infrastructure/` e uma linha em `provide-infrastructure.ts`.

## Dados

Os registros ficam no `localStorage` do aparelho. Em **Histórico → Cópia de segurança** é possível baixar
um arquivo `.json` e importá-lo em outro aparelho. A importação junta os registros, sem duplicar.
