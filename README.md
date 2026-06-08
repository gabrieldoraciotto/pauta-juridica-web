# Pauta Jurídica — Web

Interface da esteira de conteúdo previdenciário. Consome a API do backend
(`pauta-juridica`, no Railway) e organiza tudo em quatro telas:

- **Calendário** — visão geral com métricas (roteiros a aprovar, estoque na fila,
  datas sem roteiro = risco de furo) e a agenda das próximas publicações.
- **Notícias** — matéria-prima coletada dos feeds, com a nota de relevância da
  triagem e os botões para gerar reel ou carrossel.
- **Roteiros** — revisar, editar, aprovar ou rejeitar cada roteiro.
- **Fontes** — gerenciar os feeds RSS.

Visual baseado na identidade do escritório (creme, verde-escuro, dourado),
tipografia serifada nos títulos.

## Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Sem banco próprio — todo o estado vive no backend

## Rodando localmente

```bash
npm install
cp .env.example .env.local     # aponte NEXT_PUBLIC_API_URL para o backend
npm run dev                    # http://localhost:3000
```

O backend (`pauta-juridica`) precisa estar rodando em paralelo.

## Deploy no Vercel

1. Suba este repositório no GitHub (separado do backend).
2. No Vercel: **Add New -> Project -> Import** o repositório.
3. Em **Environment Variables**, defina:
   ```
   NEXT_PUBLIC_API_URL = https://SEU-BACKEND.up.railway.app
   ```
4. Deploy. O Vercel detecta o Next.js automaticamente.

> Importante: como o frontend chama o backend direto do navegador, o backend já
> está com CORS liberado (`cors()` no Express). Em produção, vale restringir o
> CORS ao domínio do Vercel.

## Observação de conformidade

Todo roteiro é minuta gerada por IA. A revisão da Dra. Sara é obrigatória antes
de publicar — exatidão jurídica e regras de publicidade da OAB (Provimento 205/2021).
