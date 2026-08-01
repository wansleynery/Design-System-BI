import React from 'react';
import { createRoot } from 'react-dom/client';
import { applyPolyfills as applyBlocks, defineCustomElements as defineBlocks} from "@sankhyalabs/sankhyablocks/loader";
import { applyPolyfills, defineCustomElements } from "@sankhyalabs/ezui/loader";
import '@sankhyalabs/sankhya-docusaurus-styles/dist/index.css';
import '@sankhyalabs/ez-design/dist/default/ez-themed.min.css';

import Dados, { RESOURCE_ID } from './Dados';

/*
 * Tira a tela da moldura de gadget e reabre em tela cheia. Roda no escopo do modulo, antes
 * do createRoot: a versao em useEffect foi testada num gadget real e nao removeu o frame.
 *
 * `instancia` e o nome EXATO (case sensitive) do Componente BI cadastrado no Sankhya.
 * Fora do Sankhya nao existe window.BI e a chamada simplesmente nao acontece.
 *
 * `resourceID` vai junto porque a URL do iframe montado aqui e a unica desta tela que
 * podemos escrever, e e por urlParams que o snk-application descobre o resourceID da
 * aplicacao. O valor vem do Dados.tsx para nao existir uma segunda copia dele: aqui so
 * passa adiante.
 */
const substituindo = window.BI?.removerFrame ({
    paginaInicial: 'index.jsp',
    instancia: 'TESTE REACT',
    resourceID: RESOURCE_ID
});

const montar = () =>
    createRoot (document.getElementById ('root') as HTMLElement)
        .render (<React.StrictMode><Dados /></React.StrictMode>);

/*
 * ABRIR A TELA MONTA O REACT UMA VEZ SO.
 *
 * Dentro da moldura do gadget este documento tem meio segundo de vida: o removerFrame
 * troca o innerHTML do .dyna-gadget por um iframe da mesma pagina em tela cheia, e o que
 * estava aqui morre. Montar mesmo assim significava subir a aplicacao inteira duas vezes
 * por abertura, e as duas mandavam ao BFF o mesmo lote de ~8 queries com 500ms de
 * diferenca — a primeira ainda em voo quando a segunda sai, a primeira sendo abortada no
 * meio. E o unico ponto desta tela onde duas cargas concorrem, e o 500 intermitente que
 * aparece nesse lote nunca se reproduziu em carga isolada.
 *
 * Entao: monta quando a moldura FICA (false), nao monta quando ela sai (true) — nesse caso
 * quem monta e a pagina recarregada dentro do iframe novo, que ja nasce com o resourceID
 * na URL e sem ninguem para atropelar.
 *
 * O atraso so existe no caminho condenado. Sem window.BI (npm start) ou fora de um gadget,
 * a promise ja vem resolvida em false e a montagem acontece no mesmo tick.
 */
if (substituindo) {
    substituindo.then (trocou => { if (!trocou) montar (); });
} else {
    montar ();
}

applyPolyfills ().then (() => defineCustomElements ());
applyBlocks    ().then (() => defineBlocks ());
