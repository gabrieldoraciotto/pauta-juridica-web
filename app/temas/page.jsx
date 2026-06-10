"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle } from "@/components/ui";

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

// Calendário previdenciário. month/day é referência para ordenar por proximidade;
// "quando" é solto de propósito (não afirma data exata, que varia ano a ano).
const DATAS = [
  { label: "Reajuste anual dos benefícios", quando: "Início de janeiro", month: 1, day: 1, topic: "como funciona o reajuste anual dos benefícios do INSS no início do ano e o que o segurado deve observar" },
  { label: "Dia do Aposentado", quando: "24 de janeiro", month: 1, day: 24, topic: "o Dia do Aposentado e os principais direitos de quem já está aposentado" },
  { label: "Imposto de Renda dos aposentados", quando: "Março a maio", month: 3, day: 15, topic: "imposto de renda para aposentados e pensionistas, incluindo a isenção por doença grave e os cuidados na declaração, em linhas gerais" },
  { label: "13º — 1ª parcela", quando: "Por volta de abril/maio", month: 4, day: 25, topic: "o pagamento do 13º (gratificação natalina) dos aposentados e pensionistas e como costuma ser pago em parcelas" },
  { label: "Dia do Trabalhador", quando: "1º de maio", month: 5, day: 1, topic: "direitos previdenciários do trabalhador, como qualidade de segurado e contribuição, a propósito do Dia do Trabalhador" },
  { label: "13º — 2ª parcela", quando: "Por volta de agosto", month: 8, day: 25, topic: "a segunda parcela do 13º dos aposentados e pensionistas e o que o segurado deve saber" },
  { label: "Setembro Amarelo", quando: "Setembro", month: 9, day: 1, topic: "saúde mental e os benefícios por incapacidade do INSS: como o auxílio por incapacidade pode amparar quem está em tratamento, em linhas gerais" },
  { label: "Outubro Rosa", quando: "Outubro", month: 10, day: 1, topic: "Outubro Rosa: direitos previdenciários de pacientes com câncer de mama, como o auxílio por incapacidade, a aposentadoria por incapacidade e a isenção de imposto de renda, em linhas gerais" },
  { label: "Novembro Azul", quando: "Novembro", month: 11, day: 1, topic: "Novembro Azul: direitos previdenciários de pacientes com câncer de próstata, em linhas gerais" },
  { label: "Dia da Pessoa com Deficiência", quando: "3 de dezembro", month: 12, day: 3, topic: "o Dia Internacional da Pessoa com Deficiência e os direitos previdenciários relacionados, como o BPC/LOAS e a aposentadoria da pessoa com deficiência" },
];

// Temas atemporais, agrupados por assunto (não são uma sequência — por isso
// quadro de etiquetas, não lista numerada).
const GRUPOS = [
  {
    categoria: "Benefícios por incapacidade",
    itens: [
      { label: "Auxílio por incapacidade temporária", topic: "o auxílio por incapacidade temporária (antigo auxílio-doença): o que é, quem tem direito e quando cabe, em linhas gerais" },
      { label: "Aposentadoria por incapacidade permanente", topic: "a aposentadoria por incapacidade permanente: requisitos gerais e como funciona" },
      { label: "Auxílio-acidente", topic: "o auxílio-acidente: o que é e em que situações costuma ser devido" },
      { label: "Perícia médica do INSS", topic: "como funciona a perícia médica do INSS e como o segurado pode se preparar" },
    ],
  },
  {
    categoria: "Aposentadorias",
    itens: [
      { label: "Por idade", topic: "a aposentadoria por idade: como funciona em linhas gerais" },
      { label: "Por tempo de contribuição", topic: "a aposentadoria por tempo de contribuição e as regras de transição da reforma da previdência, em linhas gerais" },
      { label: "Especial", topic: "a aposentadoria especial para quem trabalha exposto a agentes nocivos, em linhas gerais" },
      { label: "Da pessoa com deficiência", topic: "a aposentadoria da pessoa com deficiência (Lei Complementar 142/2013): quem pode ter direito" },
      { label: "Do professor", topic: "a aposentadoria do professor e o que ela tem de diferente das demais" },
    ],
  },
  {
    categoria: "Família e assistência",
    itens: [
      { label: "BPC/LOAS", topic: "o benefício assistencial BPC/LOAS: o que é e quem pode ter direito" },
      { label: "Pensão por morte", topic: "a pensão por morte: quem são os dependentes e como funciona em linhas gerais" },
      { label: "Salário-maternidade", topic: "o salário-maternidade: quem tem direito e como funciona" },
      { label: "Auxílio-reclusão", topic: "o auxílio-reclusão: o que é e para quem é destinado, esclarecendo mitos comuns" },
    ],
  },
  {
    categoria: "Processo e estratégia",
    itens: [
      { label: "Conferir o CNIS", topic: "o que é o CNIS e como o segurado pode conferir seus vínculos e contribuições" },
      { label: "Planejamento previdenciário", topic: "o que é planejamento previdenciário e por que vale a pena fazer antes de pedir o benefício" },
      { label: "Comprovar tempo especial", topic: "como comprovar tempo especial, com documentos como PPP e LTCAT, em linhas gerais" },
      { label: "INSS indeferiu, e agora?", topic: "o que o segurado pode fazer quando o INSS indefere o pedido de benefício, em linhas gerais" },
      { label: "Revisão de benefício", topic: "quando pode valer a pena pedir a revisão de um benefício já concedido, em linhas gerais" },
      { label: "Qualidade de segurado", topic: "o que são qualidade de segurado e período de graça e por que isso é importante" },
      { label: "Tempo rural", topic: "como o trabalhador rural (segurado especial) pode comprovar o tempo de trabalho no campo, em linhas gerais" },
    ],
  },
];

function diasAte(month, day) {
  const hoje = new Date();
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  let alvo = new Date(hoje.getFullYear(), month - 1, day);
  if (alvo < base) alvo = new Date(hoje.getFullYear() + 1, month - 1, day);
  return Math.round((alvo - base) / 86400000);
}

export default function TemasPage() {
  const [format, setFormat] = useState("reel");
  const [busyTopic, setBusyTopic] = useState(null);
  const [msg, setMsg] = useState("");

  async function criar(topic) {
    setBusyTopic(topic);
    setMsg("");
    try {
      await api.createFromTopic({ topic, format });
      setMsg("Roteiro escrito e conferido pela OAB. Está em Roteiros, na fila a revisar.");
    } catch (e) {
      setMsg(`Não consegui gerar agora: ${e.message}`);
    } finally {
      setBusyTopic(null);
    }
  }

  const datas = [...DATAS].map((d) => ({ ...d, dias: diasAte(d.month, d.day) })).sort((a, b) => a.dias - b.dias);
  const proxima = datas[0];
  const demais = datas.slice(1);

  return (
    <div className="rise">
      <SectionTitle kicker="Banco de pautas" title="Temas" />

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-wide text-gold-deep">Gerar como</span>
        <div className="inline-flex overflow-hidden rounded-full border border-cream-deep">
          {[
            { key: "reel", label: "Reel" },
            { key: "carrossel", label: "Carrossel" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFormat(f.key)}
              className={`px-4 py-1.5 text-sm transition-colors ${
                format === f.key ? "bg-forest text-cream" : "text-forest hover:bg-cream-deep/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted">Toque numa pauta — o roteiro nasce pronto em Roteiros.</span>
      </div>

      {msg && (
        <p className="mb-8 rounded-xl border border-cream-deep bg-cream-card px-4 py-2 text-sm text-muted">
          {msg}
        </p>
      )}

      {/* ── Calendário: a próxima data em destaque + almanaque ── */}
      <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-gold-deep">Calendário previdenciário</p>

      <div className="mb-4 overflow-hidden rounded-3xl bg-forest text-cream shadow-card">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="font-display text-4xl leading-none text-gold">{MESES[proxima.month - 1]}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-cream/60">
                {proxima.dias <= 45 ? "chegando" : "próxima"}
              </div>
            </div>
            <div className="h-12 w-px bg-cream/20" />
            <div>
              <p className="font-display text-2xl leading-tight">{proxima.label}</p>
              <p className="text-sm text-cream/70">{proxima.quando}</p>
            </div>
          </div>
          <button
            onClick={() => criar(proxima.topic)}
            disabled={busyTopic === proxima.topic}
            className="shrink-0 self-start rounded-full bg-gold px-5 py-2 text-sm font-semibold text-forest transition-opacity hover:opacity-90 disabled:opacity-60 sm:self-auto"
          >
            {busyTopic === proxima.topic ? "Escrevendo…" : "Criar roteiro"}
          </button>
        </div>
      </div>

      <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {demais.map((d) => (
          <button
            key={d.label}
            onClick={() => criar(d.topic)}
            disabled={busyTopic === d.topic}
            className="group flex flex-col rounded-2xl border border-cream-deep bg-cream-card p-4 text-left transition-colors hover:border-forest disabled:opacity-60"
          >
            <span className="font-display text-2xl leading-none text-gold-deep">{MESES[d.month - 1]}</span>
            <span className="mt-2 font-display text-sm leading-tight text-forest">{d.label}</span>
            <span className="mt-1 text-xs text-muted">{d.quando}</span>
            <span className="mt-3 text-xs font-medium text-forest/70 group-hover:text-forest">
              {busyTopic === d.topic ? "Escrevendo…" : "Criar roteiro →"}
            </span>
          </button>
        ))}
      </div>

      {/* ── Temas atemporais: quadro de etiquetas por assunto ── */}
      <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-gold-deep">Temas atemporais</p>

      <div className="space-y-7">
        {GRUPOS.map((g) => (
          <div key={g.categoria}>
            <h3 className="mb-3 font-display text-lg text-forest">{g.categoria}</h3>
            <div className="flex flex-wrap gap-2">
              {g.itens.map((t) => (
                <button
                  key={t.label}
                  onClick={() => criar(t.topic)}
                  disabled={busyTopic === t.topic}
                  className="rounded-full border border-cream-deep bg-cream-card px-4 py-2 text-sm text-ink transition-colors hover:border-forest hover:bg-forest hover:text-cream disabled:opacity-60"
                >
                  {busyTopic === t.topic ? "Escrevendo…" : t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
