# 7. Próximos Passos — Roadmap de Implementação

## 7.1 Fases do Projeto

O SSAB deve ser construído de forma incremental. Cada fase entrega valor independente e valida a viabilidade da próxima.

```mermaid
timeline
    title Roadmap SSAB
    section Fase 0 — Fundação
        Semana 1-2 : Gateway PHP (index.php)
                   : Integração Redis básica
                   : Estrutura de diretórios DDD
    section Fase 1 — PoC de Geração
        Semana 3-4 : Integração com LLM (Claude/GPT)
                   : Primeira Spec → código gerado
                   : Sandbox básica (transação + rollback)
    section Fase 2 — Validação
        Semana 5-6 : MCP Connectors (DB Schema)
                   : Skills Engine
                   : Pipeline de testes automatizados
    section Fase 3 — CI/CD
        Semana 7-8 : PR automático no GitHub
                   : Webhook de feedback
                   : Rollout gradual (10% → 100%)
    section Fase 4 — Evolução
        Semana 9-12 : Analisador de padrões
                    : Geração automática de Skills
                    : Semantic Cache (Vector DB)
                    : Dashboard de monitoramento
```

---

## 7.2 Fase 0 — Fundação (Semanas 1-2)

O objetivo é criar o esqueleto da aplicação: o Gateway que recebe requests e consulta o Redis.

```mermaid
flowchart TD
    START["Início"] --> A["Criar estrutura de diretórios"]
    A --> B["Configurar Docker Compose<br/>(PHP + Redis + PostgreSQL)"]
    B --> C["Implementar index.php<br/>(Gateway Orquestrador)"]
    C --> D["Implementar Router.php<br/>(consulta Redis → include())"]
    D --> E["Criar primeiro arquivo<br/>de Spec (post_user.json)"]
    E --> F["Teste manual:<br/>Cache Miss → retorna 501<br/>Cache Hit → executa PHP"]

    style START fill:#4A90D9,color:#fff
    style F fill:#417505,color:#fff
```

### Entregáveis

| Entregável | Descrição |
|-----------|-----------|
| `docker-compose.yml` | PHP 8.3 + Redis 7 + PostgreSQL 16 |
| `src/Gateway/index.php` | Ponto de entrada único |
| `src/Gateway/Router.php` | Consulta Redis, decide include() ou erro |
| `specs/post_user.json` | Primeira Spec de exemplo |
| `skills/ddd-structure.md` | Skill base de DDD |

### Critério de Sucesso
- Request `POST /user` chega ao Gateway
- Gateway consulta Redis → Cache Miss → retorna HTTP 501 "Not Yet Synthesized"
- Manualmente inserir rota no Redis → Cache Hit → `include()` executa PHP → retorna JSON

---

## 7.3 Fase 1 — PoC de Geração (Semanas 3-4)

Conectar a LLM ao Gateway. A primeira geração de código end-to-end.

```mermaid
flowchart TD
    A["Cache Miss detectado"] --> B["Montar prompt com:<br/>• Request data<br/>• Spec file<br/>• Skills"]
    B --> C["Chamar API da LLM<br/>(Claude / GPT)"]
    C --> D["Receber código PHP"]
    D --> E["Salvar em /generated/shadow/"]
    E --> F["Registrar no Redis"]
    F --> G["Executar include() e retornar"]

    G --> H{"Próxima request<br/>mesmo endpoint"}
    H --> I["Cache Hit ✅<br/>include() direto<br/>LLM não é chamada"]

    style C fill:#7B68EE,color:#fff
    style I fill:#417505,color:#fff
```

### Entregáveis

| Entregável | Descrição |
|-----------|-----------|
| `src/Infrastructure/LLM/LLMClient.php` | Client para API da LLM |
| `src/Infrastructure/LLM/PromptBuilder.php` | Monta prompt com Spec + Skills |
| `src/Gateway/CodeGenerator.php` | Orquestra geração + salvamento |
| Primeiro código gerado pela IA | `generated/shadow/create_user.php` |

### Critério de Sucesso
- Request `POST /user` → Cache Miss → LLM gera PHP → Código salvo → Response 201
- Segunda request `POST /user` → Cache Hit → PHP nativo executa → Response 201 (sem LLM)
- Latência 1ª request: <15s | Latência 2ª request: <50ms

---

## 7.4 Fase 2 — Validação (Semanas 5-6)

Adicionar sandbox, MCP e testes automatizados. O código gerado passa a ser **validado antes de servir tráfego**.

```mermaid
flowchart TD
    A["LLM gera código"] --> B["Sandbox Container"]
    
    B --> C["BEGIN TRANSACTION"]
    C --> D["Executa código com<br/>mock input da Spec"]
    D --> E["Captura response"]
    E --> F{"Response ==<br/>Spec.expect?"}
    
    F -->|Sim| G["Verifica side-effects<br/>(db_assert)"]
    F -->|Não| H["ROLLBACK +<br/>Reenvia para LLM"]
    
    G --> I{"Side-effects<br/>corretos?"}
    I -->|Sim| J["ROLLBACK +<br/>Código APROVADO ✅"]
    I -->|Não| H
    
    J --> K["Linter (PHPStan)"]
    K --> L{"Passa?"}
    L -->|Sim| M["Salva em shadow/"]
    L -->|Não| H

    style J fill:#417505,color:#fff
    style H fill:#D0021B,color:#fff
```

### Entregáveis

| Entregável | Descrição |
|-----------|-----------|
| `src/Infrastructure/Sandbox/Runner.php` | Executa código em transação isolada |
| `src/Infrastructure/Sandbox/Validator.php` | Compara output vs Spec |
| `src/Infrastructure/MCP/DatabaseConnector.php` | Expõe schema do DB para a LLM |
| `skills/security-rules.md` | Regras de segurança obrigatórias |
| Pipeline de validação completo | Spec → LLM → Sandbox → Aprovação |

### Critério de Sucesso
- Código gerado que **passa** nos testes da Spec é salvo
- Código gerado que **falha** é reenviado para a LLM (até 3 tentativas)
- Após 3 falhas, alerta é enviado ao Dev
- MCP fornece schema do banco correto para a LLM

---

## 7.5 Fase 3 — CI/CD Automatizado (Semanas 7-8)

Integração com GitHub para PRs automáticos e feedback loop.

```mermaid
flowchart TD
    A["Código aprovado<br/>na Sandbox"] --> B["git init + add + commit"]
    B --> C["git push (branch ssab/auto)"]
    C --> D["gh pr create"]
    D --> E["Dev recebe notificação"]

    E --> F{"Dev review"}
    F -->|Aprova| G["Merge para main"]
    F -->|Comenta| H["Webhook captura"]
    H --> I["LLM processa feedback"]
    I --> J["Novo commit + push"]
    J --> F

    G --> K["Redis: rollout → 100%"]
    K --> L["Código promovido<br/>para /generated/hot/"]

    style D fill:#333,color:#fff
    style G fill:#417505,color:#fff
    style L fill:#417505,color:#fff
```

### Entregáveis

| Entregável | Descrição |
|-----------|-----------|
| `src/Infrastructure/Git/AutoCommitter.php` | Commit + push automático |
| `src/Infrastructure/Git/PRCreator.php` | Cria PR via GitHub API |
| `src/Infrastructure/Webhooks/ReviewHandler.php` | Processa comentários de PR |
| `src/Infrastructure/Webhooks/FeedbackProcessor.php` | Monta prompt de correção |
| GitHub Actions workflow | Validação automática do PR |

### Critério de Sucesso
- Código gerado aparece como PR no GitHub
- Dev comenta no PR → IA corrige e commita automaticamente
- Dev aprova PR → Redis atualiza rota → tráfego 100% para código nativo

---

## 7.6 Fase 4 — Evolução (Semanas 9-12)

O sistema se torna autônomo: aprende com feedback, sugere Skills, e otimiza o cache.

```mermaid
flowchart TD
    A["Comentários de<br/>Code Review"] --> B["Embedding +<br/>Clustering"]
    B --> C{"Padrão recorrente<br/>detectado?"}
    
    C -->|Sim| D["Gera draft<br/>de nova Skill"]
    C -->|Não| E["Armazena para<br/>análise futura"]
    
    D --> F["Notifica Dev"]
    F --> G{"Aprovado?"}
    G -->|Sim| H["Skill ativada<br/>para gerações futuras"]
    G -->|Não| I["Descartada"]

    J["Requests similares"] --> K["Vector DB<br/>(ChromaDB)"]
    K --> L{"Similaridade<br/>> 0.85?"}
    L -->|Sim| M["Reutiliza código<br/>existente"]
    L -->|Não| N["Gera novo<br/>via LLM"]

    style H fill:#417505,color:#fff
    style M fill:#417505,color:#fff
```

### Entregáveis

| Entregável | Descrição |
|-----------|-----------|
| `src/Infrastructure/Learning/PatternAnalyzer.php` | Detecta padrões em feedback |
| `src/Infrastructure/Learning/SkillGenerator.php` | Gera drafts de novas Skills |
| `src/Infrastructure/Cache/SemanticCache.php` | Integração com Vector DB |
| Dashboard de monitoramento | Status de endpoints, erros, Skills |

### Critério de Sucesso
- Sistema sugere nova Skill após detectar 3+ comentários similares
- Semantic Cache evita chamadas desnecessárias à LLM
- Dashboard mostra: endpoints Cold/Staging/Hot, taxa de aprovação, Skills ativas

---

## 7.7 Visão de Longo Prazo

```mermaid
graph LR
    subgraph "Hoje"
        A["1 Dev Backend<br/>escreve 3 CRUDs/dia"]
    end

    subgraph "Com SSAB (Mês 1)"
        B["1 Dev Backend + SSAB<br/>10 endpoints/dia<br/>(Dev foca em review)"]
    end

    subgraph "Com SSAB (Mês 6)"
        C["1 Dev Backend + SSAB maduro<br/>50+ endpoints/dia<br/>(IA domina padrões do time)"]
    end

    A --> B --> C

    style A fill:#D0021B,color:#fff
    style B fill:#F5A623,color:#fff
    style C fill:#417505,color:#fff
```

---

## 7.8 Checklist de PoC (Mínimo Viável)

Para validar a ideia com o mínimo esforço, o PoC precisa demonstrar:

- [ ] **Gateway recebe request** e consulta Redis
- [ ] **Cache Miss** aciona chamada à LLM
- [ ] **LLM gera código PHP** seguindo DDD (Service + Repository)
- [ ] **Código é salvo** em disco e registrado no Redis
- [ ] **Cache Hit** executa `include()` do PHP gerado (sem LLM)
- [ ] **Spec com mocks** valida o código antes de salvar
- [ ] **Demonstração de latência**: 1ª request ~10s, 2ª request ~15ms

```mermaid
flowchart LR
    A["PoC funciona?"] -->|Sim| B["Validar com time"]
    B --> C["Investir nas fases 2-4"]
    A -->|Não| D["Ajustar abordagem<br/>ou pivotar"]

    style B fill:#417505,color:#fff
    style D fill:#F5A623,color:#fff
```

---

> *"A melhor forma de prever o futuro é construí-lo."* — Alan Kay
