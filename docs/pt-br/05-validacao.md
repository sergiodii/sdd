# 5. Validação

## 5.1 O contrato

No SDD, a spec é um **contrato**. O código não está "pronto" quando compila — está pronto quando **passa em todos os cenários de teste definidos na spec**.

```mermaid
graph LR
    CODE["📦 Código"] --> VALIDATE{"Atende ao contrato<br/>da spec?"}
    VALIDATE -->|Sim| VALID["✅ Válido"]
    VALIDATE -->|Não| INVALID["❌ Inválido"]

    style VALID fill:#417505,color:#fff
    style INVALID fill:#D0021B,color:#fff
```

Essa é a diferença fundamental em relação ao desenvolvimento tradicional: os critérios de aceite são **formalizados e executáveis**, não implícitos ou verbais.

---

## 5.2 O que é validado

```mermaid
flowchart TD
    CODE["Código sintetizado"] --> C1{"Conformidade<br/>funcional"}
    C1 -->|Passa| C2{"Efeitos colaterais<br/>corretos"}
    C1 -->|Falha| REJECT["❌"]
    C2 -->|Passa| C3{"Segue as<br/>skills"}
    C2 -->|Falha| REJECT
    C3 -->|Passa| C4{"Análise estática<br/>(lint/SAST)"}
    C3 -->|Falha| REJECT
    C4 -->|Passa| C5{"Desempenho<br/>aceitável"}
    C4 -->|Falha| REJECT
    C5 -->|Passa| APPROVE["✅ Pronto para revisão"]
    C5 -->|Falha| REJECT

    REJECT --> RETRY{"Tentativas < 3?"}
    RETRY -->|Sim| RESYNTH["Re-sintetizar"]
    RETRY -->|Não| HUMAN["🚨 Intervenção humana"]

    style APPROVE fill:#417505,color:#fff
    style REJECT fill:#D0021B,color:#fff
    style HUMAN fill:#D0021B,color:#fff
```

| # | Verificação | Método | Automatizado? |
|---|-------------|--------|---------------|
| 1 | **Conformidade funcional** | Executar o código com o input da spec, comparar a saída | Sim |
| 2 | **Efeitos colaterais** | Verificar se mudanças em banco/estado batem com a spec | Sim |
| 3 | **Conformidade com skills** | Verificar se o código segue regras arquiteturais | Sim (lint + checagem de estrutura) |
| 4 | **Análise estática** | Rodar linter, SAST, type checker | Sim |
| 5 | **Desempenho** | Tempo de execução dentro do intervalo aceitável | Sim |
| 6 | **Revisão humana** | Desenvolvedor revisa qualidade do código, lógica, segurança | Não |

---

## 5.3 Processo de validação

```mermaid
sequenceDiagram
    participant CODE as Código sintetizado
    participant RUNNER as Executor de testes
    participant SPEC as Cenários da spec
    participant DB as Banco de testes

    RUNNER->>SPEC: Carregar cenários

    loop Para cada cenário
        alt Tem seed/pré-condição
            RUNNER->>DB: Aplicar dados de seed
        end

        RUNNER->>DB: BEGIN TRANSACTION
        RUNNER->>CODE: Executar com scenario.input
        CODE-->>RUNNER: Resposta (status + corpo)

        RUNNER->>RUNNER: Comparar resposta vs scenario.expect

        alt Tem db_assert
            RUNNER->>DB: Verificar condições de db_assert
        end

        RUNNER->>DB: ROLLBACK

        alt Cenário passou
            RUNNER->>RUNNER: ✅ Próximo cenário
        else Cenário falhou
            RUNNER->>RUNNER: ❌ Registrar detalhes da falha
        end
    end

    alt Todos os cenários passaram
        RUNNER->>RUNNER: ✅ Código validado
    else Algum cenário falhou
        RUNNER->>RUNNER: ❌ Relatar falhas
    end
```

### Garantias principais

- **Isolamento**: Cada cenário roda em uma transação de banco que é revertida depois. Os testes nunca se contaminam.
- **Dados de seed**: Cenários podem definir pré-condições (por exemplo, "já existe um usuário com este e-mail") configuradas antes da execução.
- **Asserções de DB**: Além de checar a resposta, a validação pode verificar se as mudanças corretas foram feitas no banco.
- **Determinístico**: Mesma spec + mesmo código = mesmo resultado, sempre.

---

## 5.4 Validação em contextos diferentes

### Com Cursor (desenvolvimento local)

O desenvolvedor sintetiza o código localmente com o Cursor e, em seguida, roda a validação:

```mermaid
graph LR
    A["Dev escreve spec"] --> B["Cursor gera código"]
    B --> C["Dev roda testes localmente"]
    C --> D["Testes validam contra a spec"]
    D --> E["Dev abre PR"]

    style B fill:#7B68EE,color:#fff
    style D fill:#F5A623,color:#fff
```

### Com CI/CD (pipeline automatizado)

Um GitHub Action gera código e valida automaticamente:

```mermaid
graph LR
    A["Spec enviada (push)"] --> B["Action gera código"]
    B --> C["Action executa validação"]
    C --> D["Action abre PR"]
    D --> E["Dev revisa"]

    style B fill:#7B68EE,color:#fff
    style C fill:#F5A623,color:#fff
```

### Desenvolvimento manual

Um desenvolvedor escreve o código à mão e valida contra a spec:

```mermaid
graph LR
    A["Dev lê spec"] --> B["Dev escreve código"]
    B --> C["Dev roda testes"]
    C --> D["Testes validam contra a spec"]
    D --> E["Dev abre PR"]

    style B fill:#417505,color:#fff
    style D fill:#F5A623,color:#fff
```

Nos três casos, o **passo de validação é o mesmo**: executar os cenários de teste da spec contra o código. O método de síntese não importa — o que importa é o código estar em conformidade com o contrato.

---

## 5.5 Critérios de aprovação

Para o código sair de "sintetizado" para "pronto para produção", ele precisa passar em:

```mermaid
graph TD
    subgraph "Automatizado (obrigatório passar)"
        A1["Todos os cenários da spec passam"]
        A2["Sem erros de lint"]
        A3["Sem funções proibidas"]
        A4["Segue estrutura DDD"]
        A5["Compila / build"]
    end

    subgraph "Humano (obrigatório aprovar)"
        H1["Lógica está correta"]
        H2["Segurança é adequada"]
        H3["Código é legível"]
        H4["Sem complexidade desnecessária"]
    end

    A1 --> GATE{"Todas as verificações<br/>automatizadas passam?"}
    A2 --> GATE
    A3 --> GATE
    A4 --> GATE
    A5 --> GATE

    GATE -->|Não| BLOCK["❌ PR bloqueado"]
    GATE -->|Sim| HUMAN_REVIEW["Revisão humana"]
    HUMAN_REVIEW --> H1
    HUMAN_REVIEW --> H2
    HUMAN_REVIEW --> H3
    HUMAN_REVIEW --> H4

    style BLOCK fill:#D0021B,color:#fff
    style HUMAN_REVIEW fill:#417505,color:#fff
```

---

## 5.6 O ciclo de feedback

Quando um revisor humano dá feedback, isso gera valor em dois níveis:

```mermaid
graph TD
    COMMENT["💬 Comentário de revisão"] --> SHORT["Curto prazo:<br/>Corrigir este PR"]
    COMMENT --> LONG["Longo prazo:<br/>Melhorar toda síntese futura"]

    SHORT --> FIX["Re-sintetizar com<br/>contexto do feedback"]
    FIX --> COMMIT["Novo commit no PR"]

    LONG --> PATTERN{"Mesmo feedback<br/>3+ vezes?"}
    PATTERN -->|Sim| SKILL["Criar nova skill"]
    PATTERN -->|Não| STORE["Guardar para análise"]

    SKILL --> FUTURE["Todo código futuro<br/>segue esta regra"]

    style SHORT fill:#F5A623,color:#fff
    style LONG fill:#417505,color:#fff
    style SKILL fill:#7B68EE,color:#fff
```

Ou seja, cada comentário de code review tem **valor permanente**. Não corrige só um PR — pode evitar o mesmo erro em toda síntese futura.
