import React, { useCallback, useState } from 'react';
import { DataUnit } from "@sankhyalabs/core";
import { SnkApplication, SnkDataUnit, SnkCrud } from "@sankhyalabs/sankhyablocks/react/components";
import { gerenciadorBarraTarefas, aoClicarNaBarra } from './BarraTarefas';
import Rodape, { TotalDoRodape } from './Rodape';

/*
 * RESOURCEID DA TELA — preencha, senao a tela abre somente leitura.
 *
 * Formato: br.com.sankhya.<modulo>.<grupo>.<tela>, por exemplo
 * 'br.com.sankhya.fin.cad.movimentacaoFinanceira'.
 *
 * Por que e obrigatorio aqui e nao nas telas nativas: o snk-application resolve o
 * resourceID nesta ordem (snk-application.js, getter applicationResourceID)
 *
 *     urlParams.get('workspaceResourceID')  ||  urlParams.get('resourceID')
 *         ||  window.workspace?.resourceID  ||  'unknown.resource.id'
 *
 * Numa tela nativa quem preenche isso e o shell do Sankhya, via window.workspace. Como esta
 * tela roda sem AngularJS e sem workspace, e a URL do html5component.mge que o shell monta
 * nao traz nenhum dos dois parametros, a resolucao cai em 'unknown.resource.id'. As
 * permissoes sao entao consultadas em cfg://auth/unknown.resource.id, que nao existe, e o
 * snk-data-unit trata ausencia de permissao como negacao:
 *
 *     isAllowed (flag) { return this._permissions ? ... : false; }   snk-data-unit.js:519
 *
 * O sintoma e o alerta "Sem permissao / Nao e possivel fazer alteracoes".
 *
 * Esta constante ataca os dois lados dessa resolucao:
 *
 *   - como prop do SnkDataUnit, faz o getAllAccess (this.resourceID) ir direto ao
 *     cfg://auth/<resourceID> em vez de usar o da aplicacao, e nomeia o DataUnit como
 *     dd://<entidade>/<resourceID> (snk-application.js:486-495);
 *
 *   - repassada ao removerFrame pelo src/index.tsx, entra como &resourceID= na URL do
 *     iframe em tela cheia, que e a unica URL desta tela sob nosso controle. Dai o
 *     snk-application a le pelo urlParams e as configuracoes de grade, formulario, resumo e
 *     valores padrao passam a ser buscadas no mesmo recurso — sem isso metade do lote de
 *     queries continua indo para cfg://.../unknown.resource.id.
 *
 * Note que a PRIMEIRA carga, a de dentro da moldura do gadget, ainda resolve
 * 'unknown.resource.id': aquela URL vem do shell. Ela e descartada pelo removerFrame, mas se
 * a moldura nao for removida (sem nuGdg, ou fora de um gadget) e esse o valor que fica.
 *
 * Para descobrir o valor: abra a tela nativa equivalente e rode no console
 *
 *     document.querySelector ('snk-application').dataset.elementId
 *
 * que devolve 'resource_' + o resourceID. Reaproveitar o da tela nativa faz as permissoes
 * desta tela seguirem as de la — normalmente e o que se quer.
 *
 * ATENCAO: nao troque por string vazia para "desligar". O getAuth so cai no comportamento
 * padrao quando o valor e undefined ('' != undefined), e '' vai consultar cfg://auth/ e
 * falhar — mesmo alerta de novo.
 */
export const RESOURCE_ID = 'br.com.sankhya.core.cad.parceiros';
const entidade = "Parceiro";

/*
 * Tela de dados: grade + barra de filtros + formulario da entidade.
 *
 * O aninhamento e o do exemplo oficial do snk-crud, sem nada em volta: SnkApplication (config,
 * permissoes, mensagens) e SnkDataUnit (metadados e estado da entidade) sao os dois pais
 * obrigatorios.
 *
 * OS FILTROS VEM DO ERP, NAO DAQUI — e isso e a plataforma, nao uma limitacao nossa.
 * `filterCustomConfig` e `filterCustomConfigInterceptor` nem constam na referencia do snk-crud:
 * sao @Prop do snk-grid (snk-grid.js:1264,1293), que o snk-crud monta por dentro e nao repassa
 * (snk-crud.js:363 leva filterBarTitle, autoLoad, disablePersonalizedFilter e
 * filterBarLegacyConfigName — nao essas). A barra e alimentada pelo que estiver cadastrado no
 * resourceID e pelos filtros personalizados que o usuario criar, que o servidor devolve como
 * groupedItems do PERSONALIZED_FILTER_GROUP.
 *
 * Se um dia for preciso trazer filtros ja cadastrados noutro recurso, o caminho documentado e a
 * prop `filterBarLegacyConfigName`, que injeta um legacyResourceID na busca da config
 * (ConfigStorage.js:35) — declarativo, sem alcancar elemento nenhum.
 *
 * ARMADILHA CONHECIDA: sem NENHUM filtro — nada cadastrado no recurso e nenhum personalizado
 * criado — o snk-grid conclui que nao ha o que mostrar e tira a barra inteira do DOM
 * (snk-grid.js:574-576), levando junto o botao "+ Filtros". Numa base virgem o usuario fica sem
 * por onde criar o primeiro. Se isso aparecer, o problema e esse, nao a tela.
 *
 * O que NAO resolve, e ja foi tentado: acrescentar um <SnkFilterBar> ao lado, como o exemplo
 * oficial mostra para telas SEM grade. Toda barra faz dataUnit.addFilterProvider(this), e a
 * chave desse Map e o hash do CODIGO do metodo getFilter (DataUnit.js:224-229) — duas
 * instancias da mesma classe colidem, e a que registra por ultimo apaga a outra. Sobrava a
 * barra do grid, vazia, e o DataUnit.getFilters() devolvia [].
 *
 * O `configName` mantem a config de filtros, grade e formulario no mesmo recurso que o
 * SnkApplication usa (cfg://filter/FilterBarState:<resourceID>.Parceiro); sem ele o snk-crud
 * repassa configName undefined e a barra grava noutra chave.
 */

/*
 * Numeros do rodape, tirados do proprio DataUnit.
 *
 * ESTA E A FONTE QUE NAO DEPENDE DE NADA CADASTRADO NO ERP. A tela nativa de Movimentacao
 * Financeira mostra Receita/Despesa/Saldo, e aqueles valores vem de um recurso
 * `totals://<nome>/<resourceID>` cadastrado no ERP para AQUELA tela — o snk-application sabe
 * busca-lo (loadTotals, snk-application.js:691), mas nao expoe o metodo ao elemento, entao do
 * React so daria para chegar la por caminho interno do pacote, que esta fixado em `latest`.
 * Para o Parceiro esse recurso tambem nao existe.
 *
 * O que o DataUnit entrega de graca, e ja filtrado pelo que estiver na barra:
 *
 *   - paginationInfo.total  — total de registros que o filtro atual devolve. Fica undefined
 *     enquanto a paginacao ainda esta correndo; nesse intervalo o `count` e o que ja veio;
 *   - records.length        — quantos estao carregados na pagina;
 *   - getSelectionInfo()    — a selecao, com `length` ciente da selecao virtual "todos".
 *
 * O `|| undefined` no getPaginationInfo so descarta o `void` da assinatura da lib
 * (`PaginationInfo | void`, devolvido enquanto nao houve carga); o tipo continua vindo dela.
 *
 * `records` e getter que faz Array.from do Map interno (DataUnit.js:800-803), entao vale numa
 * variavel — nao e leitura de campo.
 *
 * Para somar campos (valor, limite de credito), o caminho e outro: ou cadastrar o
 * totals:// no ERP, ou consultar o proprio agregado por /mge/service.sbr. Somar
 * `dataUnit.records` aqui mentiria — sao so os 150 da pagina.
 */
const calcularTotais = (dataUnit: DataUnit): Array<TotalDoRodape> => {

    const paginacao    = dataUnit.getPaginationInfo() || undefined;
    const carregados   = dataUnit.records.length;
    const selecionados = dataUnit.getSelectionInfo().length;

    return [
        {
            rotulo: 'Parceiros',
            valor:  paginacao?.total ?? paginacao?.count ?? carregados,
            icone:  'hierarchical-tree',
        },
        {
            rotulo: 'Carregados',
            valor:  carregados,
            icone:  'list',
        },
        {
            rotulo: 'Selecionados',
            valor:  selecionados,
            icone:  'check',
            tom:    selecionados > 0 ? 'positivo' : undefined,
        },
    ];
};

const Dados = () => {

    const [totais, setTotais] = useState<Array<TotalDoRodape>>([]);

    /*
     * O rodape acompanha o DataUnit, nao o React: quem muda os numeros e carga, paginacao e
     * selecao, tudo despachado como acao la dentro.
     *
     * O subscribe recebe TODA acao (DataUnit.js:1522-1533), e a maioria nao mexe em nenhum dos
     * tres numeros — CHANGING_DATA e DATA_CHANGED disparam a cada campo editado no formulario,
     * LOADING_PROPERTIES_CLEANED sai de nove pontos diferentes da lib. Filtrar por `action.type`
     * amarraria a tela a nomes internos que mudam de versao; comparar o RESULTADO e igualmente
     * barato e nao amarra nada. Devolver o array anterior faz o React abortar o render — o que
     * importa aqui porque os wrappers React do Stencil nao tem shouldComponentUpdate: cada
     * render refaz attachProps nos tres hosts e troca os listeners de evento.
     *
     * Sem unsubscribe de proposito: este componente vive enquanto a tela existir, e o DataUnit
     * morre junto com ela.
     *
     * useCallback com deps vazio porque o corpo so depende de setTotais, que e estavel: sem
     * isso a identidade nova a cada render faria o wrapper remover e re-registrar o listener de
     * dataUnitReady no <snk-data-unit>.
     */
    const aoTerDataUnit = useCallback((evento: CustomEvent<DataUnit>) => {
        const dataUnit = evento.detail;
        if (!dataUnit) {
            return;
        }

        const atualizar = () => setTotais(anteriores => {
            const novos = calcularTotais(dataUnit);
            const igual = anteriores.length === novos.length
                && novos.every((total, i) =>
                    anteriores[i].valor === total.valor && anteriores[i].tom === total.tom);
            return igual ? anteriores : novos;
        });

        dataUnit.subscribe(atualizar);
        atualizar();
    }, []);

    return (
        <SnkApplication configName={entidade}>
            <SnkDataUnit
                entityName      = {entidade}
                resourceID      = {RESOURCE_ID || undefined}
                onDataUnitReady = {aoTerDataUnit}
            >
                <SnkCrud
                    configName     = {entidade}
                    taskbarManager = {gerenciadorBarraTarefas}
                    onActionClick  = {aoClicarNaBarra}
                >
                    {/* Vai para o slot SnkGridFooter, que o snk-crud repassa ao snk-grid. */}
                    <Rodape totais={totais} />
                </SnkCrud>
            </SnkDataUnit>
        </SnkApplication>
    );
};

export default Dados;
