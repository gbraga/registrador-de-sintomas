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

## Publicar no GitHub Pages

O app é só HTML, CSS e JavaScript (os dados ficam no aparelho), então o GitHub Pages hospeda de graça.
A publicação é **automática**: a cada `push` na `main`, o GitHub testa, gera o build e põe no ar.

### Configuração (uma vez só)

1. Envie o projeto para o GitHub:
   ```bash
   git push origin main
   ```
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment → Source**, escolha **GitHub Actions**.
4. Abra a aba **Actions** e acompanhe o workflow **Publicar no GitHub Pages**
   (se ele falhou por ter rodado antes do passo 3, clique em **Re-run all jobs**).
5. Quando ficar verde ✅, o app estará em:
   ```
   https://<seu-usuario>.github.io/<nome-do-repositorio>/
   ```
   O link também aparece em **Settings → Pages** e no resumo do workflow.

### Publicar uma nova versão

```bash
git add .
git commit -m "minha alteração"
git push
```

Pronto: em 1 ou 2 minutos a nova versão está no ar. Quem já instalou o app recebe a atualização
na próxima vez que abrir (o service worker baixa em segundo plano).

### Também dá para publicar manualmente

Em **Actions → Publicar no GitHub Pages → Run workflow**, sem precisar de um commit novo.

### O que o workflow faz (`.github/workflows/deploy.yml`)

| Passo | Por quê |
| --- | --- |
| `ng test` | não publica se algum teste falhar |
| `ng build --base-href "/<repositório>/"` | o site fica num subcaminho, não na raiz do domínio |
| copia `index.html` para `404.html` | recarregar `/historico` ou `/painel` abre o app em vez de um erro 404 |
| cria `.nojekyll` | impede o GitHub de processar/ignorar arquivos do build |

### Problemas comuns

- **Página em branco**: o repositório foi renomeado? Rode o workflow de novo — o `base href` usa o nome atual.
- **Erro 404 no endereço principal**: confira se **Source** está em **GitHub Actions** (e não em *Deploy from a branch*).
- **Versão antiga aparece**: feche e abra o app (ou recarregue a página) para o service worker trocar de versão.
- **Repositório privado**: o GitHub Pages em repositório privado exige plano pago; deixe o repositório público.
- **Os dados somem ao trocar de endereço?** Sim: o `localStorage` é por endereço. Use
  **Histórico → Cópia de segurança** para levar os registros de `localhost` para o site publicado.

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
