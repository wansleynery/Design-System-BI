// Configuracao inicial da SnkFilterBar da tela.
//
// Os tipos sao declarados aqui em vez de importados de sankhyablocks: FilterItemType e
// FilterType (snk-filter-bar/filter-item/filter-item-type.enum, .../types/filter-type.enum)
// nao fazem parte da API publica do pacote — so existem sob dist/collection/**, fora de
// main/exports — e o pacote esta fixado em `latest`, entao um import de caminho interno
// pode quebrar a qualquer `npm install`. Diferente do caso de BarraTarefas.tsx, porem,
// esses dois campos sao string enums do lado da lib: um objeto so com o mesmo formato nao
// basta, TypeScript nao aceita string literal solta onde espera um enum. Por isso o array
// exportado sai tipado com os literais aqui (documentados, conferidos contra os .d.ts
// publicados) e e a Dados.tsx que faz o cast na fronteira com a prop da SnkFilterBar.
//
// Comentarios de linha, e nao um bloco /* */, pelo mesmo motivo do BarraTarefas.tsx: o
// ESLint do CRA le o primeiro bloco do arquivo como possivel anotacao Flow e a arroba de um
// nome de pacote ali dispara "Malformed Flow file annotation".

/*
 * Espelha SnkFilterItemConfig (snk-filter-bar/filter-item/snk-filter-item.d.ts), so com os
 * campos que esta tela usa.
 *
 * `type` e `filterType` ficam como string: os valores validos sao os enums FilterItemType
 * (NUMBER, TEXT, SEARCH, PERIOD, BINARY_SELECT, MULTI_SELECT, MULTI_LIST, CHECK_BOX_LIST,
 * DEFAULT_FILTER, PERSONALIZED) e FilterType (QUICK_FILTER, CUSTOM_FILTER, OTHER_FILTERS,
 * DEFAULT_FILTER) — ver o comentario no topo do arquivo.
 */
export interface FiltroBarra {
    id: string;
    label: string;
    detailTitle: string;
    type: string;
    filterType: string;
    visible: boolean;
    props: { expression: string };
}

/*
 * Filtro inicial da barra: CODPARC, o campo-chave do Parceiro.
 *
 * Vai em `filterCustomConfig`, nao em `filterConfig`: o snk-filter-bar carrega a config da
 * barra do servidor a cada abertura (ConfigStorage.loadFilterBarConfig, por configName +
 * resourceID) e SOBRESCREVE `filterConfig` com o que vier de la — um valor inicial nessa
 * prop e descartado assim que o componente monta. `filterCustomConfig` e diferente: e
 * prependado ao resultado do servidor toda vez, entao o filtro sobrevive mesmo sem nada
 * salvo ainda (instalacao nova) e mesmo depois. Veja o uso em Dados.tsx.
 *
 * A expressao segue o formato que o proprio snk-filter-bar espera para build de query
 * (data-unit-filter-builder.js): `this.<CAMPO> = :<id>`, onde `:<id>` e o parametro
 * nomeado com o mesmo valor do `id` do filtro.
 */
export const filtrosPadrao: Array <FiltroBarra> = [
    {
        id:          'CODPARC',
        label:       'Código do Parceiro',
        detailTitle: 'Informe o código do parceiro',
        type:        'NUMBER',
        filterType:  'QUICK_FILTER',
        visible:     true,
        props: { expression: 'this.CODPARC = :CODPARC' },
    },
];
