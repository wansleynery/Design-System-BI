import React from 'react';
import { createRoot } from 'react-dom/client';
import { applyPolyfills as applyBlocks, defineCustomElements as defineBlocks} from "@sankhyalabs/sankhyablocks/loader";
import { applyPolyfills, defineCustomElements } from "@sankhyalabs/ezui/loader";
import '@sankhyalabs/sankhya-docusaurus-styles/dist/index.css';
import '@sankhyalabs/ez-design/dist/default/ez-themed.min.css';

import Dados from './Dados';

/*
 * Tira a tela da moldura de gadget e reabre em tela cheia. Roda no escopo do modulo, antes
 * do createRoot: a versao em useEffect foi testada num gadget real e nao removeu o frame.
 *
 * `instancia` e o nome EXATO (case sensitive) do Componente BI cadastrado no Sankhya.
 * Fora do Sankhya nao existe window.BI e a chamada simplesmente nao acontece.
 */
window.BI?.removerFrame ({
    paginaInicial: 'index.jsp',
    instancia: 'NOME DO SEU COMPONENTE BI'
});

createRoot  (document.getElementById ('root') as HTMLElement)
    .render (<React.StrictMode><Dados /></React.StrictMode>);

applyPolyfills ().then (() => defineCustomElements ());
applyBlocks    ().then (() => defineBlocks ());
