import React from 'react';
import { SnkApplication, SnkDataUnit, SnkCrud } from "@sankhyalabs/sankhyablocks/react/components";
import { gerenciadorBarraTarefas, aoClicarNaBarra } from './BarraTarefas';

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
 * tela roda sem AngularJS e sem workspace, e a URL do html5component.mge nao traz nenhum dos
 * dois parametros, a resolucao cai em 'unknown.resource.id'. As permissoes sao entao
 * consultadas em cfg://auth/unknown.resource.id, que nao existe, e o snk-data-unit trata
 * ausencia de permissao como negacao:
 *
 *     isAllowed (flag) { return this._permissions ? ... : false; }   snk-data-unit.js:519
 *
 * O sintoma e o alerta "Sem permissao / Nao e possivel fazer alteracoes".
 *
 * Passar o resourceID ao SnkDataUnit resolve: ele chama getAllAccess (this.resourceID), que
 * vai direto ao cfg://auth/<resourceID> em vez de usar o da aplicacao.
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
const RESOURCE_ID = 'br.com.sankhya.core.cad.parceiros';

/*
 * Tela de dados: grade + barra de filtros + formulario da entidade.
 *
 * O aninhamento e obrigatorio — o SnkCrud exige SnkApplication (config, permissoes,
 * mensagens) e SnkDataUnit (metadados e estado da entidade) como pais.
 */
const Dados = () => (
    <SnkApplication configName="Parceiro">
        <SnkDataUnit
            entityName = "Parceiro"
            resourceID = {RESOURCE_ID || undefined}
        >
            <SnkCrud
                taskbarManager = {gerenciadorBarraTarefas}
                onActionClick  = {aoClicarNaBarra}
            />
        </SnkDataUnit>
    </SnkApplication>
);

export default Dados;
