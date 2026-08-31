# Plano de Integração: Microsoft OneDrive × Tersia Dashboard (Tempo Real)

Este documento detalha a arquitetura, as configurações e as etapas para conectar o **Tersia Dashboard** diretamente ao **Microsoft OneDrive** da clínica, fazendo com que qualquer alteração salva na planilha Excel (`.xlsx`) reflita automaticamente nos gráficos, KPIs e DRE do dashboard em tempo real.

---

## 🏗️ Visão Geral da Arquitetura

```
┌────────────────────────────────────────────────────────┐
│ 1. COMPUTADOR (Windows)                                │
│    Contabilidade / Gestor edita o Excel e dá Ctrl + S  │
└──────────────────────────┬─────────────────────────────┘
                           │ Sincronização automática (2-3 seg)
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. MICROSOFT ONEDRIVE (Nuvem Microsoft 365)            │
│    Armazena o arquivo atualizado na nuvem              │
└──────────────────────────┬─────────────────────────────┘
                           │ Chamada de API Segura (Token OAuth)
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. SERVIDOR DO DASHBOARD (Backend / TanStack Start)    │
│    • Consulta Microsoft Graph API                      │
│    • Detecta alterações via ETag / Timestamp           │
│    • Executa o parser do DFC e calcula métricas       │
│    • Aplica cache inteligente (SWR)                   │
└──────────────────────────┬─────────────────────────────┘
                           │ Sincronização via Polling / WebSocket
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. TERSIA DASHBOARD (Navegador / Dra. Térsia)          │
│    • Indicador: 🟢 "Sincronizado com OneDrive"         │
│    • Gráficos e DRE atualizados ao vivo                │
└────────────────────────────────────────────────────────┘
```

---

## 🔑 Métodos de Conexão com o OneDrive

### Método 1 (Recomendado): Microsoft Graph API Oficial

Utiliza o registro de aplicativo no Microsoft Entra ID (Azure AD), permitindo que o servidor do dashboard consulte a pasta do OneDrive de forma 100% autônoma e segura.

- **Segurança**: Permissões mínimas de somente leitura (`Files.Read`).
- **Autenticação**: Fluxo servidor-a-servidor (Client Credentials Flow) usando `Tenant ID`, `Client ID` e `Client Secret`.
- **Custo**: **R$ 0,00** (gratuito dentro do plano Microsoft 365).

### Método 2 (Alternativo Simplificado): Link Seguro de Compartilhamento

Gera um link de compartilhamento de download direto do arquivo Excel no OneDrive. O servidor baixa o buffer do arquivo através desse link seguro sem necessidade de registrar aplicativo no Azure.

---

## 📋 Proposta de Mudanças no Código

### 1. Configuração e Variáveis de Ambiente

#### [.env.example](file:///.env.example)

Definição das variáveis seguras:

- `ONEDRIVE_AUTH_TYPE`: `graph_api` ou `shared_link`
- `AZURE_TENANT_ID`: ID do inquilino Microsoft da clínica
- `AZURE_CLIENT_ID`: ID do aplicativo registrado
- `AZURE_CLIENT_SECRET`: Segredo do aplicativo
- `ONEDRIVE_FILE_PATH`: Caminho do arquivo no OneDrive (ex: `/Financeiro/DFC ANO.xlsx`)

---

### 2. Camada de Serviço no Servidor (Backend)

#### `src/lib/server/onedrive-service.ts`

- Gerenciador de tokens OAuth com renovação automática.
- Função para buscar metadados do arquivo (`lastModifiedDateTime`, `size`, `eTag`).
- Download do buffer binário do arquivo `.xlsx` direto da API da Microsoft.
- Camada de cache em memória (ex: 60 segundos) com verificação de modificação para evitar requisições redundantes.

#### `src/routes/api/finance.sync.ts`

- Endpoint de API interna do dashboard (`/api/finance/sync`):
  - Retorna o dataset financeiro já processado em formato JSON leve.
  - Informa a data e hora exatas da última alteração no Excel.

---

### 3. Integração no Frontend e Estado Global

#### `src/lib/finance/finance-store.tsx`

- Integração com **TanStack Query** para sincronização automática em segundo plano:
  - Polling a cada 60 segundos (ou intervalo configurável).
  - Atualização imediata em caso de foco na janela (`refetchOnWindowFocus`).
- Adição de estado de sincronização (`syncStatus`: `idle`, `syncing`, `synced`, `offline`).

---

### 4. Interface do Usuário (UI / UX)

#### `src/components/dashboard/import-planilha.tsx`

- Exibição do status da integração:
  - 🟢 **OneDrive Conectado**: "Última sincronização: há 1 min (Excel salvo às 10:15)".
  - Botão **"Sincronizar Agora"** para forçar leitura manual instantânea se desejado.
- Mantém o fallback para upload manual caso a internet ou o serviço fiquem indisponíveis.

---

## 🔒 Segurança e Privacidade

1. **Credenciais Protegidas**: As chaves da Microsoft nunca chegam ao navegador do usuário; ficam isoladas no servidor.
2. **Somente Leitura**: As permissões concedidas à aplicação são estritamente de **leitura de arquivo** (`Files.Read`), impedindo qualquer alteração ou exclusão de dados no OneDrive.
3. **Privacidade dos Dados**: O link original do OneDrive nunca é exposto publicamente na URL do site.

---

## 🚀 Roteiro de Implementação (Passo a Passo)

### Etapa 1: Configuração na Microsoft (Acesso da Clínica)

1. Acessar o portal [entra.microsoft.com](https://entra.microsoft.com) com a conta Microsoft da clínica.
2. Criar um Registro de Aplicativo gratuito: _"Tersia Dashboard Sync"_.
3. Gerar um `Client Secret` e conceder permissão `Files.Read` no Microsoft Graph.
4. Definir o local da planilha `DFC ANO.xlsx` no OneDrive.

### Etapa 2: Implementação do Serviço Backend

1. Criar o cliente de integração com a API da Microsoft.
2. Integrar o serviço ao parser financeiro existente (`parseDfcWorkbook`).
3. Criar a rota de API interna `/api/finance/sync`.

### Etapa 3: Integração com o Dashboard & Polling

1. Conectar o `FinanceProvider` ao endpoint `/api/finance/sync`.
2. Configurar a atualização automática em tempo real.
3. Adicionar os indicadores visuais de sincronização e botão de atualização rápida.

### Etapa 4: Validação e Testes

1. Abrir a planilha no Excel local, alterar um valor teste e salvar (`Ctrl + S`).
2. Validar se o Dashboard reflete a alteração automaticamente na tela.
3. Testar comportamento em múltiplos dispositivos (celular, desktop) simultaneamente.
