// Botao customizado na barra de tarefas do SnkCrud.
//
// O caminho e o `taskbarManager` do proprio SnkCrud, nao um <SnkTaskbar> avulso: o CRUD ja
// monta suas barras internamente e o manager e o gancho para interferir nelas.
//
// Os tipos sao declarados aqui em vez de importados de sankhyablocks/dist/types/...:
// aquelas typings tem varios erros de resolucao (falta o pacote floating-ui/dom, caminhos
// para ezui/src/...). O TypeScript e estrutural, entao um objeto com o mesmo formato e
// aceito na prop normalmente.
//
// Comentarios de linha, e nao um bloco /* */, porque o ESLint do CRA le o primeiro bloco do
// arquivo como possivel anotacao Flow e a arroba de um nome de pacote ali dispara
// "Malformed Flow file annotation" (regra flowtype/require-valid-file-annotation).

/* Espelha CustomButton de snk-taskbar.d.ts. */
export interface BotaoCustomizado {
    name: string;
    hint: string;
    text?: string;
    iconName?: string;
}

/* Espelha TaskbarManager de snk-taskbar.d.ts. `dataState` fica como unknown: nao usamos e
   assim nao arrastamos as typings quebradas. */
export interface GerenciadorBarraTarefas {
    getButtons: (
        taskbarId: string,
        dataState: unknown,
        currentButtons: Array <string>
    ) => Array <string | BotaoCustomizado>;
}

/*
 * `iconName` tem que ser um icone do ez-design. Nomes em uso pelos proprios blocos:
 * acao, check, chevron-down, close, delete, dots-horizontal, dots-vertical,
 * drag-indicator, edit, file-download, hide-list, hierarchical-tree, launch, list,
 * minus, plus, print, search, settings-inverted, show-list, sync, table.
 *
 * ATENCAO: com iconName + text, `hint` e `text` chegam trocados no botao. O
 * buildCustomButton chama
 *
 *     iconTextButton (iconName, def.name, className, dataElementId, hint, text, ...)
 *
 * mas a assinatura da funcao e
 *
 *     iconTextButton (iconName, name, className, dataElementId, text, title, ...)
 *
 * (taskbar-elements.js:41 e :113), entao o 5o argumento vira o `label` — o texto visivel — e
 * o 6o vira o `title` — o tooltip. Confirmado no DOM da tela publicada, que saiu com
 * title="Alerta" e label="Dispara um alerta de teste": o botao exibia a frase longa.
 *
 * Os valores abaixo ja estao na ordem que a lib espera. Se um dia o `text` sair (botao so de
 * icone), o caminho passa a ser o iconButton, que usa o `hint` como title normalmente — e ai
 * o hint volta a ser a descricao longa.
 */
export const BOTAO_ALERTA: BotaoCustomizado = {
    name: 'BOTAO_ALERTA',
    hint: 'Alerta',                        /* vira o label — texto visivel no botao */
    text: 'Dispara um alerta de teste',    /* vira o title — tooltip                */
    iconName: 'acao'
};

/*
 * O snk-grid monta varias barras e chama getButtons uma vez para cada, variando o id
 * conforme o estado. Os ids observados no snk-grid.js:
 *
 *   snkGridHeaderTaskbar.unselected | .selected   (barra principal da grade)
 *   snkGridHeaderTaskbar.singleTaskbar[...]        (conforme presentationMode)
 *   snkGridTopTaskbar[...]                         (barra superior)
 *
 * Casamos pelo prefixo da barra principal para o botao nao aparecer repetido nas outras
 * nem no modo formulario.
 */
const BARRA_ALVO = 'snkGridHeaderTaskbar';

export const gerenciadorBarraTarefas: GerenciadorBarraTarefas = {

    getButtons (taskbarId, _dataState, currentButtons) {

        if (!taskbarId.startsWith (BARRA_ALVO)) return currentButtons;

        return [...currentButtons, BOTAO_ALERTA];

    }

};

/*
 * O evento actionClick do SnkCrud dispara para QUALQUER botao ou acao da barra — os padrao
 * inclusive. O detail traz o nome, entao filtrar pelo nosso e obrigatorio, senao o alerta
 * apareceria ao clicar em atualizar, exportar, inserir e afins.
 */
export function aoClicarNaBarra (evento: CustomEvent<string>) {

    if (evento.detail !== BOTAO_ALERTA.name) return;

    window.alert ('Botão customizado da barra de tarefas foi clicado.');

}
