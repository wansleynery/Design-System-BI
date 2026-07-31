# Componente BI em React — template de tela Sankhya

Template para criar **telas do Sankhya com o layout novo** (React + os web components
`ez-*` / `snk-*` do Sankhya Design System) e implantá-las como **Componente BI (HTML5)**,
sem tocar no servidor de aplicação.

O `npm run zip` empacota tudo — React, `sankhyablocks`, `ezui`, tema e fontes — em **um
único `index.jsp` auto-contido**, dentro de `build/bi.zip`. Esse zip sobe no cadastro de
Componente BI e a tela funciona: em tempo de execução ela **não busca nenhum chunk, CSS
ou fonte**, só o próprio documento.

É a mesma tecnologia das telas nativas novas do Sankhya (as `labsApps`), disponível para
telas suas.

## Por que isso existe

A forma documentada de usar os componentes do Sankhya assume o monorepo interno (`gulp`,
`build.prod`, pasta de aplicação servida pelo próprio ERP). Numa base onde você só tem
acesso à UI — inclusive as hospedadas pela Sankhya —, o único caminho de implantação é o
**Componente BI**, que aceita um zip de arquivos estáticos e nada mais: sem contexto de
servidor, sem microserviço, sem controle de rota.

Este template resolve a distância entre as duas coisas:

- o build do CRA vira **um arquivo só**, porque o Componente BI não é um bom servidor de
  assets (caminho relativo imprevisível, `publicPath` que não dá para prever);
- a página traz à mão o contexto de sessão que as telas nativas recebem do shell
  (`mgeSession`, token do `sf.js`, pasta base), sem o qual o BFF responde `401`;
- o `AngularJS` do boilerplate antigo sai inteiro — a tela é 100% React.

## Referência de implementação

**Documentação oficial dos componentes:**
<https://gilded-nasturtium-6b64dd.netlify.app/>

É lá que estão o catálogo (`Componentes`, `Utilitários`), a `API Java` do BFF e o
onboarding. Ao criar uma tela nova, comece pela página do bloco que você quer
(`snk-crud`, `snk-grid`, `snk-form`, `snk-filter-bar`, …): os exemplos de aninhamento e as
props de cada um vêm de lá. O `src/Dados.tsx` deste repositório é o exemplo de `snk-crud`
da documentação, verbatim.

## Requisitos

- Node 16+ e npm
- Windows para o `npm run zip` (o empacotamento usa `Compress-Archive` do PowerShell)
- Uma base Sankhya com permissão para cadastrar Componente BI

A tela **não busca nada fora da base** — nem em tempo de build, nem em tempo de execução.
Funciona em base sem saída para a internet.

## Instalação

```bash
git clone <url-do-repo>
cd web
npm install          # ~1300 pacotes, ~40s
```

Se o `npm install` reclamar de `ERESOLVE`, veja
[Pegadinhas](#pegadinhas-herdadas-do-projeto-original).

## Comandos

| Comando             | O que faz                                                       |
|---------------------|-----------------------------------------------------------------|
| `npm run zip`       | **o que você vai usar**: build → embute tudo → `build/bi.zip`   |
| `npm run zip:split` | escape hatch: gera `index.jsp` + `bi.js` (dois arquivos)        |
| `npm start`         | dev server do CRA — a tela sobe vazia, veja abaixo              |
| `npm test`          | `--passWithNoTests`; não há testes                              |
| `npm run build`     | **não funciona** — sobra do monorepo interno, use `npm run zip` |

O `npm run build` falha na primeira linha sem tocar em `build/`; o porquê está em
[Pegadinhas](#pegadinhas-herdadas-do-projeto-original).

Flags do `npm run zip` (passe com `--`, ex.: `npm run zip -- --no-zip`):

- `--split` — dois arquivos em vez de um
- `--no-zip` — para depois de gerar `build/`, sem empacotar (deixa os arquivos soltos)
- `--no-build` — reaproveita o `build/static` existente, para depurar o próprio script

**`npm start` não renderiza a tela, e isso é esperado.** O `SnkCrud` conversa com o BFF do
módulo e depende da sessão do ERP; fora do Sankhya não há sessão nem BFF. Um teste local
prova que o bundle *carrega*, nunca que a tela *funciona* — só o upload prova isso.

## Estrutura

```
src/                VOCÊ TRABALHA AQUI
  index.tsx         bootstrap: createRoot + custom elements + removerFrame (nome do card)
  Dados.tsx         a tela em si — troque isto pela sua
  BarraTarefas.tsx  exemplo de botão customizado na barra do SnkCrud
  sankhya.d.ts      tipos dos globais que a página publica (window.BI, window.SANKHYA)
public/
  index.html        infraestrutura — NÃO MEXA. Sessão, tokens e marcadores de build.
scripts/
  zip.js            infraestrutura — NÃO MEXA. Build → embute → zipa, num comando só.
build/              gerado. Ao final contém APENAS bi.zip.
```

**Tudo que você edita fica em `src/`.** Os outros dois arquivos são a plataforma sobre a
qual a tela roda, e são **os mesmos para qualquer tela** — não há nada neles para
personalizar por projeto:

- **`public/index.html`** monta a sessão do ERP, o token do `sf.js`, o `mgeSession` e os
  marcadores que o empacotamento preenche. Mexer aqui é o caminho mais curto para um `401`
  ou um build quebrado.
- **`scripts/zip.js`** faz o empacotamento inteiro. Cada etapa dele existe por causa de um
  problema concreto que já aconteceu — ordem dos chunks, escapes de JSP, quais fontes
  entram, quando apagar os arquivos soltos. Ele também **valida o próprio trabalho** e
  aborta em vez de gerar um zip quebrado; editar sem entender essas verificações troca um
  erro no terminal por uma tela que falha depois de subir.

As duas seções que descrevem esses arquivos —
[O que tem no `index.html`](#o-que-tem-no-indexhtml-e-por-que-não-mexer) e
[Como funciona o empacotamento](#como-funciona-o-empacotamento) — estão aqui como
referência, para você entender o que sustenta a tela. Não são convite para editar.

Se mesmo assim você precisar mudar o empacotamento, comece rodando `npm run zip -- --no-zip`
e comparando o `build/index.jsp` gerado antes e depois: é a única forma barata de ver o que
a sua mudança fez.

Não existe `public/index.jsp`: o `react-scripts` exige que `public/index.html` exista
(`build.js:50`), então manter os dois seria duplicação. O `zip.js` converte um no outro.

## O entregável

`npm run zip` → **`build/bi.zip`** (~1,3 MB), com **uma única entrada na raiz do
arquivo**: `index.jsp` (~4,6 MB), auto-contido.

Quando termina, `build/` **contém apenas o zip**: os arquivos empacotados são apagados
depois que o zip é escrito *e* verificado, para não sobrar cópia solta para subir por
engano.

### Deploy

1. No Sankhya, cadastre o **Componente BI (HTML5)** com o `bi.zip`, `entryPoint =
   index.jsp`.
2. Anote o **nome exato** que você deu ao componente (case sensitive).
3. Ponha esse nome no `instancia` do `removerFrame`, em `src/index.tsx`, e gere o zip de
   novo. É o que tira a tela da moldura de gadget e a abre em tela cheia. **Deixar o texto de
   exemplo aí é o erro mais provável na primeira implantação** — veja
   [De onde vem o `nuGdg`](#de-onde-vem-o-nugdg):

   ```tsx
   window.BI?.removerFrame ({
       paginaInicial: 'index.jsp',
       instancia: 'NOME DO SEU COMPONENTE BI'
   });
   ```

4. Libere o acesso ao componente na tela **Acessos** para os usuários ou grupos que devem
   enxergá-lo.

`paginaInicial` é `index.jsp` e não muda: os arquivos ficam na raiz do zip, e o caminho é
relativo à pasta customizada — a função monta a URL final sozinha.

## Como editar

### Trocar a tela

`src/Dados.tsx` é o exemplo mínimo. O aninhamento **é obrigatório** — o `SnkCrud` exige
`SnkApplication` (config, permissões, mensagens) e `SnkDataUnit` (metadados e estado da
entidade) como pais:

```tsx
<SnkApplication configName="Parceiro">
  <SnkDataUnit entityName="Parceiro">
    <SnkCrud />
  </SnkDataUnit>
</SnkApplication>
```

Troque `Parceiro` pela sua entidade. Para outros blocos (`SnkGrid`, `SnkForm`,
`SnkFilterBar`, …) consulte a [documentação de referência](#referência-de-implementação)
— cada página traz o aninhamento exigido.

O `DataUnit` é o hub de estado da tela, **não** o state do React. Uma tela real configura
os cinco loaders (`metadataLoader`, `dataLoader`, `saveLoader`, `removeLoader`,
`recordLoader`) contra o BFF. Registros são chaveados por `__record__id__`; campos são
descritos por metadados (`name`, `label`, `dataType`, `userInterface`).

A documentação recomenda uma *Critical Note* que este template **não** implementa: travar
o filho no `onDataUnitReady` (`{dataUnit && <SnkCrud />}`) para o `SnkDataUnit` inicializar
primeiro. Aqui o `SnkCrud` renderiza incondicionalmente, como no exemplo básico. Se sua
tela depender de estado pronto na montagem, siga a nota.

### Botão na barra de tarefas

`src/BarraTarefas.tsx` mostra o caminho suportado: o `taskbarManager` do próprio
`SnkCrud`, não um `<SnkTaskbar>` avulso — o CRUD monta as barras internamente e o manager
é o gancho para interferir nelas.

Duas armadilhas documentadas no arquivo: o evento `onActionClick` dispara para **qualquer**
botão da barra (filtrar pelo `name` é obrigatório), e com `iconName` + `text` os campos
`hint` e `text` chegam **trocados** no botão, por uma inversão de argumentos na própria
lib.

### CSS próprio

Crie um `.css` em `src/` e importe no `src/index.tsx`:

```tsx
import './minha-tela.css';
```

O CRA junta tudo num `main.css` que o empacotamento embute **depois** do CSS base da
página, então as suas regras vencem sem precisar de `!important` nem de tocar no
`index.html`.

Três coisas que economizam tempo antes de brigar com o layout:

- **A cadeia de altura já está resolvida.** `snk-application` e `snk-crud` declaram `:host {
  display:flex; height:100% }`, mas **`snk-data-unit` não tem CSS nenhum** — vira
  `display:inline` e quebraria a cadeia no meio, deixando a grade encolhida com o painel
  vazio. O CSS base já dá `display:flex; flex:1 1 auto; min-height:0` a quem precisa. O
  `min-height:0` importa: sem ele, um filho que transborda impede o flex de encolher o
  container.
- **`snk-crud` e `snk-grid` escrevem classes de padding direto no `render()`**, sem prop
  para desligar — daí as molduras concêntricas que o CSS base já zera com seletores de duas
  classes, que vencem por especificidade.
- **Re-tema pela sobrescrita de CSS custom properties** (`--color--*`, `--space--*`), não
  estilizando componente a componente. Os `snk-*`/`ez-*` são Stencil *scoped* (light DOM,
  alcançável por CSS global), mas alguns — `ez-chip` confirmado — usam shadow DOM real, onde
  só o remapeamento de token funciona.

Vale ler o CSS do componente antes de brigar com ele:
`node_modules/@sankhyalabs/sankhyablocks/dist/collection/components/<nome>/<nome>.css`.
Vários trazem um `:host`, outros não trazem nada.

### `resourceID` — obrigatório, senão a tela abre somente leitura

**Este é o ajuste que mais custa tempo de quem monta a primeira tela**, porque o sintoma não
parece ter relação com configuração:

> **Sem permissão**
> Não é possível fazer alterações. Verifique as permissões de acesso.

Não é permissão de usuário. É a tela pedindo permissão para um recurso que não existe.

O `snk-application` resolve o `resourceID` nesta ordem
(`snk-application.js`, getter `applicationResourceID`):

```
urlParams.get('workspaceResourceID')  ||  urlParams.get('resourceID')
    ||  window.workspace?.resourceID  ||  'unknown.resource.id'
```

Numa tela nativa quem preenche isso é o shell do Sankhya, via `window.workspace` — por isso a
documentação oficial não fala do assunto: lá ele nunca falta. Aqui não há AngularJS nem
workspace, e a URL do `html5component.mge` não traz nenhum dos dois parâmetros, então a
resolução cai em `unknown.resource.id`. As permissões são consultadas em
`cfg://auth/unknown.resource.id`, que não existe, e o `snk-data-unit` trata ausência de
permissão como negação (`snk-data-unit.js:519`):

```js
isAllowed (flag) { return this._permissions ? this._permissions.isSup || this._permissions[flag] : false; }
```

A correção é preencher a constante no topo de `src/Dados.tsx`, que vai como prop do
`SnkDataUnit`:

```tsx
const RESOURCE_ID = 'br.com.sankhya.fin.cad.movimentacaoFinanceira';
```

Assim o `getAllAccess(this.resourceID)` consulta `cfg://auth/<resourceID>` direto, em vez de
usar o da aplicação.

**Para descobrir o valor**, abra a tela nativa equivalente e rode no console:

```js
document.querySelector ('snk-application').dataset.elementId   // 'resource_br.com.sankhya...'
```

Reaproveitar o `resourceID` da tela nativa faz as permissões desta tela seguirem as de lá —
normalmente é o que se quer, e evita cadastrar um recurso novo.

**Não use string vazia para "desligar".** O `getAuth` só cai no comportamento padrão quando o
valor é `undefined` (`'' != undefined`), e `''` consulta `cfg://auth/` e falha com o mesmo
alerta. É por isso que o `Dados.tsx` passa `{RESOURCE_ID || undefined}`.

Cuidado para não confundir com **`window.resourceID`**, que é outra coisa: ele só entra na
query string que o `DataFetcher` monta para o `service.sbr` (`DataFetcher.js:262`) e **não**
influencia permissão nenhuma.

## O que tem no `index.html`, e por que não mexer

Esta seção é **referência**, para você entender o que sustenta a tela. Nada aqui precisa ser
editado para criar uma tela nova, e cada item é uma forma diferente de quebrar o build ou a
sessão.

O arquivo carrega o `jquery` + `/mge/js/sf/sf.js` (o gerenciador de token — sem ele o
`/mge/service.sbr` responde `401`), os globais que o `sf.js` lê (`PCSF`, `PROFILEID`, `RAS`,
`APPLICATION_NAME`, `MODULE_ID`), o `window.SANKHYA` com o contexto de sessão, o
`mgeSession`, o `removerFrame` e o CSS base da tela. **Os dois `<script src>` apontam para a
própria base** — não há CDN. **Não há AngularJS**: saíram
`angular*.js`, `angular-material`, `snk.js`, `launcher.js`, `ui-grid`, `ui-bootstrap`,
`jqwidgets`, `tinymce`, `ace`, `bpmn`, `fullcalendar` e os CSS que os acompanhavam — cerca
de 30 requests que só alimentariam diretivas que esta tela não usa. O `ag-grid-enterprise.js`
também saiu: o `ez-grid` traz a própria cópia do AG Grid dentro do bundle.

Dois detalhes estruturais que uma edição descuidada derruba:

- **O marcador do bundle fica no fim do `<body>`**, depois do `#root`. O `index.tsx` chama
  `createRoot(getElementById('root'))` na primeira linha, então o container precisa já
  existir quando o script inline rodar.
- **Não escreva scriptlets JSP no arquivo** — nem dentro de comentários, nem em prosa. Veja
  a seção seguinte.

### `removerFrame`, sem dependência externa

Cadastrado como Componente BI, a tela abre dentro da moldura de um gadget do dashboard —
pequena e com o cabeçalho do card por cima. O `removerFrame` troca o conteúdo dessa moldura
por um iframe da própria tela em tela cheia.

O código vive num `<script>` inline da página. É um **recorte** do `removerFrame` do
[SankhyaJX](https://github.com/wansleynery/SankhyaJX), que antes vinha de um CDN — trazido
para dentro para que a página não dependa de nada externo. Só esse método veio; o `JX.post`
e o `JX.consultar` ficaram de fora porque nada nesta tela os usa (os dados vêm do BFF, pelo
próprio `sankhyablocks`).

Como funciona, na ordem:

1. Se não há `DashWindow` no documento pai, retorna calado. **É essa guarda que impede o
   laço infinito**: a página recarregada dentro do iframe novo não tem essa classe, então a
   segunda execução para aí. Também é o motivo de o `npm start` não fazer nada.
2. Esconde o alerta do shell e trava a rolagem nos dois níveis acima.
3. Resolve o `nuGdg` do gadget (abaixo).
4. Depois de 500 ms, troca o `innerHTML` do `.dyna-gadget` do pai por um iframe apontando
   para `/mge/html5component.mge?entryPoint=<paginaInicial>&nuGdg=<n>`.

### De onde vem o `nuGdg`

O `nuGdg` identifica **a instância do card no dashboard**, e a tela recarregada não abre sem
ele. São três fontes, nesta ordem:

1. **O parâmetro `nuGdg` da própria URL**, quando o shell o passou ao montar o gadget. É
   exato por construção — não depende de título, de seletor de DOM nem de permissão em
   serviço nenhum.
2. **O título lido do cabeçalho do gadget**, seguido de um `SELECT NUGDG FROM TSIGDG WHERE
   TITULO = …` via `DbExplorerSP.executeQuery`. É o nome do card que está realmente em tela,
   então vence o valor compilado. O seletor depende de uma classe gerada pelo GWT
   (`GI-BUHVBPVC`), que muda entre versões do Sankhya.
3. **O `instancia` que você informou** em `src/index.tsx` — usado quando o seletor acima não
   casa. Tem que ser o nome **exato** do componente, case sensitive.

**Se nenhuma das três resolver, a moldura não é trocada.** Recarregar com `nuGdg=0` leva a
uma tela que o ERP não consegue montar; ficar no gadget pequeno é degradado, mas funciona.
Nesse caso o console explica o que faltou, com o prefixo `[bi]` — filtre por ele no DevTools.

A consulta do passo 2 exige permissão no `DbExplorerSP.executeQuery`. Sem ela, o caminho que
sobra é o passo 1 ou o 3.

## Como funciona o empacotamento

**Nada aqui pede ajuste seu** — é o retrato do que o `scripts/zip.js` já resolve, e cada
item abaixo é uma armadilha que custou um build quebrado ou uma tela que subiu com defeito.
Leia para entender, não para replicar.

**Nada de scriptlets JSP no `public/index.html`.** O `HtmlWebpackPlugin` passa o arquivo
pelo `lodash/template`, que avalia a abertura de scriptlet como JavaScript e quebra o build.
Por isso as diretivas de página e o acesso
à sessão são **marcadores** (`@JSP_DIRETIVAS@`, `@JSP_USUARIO@`) preenchidos pelo `zip.js`,
que se recusa a rodar se achar um `<%` no template. `${BASE_FOLDER}` **pode** ficar
literal: o loader do plugin passa um `interpolate` próprio e o lodash só ativa o modo
ES-template quando esse regex é o default por referência.

**Cada marcador tem que aparecer exatamente uma vez.** O `zip.js` aborta com 0 ou 2+. Não é
teórico: um comentário que listava os marcadores por extenso fez o bundle ser embutido
duas vezes, gerando um JSP silenciosamente duplicado.

**143 arquivos JS viram um sem tocar no webpack.** Todo `*.chunk.js` só faz
`(self.webpackChunk_x = ... ).push([[id], {módulos}])`. Concatenados **antes** do
`main.js`, eles se acumulam nesse array; o runtime do webpack 5 registra todos na
inicialização (`installedChunks[id] = 0`) e nunca dispara requisição. Daí a ordem —
**chunks primeiro, `main.js` por último** — que o script preserva.

**Fontes:** das cinco variantes só o `woff2` (0,15 MB) entra como data URI. As outras somam
3 MB e servem IE (`eot`), Safari iOS ≤ 9 (`svg`, 2,17 MB sozinho) e fallbacks antigos — o
Sankhya roda em Chrome/Electron. Se alguma referência a `static/media` sobreviver, o script
aborta em vez de entregar URL quebrada. O `"homepage": "."` do `package.json` **é
necessário** para isso: é ele que faz o CRA emitir `url(../../static/media/…)` relativo no
CSS, que é como o `zip.js` acha os arquivos.

**Escapes de JSP:** o bundle real contém ~40 `${` (de template literals) e 1 `<%`. Com
`isELIgnored="false"` o container avaliaria os primeiros como EL e os substituiria por
string vazia, e o segundo abriria um scriptlet. O script escapa ambos, preservando os dois
`${BASE_FOLDER}` do template.

### Quando usar `--split`

`npm run zip:split` gera `index.jsp` (6,7 KB) + `bi.js` (4,6 MB). Use se o ERP recusar
o JSP de 4,6 MB (*"code too large"* / constant pool) — **esse risco não foi testado, não há
container JSP aqui** — ou se o cache do navegador importar: o JSP é reenviado a cada
abertura, o `bi.js` de nome fixo responde `304`. O `bi.js` é igualmente auto-contido
(injeta o CSS como `<style>`), então também não busca nada.

## `mgeSession` — a causa do 401

**Já vem resolvido**; está aqui porque é o erro que mais aparece quando alguém tenta montar
essa mesma tela do zero.

O `DataFetcher` do `sankhyablocks` monta a URL do GraphQL a partir de
`window['mgeSession'] || urlParams.get('mgeSession')`. A URL do `html5component.mge` não
carrega esse parâmetro, então **sem o global** a chamada sai como
`/mgefin-bff/graphql?mgeSession=undefined` e o BFF responde `401 Not authenticated`.

O script de contexto da página o preenche a partir do cookie `JSESSIONID`, tirando o sufixo
de jvmRoute (tudo depois do primeiro `.`), lido direto de `document.cookie`.

Se você vir esse `401`, o problema quase certamente não é aqui — é sessão expirada ou o
componente aberto fora do shell do Sankhya.

## Scriptar sobre a tela renderizada

Se você for automatizar ou customizar a tela por fora:

- Dirija a grade pela API do `dataUnit`, **nunca** lendo o DOM: o `ez-grid` embrulha o AG
  Grid e virtualiza linhas, então só a janela visível existe no DOM.
- Selecione nós por `data-element-id` (ex.: `financeiro_crudGrid_snkGrid`), nunca por
  classes geradas `sc-*` ou `ag-*`.
- Espere a hidratação (`customElements.whenDefined('snk-crud')` ou a classe `.hydrated`)
  antes de tocar num componente — antes disso ele existe, mas está `visibility:hidden` e
  não tem API.
- Helpers `angular.*` são inertes aqui (`window.angular` não existe); use `snk-data-unit`.
- Embrulhe código injetado em try/catch: a página hospedeira roda Rollbar com
  `captureUncaught`/`captureUnhandledRejections`, então erro não tratado vai parar na
  telemetria do Sankhya.

## Pegadinhas herdadas do projeto original

Este template nasceu do exemplo oficial `@sankhyalabs/components-demo`. Algumas asperezas
vieram junto e ficaram **de propósito**, para não divergir do upstream — não são bugs para
caçar:

- **`npm run build` não funciona.** Ele roda `npm run build.prod && gulp`, e nem o script
  `build.prod` nem um gulpfile/dependência do gulp existem aqui (pertencem ao monorepo
  interno). Falha na primeira linha sem tocar em `build/`, o que dá a impressão de "o build
  não produziu nada". **Use `npm run zip`.**
- **O `tsconfig.json` usa o clássico `"jsx": "react"`**, e não o `"react-jsx"` do CRA 5 —
  então **todo arquivo precisa importar o React explicitamente**. Com `noUnusedLocals`
  ligado, trocar isso obriga a remover o import de todos os arquivos de uma vez; ficou como
  está por isso.
- **Todas as dependências estão em `devDependencies`** (incluindo `react`, `react-dom` e
  `typescript`), e os pacotes `@sankhyalabs/*` estão fixados em `latest`. **Instalações não
  são reprodutíveis**: dois `npm install` em datas diferentes trazem versões diferentes dos
  blocos, e o `package-lock.json` não é versionado aqui — ele descreveria as versões da
  máquina de quem publicou, não as suas. Se o seu projeto precisa de builds repetíveis, versione
  o lock **no seu** repositório (tire a linha do `.gitignore`) e use `npm ci`. Como o `latest`
  acompanha o que a Sankhya publica, atualizar de propósito costuma ser o que se quer — o
  preço é que uma regressão nos blocos chega sem aviso.
- **`react-i18next` foi removido** porque quebrava o `npm install` com `ERESOLVE`:
  `react-i18next@11` pede `i18next >= 19`, o npm resolvia `i18next@26`, que exige
  `typescript ^5 || ^6 || ^7` enquanto aqui o TypeScript está em `^4.7.4` (o
  `react-scripts 5` só aceita `^3 || ^4`). Nada o importava. Se um dia precisar de i18n,
  use `i18next@^23` + `react-i18next@^13`, alinhado com o que o `@sankhyalabs/ezui` já
  embute.
- **As typings dos pacotes `@sankhyalabs/*` têm erros próprios** (caminhos que não resolvem,
  como `@floating-ui/dom`). O `tsconfig.json` liga `skipLibCheck`, igual ao que o build já
  faz internamente, então `npx tsc` sai limpo. É pelo mesmo motivo que o
  `src/BarraTarefas.tsx` **declara** os tipos do taskbar em vez de importá-los — e funciona
  porque o TypeScript é estrutural: um objeto com o mesmo formato é aceito normalmente.
- **`appmessages.js` dando 404 é cosmético.** O `SnkMessageBuilder` já trata a rejeição com
  um `console.info`; mensagens customizadas são opcionais.

## Não verificado contra um ERP em produção

Se o AG Grid embutido no `ez-grid` precisa de chave de licença própria, agora que a chamada
global `agGrid.LicenseManager.setLicenseKey` saiu junto com
`/mge/scripts/vendors/ag-grid/`.

## Licença e crédito

Autoria: **Wansley Nery Soto** — [LinkedIn](https://www.linkedin.com/in/wansleynery/).

Em uma frase: **use este template à vontade para construir e implantar as suas telas, mas
não redistribua o template.**

- **Livre e gratuito**: usar como base para quantas telas quiser, em quantas bases quiser,
  inclusive em bases de clientes e para fins comerciais.
- **Pode editar** os arquivos para adequar à sua tela e à sua base, preservando os avisos de
  autoria.
- **As suas telas são suas.** O código que você escreve sobre o template (a sua tela, os
  seus componentes) é seu, e implantá-lo não está sujeito a nada aqui.
- **Não pode**, sem autorização por escrito: redistribuir o template em si (nem editado, nem
  embutido em outro produto), remover os avisos de autoria, ou vendê-lo.

Não é uma licença open source.

Precisa de algo que a licença não cobre (redistribuir, embutir em outro produto, uma
parceria)? Abra uma issue.

### Termos completos

> **Componente BI em React — Licença de Uso**
>
> Copyright (c) 2026 Wansley Nery Soto. Todos os direitos reservados.
>
> Neste documento, "o Template" designa os arquivos deste repositório: a página, os fontes
> de exemplo, o script de empacotamento e a documentação.
>
> **1. Permitido**, gratuitamente e sem necessidade de aviso prévio
>
> a) usar o Template como base para desenvolver telas e componentes próprios, e implantar o
> resultado em qualquer número de bases, ambientes e usuários, inclusive para fins
> comerciais e em bases de clientes;
> b) copiar os arquivos na medida necessária para esse desenvolvimento e implantação,
> incluindo backup e repositórios privados da própria equipe;
> c) **editar e adaptar** os arquivos do Template, desde que os avisos de autoria e de
> copyright sejam preservados. Esta permissão é para uso próprio: o arquivo editado
> continua sujeito à cláusula 2.
> d) o código autoral que o usuário escrever sobre o Template — suas telas, seus componentes
> e sua lógica de negócio — é de titularidade exclusiva dele e não fica sujeito a esta
> licença; a cláusula 2 alcança o Template, não o trabalho derivado dele.
>
> **2. Não permitido**, sem autorização prévia e por escrito do titular
>
> a) redistribuir o Template, editado ou não, integral ou parcialmente, por qualquer meio ou
> canal, inclusive embutido em outro produto, componente, pacote, curso ou oferta de
> serviço;
> b) publicar o Template, ou uma variação dele, como template, boilerplate ou starter kit
> próprio;
> c) remover, alterar ou ocultar os avisos de autoria e de copyright presentes nos arquivos
> ou na documentação;
> d) sublicenciar, vender, alugar ou oferecer o Template como serviço.
>
> **3. Autoria**
>
> A autoria e a titularidade do Template permanecem integralmente com Wansley Nery Soto.
> Nenhuma permissão acima transfere direito autoral, marca ou qualquer outro direito de
> propriedade intelectual sobre o Template. As adaptações feitas sob a cláusula 1.c não
> geram titularidade sobre o Template original.
>
> **4. Ausência de garantia**
>
> O TEMPLATE É FORNECIDO "COMO ESTÁ", SEM GARANTIA DE QUALQUER NATUREZA, EXPRESSA OU
> IMPLÍCITA, INCLUINDO MAS NÃO SE LIMITANDO A GARANTIAS DE ADEQUAÇÃO A UM PROPÓSITO
> ESPECÍFICO E DE NÃO VIOLAÇÃO. EM NENHUMA HIPÓTESE O TITULAR RESPONDERÁ POR QUALQUER
> RECLAMAÇÃO, DANO OU OUTRA RESPONSABILIDADE DECORRENTE DO USO OU DA IMPOSSIBILIDADE DE USO
> DO TEMPLATE.
>
> A implantação ocorre em ambiente de terceiros (base Sankhya do usuário), sob
> responsabilidade exclusiva de quem implanta, inclusive quanto a testes, homologação e
> backup prévios. Arquivos editados sob a cláusula 1.c são de responsabilidade exclusiva de
> quem os editou.
>
> **5. Rescisão**
>
> O descumprimento de qualquer item da cláusula 2 encerra automaticamente, e de imediato, as
> permissões concedidas na cláusula 1.
>
> **6. Contato**
>
> Autorizações, exceções e parcerias: abra uma issue neste repositório.

### Sobre as marcas e o código de terceiros

Sankhya, Sankhya Om e os pacotes `@sankhyalabs/*` são propriedade da Sankhya Gestão de
Negócios. Este repositório **não** redistribui esses pacotes — eles são baixados do npm pelo
`npm install`, sob os termos dos seus próprios detentores. O template nasceu do exemplo
público `@sankhyalabs/components-demo` e não é um produto oficial nem endossado pela
Sankhya.
