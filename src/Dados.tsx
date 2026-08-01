import React, { useState } from 'react';
import { DataUnit } from "@sankhyalabs/core";
import { SnkApplication, SnkDataUnit, SnkCrud, SnkFilterBar } from "@sankhyalabs/sankhyablocks/react/components";
import { gerenciadorBarraTarefas, aoClicarNaBarra } from './BarraTarefas';
import { filtrosPadrao } from './Filtros';

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
 * O aninhamento e obrigatorio — o SnkCrud exige SnkApplication (config, permissoes,
 * mensagens) e SnkDataUnit (metadados e estado da entidade) como pais. O SnkFilterBar
 * entra como outro filho direto do SnkDataUnit.
 *
 * SnkFilterBar so monta depois do `onDataUnitReady` e recebe o `dataUnit` explicito por
 * prop, em vez de deixa-lo subir o `parentElement` sozinho procurando por um
 * <snk-data-unit> (o que a lib faz quando a prop nao e informada): esse auto-discovery
 * roda dentro do componentWillLoad do SnkFilterBar e, se o <snk-data-unit> pai ainda nao
 * tiver o proprio dataUnit pronto naquele instante, ele so registra um listener de
 * "dataUnitReady" e segue em frente sem esperar — daí o componentWillLoad chama
 * loadConfigFromStorage com `this.dataUnit` ainda undefined, e a lib tenta ler
 * `this.dataUnit.name` (snk-filter-bar.js:384/387), estourando "TypeError: Cannot read
 * properties of undefined (reading 'name')" e sendo relancado como "Falha ao buscar
 * configuração de filtros". Gatear no evento (como o exemplo oficial recomenda para o
 * SnkCrud) fecha essa corrida.
 */
const Dados = () => {
    const [dataUnit, setDataUnit] = useState<DataUnit>();

    return (
        <SnkApplication configName={entidade}>
            <SnkDataUnit
                entityName     = {entidade}
                resourceID     = {RESOURCE_ID || undefined}
                onDataUnitReady = {(evento) => setDataUnit(evento.detail)}
            >
                {dataUnit && (
                    <SnkFilterBar
                        configName          = {entidade}
                        resourceID          = {RESOURCE_ID || undefined}
                        dataUnit            = {dataUnit}
                        /* O `as any` e so aqui, na fronteira com a prop: a SnkFilterItemConfig da
                           lib tipa `type`/`filterType` como enum, e filtrosPadrao (Filtros.tsx) usa
                           string por nao poder importar esses enums — ver o comentario la. */
                        filterCustomConfig  = {filtrosPadrao as any}
                    />
                )}
                <SnkCrud
                    taskbarManager = {gerenciadorBarraTarefas}
                    onActionClick  = {aoClicarNaBarra}
                />
            </SnkDataUnit>
        </SnkApplication>
    );
};

export default Dados;
