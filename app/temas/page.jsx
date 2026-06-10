"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Button, Card } from "@/components/ui";

// Datas/ganchos do calendário previdenciário. month/day é uma referência para
// ordenar por proximidade — o rótulo "quando" é solto de propósito (não afirma
// data exata, que pode variar ano a ano). topic é o que vai para a geração.
const DATAS = [
  {
    label: "Reajuste anual dos benefícios",
    quando: "Janeiro",
    month: 1,
    day: 1,
    topic:
      "como funciona o reajuste anual dos benefícios do INSS no início do ano e o que o segurado deve observar",
  },
  {
    label: "Dia do Aposentado",
    quando: "24 de janeiro",
    month: 1,
    day: 24,
    topic: "o Dia do Aposentado e os principais direitos de quem já está aposentado",
  },
  {
    label: "Imposto de Renda dos aposentados",
    quando: "Março a maio",
    month: 3,
    day: 15,
    topic:
      "imposto de renda para aposentados e pensionistas, incluindo a isenção por doença grave e os cuidados na declaração, em linhas gerais",
  },
  {
    label: "13º dos aposentados (1ª parcela)",
    quando: "Por volta de abril/maio",
    month: 4,
    day: 25,
    topic:
      "o pagamento do 13º (gratificação natalina) dos aposentados e pensionistas e como costuma ser pago em parcelas",
  },
  {
    label: "Dia do Trabalhador",
    quando: "1º de maio",
    month: 5,
    day: 1,
    topic:
      "direitos previdenciários do trabalhador, como qualidade de segurado e contribuição, a propósito do Dia do Trabalhador",
  },
  {
    label: "13º dos aposentados (2ª parcela)",
    quando: "Por volta de agosto",
    month: 8,
    day: 25,
    topic:
      "a segunda parcela do 13º dos aposentados e pensionistas e o que o segurado deve saber",
  },
  {
    label: "Setembro Amarelo",
    quando: "Setembro",
    month: 9,
    day: 1,
    topic:
      "saúde mental e os benefícios por incapacidade do INSS: como o auxílio por incapacidade pode amparar quem está em tratamento, em linhas gerais",
  },
  {
    label: "Outubro Rosa",
    quando: "Outubro",
    month: 10,
    day: 1,
    topic:
      "Outubro Rosa: direitos previdenciários de pacientes com câncer de mama, como o auxílio por incapacidade, a aposentadoria por incapacidade e a isenção de imposto de renda, em linhas gerais",
  },
  {
    label: "Novembro Azul",
    quando: "Novembro",
    month: 11,
    day: 1,
    topic:
      "Novembro Azul: direitos previdenciários de pacientes com câncer de próstata, em linhas gerais",
  },
  {
    label: "Dia da Pessoa com Deficiência",
    quando: "3 de dezembro",
    month: 12,
    day: 3,
    topic:
      "o Dia Internacional da Pessoa com Deficiência e os direitos previdenciários relacionados, como o BPC/LOAS e a aposentadoria da pessoa com deficiência",
  },
];

// Temas atemporais — sempre rendem conteúdo educativo. label para exibir, topic
// para gerar (frasezinha mais completa, sempre "em linhas gerais" para a IA
// tratar de forma genérica e não inventar número/prazo específico).
const TEMAS = [
  { label: "Auxílio por incapacidade temporária", topic: "o auxílio por incapacidade temporária (antigo auxílio-doença): o que é, quem tem direito e quando cabe, em linhas gerais" },
  { label: "Aposentadoria por incapacidade permanente", topic: "a aposentadoria por incapacidade permanente: requisitos gerais e como funciona" },
  { label: "Auxílio-acidente", topic: "o auxílio-acidente: o que é e em que situações costuma ser devido" },
  { label: "Perícia médica do INSS", topic: "como funciona a perícia médica do INSS e como o segurado pode se preparar" },
  { label: "Aposentadoria por idade", topic: "a aposentadoria por idade: como funciona em linhas gerais" },
  { label: "Aposentadoria por tempo de contribuição", topic: "a aposentadoria por tempo de contribuição e as regras de transição da reforma da previdência, em linhas gerais" },
  { label: "Aposentadoria especial", topic: "a aposentadoria especial para quem trabalha exposto a agentes nocivos, em linhas gerais" },
  { label: "Aposentadoria da pessoa com deficiência", topic: "a aposentadoria da pessoa com deficiência (Lei Complementar 142/2013): quem pode ter direito" },
  { label: "Aposentadoria do professor", topic: "a aposentadoria do professor e o que ela tem de diferente das demais" },
  { label: "BPC/LOAS", topic: "o benefício assistencial BPC/LOAS: o que é e quem pode ter direito" },
  { label: "Pensão por morte", topic: "a pensão por morte: quem são os dependentes e como funciona em linhas gerais" },
  { label: "Salário-maternidade", topic: "o salário-maternidade: quem tem direito e como funciona" },
  { label: "Auxílio-reclusão", topic: "o auxílio-reclusão: o que é e para quem é destinado, esclarecendo mitos comuns" },
  { label: "Como conferir o CNIS", topic: "o que é o CNIS e como o segurado pode conferir seus vínculos e contribuições" },
  { label: "Planejamento previdenciário", topic: "o que é planejamento previdenciário e por que vale a pena fazer antes de pedir o benefício" },
  { label: "Tempo especial: como comprovar", topic: "como comprovar tempo especial, com documentos como PPP e LTCAT, em linhas gerais" },
  { label: "INSS indeferiu: o que fazer", topic: "o que o segurado pode fazer quando o INSS indefere o pedido de benefício, em linhas gerais" },
  { label: "Revisão de benefício", topic: "quando pode valer a pena pedir a revisão de um benefício já concedido, em linhas gerais" },
  { label: "Qualidade de segurado e período de graça", topic: "o que são qualidade de segurado e período de graça e por que isso é importante" },
  { label: "Tempo rural (segurado especial)", topic: "como o trabalhador rural (segurado especial) pode comprovar o tempo de trabalho no campo, em linhas gerais" },
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
      setMsg("Roteiro gerado a partir do tema e verificado pela OAB. Veja na aba Roteiros.");
    } catch (e) {
      setMsg(`Erro ao gerar: ${e.message}`);
    } finally {
      setBusyTopic(null);
    }
  }

  const datasOrdenadas = [...DATAS]
    .map((d) => ({ ...d, dias: diasAte(d.month, d.day) }))
    .sort((a, b) => a.dias - b.dias);

  return (
    <div className="rise">
      <SectionTitle kicker="Banco de pautas" title="Temas" />

      <Card className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted">Formato:</span>
          {[
            { key: "reel", label: "Reel" },
            { key: "carrossel", label: "Carrossel" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFormat(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                format === f.key
                  ? "bg-forest text-cream"
                  : "border border-cream-deep text-forest hover:bg-cream-deep/40"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="text-xs text-muted">
            Escolha um tema e gere o roteiro num clique — ele aparece em Roteiros já verificado pela OAB.
          </span>
        </div>
      </Card>

      {msg && (
        <p className="mb-6 rounded-xl border border-cream-deep bg-cream-card px-4 py-2 text-sm text-muted">
          {msg}
        </p>
      )}

      <h2 className="mb-3 font-display text-lg text-forest">Calendário previdenciário</h2>
      <div className="mb-10 space-y-2">
        {datasOrdenadas.map((d) => (
          <div
            key={d.label}
            className="flex items-center justify-between gap-4 rounded-2xl border border-cream-deep/60 bg-cream-card p-4 shadow-card"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-base text-forest">{d.label}</p>
                {d.dias <= 45 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: "#FBF3E0", color: "#B07D3A" }}
                  >
                    chegando
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">{d.quando}</p>
            </div>
            <Button variant="ghost" disabled={busyTopic === d.topic} onClick={() => criar(d.topic)}>
              {busyTopic === d.topic ? "Gerando…" : "Criar roteiro"}
            </Button>
          </div>
        ))}
      </div>

      <h2 className="mb-3 font-display text-lg text-forest">Temas atemporais</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {TEMAS.map((t) => (
          <div
            key={t.label}
            className="flex items-center justify-between gap-3 rounded-2xl border border-cream-deep/60 bg-cream-card p-4 shadow-card"
          >
            <p className="min-w-0 text-sm text-ink">{t.label}</p>
            <Button variant="ghost" disabled={busyTopic === t.topic} onClick={() => criar(t.topic)}>
              {busyTopic === t.topic ? "Gerando…" : "Criar roteiro"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
