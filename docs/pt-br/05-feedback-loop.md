# 5. Feedback Loop — O Ciclo de Aprendizado

## 5.1 Visão Geral

O Feedback Loop é o mecanismo que transforma o SSAB de um simples gerador de código em um **sistema que evolui**. Comentários de code review feitos por humanos retroalimentam a LLM, que corrige o código automaticamente e — mais importante — **aprende padrões recorrentes** para não repetir os mesmos erros.

```mermaid
graph TD
    GEN["🤖 IA gera código"] --> PR["📝 Abre PR"]
    PR --> REVIEW["👁️ Dev faz Code Review"]
    REVIEW --> COMMENTS["💬 Comentários no PR"]
    COMMENTS --> HOOK["🔗 Webhook captura"]
    HOOK --> LLM["🤖 IA processa feedback"]
    LLM --> FIX["🔧 Corrige código"]
    FIX --> COMMIT["📦 Novo commit no PR"]
    COMMIT --> REVIEW

    COMMENTS --> LEARN["📚 Análise de padrão"]
    LEARN --> SKILL["⚙️ Nova Skill criada"]
    SKILL --> GEN

    style GEN fill:#7B68EE,color:#fff
    style REVIEW fill:#4A90D9,color:#fff
    style LEARN fill:#F5A623,color:#fff
    style SKILL fill:#417505,color:#fff
```

---

## 5.2 O Ciclo de Correção (Short Loop)

O ciclo curto acontece **dentro de um único PR**. O Dev comenta, a IA corrige, o Dev re-avalia.

```mermaid
sequenceDiagram
    participant Dev as Dev Backend
    participant GH as GitHub
    participant Hook as Webhook Handler
    participant CTX as Context Builder
    participant LLM as LLM
    participant SB as Sandbox
    participant Git as Git

    Dev->>GH: Comenta na linha 42:<br/>"Use Carbon::now() em vez de date()"

    GH->>Hook: POST webhook (pull_request_review_comment)
    
    Hook->>CTX: Monta contexto completo
    Note over CTX: • Arquivo completo (CreateUserService.php)<br/>• Linha comentada (42)<br/>• Texto do comentário<br/>• Spec original do endpoint<br/>• Skills vigentes<br/>• Histórico de comentários do PR

    CTX->>LLM: Prompt de correção

    LLM->>LLM: Analisa o feedback
    LLM->>LLM: Gera código corrigido
    LLM->>SB: Valida contra Spec (sandbox)

    alt Validação OK
        SB->>Git: git add + git commit
        Git->>GH: Push para branch do PR
        GH->>Dev: Notificação: "Corrigido"
        Note over GH: IA responde ao comentário:<br/>"Corrigido no commit abc123.<br/>Troquei date() por Carbon::now()<br/>conforme sugerido."
    else Validação Falhou
        SB->>LLM: Reenvia com erro
        Note over LLM: Até 3 tentativas
    end
```

### Estrutura do Prompt de Correção

A IA recebe um prompt estruturado para processar cada comentário:

```
## Contexto de Correção

### Arquivo
CreateUserService.php (linha 42)

### Comentário do Reviewer
"Use Carbon::now() em vez de date(). Padrão do projeto é sempre usar Carbon."

### Código Atual (trecho)
```php
$user->created_at = date('Y-m-d H:i:s');
```

### Spec Original
(spec completa do endpoint)

### Skills Vigentes
(lista de skills/rules)

### Instrução
Corrija o código conforme o feedback do reviewer.
Mantenha a estrutura DDD. Rode os testes da Spec.
Se a correção exigir uma nova dependência, declare-a.
```

---

## 5.3 O Ciclo de Aprendizado (Long Loop)

O ciclo longo analisa **padrões recorrentes** nos comentários de code review. Quando um tipo de correção se repete, o sistema cria automaticamente uma nova Skill para prevenir o erro no futuro.

```mermaid
flowchart TD
    C1["Comentário: 'Use Carbon'<br/>PR #12"] --> DB["Feedback DB"]
    C2["Comentário: 'Use Carbon para datas'<br/>PR #15"] --> DB
    C3["Comentário: 'Não use date(), use Carbon'<br/>PR #18"] --> DB

    DB --> ANALYZER["Analisador de Padrões"]
    ANALYZER --> COUNT{"Mesmo padrão<br/>≥ 3 vezes?"}

    COUNT -->|Sim| GENERATE["Gera nova Skill"]
    COUNT -->|Não| WAIT["Aguarda mais dados"]

    GENERATE --> SKILL["📄 skills/use-carbon.md<br/><br/>REGRA: Sempre use Carbon\npara manipulação de datas.\nNUNCA use date() ou time()."]

    SKILL --> NOTIFY["📢 Notifica Dev:<br/>'Nova skill sugerida.<br/>Deseja aprovar?'"]

    NOTIFY --> APPROVE{"Dev aprova?"}
    APPROVE -->|Sim| ACTIVE["Skill ativa para<br/>todas as gerações futuras"]
    APPROVE -->|Não| DISCARD["Descartada"]

    style GENERATE fill:#F5A623,color:#fff
    style ACTIVE fill:#417505,color:#fff
    style DB fill:#4A90D9,color:#fff
```

### Como o Analisador de Padrões Funciona

```mermaid
graph LR
    subgraph "Entrada"
        COMMENTS["Todos os comentários<br/>de code review"]
    end

    subgraph "Processamento"
        EMBED["Embedding dos<br/>comentários"]
        CLUSTER["Clustering por<br/>similaridade semântica"]
        THRESHOLD["Filtro: clusters<br/>com ≥ 3 ocorrências"]
    end

    subgraph "Saída"
        SKILL_DRAFT["Draft de nova Skill<br/>(pendente aprovação)"]
    end

    COMMENTS --> EMBED --> CLUSTER --> THRESHOLD --> SKILL_DRAFT

    style EMBED fill:#7B68EE,color:#fff
    style CLUSTER fill:#F5A623,color:#fff
    style SKILL_DRAFT fill:#417505,color:#fff
```

O sistema usa **embeddings** dos comentários para agrupar feedbacks semanticamente similares. Não importa se o Dev escreveu "use Carbon", "não use date()" ou "datas devem usar Carbon" — o clustering agrupa todos como o mesmo padrão.

---

## 5.4 Tipos de Feedback Processáveis

```mermaid
graph TD
    subgraph "Correções Diretas"
        F1["'Troque X por Y'<br/>Ação: substituição direta"]
        F2["'Adicione validação de null'<br/>Ação: inserir guard clause"]
        F3["'Remova esse bloco'<br/>Ação: deletar código"]
    end

    subgraph "Padrões Arquiteturais"
        F4["'Isso deveria estar no Repository'<br/>Ação: mover lógica de camada"]
        F5["'Use o padrão Strategy aqui'<br/>Ação: refatorar estrutura"]
        F6["'Extraia esse método'<br/>Ação: refatoração"]
    end

    subgraph "Regras de Negócio"
        F7["'Desconto máximo é 50%'<br/>Ação: adicionar constraint"]
        F8["'Esse campo é obrigatório'<br/>Ação: adicionar validação"]
    end

    subgraph "Ambíguos (Exigem clarificação)"
        F9["'Isso não parece certo'<br/>Ação: IA pede mais detalhes"]
        F10["'Revise essa lógica'<br/>Ação: IA pede contexto"]
    end

    style F1 fill:#417505,color:#fff
    style F2 fill:#417505,color:#fff
    style F3 fill:#417505,color:#fff
    style F4 fill:#4A90D9,color:#fff
    style F5 fill:#4A90D9,color:#fff
    style F6 fill:#4A90D9,color:#fff
    style F7 fill:#F5A623,color:#fff
    style F8 fill:#F5A623,color:#fff
    style F9 fill:#D0021B,color:#fff
    style F10 fill:#D0021B,color:#fff
```

| Tipo | Ação da IA | Confiança |
|------|-----------|-----------|
| **Substituição direta** | Troca automática + re-teste | Alta |
| **Adição de validação** | Insere guard clause + novo cenário de teste | Alta |
| **Mudança de camada** | Refatora seguindo DDD + re-teste | Média |
| **Refatoração de padrão** | Reescreve usando o padrão sugerido | Média |
| **Constraint de negócio** | Adiciona regra + atualiza Spec | Média |
| **Ambíguo** | Responde no PR pedindo clarificação | N/A |

---

## 5.5 Proteção Contra Loop Infinito

Um risco real é a IA entrar em **loop de correções**: o Dev comenta, a IA corrige de um jeito que gera outro problema, o Dev comenta novamente...

```mermaid
flowchart TD
    START["Comentário recebido"] --> ATTEMPT["Tentativa de correção"]
    ATTEMPT --> TEST{"Passa nos testes?"}

    TEST -->|Sim| COMMIT["Commit + Push"]
    TEST -->|Não| COUNT{"Tentativa < 3?"}

    COUNT -->|Sim| ATTEMPT
    COUNT -->|Não| ESCALATE["🚨 Escalar para Dev"]

    COMMIT --> REVIEW{"Novo comentário<br/>no mesmo trecho?"}
    REVIEW -->|Não| DONE["✅ Resolvido"]
    REVIEW -->|Sim| BOUNCE{"Bounces no<br/>mesmo trecho ≥ 2?"}

    BOUNCE -->|Não| ATTEMPT
    BOUNCE -->|Sim| MANUAL["🛑 Marca como:<br/>'Requer intervenção manual'<br/>+ Notifica Dev"]

    style DONE fill:#417505,color:#fff
    style ESCALATE fill:#D0021B,color:#fff
    style MANUAL fill:#D0021B,color:#fff
```

**Regras de proteção:**

| Regra | Limite | Ação |
|-------|--------|------|
| Tentativas de correção por comentário | 3 | Escala para Dev |
| Bounces no mesmo trecho de código | 2 | Marca como manual |
| Commits automáticos por PR | 10 | Congela PR + alerta |
| Tempo total de correção por PR | 1 hora | Congela PR + alerta |

---

## 5.6 Memória Persistente

O Feedback Loop alimenta uma **base de conhecimento persistente** que melhora a qualidade do código gerado ao longo do tempo.

```mermaid
graph TB
    subgraph "Curto Prazo (por PR)"
        ST1["Comentários do PR atual"]
        ST2["Contexto do endpoint"]
    end

    subgraph "Médio Prazo (por projeto)"
        MT1["Skills geradas<br/>de padrões recorrentes"]
        MT2["Preferências do time<br/>(Carbon, Eloquent, etc.)"]
    end

    subgraph "Longo Prazo (base global)"
        LT1["Regras de arquitetura"]
        LT2["Padrões de segurança"]
        LT3["Convenções de nomenclatura"]
    end

    ST1 --> MT1
    ST2 --> MT2
    MT1 --> LT1
    MT2 --> LT2

    LT1 --> LLM["🤖 LLM"]
    LT2 --> LLM
    LT3 --> LLM
    MT1 --> LLM
    MT2 --> LLM
    ST1 --> LLM
    ST2 --> LLM

    style ST1 fill:#4A90D9,color:#fff
    style MT1 fill:#F5A623,color:#fff
    style LT1 fill:#417505,color:#fff
    style LLM fill:#7B68EE,color:#fff
```

### Evolução da Qualidade ao Longo do Tempo

```mermaid
graph LR
    subgraph "Semana 1"
        W1["IA gera código básico<br/>Muitos comentários de review<br/>5+ correções por PR"]
    end

    subgraph "Semana 4"
        W4["IA segue padrões do time<br/>Comentários menores<br/>2-3 correções por PR"]
    end

    subgraph "Semana 12"
        W12["IA domina convenções<br/>Reviews quase automáticos<br/>0-1 correções por PR"]
    end

    W1 -->|"Skills acumuladas"| W4
    W4 -->|"Skills refinadas"| W12

    style W1 fill:#D0021B,color:#fff
    style W4 fill:#F5A623,color:#fff
    style W12 fill:#417505,color:#fff
```

> Com o tempo, a IA se torna um reflexo das preferências e padrões do time. Cada comentário de code review é uma micro-lição que melhora todas as gerações futuras.
