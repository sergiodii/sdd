# 7. Next Steps — Implementation Roadmap

## 7.1 Project Phases

```mermaid
timeline
    title SSAB implementation roadmap (indicative)
    section Phase 0 — Foundation
        Week 1-2 : PHP Gateway
                 : Redis integration
                 : DDD directory structure
    section Phase 1 — Generation PoC
        Week 3-4 : LLM integration
                 : First Spec to code
                 : Basic sandbox
    section Phase 2 — Validation
        Week 5-6 : MCP connectors
                 : Skills engine
                 : Automated test pipeline
    section Phase 3 — CI/CD
        Week 7-8 : Auto PR on GitHub
                 : Feedback webhook
                 : Gradual rollout
    section Phase 4 — Evolution
        Week 9-12 : Pattern analyzer
                  : Auto Skill generation
                  : Semantic cache
                  : Monitoring dashboard
```

---

## 7.2 Phase 0 — Foundation (Weeks 1–2)

**Goal:** Application skeleton — a Gateway that receives HTTP requests and resolves endpoints via **Redis** before executing generated PHP.

```mermaid
flowchart TD
    START([Start]) --> DIR[Create DDD directory structure]
    DIR --> DC[Docker Compose:<br/>PHP + Redis + PostgreSQL]
    DC --> IDX[Implement index.php Gateway]
    IDX --> RTR[Implement Router.php:<br/>Redis key → include]
    RTR --> SPEC[Create first Spec:<br/>post_user.json]
    SPEC --> MAN{Manual test}
    MAN -->|Cache miss| E501[501 / not ready path]
    MAN -->|Cache hit| EXEC[Execute PHP handler]

    style EXEC fill:#c8e6c9
```

### Deliverables

| Deliverable | Description |
|-------------|-------------|
| Repo layout | DDD-friendly folders for domain, application, infrastructure |
| `docker-compose` | PHP, Redis, PostgreSQL (or chosen DB) running locally |
| Gateway | Parses request, looks up Redis registry |
| Router | On hit, `include()` safe path; on miss, explicit fallback |
| First Spec | `post_user.json` (or equivalent) for experiments |

### Success criteria

- Redis stores a mapping from **route key → file path** (or versioned artifact reference).
- **Miss** and **hit** behaviors are deterministic and logged.
- One happy-path include works end-to-end on a stub file.

---

## 7.3 Phase 1 — Generation PoC (Weeks 3–4)

**Goal:** Connect the LLM to the Gateway and complete the first **Spec → PHP** pipeline.

```mermaid
flowchart TD
    MISS[Cache miss] --> BP[Build prompt:<br/>request + Spec + Skills]
    BP --> API[Call LLM API]
    API --> PHP[Receive PHP code]
    PHP --> SHADOW[Save to /generated/shadow/]
    SHADOW --> REG[Register path in Redis]
    REG --> INC[include + return response]

    NEXT[Next request] --> HIT{Cache hit?}
    HIT -->|Yes| INC2[include direct — no LLM]
    HIT -->|No| MISS

    style INC fill:#c8e6c9
    style INC2 fill:#c8e6c9
```

### Deliverables

| Deliverable | Description |
|-------------|-------------|
| Prompt builder | Stable templates + versioning |
| Artifact writer | Writes shadow files atomically where possible |
| Registry write | Atomic Redis update after successful write |
| Metrics | Timings for first vs second request |

### Success criteria

- **First request:** generation + persist + execute **under ~15s** (environment-dependent).
- **Second request:** **under ~50ms** served from disk/include (no LLM).

---

## 7.4 Phase 2 — Validation (Weeks 5–6)

**Goal:** **Sandbox**, **MCP** connectors, and an automated test gate before shadow code is trusted.

```mermaid
flowchart TD
    GEN[LLM generates code] --> BOX[Sandbox container]
    BOX --> TX[BEGIN TRANSACTION]
    TX --> RUN[Execute with mock input]
    RUN --> CAP[Capture response]
    CAP --> EXP{response == Spec.expect?}
    EXP -->|No| LLM1[Send failure back to LLM]
    EXP -->|Yes| SIDE{Side-effects correct?}
    SIDE -->|No| LLM1
    SIDE -->|Yes| RB[ROLLBACK + mark APPROVED]
    RB --> LINT[PHPStan / linter]
    LINT --> LP{Passes?}
    LP -->|No| LLM1
    LP -->|Yes| SAVE[Save under shadow/]

    style SAVE fill:#c8e6c9
    style LLM1 fill:#fff9c4
```

### Deliverables

| Deliverable | Description |
|-------------|-------------|
| Sandbox image | Isolated DB / filesystem / network policy |
| Spec runner | Applies mocks, compares outputs |
| MCP layer | Connectors for internal docs, schemas, etc. |
| CI job | Lint + tests on every generation PR |

### Success criteria

- No promotion without **Spec expectation match** (or explicit waiver policy).
- Linter failures block registration in Redis.

---

## 7.5 Phase 3 — Automated CI/CD (Weeks 7–8)

**Goal:** GitHub automation for **auto PRs** and the **feedback loop** from review comments.

```mermaid
flowchart TD
    OK[Approved validated code] --> GIT[git init / add / commit]
    GIT --> PUSH[Push branch ssab/auto-*]
    PUSH --> PRC[gh pr create]
    PRC --> DEVN[Notify developer]
    DEVN --> REV{Review}
    REV -->|Approve + merge| MAIN[Merge to main]
    MAIN --> R100[Redis rollout 100%]
    R100 --> HOT[Promote to /generated/hot/]

    REV -->|PR comments| WH[Webhook to SSAB]
    WH --> LLM[LLM processes feedback]
    LLM --> NC[New commit on branch]
    NC --> REV

    style HOT fill:#c8e6c9
```

### Deliverables

| Deliverable | Description |
|-------------|-------------|
| Bot identity | PAT / GitHub App with least privilege |
| Branch policy | Naming, protection rules, required checks |
| Webhook service | Verifies signatures, idempotency |
| Rollout | Percentage flags or versioned Redis keys |

### Success criteria

- Every merged endpoint has **traceability** from Spec → PR → hot artifact.
- Comment-driven fixes produce **auditable** commits with caps (see Feedback Loop doc).

---

## 7.6 Phase 4 — Evolution (Weeks 9–12)

**Goal:** The system becomes more **autonomous**: learns from feedback, proposes Skills, and reuses similar implementations.

```mermaid
flowchart TB
    subgraph PathA["Learning path"]
        CR[Code review comments] --> EC[Embedding + clustering]
        EC --> PD{Pattern detected?}
        PD -->|Yes| DS[Draft new Skill]
        DS --> ND[Notify developer]
        ND --> AP{Approved?}
        AP -->|Yes| SA[Skill activated]
        AP -->|No| DIS[Discard]
    end

    subgraph PathB["Semantic reuse path"]
        REQ[Similar requests] --> VDB[Vector DB lookup]
        VDB --> SIM{Similarity > 0.85?}
        SIM -->|Yes| REUSE[Reuse / adapt existing code]
        SIM -->|No| GEN[Generate via LLM]
    end

    style SA fill:#c8e6c9
    style REUSE fill:#e3f2fd
```

### Deliverables

| Deliverable | Description |
|-------------|-------------|
| Pattern analyzer | Clustering + thresholds + human approval |
| Skill proposals | Draft YAML/JSON with diff preview |
| Semantic cache | Vector index of prompts / Specs / artifacts |
| Dashboard | Generation volume, failures, cost, latency |

### Success criteria

- Measurable **drop** in repeated review themes over several weeks.
- Safe defaults: **no auto-activate** Skills without explicit approval.

---

## 7.7 Long-Term Vision

```mermaid
flowchart LR
    T[Today:<br/>1 backend dev ≈ 3 CRUDs/day]
    M1[SSAB month 1:<br/>1 dev + SSAB ≈ 10 endpoints/day<br/>focus on review]
    M6[SSAB month 6:<br/>50+ endpoints/day mature patterns<br/>AI matches team style]

    T --> M1 --> M6

    style T fill:#ffcdd2
    style M1 fill:#fff9c4
    style M6 fill:#c8e6c9
```

*Rates are illustrative and depend on Spec quality, review bandwidth, and endpoint complexity.*

---

## 7.8 PoC Checklist (Minimum Viable)

- [ ] Gateway receives request and queries Redis.
- [ ] Cache miss triggers an LLM call.
- [ ] LLM generates PHP following the agreed DDD layout.
- [ ] Code is saved to disk and registered in Redis.
- [ ] Cache hit executes `include()` with **no** LLM.
- [ ] Spec with mocks validates code before persistence.
- [ ] Latency demo: **~10s** first request, **~15ms** second (typical local/staging).

```mermaid
flowchart TD
    Q{PoC meets checklist?}
    Q -->|Yes| TEAM[Validate with team]
    TEAM --> INV[Invest in phases 2–4]
    Q -->|No| ADJ[Adjust approach or pivot]

    style INV fill:#c8e6c9
    style ADJ fill:#fff9c4
```

> “The best way to predict the future is to build it.” — **Alan Kay**

---

*Week ranges assume one focused team and clear scope; adjust for compliance, multi-region rollout, and organizational approval gates.*
