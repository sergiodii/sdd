# 2. Ciclo de Vida do Código — O Funil de Promoção

O código no SSAB não nasce pronto. Ele **amadurece** através de um funil de três fases, saindo de uma execução lenta (IA) para execução nativa de alta performance (PHP puro).

```mermaid
graph LR
    A["❄️ COLD<br/>IA Gera Código"] --> B["🔥 STAGING<br/>Sandbox + 10% Tráfego"]
    B --> C["⚡ HOT<br/>PHP Nativo 100%"]

    style A fill:#4A90D9,color:#fff
    style B fill:#F5A623,color:#fff
    style C fill:#417505,color:#fff
```

---

## 2.1 Fase A — Cold Start (Ingestão de Intenção)

A fase fria é acionada quando um endpoint é chamado **pela primeira vez** e não existe código nativo para atendê-lo.

### Atores
- **PM** (Produto) ou **Dev** — quem definiu a Spec/Contrato previamente

### Fluxo

```mermaid
sequenceDiagram
    participant Front as Frontend
    participant GW as Gateway PHP
    participant Redis as Redis Cache
    participant LLM as LLM + MCP
    participant FS as File System
    participant Git as Git/GitHub

    Front->>GW: POST /user {email, passkey}
    GW->>Redis: GET api:post:/user
    Redis-->>GW: null (Cache Miss)

    Note over GW,LLM: Primeira chamada — aciona IA

    GW->>LLM: Prompt + Spec + Schema (via MCP)
    LLM->>LLM: Lê Skills (DDD Rules)
    LLM->>LLM: Lê Schema do banco (via MCP)
    LLM->>LLM: Gera Service + Repository + Controller

    LLM-->>GW: Código PHP gerado

    GW->>GW: Executa em Sandbox (BEGIN TRANSACTION)
    GW->>GW: Valida contra Mocks do Dev
    GW->>GW: ROLLBACK

    alt Validação OK
        GW->>FS: Salva em /generated/shadow/
        GW->>Redis: SET api:post:/user → shadow/create_user.php
        GW->>Git: Commit + Push (branch: ssab/auto)
        GW-->>Front: HTTP 201 {token, userData}
    else Validação Falhou
        GW->>LLM: Reenvia com erro para correção
        Note over GW,LLM: Até 3 tentativas
    end
```

### O que acontece nesta fase

1. O **Gateway** recebe a request e consulta o Redis
2. **Cache Miss** — não existe código para este endpoint
3. O Gateway monta um prompt contendo:
   - A request original (método, path, payload)
   - A **Spec** definida pelo Dev/PM (input esperado, output desejado)
   - O **Schema do banco** (via MCP)
   - As **Skills** (regras DDD obrigatórias)
4. A LLM gera o código PHP completo seguindo DDD
5. O código é **testado em sandbox** contra os mocks
6. Se aprovado, é salvo como **Shadow Code**

### Latência esperada
- **3 a 15 segundos** (inclui chamada à LLM + sandbox)
- O frontend deve estar preparado com timeout adequado ou indicador de carregamento

---

## 2.2 Fase B — Staging (Sandbox e Validação)

O código gerado entra em um estado intermediário: existe fisicamente, mas ainda não é considerado "de produção".

### Fluxo

```mermaid
flowchart TD
    A["Shadow Code gerado"] --> B{"Testes automáticos<br/>passaram?"}
    B -->|Sim| C["Salva na branch ssab/auto"]
    B -->|Não| D["LLM tenta corrigir"]
    D --> E{"Tentativa < 3?"}
    E -->|Sim| B
    E -->|Não| F["🚨 Alerta para Dev<br/>Intervenção manual"]

    C --> G["Rollout 10% do tráfego"]
    G --> H{"Erros em<br/>tempo real?"}
    H -->|Não| I["✅ Estável<br/>Pronto para PR"]
    H -->|Sim| J["Rollback automático<br/>Volta para Cold"]

    style A fill:#4A90D9,color:#fff
    style C fill:#F5A623,color:#fff
    style I fill:#417505,color:#fff
    style F fill:#D0021B,color:#fff
    style J fill:#D0021B,color:#fff
```

### Mecanismo de Rollout Gradual

O Redis controla a distribuição de tráfego usando uma estratégia de **percentage-based routing**:

```mermaid
graph LR
    subgraph "Distribuição de Tráfego (Staging)"
        REQ["100% Requests"] --> SPLIT{"Router"}
        SPLIT -->|"90%"| NATIVE["Código anterior<br/>ou fallback"]
        SPLIT -->|"10%"| SHADOW["Shadow Code<br/>(gerado pela IA)"]
    end

    style SHADOW fill:#F5A623,color:#fff
    style NATIVE fill:#417505,color:#fff
```

### Validações nesta fase

| Verificação | Método | Critério de Aprovação |
|-------------|--------|----------------------|
| Conformidade de contrato | Comparação JSON output vs Spec | Output **idêntico** ao esperado |
| Side-effects | Inspeção de banco em sandbox | Registros criados/alterados conforme Spec |
| Erros de runtime | Monitoramento do tráfego de 10% | Zero erros 5xx em 1 hora |
| Performance | Medição de latência p95 | < 200ms por request |
| Segurança | Análise estática (linter) | Sem `eval()`, `exec()`, SQL raw |

---

## 2.3 Fase C — Hot (Promoção para Nativo)

O código sobreviveu à sandbox, ao tráfego real parcial e está pronto para ser promovido.

### Fluxo

```mermaid
sequenceDiagram
    participant IA as LLM
    participant Git as GitHub
    participant Dev as Dev Backend
    participant Redis as Redis
    participant Prod as Produção

    IA->>Git: Abre Pull Request (branch ssab/auto → main)
    Note over Git: PR inclui:<br/>• Service PHP<br/>• Repository PHP<br/>• Testes Unitários<br/>• Spec original

    Git->>Dev: Notificação de PR

    alt Dev aprova
        Dev->>Git: Merge para main
        Git->>Redis: Atualiza rota → arquivo nativo
        Redis->>Prod: 100% tráfego → código nativo
        Note over Prod: IA sai do fluxo<br/>Latência zero de IA
    else Dev comenta correções
        Dev->>Git: Comentário no PR
        Git->>IA: Webhook com comentários
        IA->>IA: Processa feedback
        IA->>Git: Novo commit com correções
        Note over Git,Dev: Ciclo repete até aprovação
    end
```

### O que o PR contém

```
📦 PR #42 — [SSAB] POST /user - Criação de Usuário
│
├── src/Domain/Entities/User.php
├── src/Application/Services/CreateUserService.php
├── src/Infrastructure/Repositories/UserRepository.php
├── tests/Unit/CreateUserServiceTest.php
├── specs/post_user.json (referência)
│
└── 📝 Descrição automática:
    "Gerado pelo SSAB em 2026-03-20.
     Validado contra 3 cenários de teste.
     Rollout de 10% estável por 2 horas.
     0 erros registrados."
```

### Após a aprovação

```mermaid
stateDiagram-v2
    [*] --> Cold: Endpoint novo
    Cold --> Staging: Código gerado + testado
    Staging --> Hot: PR aprovado pelo Dev
    Hot --> [*]: Endpoint maduro

    Hot --> Cold: Schema do banco mudou
    Staging --> Cold: Erros críticos detectados

    note right of Cold: IA ativa\nLatência alta
    note right of Staging: IA em standby\n10% tráfego
    note right of Hot: IA desligada\nPHP nativo puro
```

---

## 2.4 Transições de Estado

### Promoção (caminho feliz)

| De | Para | Gatilho |
|----|------|---------|
| **Cold** | **Staging** | Código passa em todos os mocks |
| **Staging** | **Hot** | PR aprovado pelo Dev + zero erros em tráfego real |

### Demoção (caminho de falha)

| De | Para | Gatilho |
|----|------|---------|
| **Staging** | **Cold** | Erros 5xx detectados no tráfego de 10% |
| **Hot** | **Cold** | Migração de banco de dados invalida o código |
| **Cold** | **Alerta** | IA falha 3x consecutivas em gerar código válido |

```mermaid
graph TD
    A["Cold ❄️"] -->|"Mocks OK"| B["Staging 🔥"]
    B -->|"PR Aprovado"| C["Hot ⚡"]
    B -->|"Erros 5xx"| A
    C -->|"Schema mudou"| A
    A -->|"3 falhas"| D["🚨 Alerta Dev"]

    style A fill:#4A90D9,color:#fff
    style B fill:#F5A623,color:#fff
    style C fill:#417505,color:#fff
    style D fill:#D0021B,color:#fff
```

---

## 2.5 Tempos Esperados por Fase

```mermaid
gantt
    title Tempo de Vida Típico de um Endpoint
    dateFormat X
    axisFormat %s

    section Cold
    LLM gera código        :a1, 0, 10
    Sandbox valida          :a2, 10, 15

    section Staging
    Rollout 10%             :a3, 15, 75
    Monitoramento           :a4, 75, 135

    section Hot
    PR Review               :a5, 135, 195
    Merge + 100% tráfego    :a6, 195, 200
```

| Fase | Duração Estimada | Dependência |
|------|-----------------|-------------|
| **Cold** | 5-15 segundos | Latência da LLM |
| **Staging** | 1-2 horas | Tempo de monitoramento |
| **Hot** | 1-24 horas | Velocidade do code review humano |
| **Total** | ~2-26 horas | Do "post-it" ao código nativo em produção |

> Comparação: no fluxo tradicional, um CRUD simples leva de **1 a 5 dias** entre spec, desenvolvimento, code review e deploy.
