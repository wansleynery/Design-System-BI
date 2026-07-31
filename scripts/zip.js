/*
 * Build -> pacote -> zip, num comando so. `npm run zip` chama este arquivo.
 *
 * Saida padrao: build/bi.zip, com UM arquivo na raiz do pacote — index.jsp, auto-contido.
 *
 * Como os 143 arquivos de JS viram um, sem mexer no webpack: cada *.chunk.js so faz
 * `(self.webpackChunk_x = self.webpackChunk_x || []).push([[id], {modulos}])`. Se rodarem
 * ANTES do main.js, ficam acumulados nesse array; o runtime do webpack 5, ao iniciar, faz
 * `chunkLoadingGlobal.forEach(webpackJsonpCallback...)` e registra todos, marcando
 * installedChunks[id] = 0. Depois disso __webpack_require__.f.j ve os chunks como ja
 * instalados e nunca dispara requisicao. Por isso a ordem: chunks, main.js.
 *
 * Fontes: das 5 variantes so o woff2 (0,15 MB) entra como data URI. As outras somam 3 MB
 * e so servem a IE (eot), Safari iOS <=9 (svg, 2,17 MB sozinho) e fallbacks antigos — o
 * Sankhya roda em Chrome/Electron.
 *
 * Flags:
 *   --split     gera index.jsp + bi.js (2 arquivos) em vez de um. Use se o Jasper recusar
 *               o JSP de ~4,6 MB ("code too large" / constant pool) ou se quiser cache de
 *               navegador: o JSP e reenviado a cada abertura, o bi.js responde 304.
 *   --no-zip    para depois de gerar build/, sem empacotar.
 *   --no-build  reaproveita o build/static existente (util para depurar este script).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const modoSplit = process.argv.includes('--split');
const semZip = process.argv.includes('--no-zip');
const semBuild = process.argv.includes('--no-build');

const projectDir = path.resolve(__dirname, '..');
const buildDir = path.join(projectDir, 'build');
const jsDir = path.join(buildDir, 'static', 'js');
const cssDir = path.join(buildDir, 'static', 'css');
const mediaDir = path.join(buildDir, 'static', 'media');
const templatePath = path.join(projectDir, 'public', 'index.html');
const zipPath = path.join(buildDir, 'bi.zip');

function abortar(mensagem) {
  console.error(`[zip] ${mensagem}`);
  process.exit(1);
}

const mb = (texto) => (Buffer.byteLength(texto, 'utf8') / 1048576).toFixed(2);

/*
 * Substitui um marcador SEM interpretar padroes de $ na substituicao.
 *
 * String.replace(str, str) trata $&, $`, $' e $n como referencias ao casamento — e o bundle
 * minificado tem `$&&$.parentNode`, cujo $& virava o proprio marcador, injetando o texto do
 * marcador no meio do JS e quebrando o parse. split/join nao sofre disso.
 */
function trocar(texto, marcador, valor) {
  const partes = texto.split(marcador);

  /*
   * Exatamente uma ocorrencia. Ja aconteceu de o bloco de documentacao do index.html citar
   * os marcadores por extenso: o bundle foi inlinado duas vezes e o JSP saiu com 9,21 MB em
   * vez de 4,61 MB, sem nenhum erro.
   */
  if (partes.length === 1) abortar(`marcador ${marcador} ausente em public/index.html`);
  if (partes.length > 2) {
    abortar(`marcador ${marcador} aparece ${partes.length - 1}x em public/index.html — deve aparecer 1x`);
  }

  return partes.join(valor);
}

/* ------------------------------------------------------- checagem previa ---- */

if (!fs.existsSync(templatePath)) abortar(`${templatePath} não existe.`);

/*
 * Lido uma vez so: serve a checagem abaixo e, depois do build, a montagem do JSP.
 *
 * O .toString() e redundante em runtime — readFileSync com encoding ja devolve string, e
 * String.prototype.toString devolve a propria string. Ele esta ai porque a assinatura tem
 * sobrecarga (Buffer sem encoding, string com) e o editor nao resolve a variante de string,
 * acusando "Unresolved function or method split()". Como toString existe nos dois tipos, a
 * chamada fecha a inferencia sem mudar nada.
 */
let template = fs.readFileSync(templatePath, 'utf8').toString();

/*
 * Antes de gastar um build inteiro: o HtmlWebpackPlugin passa public/index.html pelo
 * lodash/template, que avalia <% ... %> como JavaScript. Um scriptlet de JSP ali derruba o
 * build com "SyntaxError: Invalid or unexpected token" vindo de dentro do lodash — inclusive
 * quando aparece so em prosa, dentro de um comentario HTML.
 */
const scriptlets = template.split('<%').length - 1;

if (scriptlets > 0) {
  abortar(
    `public/index.html tem ${scriptlets} ocorrência(s) de "<%" — o lodash/template do `
    + 'HtmlWebpackPlugin as avalia como JavaScript e o build quebra. Use os marcadores '
    + '<!--@JSP_DIRETIVAS@--> e @JSP_USUARIO@, e não cite scriptlets nem nos comentários.'
  );
}

/* ---------------------------------------------------------------- build ---- */

if (!semBuild) {
  /*
   * GENERATE_SOURCEMAP fica aqui, e nao num .env: os .map eram 14 MB de um build de 18 MB e
   * nao servem para nada dentro do ERP. Passar pelo ambiente do spawn tambem evita depender
   * de `VAR=valor comando`, que nao funciona no cmd.exe do Windows.
   */
  /*
   * Chama o bin do react-scripts pelo proprio node, sem npx: desde a CVE-2024-27980 o Node
   * recusa spawnar .cmd/.bat sem shell:true (npx.cmd da EINVAL), e "npx" sem extensao da
   * ENOENT no Windows. Assim tambem evita-se depender de shell e de aspas.
   */
  const build = spawnSync(
    process.execPath,
    [require.resolve('react-scripts/bin/react-scripts.js'), 'build'],
    { cwd: projectDir, stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, GENERATE_SOURCEMAP: 'false' } }
  );

  if (build.error) abortar(`react-scripts build não executou: ${build.error.message}`);
  if (build.status !== 0) abortar(`react-scripts build falhou (código ${build.status}).`);
}

if (!fs.existsSync(jsDir)) abortar(`${jsDir} não existe — rode sem --no-build.`);

/* ------------------------------------------------------------------- JS ---- */

const arquivosJs = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));
const principal = arquivosJs.find((f) => /^main\.\w+\.js$/.test(f));

if (!principal) abortar('main.<hash>.js não encontrado.');

// Os chunks têm que vir antes do main.js — ver o comentário do topo.
const ordem = [...arquivosJs.filter((f) => f !== principal), principal];

const js = ordem.map((f) => fs.readFileSync(path.join(jsDir, f), 'utf8')).join('\n;');

/* ------------------------------------------------------------------ CSS ---- */

const arquivoCss = fs.readdirSync(cssDir).find((f) => f.endsWith('.css'));
if (!arquivoCss) abortar('main.<hash>.css não encontrado.');

let css = fs.readFileSync(path.join(cssDir, arquivoCss), 'utf8');

// Em cada @font-face, mantém só as fontes woff2 e descarta eot/woff/ttf/svg.
css = css.replace(/@font-face\{([^}]*)}/g, (bloco, corpo) => {
  const novo = corpo
    .replace(/src:([^;]+)/g, (decl, valor) => {
      const fontes = valor
        .split(',')
        .map((parte) => parte.trim())
        .filter((parte) => /\.woff2[^)]*\)/.test(parte));
      return fontes.length ? `src:${fontes.join(',')}` : '';
    })
    .replace(/;{2,}/g, ';')
    .replace(/^;+|;+$/g, '');

  return `@font-face{${novo}}`;
});

// O que sobrou de static/media vira data URI.
const tipos = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', svg: 'image/svg+xml' };

css = css.replace(/url\((?:\.\.\/)*static\/media\/([^)#?]+)[^)]*\)/g, (todo, arquivo) => {
  const origem = path.join(mediaDir, arquivo);
  if (!fs.existsSync(origem)) {
    console.warn(`[zip] AVISO: ${arquivo} não encontrado, url mantida`);
    return todo;
  }
  const ext = path.extname(arquivo).slice(1).toLowerCase();
  const base64 = fs.readFileSync(origem).toString('base64');
  return `url(data:${tipos[ext] || 'application/octet-stream'};base64,${base64})`;
});

const restantes = css.match(/static\/media\//g);
if (restantes) abortar(`${restantes.length} referência(s) a static/media sobraram no CSS.`);

/* --------------------------------------------------------------- montagem ---- */

/*
 * Escapes de JSP. Com isELIgnored="false" o container avalia ${...} no corpo da pagina,
 * inclusive dentro de <script> — e o bundle minificado tem ~40 ocorrencias vindas de
 * template literals, que seriam silenciosamente substituidas por vazio. O <% abriria um
 * scriptlet e quebraria a compilacao. </script fecharia a tag mais cedo.
 */
function escaparParaJsp(texto) {
  return texto
    .split('${').join('\\${')
    .split('#{').join('\\#{')
    .split('<%').join('<\\%')
    .split('</script').join('<\\/script');
}

const DIRETIVAS = [
  '<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="false" %>',
  '<%@ page import="br.com.sankhya.modelcore.auth.AuthenticationInfo" %>',
  '<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>',
].join('\n');

const USUARIO = '<%= ((AuthenticationInfo) session.getAttribute ("usuarioLogado")).getUserID ().toString () %>';

console.log(`[zip] js  ${ordem.length} arquivos -> ${mb(js)} MB`);
console.log(`[zip] css ${mb(css)} MB (fontes woff2 embutidas)`);

/*
 * As diretivas e o <%= %> só existem no JSP: no public/index.html eles são marcadores,
 * porque o HtmlWebpackPlugin passa o arquivo pelo lodash/template e <% ... %> é avaliado
 * como JavaScript, quebrando o build. ${BASE_FOLDER} pode ficar literal lá — o loader usa
 * um `interpolate` próprio, e o lodash só liga o modo ES-template quando esse regex é o
 * default por referência.
 */
template = trocar(template, '<!--@JSP_DIRETIVAS@-->', DIRETIVAS);
template = trocar(template, '@JSP_USUARIO@', USUARIO);

if (modoSplit) {
  const bi = '/* Gerado por scripts/zip.js — não edite à mão. */\n'
    + `(function(){var s=document.createElement('style');s.textContent=${JSON.stringify(css)};`
    + 'document.head.appendChild(s);})();\n'
    + js;

  fs.writeFileSync(path.join(buildDir, 'bi.js'), bi, 'utf8');

  /*
   * A URL fica numa constante em vez de literal no atributo src. O editor injeta HTML em
   * strings assim e tenta resolver o caminho no disco, acusando "Cannot resolve directory
   * '${BASE_FOLDER}'" — mas quem resolve isso e o container JSP, em tempo de requisicao.
   * Com o valor vindo de uma variavel nao ha caminho literal para ele tentar abrir.
   */
  const srcBi = '${BASE_FOLDER}/bi.js';

  template = trocar(template, '<!--@BI_STYLE@-->', '');
  template = trocar(template, '<!--@BI_SCRIPT@-->', `<script src="${srcBi}"></script>`);

  console.log(`[zip] build/bi.js gerado (${mb(bi)} MB)`);
} else {
  template = trocar(template, '<!--@BI_STYLE@-->', `<style>${escaparParaJsp(css)}</style>`);
  template = trocar(template, '<!--@BI_SCRIPT@-->', `<script>${escaparParaJsp(js)}</script>`);
}

fs.writeFileSync(path.join(buildDir, 'index.jsp'), template, 'utf8');

/* ---------------------------------------------------------------- limpeza ---- */

fs.rmSync(path.join(buildDir, 'static'), { recursive: true, force: true });

for (const arquivo of ['index.html', 'asset-manifest.json']) {
  fs.rmSync(path.join(buildDir, arquivo), { force: true });
}

if (!modoSplit) fs.rmSync(path.join(buildDir, 'bi.js'), { force: true });

console.log(`[zip] build/index.jsp gerado (${mb(template)} MB)`);
console.log(`[zip] build/ agora: ${fs.readdirSync(buildDir).join(', ')}`);

if (semZip) process.exit(0);

/* ------------------------------------------------------------ empacotamento ---- */

/*
 * Compress-Archive do PowerShell em vez de uma dependencia npm: instalar pacotes aqui ja e
 * fragil (ver o caso do react-i18next no CLAUDE.md) e nao vale uma dependencia nova so para
 * zipar. Compress-Archive nao sobrescreve de forma confiavel em PowerShell antigo, dai o
 * unlink antes.
 */
fs.rmSync(zipPath, { force: true });

// Aspas simples do PowerShell: escapa duplicando, para aguentar caminhos com espaços
// ("Componente de BI React") e apóstrofos.
const ps = (valor) => `'${valor.replace(/'/g, "''")}'`;

/*
 * Lista explicita em vez de build\*, porque o zip mora DENTRO de build/: com o glob o
 * Compress-Archive enumeraria o proprio arquivo de destino. Filtrar por extensao cobre
 * tambem o caso de um bi.zip antigo ter sobrado de uma execucao com --no-build (num build
 * normal o react-scripts esvazia a pasta antes).
 *
 * Sao os arquivos em si, nao a pasta, entao eles ficam na RAIZ do pacote — e o que o
 * componente de BI espera, e o que mantem o paginaInicial do JX.removerFrame como
 * 'index.jsp' (ver src/index.tsx).
 */
const aEmpacotar = fs.readdirSync(buildDir).filter((nome) => !nome.endsWith('.zip'));

if (aEmpacotar.length === 0) abortar('nada para empacotar em build/.');

const caminhos = aEmpacotar.map((nome) => ps(path.join(buildDir, nome)));

const comando = `Compress-Archive -Path ${caminhos.join(',')} -DestinationPath ${ps(zipPath)} -CompressionLevel Optimal`;

const resultado = spawnSync(
  'powershell',
  ['-NoProfile', '-NonInteractive', '-Command', comando],
  { stdio: ['ignore', 'inherit', 'inherit'] }
);

if (resultado.error || resultado.status !== 0) abortar('Compress-Archive falhou.');
if (!fs.existsSync(zipPath)) abortar('o zip não foi criado.');

console.log(`[zip] build/${path.basename(zipPath)} gerado (${(fs.statSync(zipPath).size / 1048576).toFixed(1)} MB)`);

/*
 * Empacotado e conferido, as copias soltas nao servem mais — o zip e o entregavel. So
 * roda depois das duas checagens acima, para nunca apagar o conteudo de um pacote que
 * falhou. Com --no-zip o script ja saiu antes daqui e build/ fica intacto.
 */
for (const nome of aEmpacotar) {
  fs.rmSync(path.join(buildDir, nome), { recursive: true, force: true });
}

console.log(`[zip] build/ agora: ${fs.readdirSync(buildDir).join(', ')}`);
