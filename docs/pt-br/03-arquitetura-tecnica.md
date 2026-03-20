# 3. Arquitetura Técnica

## 3.1 Visão de Alto Nível

```mermaid
graph TB
    subgraph "Camada Externa"
        FE["Frontend / Client"]
    end

    subgraph "Camada de Entrada"
        GW["Gateway Orquestrador<br/>(PHP)"]
    end

    subgraph "Camada de Decisão"
        REDIS["Redis<br/>(Route Cache)"]
        VDB["Vector DB<br/>(Semantic Cache)"]
    end

    subgraph "Camada de Geração"
        LLM["LLM<br/>(Claude / GPT)"]
        MCP["MCP Connectors"]
        SKILLS["Skills Store<br/>(Rules DDD)"]
        SPECS["Specs Store<br/>(Contratos)"]
    end

    subgraph "Camada de Validação"
        SANDBOX["Sandbox<br/>(Isolated Runtime)"]
        LINTER["Linter / SAST"]
    end

    subgraph "Camada de Persistência"
        DB[("Database<br/>(MySQL/PostgreSQL)")]
        FS["File System<br/>(/generated/)"]
        GIT["Git Repository"]
    end

    subgraph "Camada de Feedback"
        GH["GitHub/GitLab<br/>Webhooks"]
        HOOK["Feedback Loop<br/>Handler"]
    end

    FE -->|"POST /endpoint"| GW
    GW --> REDIS
    GW --> VDB
    REDIS -->|"Cache Hit"| FS
    FS -->|"include()"| GW
    REDIS -->|"Cache Miss"| LLM
    LLM --> MCP
    LLM --> SKILLS
    LLM --> SPECS
    MCP --> DB
    LLM --> SANDBOX
    SANDBOX --> LINTER
    SANDBOX -->|"Aprovado"| FS
    SANDBOX -->|"Aprovado"| GIT
    GIT --> GH
    GH --> HOOK
    HOOK -->|"Feedback"| LLM
    GW -->|"Response"| FE

    style GW fill:#4A90D9,color:#fff
    style REDIS fill:#D94A4A,color:#fff
    style LLM fill:#7B68EE,color:#fff
    style SANDBOX fill:#F5A623,color:#fff
    style GIT fill:#333,color:#fff
```

---

## 3.2 Componentes Principais

### 3.2.1 Gateway Orquestrador (PHP)

O ponto de entrada único do sistema. Toda request HTTP passa por ele.

```mermaid
flowchart TD
    REQ["HTTP Request"] --> GW["index.php<br/>(Gateway)"]
    GW --> PARSE["Parse Request<br/>método + path + payload"]
    PARSE --> HASH["Gera hash de rota<br/>METHOD:PATH:PAYLOAD_KEYS"]
    HASH --> LOOKUP["Consulta Redis"]

    LOOKUP --> HIT{"Cache Hit?"}
    HIT -->|"Sim"| INCLUDE["include() do PHP gerado"]
    HIT -->|"Não"| SEMANTIC["Consulta Semantic Cache"]

    SEMANTIC --> SHIT{"Similar encontrado?"}
    SHIT -->|"Sim"| ADAPT["Adapta código existente"]
    SHIT -->|"Não"| LLM["Aciona LLM"]

    INCLUDE --> RESP["HTTP Response"]
    ADAPT --> RESP
    LLM --> SANDBOX["Sandbox + Validação"]
    SANDBOX --> SAVE["Salva + Registra no Redis"]
    SAVE --> RESP

    style GW fill:#4A90D9,color:#fff
    style LLM fill:#7B68EE,color:#fff
    style SANDBOX fill:#F5A623,color:#fff
    style INCLUDE fill:#417505,color:#fff
```

**Responsabilidades:**
- Receber **todas** as requests HTTP
- Gerar o hash de roteamento (`METHOD:PATH:PAYLOAD_STRUCTURE`)
- Consultar Redis para decisão de roteamento
- Executar `include()` do código nativo quando disponível
- Acionar a LLM quando necessário
- Retornar a response ao client

**Decisão de roteamento:**

| Cenário | Ação | Latência |
|---------|------|----------|
| Redis tem rota → arquivo PHP existe | `include()` direto | ~15ms |
| Redis tem rota → Semantic Cache similar | Adapta código existente | ~1-3s |
| Redis vazio → nenhum código existe | Aciona LLM completa | ~5-15s |

---

### 3.2.2 Cache de Roteamento (Redis)

O Redis é o **cérebro de decisão rápida** do sistema. Ele mantém um mapa de rotas para arquivos PHP gerados.

```mermaid
graph LR
    subgraph "Estrutura de Chaves no Redis"
        K1["api:v1:POST:/user<br/>→ /generated/hot/create_user.php"]
        K2["api:v1:GET:/user/:id<br/>→ /generated/shadow/get_user.php"]
        K3["api:v1:POST:/order<br/>→ null (Cold)"]
    end

    subgraph "Metadados por Rota"
        M1["status: hot | staging | cold"]
        M2["version: 3"]
        M3["schema_hash: a1b2c3"]
        M4["rollout_pct: 100"]
        M5["created_at: 2026-03-20"]
        M6["error_count: 0"]
    end

    K1 --- M1
    K1 --- M2
    K1 --- M3
    K1 --- M4

    style K1 fill:#417505,color:#fff
    style K2 fill:#F5A623,color:#fff
    style K3 fill:#4A90D9,color:#fff
```

**Estrutura de dados no Redis (por rota):**

```json
{
  "key": "api:v1:POST:/user",
  "file": "/generated/hot/create_user_v3.php",
  "status": "hot",
  "version": 3,
  "schema_hash": "a1b2c3d4e5",
  "rollout_pct": 100,
  "created_at": "2026-03-20T14:30:00Z",
  "promoted_at": "2026-03-20T16:45:00Z",
  "error_count_24h": 0
}
```

**Invalidação de Cache:**

O `schema_hash` é um hash do schema do banco de dados. Quando uma migração altera o schema, o hash muda e **todas as rotas são invalidadas**, forçando a IA a regenerar o código com o schema atualizado.

```mermaid
flowchart LR
    MIG["DB Migration"] --> HASH["Novo schema_hash"]
    HASH --> COMPARE{"Hash mudou?"}
    COMPARE -->|"Sim"| INVALIDATE["Invalida rotas<br/>afetadas no Redis"]
    COMPARE -->|"Não"| NOOP["Nada muda"]
    INVALIDATE --> COLD["Rotas voltam<br/>para Cold"]

    style MIG fill:#D0021B,color:#fff
    style INVALIDATE fill:#F5A623,color:#fff
    style COLD fill:#4A90D9,color:#fff
```

---

### 3.2.3 Semantic Cache (Vector DB)

Complementa o Redis com busca por **similaridade semântica**, não por igualdade exata.

```mermaid
graph TD
    subgraph "Sem Semantic Cache"
        A1["POST /user {email, pass}"] --> A2["Cache Hit ✅"]
        A3["POST /user {email, password}"] --> A4["Cache Miss ❌"]
        A5["POST /register {email, pass}"] --> A6["Cache Miss ❌"]
    end

    subgraph "Com Semantic Cache"
        B1["POST /user {email, pass}"] --> B2["Hit Exato ✅"]
        B3["POST /user {email, password}"] --> B4["Hit Semântico ✅<br/>Similaridade: 0.95"]
        B5["POST /register {email, pass}"] --> B6["Hit Semântico ✅<br/>Similaridade: 0.89"]
    end

    style A4 fill:#D0021B,color:#fff
    style A6 fill:#D0021B,color:#fff
    style B2 fill:#417505,color:#fff
    style B4 fill:#417505,color:#fff
    style B6 fill:#417505,color:#fff
```

**Quando é útil:**
- Quando o frontend muda levemente a estrutura do payload
- Quando endpoints diferentes representam a mesma intenção
- Para evitar chamadas desnecessárias à LLM

---

### 3.2.4 MCP Connectors

Os **Model Context Protocol Connectors** são a ponte entre a LLM e a infraestrutura real. Eles permitem que a IA "enxergue" o ambiente sem que o Dev precise descrever tudo manualmente.

```mermaid
graph TB
    LLM["LLM"] --> MCP["MCP Hub"]

    MCP --> DB_MCP["DB Connector"]
    MCP --> QUEUE_MCP["Queue Connector"]
    MCP --> EXT_MCP["External API Connector"]
    MCP --> CACHE_MCP["Cache Connector"]

    DB_MCP --> DB_INFO["• Tabelas e colunas<br/>• Tipos de dados<br/>• Relacionamentos<br/>• Índices"]
    QUEUE_MCP --> Q_INFO["• Filas disponíveis<br/>• Formato de mensagem<br/>• Consumers ativos"]
    EXT_MCP --> E_INFO["• Endpoints externos<br/>• Autenticação<br/>• Rate limits"]
    CACHE_MCP --> C_INFO["• Chaves existentes<br/>• TTLs<br/>• Políticas de eviction"]

    style LLM fill:#7B68EE,color:#fff
    style MCP fill:#4A90D9,color:#fff
```

**Exemplo — DB Connector expõe para a LLM:**

```json
{
  "table": "users",
  "columns": [
    {"name": "id", "type": "uuid", "primary": true},
    {"name": "email", "type": "varchar(255)", "unique": true, "nullable": false},
    {"name": "password_hash", "type": "varchar(255)", "nullable": false},
    {"name": "created_at", "type": "timestamp", "default": "CURRENT_TIMESTAMP"}
  ],
  "indexes": ["idx_users_email"],
  "relations": [
    {"table": "orders", "type": "hasMany", "foreign_key": "user_id"}
  ]
}
```

Isso evita que a IA **alucine** nomes de colunas ou tente criar campos inexistentes.

---

### 3.2.5 Skills Store (Regras de Arquitetura)

As Skills são regras que a LLM **obrigatoriamente** segue ao gerar código. Elas garantem consistência arquitetural.

```mermaid
graph LR
    subgraph "Skills Obrigatórias"
        S1["🏗️ DDD Structure<br/>Controller → Service → Repository"]
        S2["🔒 Security<br/>PDO Prepared Statements only"]
        S3["✅ Validation<br/>Input sanitization obrigatória"]
        S4["📦 Dependency Injection<br/>Nunca instanciar DB diretamente"]
        S5["🧪 Testing<br/>Gerar PHPUnit para cada Service"]
    end

    LLM["LLM"] --> S1
    LLM --> S2
    LLM --> S3
    LLM --> S4
    LLM --> S5

    style LLM fill:#7B68EE,color:#fff
```

**Exemplo de Skill (`skills/ddd-structure.md`):**

```markdown
## Regra: Estrutura DDD Obrigatória

Todo código gerado DEVE seguir esta estrutura:

1. **Controller**: Recebe a request, valida input, delega para o Service
2. **Service**: Contém a lógica de negócio, chama o Repository
3. **Repository**: Única camada que toca o banco de dados

Proibições:
- NUNCA use eval(), exec(), system()
- NUNCA concatene strings em queries SQL
- NUNCA acesse $_POST ou $_GET diretamente — use o objeto Request injetado
- NUNCA instancie PDO — use o $db injetado pelo container
```

---

### 3.2.6 Feedback Loop Handler

Serviço que observa comentários em PRs do GitHub/GitLab e retroalimenta a LLM.

```mermaid
sequenceDiagram
    participant Dev as Dev Backend
    participant GH as GitHub
    participant Hook as Webhook Handler
    participant LLM as LLM
    participant Git as Git

    Dev->>GH: Comenta no PR:<br/>"Use Carbon para datas"
    GH->>Hook: Webhook (comment event)
    Hook->>Hook: Extrai contexto:<br/>arquivo + linha + comentário
    Hook->>LLM: Prompt de correção com contexto completo
    LLM->>LLM: Gera código corrigido
    LLM->>Git: git commit --fixup
    Git->>GH: Push para branch do PR
    GH->>Dev: Notificação: "IA corrigiu"

    Note over Hook,LLM: Se o comentário se repete 3+ vezes,<br/>cria uma nova Skill automática
```

---

## 3.3 Estrutura de Diretórios

```mermaid
graph TD
    ROOT["📁 ssab/"] --> SRC["📁 src/"]
    ROOT --> GEN["📁 generated/"]
    ROOT --> SPECS_DIR["📁 specs/"]
    ROOT --> SKILLS_DIR["📁 skills/"]
    ROOT --> TESTS["📁 tests/"]

    SRC --> DOMAIN["📁 Domain/<br/>Entities, Value Objects"]
    SRC --> APP["📁 Application/<br/>Services, Use Cases"]
    SRC --> INFRA["📁 Infrastructure/<br/>Repositories, MCP"]
    SRC --> GW_DIR["📁 Gateway/<br/>index.php, Router"]

    GEN --> SHADOW["📁 shadow/<br/>Código em staging"]
    GEN --> HOT["📁 hot/<br/>Código promovido"]

    SPECS_DIR --> SPEC1["📄 post_user.json"]
    SPECS_DIR --> SPEC2["📄 get_orders.json"]

    SKILLS_DIR --> SK1["📄 ddd-structure.md"]
    SKILLS_DIR --> SK2["📄 security-rules.md"]
    SKILLS_DIR --> SK3["📄 naming-conventions.md"]

    style GEN fill:#F5A623,color:#fff
    style HOT fill:#417505,color:#fff
    style SHADOW fill:#4A90D9,color:#fff
    style SKILLS_DIR fill:#7B68EE,color:#fff
```

```
ssab/
├── src/
│   ├── Domain/
│   │   └── Entities/           # Entidades do domínio
│   ├── Application/
│   │   └── Services/           # Lógica de negócio
│   ├── Infrastructure/
│   │   ├── Repositories/       # Acesso ao banco
│   │   └── MCP/                # Connectors MCP
│   └── Gateway/
│       ├── index.php           # Ponto de entrada único
│       └── Router.php          # Orquestrador de decisão
├── generated/
│   ├── shadow/                 # Código em staging (10% tráfego)
│   └── hot/                    # Código promovido (100% tráfego)
├── specs/
│   ├── post_user.json          # Contrato: criar usuário
│   └── get_orders.json         # Contrato: listar pedidos
├── skills/
│   ├── ddd-structure.md        # Regra: estrutura DDD
│   ├── security-rules.md       # Regra: segurança
│   └── naming-conventions.md   # Regra: nomenclatura
├── tests/
│   └── Unit/                   # Testes unitários (gerados pela IA)
└── docker-compose.yml          # Redis, DB, PHP
```

---

## 3.4 Stack Tecnológica

```mermaid
graph LR
    subgraph "Runtime"
        PHP["PHP 8.3+"]
        NGINX["Nginx"]
    end

    subgraph "Cache & Estado"
        REDIS["Redis 7+"]
        VECTOR["ChromaDB / Pinecone<br/>(Semantic Cache)"]
    end

    subgraph "IA"
        CLAUDE["Claude 4 / GPT-4o"]
        MCP_PROTO["MCP Protocol"]
    end

    subgraph "Banco de Dados"
        PGSQL["PostgreSQL 16+"]
    end

    subgraph "CI/CD"
        GIT_HUB["GitHub"]
        ACTIONS["GitHub Actions"]
        DOCKER["Docker"]
    end

    NGINX --> PHP
    PHP --> REDIS
    PHP --> VECTOR
    PHP --> CLAUDE
    CLAUDE --> MCP_PROTO
    MCP_PROTO --> PGSQL
    PHP --> PGSQL
    PHP --> GIT_HUB
    GIT_HUB --> ACTIONS

    style PHP fill:#777BB3,color:#fff
    style REDIS fill:#D94A4A,color:#fff
    style CLAUDE fill:#7B68EE,color:#fff
    style PGSQL fill:#336791,color:#fff
```

| Componente | Tecnologia | Justificativa |
|-----------|-----------|---------------|
| **Gateway** | PHP 8.3+ | Runtime dinâmico, `include()` nativo, sem compilação |
| **Web Server** | Nginx | Reverse proxy + roteamento para `index.php` |
| **Route Cache** | Redis 7+ | Decisão de roteamento em <1ms |
| **Semantic Cache** | ChromaDB ou Pinecone | Busca por similaridade de intenções |
| **LLM** | Claude 4 / GPT-4o | Geração de código PHP de alta qualidade |
| **Infraestrutura** | MCP Protocol | Conexão IA ↔ infraestrutura |
| **Banco de Dados** | PostgreSQL 16+ | Robustez e suporte a transações |
| **Versionamento** | GitHub | PRs automáticos + webhooks |
| **CI/CD** | GitHub Actions | Validação automatizada de PRs |
| **Containers** | Docker | Isolamento da sandbox |
