# 4. Fluxo de trabalho

## 4.1 Ciclo de desenvolvimento SDD

```mermaid
graph TD
    A["1. Escrever spec"] --> B["2. Revisar spec (PR)"]
    B --> C["3. Sintetizar código"]
    C --> D["4. Validar contra a spec"]
    D -->|Passou| E["5. Revisar código (PR)"]
    D -->|Falhou| C
    E -->|Aprovou| F["6. Merge para produção"]
    E -->|Feedback| C
    F --> G["7. Monitorar e evoluir"]
    G -->|"Novo requisito"| A

    style A fill:#4A90D9,color:#fff
    style C fill:#7B68EE,color:#fff
    style D fill:#F5A623,color:#fff
    style E fill:#417505,color:#fff
    style F fill:#2D7D2D,color:#fff
```

---

## 4.2 Passo a passo

### Passo 1 — Escrever a spec

**Quem:** PM, dev frontend, dev backend ou qualquer pessoa do time.

**O quê:** Adicionar uma nova seção de tarefa no arquivo de spec do domínio em `.sdd/specs/<domínio>.md` definindo:
- O que o endpoint deve fazer
- O que recebe e o que devolve
- Quais erros são possíveis
- Quais cenários de teste validar

**Como:** Abrir o editor (ou o editor do GitHub no navegador), escrever a spec, commitar e dar push.

### Passo 2 — Revisar a spec

**Quem:** O time (via Pull Request).

**O quê:** A spec é revisada como qualquer mudança de código. O time verifica:
- As regras de negócio estão corretas?
- Casos extremos estão cobertos?
- O schema de entrada/saída é o que o frontend espera?
- Requisitos de segurança estão especificados?

```mermaid
sequenceDiagram
    participant Dev as Dev/PM
    participant GH as GitHub
    participant Team as Time

    Dev->>GH: Push nova seção de tarefa em .sdd/specs/user.md
    Dev->>GH: Abrir PR para revisão da spec
    GH->>Team: Notificação: novo PR de spec
    Team->>GH: Revisar, comentar, sugerir mudanças
    Dev->>GH: Tratar feedback, atualizar spec
    Team->>GH: Aprovar
    GH->>GH: Merge da spec na main
```

### Passo 3 — Sintetizar código

**Quem:** Ferramenta de IA (Cursor, pipeline de CI/CD ou motor próprio) ou desenvolvedor humano.

**O quê:** Código é gerado seguindo:
- A spec (o que construir)
- As skills (como construir)
- O código existente (contexto)

```mermaid
graph LR
    SPEC["📋 Spec"] --> TOOL["Ferramenta de síntese"]
    SKILLS["⚙️ Skills"] --> TOOL
    CODEBASE["📁 Código existente"] --> TOOL
    TOOL --> CODE["📦 Código gerado"]

    style TOOL fill:#7B68EE,color:#fff
```

**Com Cursor:** O dev abre o Cursor, referencia a spec e pede para gerar o código. O Cursor segue as regras do projeto (que espelham as skills do SDD).

**Com CI/CD:** Uma GitHub Action detecta a nova spec, chama um LLM com spec + skills como contexto e gera o código automaticamente.

**Manualmente:** O dev lê a spec e escreve o código à mão, seguindo as skills.

### Passo 4 — Validar contra a spec

**Quem:** Pipeline automatizado ou testes manuais.

**O quê:** O código sintetizado é executado contra os cenários de teste da spec:

```mermaid
flowchart TD
    CODE["Código sintetizado"] --> LOOP["Para cada cenário de teste"]

    LOOP --> SEED["Aplicar seed<br/>(se especificado)"]
    SEED --> EXEC["Executar código<br/>com entrada do cenário"]
    EXEC --> CHECK{"Saída bate com<br/>o esperado?"}
    CHECK -->|Sim| DB_CHECK{"Efeitos colaterais<br/>corretos?"}
    CHECK -->|Não| FAIL["❌ Cenário falhou"]
    DB_CHECK -->|Sim| PASS["✅ Cenário passou"]
    DB_CHECK -->|Não| FAIL

    PASS --> NEXT{"Mais cenários?"}
    NEXT -->|Sim| LOOP
    NEXT -->|Não| APPROVED["Todos os cenários passaram ✅"]

    FAIL --> RETRY{"Tentativas < 3?"}
    RETRY -->|Sim| RESYNTH["Re-sintetizar com<br/>contexto do erro"]
    RETRY -->|Não| ALERT["🚨 Alertar desenvolvedor"]
    RESYNTH --> LOOP

    style APPROVED fill:#417505,color:#fff
    style FAIL fill:#D0021B,color:#fff
```

### Passo 5 — Revisar código

**Quem:** Dev backend ou tech lead.

**O quê:** O código sintetizado é revisado em PR, como código escrito por humano:
- Segue as skills/arquitetura?
- A lógica está correta?
- Há riscos de segurança?
- O código é legível e sustentável?

Se o revisor deixa feedback, o código é re-sintetizado com esse feedback como contexto adicional.

### Passo 6 — Merge para produção

**Quem:** Revisor aprova, CI/CD faz deploy.

**O quê:** Merge e deploy padrão. O código está em produção, indistinguível de código escrito manualmente.

### Passo 7 — Monitorar e evoluir

**Quem:** Time.

**O quê:**
- Se aparece bug em produção, o cenário que falhou entra na spec
- Se surge novo requisito, cria-se nova spec (ou atualização)
- Se a mesma correção de review se repete em vários PRs, cria-se uma nova skill

---

## 4.3 Papéis e responsabilidades

```mermaid
graph TB
    subgraph "Fase da spec"
        PM["PM escreve regras de negócio"]
        FE["Frontend define schemas"]
        BE_SPEC["Backend adiciona restrições"]
    end

    subgraph "Fase de síntese"
        AI["IA/ferramenta gera código"]
        DEV_WRITE["ou dev escreve manualmente"]
    end

    subgraph "Fase de validação"
        AUTO["Validação automatizada<br/>contra a spec"]
    end

    subgraph "Fase de governança"
        BE_REVIEW["Backend revisa PR"]
        FEEDBACK["Feedback → re-síntese"]
    end

    PM --> AI
    FE --> AI
    BE_SPEC --> AI
    AI --> AUTO
    DEV_WRITE --> AUTO
    AUTO --> BE_REVIEW
    BE_REVIEW --> FEEDBACK
    FEEDBACK --> AI

    style PM fill:#4A90D9,color:#fff
    style AI fill:#7B68EE,color:#fff
    style AUTO fill:#F5A623,color:#fff
    style BE_REVIEW fill:#417505,color:#fff
```

---

## 4.4 Concorrência — Várias Specs ao Mesmo Tempo

Quando vários devs adicionam tarefas à mesma spec de domínio, cada um adiciona uma **seção separada** no mesmo arquivo. Se dois devs editam seções diferentes, o conflito de merge é trivial — assim como editar funções diferentes no mesmo arquivo de código:

```mermaid
sequenceDiagram
    participant A as Dev A
    participant B as Dev B
    participant GH as GitHub
    participant SDD as Síntese

    A->>GH: Adiciona seção "TAREFA-14 - v1" em specs/user.md
    B->>GH: Adiciona seção "TAREFA-24 - v1" em specs/user.md

    Note over GH: Seções diferentes no mesmo arquivo<br/>merge trivial se houver conflito

    GH->>SDD: Gerar código a partir de user.md atualizado
    SDD->>GH: PR com código gerado

    Note over GH: Dev A depois evolui a spec

    A->>GH: Adiciona seção "TAREFA-14 - v2" em specs/user.md
    GH->>SDD: Regenerar a partir da spec mais recente
```

Cada tarefa é uma seção (`## TAREFA-14 - v1`), não um arquivo separado. O arquivo de spec cresce naturalmente com o domínio, preservando histórico completo e contexto compartilhado (ex: regras de auth do domínio no topo).

---

## 4.5 Estrutura do projeto

```
my-project/
├── cmd/                        ← entrada do app (gerido por humanos)
├── internal/                   ← código da app (sintetizado + humano)
│   ├── user/
│   │   ├── handler.go
│   │   ├── service.go
│   │   ├── repository.go
│   │   └── entity.go
│   └── order/
│       ├── handler.go
│       ├── service.go
│       └── ...
├── .sdd/                       ← configuração SDD
│   ├── specs/                  ← specs (fonte da verdade)
│   │   ├── user.md             ← todos os endpoints e tarefas de /user
│   │   └── order.md            ← todos os endpoints e tarefas de /order
│   ├── skills/                 ← regras arquiteturais
│   │   ├── go-ddd.md
│   │   ├── security.md
│   │   └── error-handling.md
│   └── config.yaml             ← configuração do projeto
├── tests/                      ← testes (gerados a partir dos cenários da spec)
├── go.mod
└── .github/
    └── workflows/              ← CI/CD (automação opcional)
```

### O que o SDD pode alterar vs o que não pode

| Caminho | SDD pode modificar? | Motivo |
|---------|---------------------|--------|
| `internal/` | Sim | Código sintetizado mora aqui |
| `tests/` | Sim | Testes gerados a partir dos cenários da spec |
| `.sdd/specs/` | Nunca | Entrada humana, fonte da verdade |
| `.sdd/skills/` | Só sugestão | Pode propor novas skills via PR |
| `.sdd/config.yaml` | Nunca | Configuração do projeto |
| `cmd/` | Nunca | Entrada do app, gerida por humanos |
| `.github/` | Nunca | Definições de pipeline, geridas por humanos |
