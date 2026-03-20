# 3. Technical Architecture

## 3.1 High-Level View

The SSAB stack is organized in layers. Traffic flows from the client through the gateway, decision caches, and—when needed—generation and validation before touching persisted artifacts or closing the feedback loop.

```mermaid
flowchart TB
    subgraph External["External Layer"]
        FE["Frontend / Client"]
    end

    subgraph Entry["Entry Layer"]
        GW["Gateway Orchestrator<br/>(PHP)"]
    end

    subgraph Decision["Decision Layer"]
        REDIS["Redis<br/>Route Cache"]
        VDB["Vector DB<br/>Semantic Cache"]
    end

    subgraph Generation["Generation Layer"]
        LLM["LLM<br/>(Claude / GPT)"]
        MCP["MCP Connectors"]
        SKILLS["Skills Store<br/>(Architecture Rules)"]
        SPECS["Specs Store<br/>(Contracts)"]
    end

    subgraph Validation["Validation Layer"]
        SANDBOX["Sandbox<br/>(Isolated Runtime)"]
        LINTER["Linter / SAST"]
    end

    subgraph Persistence["Persistence Layer"]
        DB[("Database<br/>(MySQL / PostgreSQL)")]
        FS["File System<br/>(/generated/)"]
        GIT["Git Repository"]
    end

    subgraph Feedback["Feedback Layer"]
        VCS["GitHub / GitLab<br/>Webhooks"]
        HOOK["Feedback Loop Handler"]
    end

    FE <-->|"HTTP"| GW

    GW --> REDIS
    GW --> VDB
    REDIS -->|"route → file path"| FS
    VDB -->|"similar intent + score"| GW
    GW -->|"include() on hit"| FS
    FS -->|"executed handler"| GW

    GW -->|"cache miss / cold"| LLM
    LLM --> MCP
    LLM --> SKILLS
    LLM --> SPECS
    MCP --> DB
    SPECS --> LLM
    SPECS --> SANDBOX

    LLM --> SANDBOX
    SANDBOX --> LINTER
    SANDBOX --> DB
    LINTER --> SANDBOX

    SANDBOX -->|"approved"| FS
    SANDBOX -->|"approved"| GIT
    SANDBOX -->|"register route + metadata"| REDIS

    GIT --> VCS
    VCS --> HOOK
    HOOK -->|"PR comment context"| LLM
    HOOK --> SKILLS

    GW --> DB
    GW -->|"response"| FE

    style GW fill:#4A90D9,color:#fff
    style REDIS fill:#D94A4A,color:#fff
    style VDB fill:#9B59B6,color:#fff
    style LLM fill:#7B68EE,color:#fff
    style SANDBOX fill:#F5A623,color:#fff
    style GIT fill:#333,color:#fff
```

**Reading the graph:** the **Decision Layer** chooses between native PHP (`include`), semantic adaptation, or full LLM synthesis. The **Generation Layer** is only on the slow path but is constrained by **Specs** and **Skills**, grounded by **MCP** against real infrastructure. **Validation** gates promotion into **Persistence**; **Feedback** can steer the model and even mint new **Skills** after repeated human signals.

---

## 3.2 Main Components

### 3.2.1 Gateway Orchestrator (PHP)

The gateway is the **single entry point**: every HTTP request is normalized, hashed for routing, and resolved against caches before any generated code runs.

```mermaid
flowchart TD
    REQ["HTTP Request"] --> IDX["index.php"]
    IDX --> PARSE["Parse<br/>method + path + payload"]
    PARSE --> HASH["Route hash<br/>METHOD:PATH:PAYLOAD_KEYS"]
    HASH --> RLOOKUP["Redis lookup"]

    RLOOKUP --> HIT{"Cache hit?"}
    HIT -->|"Yes"| INC["include()<br/>generated PHP"]
    HIT -->|"No"| SEM["Semantic cache<br/>(Vector DB)"]

    SEM --> SIM{"Similar<br/>found?"}
    SIM -->|"Yes"| ADAPT["Adapt existing<br/>handler / template"]
    SIM -->|"No"| LLM["Call LLM<br/>+ Specs + Skills + MCP"]

    LLM --> SB["Sandbox<br/>+ validation"]
    SB --> SAVE["Save artifact<br/>+ register Redis"]

    INC --> RESP["HTTP Response"]
    SAVE --> RESP
    ADAPT --> RESP

    style IDX fill:#4A90D9,color:#fff
    style LLM fill:#7B68EE,color:#fff
    style SB fill:#F5A623,color:#fff
    style INC fill:#417505,color:#fff
```

**Routing decision table**

| Scenario | Action | Typical latency |
|----------|--------|-----------------|
| Redis hit **and** generated file exists | `include()` native handler | ~15ms |
| Redis hit **and** semantically similar route/handler | Adapt / patch from nearest neighbor | ~1–3s |
| Redis empty / cold (no trustworthy mapping) | Full LLM synthesis + sandbox | ~5–15s |

---

### 3.2.2 Route Cache (Redis)

Redis is the **fast brain** for routing: it maps a canonical route identity to a concrete PHP file, rollout flags, and freshness metadata (including schema alignment).

```mermaid
flowchart LR
    subgraph Keys["Redis key → file mapping"]
        K1["api:v1:POST:/user"]
        F1["/generated/hot/create_user.php<br/>status: hot"]
        K2["api:v1:GET:/user/:id"]
        F2["/generated/shadow/get_user.php<br/>status: staging"]
        K3["api:v1:POST:/order"]
        F3["null<br/>status: cold"]
    end

    K1 --> F1
    K2 --> F2
    K3 --> F3

    style F1 fill:#417505,color:#fff
    style F2 fill:#F5A623,color:#fff
    style F3 fill:#4A90D9,color:#fff
```

**Example JSON document** (logical shape stored or derived from Redis fields):

```json
{
  "key": "api:v1:POST:/user",
  "file": "/generated/hot/create_user.php",
  "status": "hot",
  "version": 3,
  "schema_hash": "a1b2c3d4e5",
  "rollout_pct": 100,
  "created_at": "2026-03-20T14:30:00Z",
  "promoted_at": "2026-03-20T16:45:00Z",
  "error_count_24h": 0
}
```

**Cache invalidation when the database schema changes**

`schema_hash` fingerprints the **live DB schema** relevant to a route. When a migration runs, the hash shifts; any route whose cached code assumed the old schema must return to **cold** until regenerated.

```mermaid
flowchart TD
    MIG["DB migration<br/>applied"] --> NEWH["Compute new<br/>schema_hash"]
    NEWH --> DIFF{"schema_hash<br/>changed?"}
    DIFF -->|"No"| OK["Keep Redis entries"]
    DIFF -->|"Yes"| INV["Invalidate affected<br/>route entries"]
    INV --> COLD["Mark routes cold /<br/>delete file pointers"]
    COLD --> NEXT["Next request:<br/>miss → LLM + sandbox"]

    style MIG fill:#D0021B,color:#fff
    style INV fill:#F5A623,color:#fff
    style COLD fill:#4A90D9,color:#fff
```

---

### 3.2.3 Semantic Cache (Vector DB)

The vector store complements Redis: it matches **intent and payload shape** under similarity, not exact string equality of keys.

```mermaid
flowchart TB
    subgraph Without["Without semantic cache (exact keys only)"]
        W1["POST /user<br/>{ email, pass }"] --> WH1["Hit ✅"]
        W2["POST /user<br/>{ email, password }"] --> WM1["Miss ❌"]
        W3["POST /register<br/>{ email, pass }"] --> WM2["Miss ❌"]
    end

    subgraph With["With semantic cache (similarity)"]
        S1["POST /user<br/>{ email, pass }"] --> SH1["Hit<br/>score 1.00"]
        S2["POST /user<br/>{ email, password }"] --> SH2["Hit<br/>score 0.95"]
        S3["POST /register<br/>{ email, pass }"] --> SH3["Hit<br/>score 0.89"]
    end

    style WM1 fill:#D0021B,color:#fff
    style WM2 fill:#D0021B,color:#fff
    style SH1 fill:#417505,color:#fff
    style SH2 fill:#417505,color:#fff
    style SH3 fill:#417505,color:#fff
```

**When it helps:** renamed JSON fields, near-duplicate endpoints, and evolving clients that keep the same business intent with slightly different shapes—without paying full LLM cost every time.

---

### 3.2.4 MCP Connectors

**Model Context Protocol** connectors are the bridge between the LLM and real infrastructure. They let the model **read** environment truth (schemas, queues, external APIs, cache layout) instead of guessing.

```mermaid
flowchart TB
    LLM["LLM"] --> HUB["MCP Hub"]

    HUB --> DBC["DB Connector"]
    HUB --> QC["Queue Connector"]
    HUB --> EXT["External API Connector"]
    HUB --> CC["Cache Connector"]

    DBC --> DI["Tables, columns, types<br/>relationships, indexes"]
    QC --> QI["Queues, message shape<br/>consumers / policies"]
    EXT --> EI["Endpoints, auth<br/>rate limits, errors"]
    CC --> CI["Existing keys, TTLs<br/>namespaces"]

    style LLM fill:#7B68EE,color:#fff
    style HUB fill:#4A90D9,color:#fff
```

**Example: DB Connector payload** exposing a `users` table to the model:

```json
{
  "table": "users",
  "columns": [
    { "name": "id", "type": "uuid", "primary": true },
    { "name": "email", "type": "varchar(255)", "unique": true, "nullable": false },
    { "name": "password_hash", "type": "varchar(255)", "nullable": false },
    { "name": "created_at", "type": "timestamp", "default": "CURRENT_TIMESTAMP" }
  ],
  "indexes": ["idx_users_email"],
  "relations": [
    { "table": "orders", "type": "hasMany", "foreign_key": "user_id" }
  ]
}
```

---

### 3.2.5 Skills Store (Architecture Rules)

Skills are **non-negotiable rules** the LLM must follow when emitting PHP: structure, security, validation, DI, and testing expectations.

```mermaid
flowchart LR
    LLM["LLM"]

    LLM --> S1["Skill: DDD structure"]
    LLM --> S2["Skill: Security<br/>(PDO only)"]
    LLM --> S3["Skill: Validation<br/>(input sanitization)"]
    LLM --> S4["Skill: Dependency injection<br/>(never new DB)"]
    LLM --> S5["Skill: Testing<br/>(PHPUnit)"]

    style LLM fill:#7B68EE,color:#fff
```

**Example skill file** (`skills/ddd-structure.md`):

```markdown
## Rule: Mandatory DDD layout

All generated code MUST follow:

1. **Controller** — Accept the request, validate input, delegate to the service.
2. **Service** — Business logic; orchestrates repositories and domain rules.
3. **Repository** — The only layer that talks to the database.

Forbidden:

- NEVER use `eval()`, `exec()`, `system()`, or shell escapes.
- NEVER concatenate user input into SQL — use prepared statements only.
- NEVER read `$_GET` / `$_POST` directly — use an injected Request object.
- NEVER instantiate `PDO` inside handlers — inject the DB connection from the container.
```

---

### 3.2.6 Feedback Loop Handler

A service listens to **PR review comments** on GitHub/GitLab, packages file/line/comment context, and drives corrective generations. Repeated patterns can be promoted into **new Skills**.

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub/GitLab
    participant WH as Webhook Handler
    participant LLM as LLM
    participant Git as Git

    Dev->>GH: PR comment<br/>(file + line + text)
    GH->>WH: Webhook event
    WH->>WH: Extract context<br/>(path, diff hunks, thread)
    WH->>LLM: Fix prompt + spec excerpt + skills
    LLM->>Git: Commit fixup / patch branch
    Git->>GH: Push to PR branch
    GH->>Dev: Notification

    Note over WH,LLM: If the same issue is repeated 3+ times,<br/>auto-create a new Skill from the thread.
```

---

## 3.3 Directory Structure

```mermaid
flowchart TD
    ROOT["ssab/"] --> SRC["src/"]
    ROOT --> GEN["generated/"]
    ROOT --> SPECS["specs/"]
    ROOT --> SKILLS["skills/"]
    ROOT --> TESTS["tests/"]
    ROOT --> DC["docker-compose.yml"]

    SRC --> DOM["Domain/<br/>Entities"]
    SRC --> APP["Application/<br/>Services"]
    SRC --> INF["Infrastructure/<br/>Repositories + MCP"]
    SRC --> GWD["Gateway/<br/>index.php, Router.php"]

    GEN --> SH["shadow/"]
    GEN --> HOT["hot/"]

    SPECS --> SP1["post_user.json"]
    SPECS --> SP2["get_orders.json"]

    SKILLS --> SK1["ddd-structure.md"]
    SKILLS --> SK2["security-rules.md"]
    SKILLS --> SK3["naming-conventions.md"]

    TESTS --> U["Unit/"]

    style GEN fill:#F5A623,color:#fff
    style HOT fill:#417505,color:#fff
    style SH fill:#4A90D9,color:#fff
    style SKILLS fill:#7B68EE,color:#fff
```

**Text tree**

```
ssab/
├── src/
│   ├── Domain/
│   │   └── Entities/
│   ├── Application/
│   │   └── Services/
│   ├── Infrastructure/
│   │   ├── Repositories/
│   │   └── MCP/
│   └── Gateway/
│       ├── index.php
│       └── Router.php
├── generated/
│   ├── shadow/
│   └── hot/
├── specs/
│   ├── post_user.json
│   └── get_orders.json
├── skills/
│   ├── ddd-structure.md
│   ├── security-rules.md
│   └── naming-conventions.md
├── tests/
│   └── Unit/
└── docker-compose.yml
```

---

## 3.4 Technology Stack

```mermaid
flowchart TB
    subgraph Runtime["Runtime"]
        PHP["PHP 8.3+"]
        NGINX["Nginx"]
    end

    subgraph CacheState["Cache & state"]
        REDIS["Redis 7+"]
        VEC["ChromaDB / Pinecone"]
    end

    subgraph AI["AI"]
        MODELS["Claude 4 / GPT-4o"]
        MCP["MCP protocol"]
    end

    subgraph Data["Database"]
        PG["PostgreSQL 16+"]
    end

    subgraph CICD["CI/CD"]
        GH["GitHub"]
        GHA["GitHub Actions"]
        DOCKER["Docker"]
    end

    NGINX --> PHP
    PHP --> REDIS
    PHP --> VEC
    PHP --> MODELS
    MODELS --> MCP
    PHP --> PG
    MCP --> PG
    PHP --> DOCKER
    GH --> GHA

    style PHP fill:#777BB3,color:#fff
    style REDIS fill:#D94A4A,color:#fff
    style MODELS fill:#7B68EE,color:#fff
    style PG fill:#336791,color:#fff
```

| Component | Technology | Justification |
|-----------|------------|---------------|
| Gateway / runtime | PHP 8.3+ | Native `include()` for hot paths, mature ecosystem, fast iteration |
| Web server | Nginx | Reverse proxy, static offload, upstream to PHP-FPM |
| Route cache | Redis 7+ | Sub-millisecond lookups, TTLs, atomic metadata updates |
| Semantic cache | ChromaDB or Pinecone | Embedding search for near-duplicate intents and payloads |
| LLM | Claude 4 / GPT-4o | Strong structured codegen with tool/MCP use |
| Infra grounding | MCP | Standardized, least-privilege context to DB, queues, HTTP, cache |
| Primary database | PostgreSQL 16+ | ACID, constraints, migrations, great PHP driver story |
| Version control & review | GitHub / GitLab | PRs, webhooks, audit trail for generated code |
| Automation | GitHub Actions | Lint, tests, sandbox image builds, promotion gates |
| Isolation | Docker | Ephemeral sandbox containers, reproducible dev/prod parity |
