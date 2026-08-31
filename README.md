# Tersia Dashboard — Dra. Térsia

Dashboard financeiro executivo de página única para a empresa **Dra. Térsia**.

O projeto tem um único propósito: **gestão financeira**. A aplicação importa a planilha
financeira (formato XLSX, aba `DFC ANO`) e transforma os dados em uma visão executiva
com indicadores (KPIs), gráficos, composição de despesas e DRE completo — sem depender
de banco de dados ou APIs externas: tudo é processado e exibido no próprio navegador.

> Interface em português (pt-BR), valores monetários no formato brasileiro (R$, `pt-BR`).

---

## Índice

1. [Funcionalidades](#funcionalidades)
2. [Stack tecnológica](#stack-tecnológica)
3. [Como rodar o projeto](#como-rodar-o-projeto)
4. [Estrutura do projeto](#estrutura-do-projeto)
5. [Como funciona](#como-funciona)
6. [Formato esperado da planilha](#formato-esperado-da-planilha)
7. [KPIs do Dashboard](#kpis-do-dashboard)
8. [DRE — Demonstrativo de Resultado](#dre--demonstrativo-de-resultado)
9. [Filtro de período e variações](#filtro-de-período-e-variações)
10. [Limitações atuais](#limitações-atuais)
11. [Scripts disponíveis](#scripts-disponíveis)

---

## Funcionalidades

- **Importação de planilha financeira**: envio de arquivo `.xlsx` contendo a aba `DFC ANO`.
- **4 cards de KPI**: Total de Receitas, Total de Despesas, Margem de Contribuição e Saldo Final,
  cada um com icone, valor formatado em R$ e variação percentual em relação ao período anterior.
- **Gráfico Receitas × Despesas**:
  - Visão **Anual**: evolução mês a mês de receitas vs. despesas.
  - Visão **Mensal** (ao selecionar um mês): comparativo de receitas e grupos de despesa do mês.
- **Composição das Despesas**: gráfico de rosca com as categorias de despesa e seus percentuais.
- **DRE**: tabela hierárquica (Receita → Custos → Margem de Contribuição → Despesas →
  Resultado Operacional → Investimentos → Resultado Final), com expansão de subcategorias
  e variação percentual entre períodos.
- **Filtros de período**: Desempenho Anual ou seleção de mês específico.
- **Tratamento de erros**: mensagens claras quando o arquivo não é válido, a aba `DFC ANO`
  não é encontrada ou nenhum dado reconhecível existe na planilha.
- **Layout responsivo**: funciona em desktop, tablet e mobile (cards empilham e a tabela
  DRE ganha rolagem horizontal).

---

## Stack tecnológica

| Camada           | Tecnologia                                                 |
| ---------------- | ---------------------------------------------------------- |
| Framework        | TanStack Start (React Router + SSR) com **React 19**       |
| Build            | **Vite 8** + TypeScript 5                                  |
| Estilo           | **Tailwind CSS 4** + componentes **shadcn/ui** (Radix)     |
| Gráficos         | **Recharts**                                               |
| Parsing de Excel | **xlsx** (SheetJS)                                         |
| Estado global    | React Context (`FinanceProvider`) + TanStack Query         |
| Validação/Form   | zod, react-hook-form, @hookform/resolvers (base p/ futuro) |

---

## Como rodar o projeto

Pré-requisitos: **Node.js LTS** (recomendado v20+).

```sh
# 1. Instalar as dependências
npm install

# 2. Subir o servidor de desenvolvimento
npm run dev
```

Acesse a URL exibida no terminal (geralmente `http://localhost:3000`).

Para gerar o build de produção:

```sh
npm run build      # build de produção
npm run preview    # servir o build localmente
```

---

## Estrutura do projeto

```
tersia-dashboard/
├── public/
│   ├── dfc-modelo.xlsx        # planilha de exemplo/validação
│   ├── dfc-sample-rows.json   # amostra das linhas lidas da planilha
│   ├── favicon.*              # favicons
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── dashboard/         # componentes específicos do financeiro
│   │   │   ├── kpi-card.tsx           # card de indicador
│   │   │   ├── revenue-expense-chart.tsx  # gráfico receitas × despesas
│   │   │   ├── expense-composition.tsx    # rosca de composição de despesas
│   │   │   ├── dre-table.tsx             # tabela DRE hierárquica
│   │   │   ├── import-planilha.tsx       # área de upload do XLSX
│   │   │   └── period-filter.tsx         # filtros de período
│   │   └── ui/                # kit de componentes shadcn/ui
│   ├── lib/
│   │   ├── finance/
│   │   │   ├── types.ts        # tipos do domínio financeiro
│   │   │   ├── parse-dfc.ts    # parser da planilha DFC ANO
│   │   │   ├── selectors.ts    # cálculos (KPIs, DRE, séries, variações)
│   │   │   ├── finance-store.tsx # estado global (Context)
│   │   │   └── format.ts       # formatação pt-BR (R$, %, datas)
│   │   ├── error-capture.ts    # captura de erros p/ SSR
│   │   ├── error-page.ts       # página de erro renderizada
│   │   └── utils.ts            # helpers (cn / tailwind-merge)
│   ├── routes/
│   │   ├── __root.tsx          # layout raiz (Providers, meta, 404/erro)
│   │   └── index.tsx           # página principal: FINANCEIRO
│   ├── routeTree.gen.ts        # gerado automaticamente pelo plugin do router
│   ├── router.tsx              # criação do router (TanStack)
│   ├── server.ts               # entry SSR com tratamento de erros
│   ├── start.ts                # instância do TanStack Start (middlewares/CSRF)
│   └── styles.css              # estilos globais + tema Tailwind 4
├── vite.config.ts
├── tsconfig.json
├── components.json            # config do shadcn/ui
└── package.json
```

> O arquivo `src/routeTree.gen.ts` é **gerado automaticamente** pelo plugin do router
> (TanStack) durante `dev`/`build`. Você não deve editá-lo manualmente.

---

## Como funciona

### 1. Importação da planilha (`parse-dfc.ts`)

O usuário seleciona um arquivo `.xlsx` na área **"Importar planilha financeira"**
(lado direito do dashboard). O fluxo é:

1. O arquivo é validado (extensão `.xlsx`/`.xls`).
2. A planilha é lida em memória com a biblioteca `xlsx`.
3. O parser procura a aba chamada **`DFC ANO`** (a comparação ignora acentos e caixa).
4. Localiza a **linha de cabeçalho** que contém os meses/colunas de períodos.
   Os cabeçalhos podem vir em vários formatos: célula de data, `01/2026`, `2026-01`,
   nome do mês (`Janeiro`, `Jan`, `Jan/26`), número de série do Excel, etc.
5. Separa as linhas em duas seções:
   - **Resumo**: linhas consolidadas (Faturamento, categorias de despesa, resultados).
   - **Detalhado**: linhas com código de conta (ex.: `3.1.1`, `5.2.1`) usadas para
     montar as subcategorias do DRE.
6. Identifica as linhas-chave por padrões de texto (ex.: "faturamento", "custos variáveis",
   "margem de contribuição", "resultado operacional", "saldo acumulado").
7. Converte os valores para números, tratando formatos brasileiros: `(1.234,56)` (negativo
   entre parênteses), `R$`, separador de milhar/milésimos, traços (`-`) que significam zero.
8. Monta o **`FinanceDataset`**: períodos, receitas, grupos de despesas e séries de resultado.

Em caso de qualquer falha (arquivo inválido, aba ausente, dados não reconhecidos), o
parser lança um `ImportError` com uma mensagem amigável em português, exibida no painel.

### 2. Estado global (`finance-store.tsx`)

O `FinanceProvider` (React Context) guarda:

- `dataset`: os dados financeiros já processados;
- `status`: `empty | loading | ready | error`;
- `errorMessage` / `successMessage`: mensagens de feedback;
- `selection`: o filtro de período ativo (`this-year` por padrão, ou um mês específico);
- `periodKeys` / `previousKeys`: chaves do período selecionado e do período anterior
  (usadas para calcular variações);
- `importFile(file)`: dispara o parsing e atualiza o dataset.

Todo o estado é **em memória** — ao recarregar a página, é necessário importar a planilha novamente.

### 3. Cálculos (`selectors.ts`)

Funções puras que recebem o dataset (e as chaves de período) e devolvem:

- `totalReceitas`, `totalDespesas`, `margemContribuicao`, `resultadoFinal`, `saldoFinal`,
  `resultadoOperacional`;
- `expenseBreakdown`: fatias da rosca de despesas (valor + percentual);
- `monthlySeries` / `monthCategorySeries`: dados para os gráficos;
- `buildDre`: linhas hierárquicas do DRE;
- `delta`: variação percentual entre o período atual e o anterior.

### 4. Renderização (`index.tsx`)

A página `FINANCEIRO` (rota `/`) monta:

- cabeçalho com título e filtros de período;
- barras de status (importando, erro, sucesso, "nenhum dado");
- grade com os 4 KPIs;
- gráfico Receitas × Despesas;
- DRE;
- coluna lateral com Composição das Despesas e Importar planilha.

> Como a aplicação é de página única, as futuras rotas (Vendas, Estoques, Usuários)
> foram removidas. O foco é 100% financeiro.

---

## Formato esperado da planilha

A planilha deve conter uma aba chamada **`DFC ANO`** com uma estrutura de **fluxo de caixa**:

| Coluna | Conteúdo esperado                                          |
| ------ | ---------------------------------------------------------- |
| A      | Descrição/label da linha (ex.: "Faturamento", "5.1.1 ...") |
| B…M    | Uma coluna por mês (Jan…Dez), com valores numéricos        |

Códigos de conta reconhecidos (para as subcategorias do DRE):

| Código  | Categoria                    |
| ------- | ---------------------------- |
| `3.x`   | Receitas                     |
| `4.x`   | Custos Variáveis             |
| `5.1.x` | Despesas Financeiras         |
| `5.2.x` | Despesas Administrativas     |
| `5.3.x` | Gastos com Pessoal           |
| `5.4.x` | Materiais e Equipamentos     |
| `5.5.x` | Despesas com Veículos        |
| `6.x`   | Investimentos                |
| `7.x`   | Outras Despesas Operacionais |

Linhas sem código numérico também são classificadas por **palavras-chave** no texto
(ex.: "salário", "aluguel", "combustível", "tarifa", "marketing", "fornecedor").

Valores aceitos: números, `R$`, formato `1.234,56`, negativos como `(1.234,56)` ou `-1.234,56`,
e traços (`-`, `—`) = zero. Uma planilha de exemplo está em **`public/dfc-modelo.xlsx`**.

---

## KPIs do Dashboard

| Card                       | Cálculo                                                         |
| -------------------------- | --------------------------------------------------------------- |
| **Total de Receitas**      | Soma do grupo de receitas no período                            |
| **Total de Despesas**      | Soma de todos os grupos de despesa no período                   |
| **Margem de Contribuição** | Receitas − Custos Variáveis (busca linha explícita, se existir) |
| **Saldo Final**            | Receitas − Despesas (ou linha de resultado final)               |

Cada card mostra o valor formatado em R$ e um **indicador de variação percentual** em
relação ao período imediatamente anterior (seta para cima/baixo, cor verde/vermelha).
Ícone e cor do card variam conforme o tom (positivo, negativo ou automático).

---

## DRE — Demonstrativo de Resultado

A tabela segue esta hierarquia:

```
Total de Receitas
  └─ subcategorias de receita (expansíveis)
Custos Variáveis
  └─ subcategorias (expansíveis)
Margem de Contribuição        ← total
Despesas (grupos)             → Gastos com Pessoal, Administrativas, etc.
  └─ subcategorias (expansíveis)
Resultado Operacional         ← total
Investimentos
  └─ subcategorias (expansíveis)
Resultado Final               ← total
```

Recursos:

- **Coluna "Descrição"**: ícones por tipo (receita `+`, despesa `−`, total `=`), indentação
  por nível e seta de expansão (`▸`/`▾`) nas categorias com subitens.
- **Coluna "Valor"**: valores em R$; despesas geralmente negativas (destacadas em vermelho),
  receitas em verde, totais em destaque.
- **Coluna "Variação"**: variação percentual da linha comparada ao período anterior
  (exibe `—` quando não há período anterior).

---

## Filtro de período e variações

O filtro fica no cabeçalho:

- **Desempenho Anual** — resume todos os meses do ano (`this-year`). É o padrão.
- **Selecionar mês...** — destaca um mês específico (`custom`, mesmo mês de início e fim).

Quando um mês é escolhido, o gráfico principal alterna para a **visão mensal**
(receitas + categorias de despesa daquele mês, com tooltip de percentual da receita).

Para cada período selecionado, o sistema calcula a janela anterior equivalente
(`previousKeys`) e mostra a variação percentual nos KPIs e no DRE.

---

## Limitações atuais

- **Sem persistência**: os dados importados vivem apenas em memória. Ao recarregar a
  página, é preciso importar a planilha novamente.
- **Sem backend/API**: nenhuma integração externa, banco de dados ou autenticação.
- **Sem cadastro de usuários**: a tela de Usuários (estrutura futura) não faz parte desta versão.
- **Upload local**: o arquivo é processado inteiramente no navegador.

A próxima evolução planejada é conectar a planilha **DFC ANO** com persistência opcional
e, eventualmente, um backend para armazenar os dados importados.

---

## Scripts disponíveis

| Comando             | Descrição                        |
| ------------------- | -------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento      |
| `npm run build`     | Build otimizado de produção      |
| `npm run build:dev` | Build em modo desenvolvimento    |
| `npm run preview`   | Pré-visualizar o build           |
| `npm run lint`      | Verificação de lint (ESLint)     |
| `npm run format`    | Formatação automática (Prettier) |

---

Projeto criado com [Lovable](https://lovable.dev) e desenvolvido localmente com
**TanStack Start**.
