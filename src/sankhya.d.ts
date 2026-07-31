/*
 * Tipos dos globais que a pagina publica antes do bundle.
 *
 * Ficam num .d.ts proprio, e nao dentro de um `declare global` em algum .tsx: quando a
 * mesma interface Window era aumentada em dois arquivos, o TypeScript acusava
 * "TS2717: Subsequent property declarations must have the same type" a cada campo que
 * divergisse entre eles. Com um unico arquivo ambiente, isso nao tem como acontecer.
 *
 * Sem import/export no topo, este arquivo e global e a interface Window abaixo se funde
 * com a do lib.dom.
 */

interface Window {

    /* Preenchido pelo <script> de contexto do index.html / index.jsp. */
    SANKHYA?: {
        baseFolder?: string;
        origin?: string;
        usuario?: string;
    };

    /*
     * Definido pelo <script> inline do public/index.html — um recorte do removerFrame do
     * SankhyaJX, trazido para a pagina nao depender de CDN. Nao vem de lib externa.
     *
     * Opcional por seguranca: o bundle so encontra esse global quando servido pela pagina
     * deste projeto, e a chamada em index.tsx usa `?.` para nao quebrar em outro host.
     */
    BI?: {
        removerFrame: (opcoes: { paginaInicial: string; instancia: string }) => void;
    };

    /*
     * NAO e o resourceID das permissoes. Este aqui so entra na query string que o
     * DataFetcher monta para o service.sbr (DataFetcher.js:262) — nada mais depende dele, e
     * o servico funciona sem.
     *
     * O das permissoes e das configuracoes de grade/formulario vai como prop do
     * SnkDataUnit: veja a constante RESOURCE_ID no topo do src/Dados.tsx.
     */
    resourceID?: string;

}
