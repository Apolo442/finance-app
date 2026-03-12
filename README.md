# 💰 Gestor Financeiro

Dashboard de finanças pessoais construído para substituir uma planilha Google Sheets de controle mensal. Organiza gastos fixos, parcelamentos, saldo semanal e oferece analytics detalhados — tudo em uma interface rápida, responsiva e com tema claro/escuro.

---

## ✨ Funcionalidades

### Visão Geral (por mês)

- Entrada e reserva mensal editáveis inline (clique para editar)
- Divisão automática do saldo líquido em 4 semanas
- Cards de semana colapsáveis com lista de gastos
- Adição de gastos por semana (tipo, banco, categoria, data opcionais)
- Carry-over manual entre semanas (→S2, →S3, →S4) — botões independentes
- Bloco de composição colapsável (fixos + parcelamentos do mês)

### Gastos Fixos

- Cadastro com título, valor, categoria, banco e mês de início
- Edição com soft-delete: alterações valem a partir do mês escolhido, sem afetar histórico
- Exclusão retroativa ou a partir de um mês

### Parcelamentos

- Cadastro com parcela atual / total, mês de início, banco e categoria
- Filtro automático: só exibe parcelas ativas no mês visualizado
- Barra de progresso (P.A / P.T)

### Analytics

- **Visão Mensal:** totais por tipo (Crédito / PIX / Reservado / Outros), gráfico de pizza por categoria, gráfico de barras por semana
- **Visão Anual:** gráfico de linha com evolução mensal + tabela resumo dos 12 meses

### UX

- Tema escuro (padrão) e tema claro bege/creme — toggle na sidebar, persiste via localStorage
- Sidebar fixa no desktop (220px) e drawer com hamburger no mobile
- Navegação por mês (← hoje →)
- Auto-criação do mês ao acessar (padrões: entrada R$ 1.000, reserva R$ 0)

---

## 🛠 Stack

| Camada         | Tecnologia                       |
| -------------- | -------------------------------- |
| Framework      | Next.js 14 (App Router)          |
| Linguagem      | TypeScript                       |
| Estilo         | Tailwind CSS + CSS Variables     |
| Componentes    | shadcn/ui                        |
| ORM            | Prisma v7                        |
| Banco de dados | Supabase (PostgreSQL)            |
| Auth           | NextAuth v5 (Google OAuth)       |
| Gráficos       | Recharts                         |
| Deploy         | Vercel                           |
| Fontes         | DM Mono + DM Sans (Google Fonts) |

---

## 📁 Estrutura

```
finance-app/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── finance/
│   │       ├── budget/route.ts
│   │       ├── fixed/route.ts
│   │       ├── installments/route.ts
│   │       └── weekly/route.ts
│   ├── login/page.tsx
│   ├── [month]/
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← Visão Geral
│   │   ├── fixed/page.tsx        ← Gastos Fixos
│   │   ├── installments/page.tsx ← Parcelamentos
│   │   └── analytics/page.tsx    ← Analytics
│   ├── layout.tsx
│   └── page.tsx                  ← redirect para mês atual
├── components/
│   ├── sidebar-nav.tsx
│   ├── theme-toggle.tsx
│   └── monthly/
│       ├── overview-client.tsx
│       ├── fixed-client.tsx
│       ├── installments-client.tsx
│       └── analytics-client.tsx
├── lib/
│   ├── auth.ts
│   ├── auth.config.ts
│   ├── prisma.ts
│   ├── calculations.ts
│   ├── theme-context.tsx
│   ├── api.ts
│   └── utils.ts
├── generated/prisma/             ← Prisma v7 client gerado
├── prisma/
│   └── schema.prisma
├── prisma.config.ts              ← configuração Prisma v7 (raiz)
├── proxy.ts                      ← substitui middleware.ts (Next 16+)
├── next.config.ts
└── .env
```

---

## 🗄 Schema do banco

```prisma
model FixedExpense      # gastos fixos mensais (soft-delete por mês)
model Installment       # parcelamentos com startMonth
model MonthlyBudget     # entrada, reserva e carry-overs do mês
model WeeklyExpense     # gastos semanais (CREDITO | PIX | RESERVADO | OUTROS)

enum Bank { NUBANK, MERCADO_PAGO }
enum ExpenseType { CREDITO, PIX, RESERVADO, OUTROS }
```

---

## ⚙️ Lógica de cálculo

```
Líquido = Entrada − Reserva − Σ Fixos − Σ Parcelas ativas
Alocação semanal = Líquido ÷ 4

Carry-over (manual por botão):
  Semana anterior → remaining = 0 (transferido)
  Próxima semana  → budget = alocação + (budget_anterior − gasto_anterior)
```

---

## 🚀 Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Preencher DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, ALLOWED_EMAIL

# 3. Gerar cliente Prisma
npx prisma generate

# 4. Aplicar schema no banco
npx prisma db push

# 5. Rodar em desenvolvimento
npm run dev
```

### Variáveis de ambiente necessárias

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
ALLOWED_EMAIL="seu@email.com"
NEXTAUTH_URL="http://localhost:3000"
```

### Notas Prisma v7

- `datasource db` **não tem** campo `url` no schema — fica no `prisma.config.ts` na raiz
- Import: `from "../generated/prisma/client"` (não `@prisma/client`)
- Requer `@prisma/adapter-pg` + `pg`

### Teste no mobile (ngrok)

```bash
ngrok http --domain=SEU_DOMINIO_ESTATICO 3000
```

Adicionar a URL ngrok em:

- `.env` → `NEXTAUTH_URL`
- Google Cloud Console → URIs de redirecionamento OAuth
- `next.config.ts` → `allowedDevOrigins`

---

## 📋 Roadmap

- [ ] Feature: detecção automática de marketplaces por regex nos títulos (B.I por loja)
- [ ] Feature: exportar relatório (.pdf / .xlsx / .csv)
- [ ] Feature: adiantar parcelas (simulação + efetivação)
- [x] Tema claro/escuro com toggle
- [x] Carry-over manual entre semanas
- [x] Analytics mensal e anual
- [x] Gastos Fixos com soft-delete por mês
- [x] Parcelamentos com filtro automático por mês ativo
- [x] Sidebar responsiva com drawer mobile
- [x] Enum `OUTROS` no tipo de gasto
- [x] Formato "Março 2026" no título dos meses

---

## 🔒 Autenticação

Acesso restrito por e-mail via variável `ALLOWED_EMAIL`. Login com Google OAuth (NextAuth v5). Sessão persiste 30 dias via cookie.
