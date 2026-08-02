// Rodape de totais da grade, no molde do que a tela nativa de Movimentacao Financeira mostra.
//
// A tela nativa nao usa nenhum componente da lib para isso: ela projeta o proprio HTML no slot
// `SnkGridFooter`. Confirmado no DOM dela — <div slot="SnkGridFooter"> com uma div .footer-totals
// dentro. O snk-crud repassa esse slot ao snk-grid (snk-crud.js:363), que o renderiza depois da
// ez-grid, entao daqui basta devolver a marcacao e passa-la como filho do <SnkCrud>.
//
// O layout sai todo de utilitarias do tema ez-design (ez-row, ez-col, ez-align, ez-text,
// ez-padding, ez-margin), ja embutido no bundle. A .footer-totals do public/index.html so
// carrega o que nao tem utilitaria equivalente. As classes .total-indicator__icon* tambem vem
// de la: sao da labsApp da tela nativa, nao da lib.
//
// Comentarios de linha, e nao um bloco, pelo mesmo motivo dos outros arquivos: o ESLint do CRA
// le o primeiro bloco do arquivo como possivel anotacao Flow e a arroba de um nome de pacote ali
// dispara "Malformed Flow file annotation".

import React from 'react';
import { NumberUtils } from '@sankhyalabs/core';
import { EzIcon } from '@sankhyalabs/ezui/react/components';

/*
 * Um cartao do rodape.
 *
 * `valor` trafega como NUMERO: a formatacao pertence a quem apresenta, nao a quem calcula.
 * Isso e o que permite `formato` existir — a tela nativa mostra contagem e moeda lado a lado
 * (2.253 e 2.890.724,86), entao o caso misto e o esperado, nao hipotetico.
 *
 * `tom` nomeia o SIGNIFICADO, nao o pigmento: as cores saem de --color--success / --color--error
 * do tema, e amarrar a API a "verde" quebraria no dia em que positivo deixasse de ser verde.
 *
 * `icone` e um nome de icone do ez-design — os mesmos que a BarraTarefas.tsx lista. A tela
 * nativa usa south-east (receita), north-west (despesa), balance (saldo), arrow_downward e
 * calendar-clock.
 */
export interface TotalDoRodape {
    rotulo: string;
    valor: number;
    formato?: 'inteiro' | 'moeda';
    icone?: string;
    tom?: 'positivo' | 'negativo';
}

/*
 * Formata pelo NumberUtils do @sankhyalabs/core, e nao por toLocaleString proprio, porque e o
 * mesmo helper que a grade logo acima usa nas celulas numericas
 * (ezui/.../AgGridController.js:1099). Duas rotas de formatacao para numeros colados na tela
 * divergiriam sem aviso na primeira mudanca de regra da lib.
 *
 * A assinatura recebe string (NumberUtils.d.ts:33) — dai o String(). O safeFormat do caso
 * monetario ainda devolve '0,00' para valor invalido, em vez de estourar.
 */
const formatar = (total: TotalDoRodape): string =>
    total.formato === 'moeda'
        ? NumberUtils.safeFormat (String (total.valor), 2)
        : NumberUtils.format (String (total.valor), 0);

/*
 * O CONTAINER E RENDERIZADO SEMPRE, MESMO SEM TOTAIS — nao devolva null aqui.
 *
 * Os slots do Stencil em modo scoped nao sao slots nativos: o host realoca os nos com o `slot`
 * correspondente durante o proprio render dele. Um elemento que so nasce depois fica onde o
 * React o colocou — filho direto do <snk-crud>, antes da view stack — e aparece no TOPO da
 * tela, acima da barra de filtros. So volta ao lugar se o snk-grid renderizar de novo por
 * outro motivo, o que nao e garantido.
 *
 * Existindo desde o primeiro commit do React, ele e realocado no primeiro render do host e
 * dali em diante o React so troca os filhos. O custo de manter a caixa vazia por um instante
 * e uma faixa de alguns pixels ate o DataUnit avisar.
 */
const Rodape = ({ totais }: { totais: Array <TotalDoRodape> }) => {

    return (
        <div
            slot      = "SnkGridFooter"
            className = "footer-totals ez-row ez-align--middle ez-padding-horizontal--medium ez-padding-top--medium"
        >
            {totais.map (total => (
                <div
                    key       = {total.rotulo}
                    className = "ez-col ez-col--sd-6 ez-col--tb-2 ez-align--middle ez-margin-bottom--small"
                >
                    {total.icone && (
                        <div
                            className = {
                                'total-indicator__icon ez-margin-right--small'
                                + (total.tom ? ' total-indicator__icon--' + total.tom : '')
                            }
                        >
                            <EzIcon iconName={total.icone} size="large" />
                        </div>
                    )}
                    <div>
                        <div className="ez-text ez-text--small ez-text--primary">{total.rotulo}</div>
                        <div className="ez-text ez-text--large ez-text--bold">{formatar (total)}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Rodape;
