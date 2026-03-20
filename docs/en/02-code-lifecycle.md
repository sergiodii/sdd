# 2. Code Lifecycle — The Promotion Funnel

Code in SSAB matures through a **three-phase funnel**: **Cold → Staging → Hot**. Each phase adds evidence that the synthesized PHP is correct, safe, and fast enough for full production traffic.

```mermaid
flowchart LR
    C["Cold<br/>AI generates"]
    S["Staging<br/>Sandbox + ~10% traffic"]
    H["Hot<br/>Native PHP 100%"]

    C --> S --> H
```

---

## 2.1 Phase A — Cold Start (Intent Ingestion)

**When it runs:** The first time an endpoint (or feature path) is invoked and **no native implementation** exists yet.

**Who prepared the ground:** A **PM** or **developer** who authored or approved the **Spec** that constrains generation.

**What happens:** The gateway misses semantic cache, invokes the LLM with **Skills** and **MCP**-mediated context (e.g., DB schema), synthesizes **Service + Repository + Controller**, validates in a **sandbox** (transactional, mocked side effects), then persists **shadow** artifacts and warms **Redis**.

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend
    participant GW as Gateway
    participant R as Redis (semantic cache)
    participant L as LLM (+ MCP)
    participant SB as Sandbox (DB + mocks)

    FE->>GW: HTTP request (new feature)
    GW->>R: GET semantic key
    R-->>GW: MISS

    GW->>L: Generate (Spec + Skills + schema via MCP)
    L-->>GW: Service + Repository + Controller (candidate)

    GW->>SB: BEGIN TRANSACTION
    GW->>SB: Execute candidate + validate vs mocks/contracts
    alt Validation OK
        SB-->>GW: OK
        GW->>SB: ROLLBACK
        GW->>GW: Save to /generated/shadow/
        GW->>R: SET route + artifact metadata
        GW->>GW: git commit + push (e.g. ssab/auto)
        GW-->>FE: Response
    else Validation FAIL
        SB-->>GW: FAIL
        GW->>SB: ROLLBACK
        loop Retry (max 3)
            GW->>L: Resend failure context + constraints
            L-->>GW: Revised candidate
            GW->>SB: Re-validate
        end
        alt Still failing after 3 attempts
            GW-->>FE: Error / fallback + alert
        end
    end
```

**Expected latency (cold path):** roughly **3–15 seconds**, dominated by LLM and sandbox validation.

---

## 2.2 Phase B — Staging (Sandbox & Validation)

**Purpose:** Candidate code lives in an **intermediate** state: present in the repo as **shadow** code, exercised under controlled conditions before a human promotion PR.

```mermaid
flowchart TB
    SC["Shadow code in repo"]
    SC --> T{"Automated tests<br/>passed?"}
    T -->|No| RET["LLM retry (max 3)"]
    RET --> ALERT["Alert developer"]
    T -->|Yes| BR["Save / update branch<br/>ssab/auto"]
    BR --> R10["Roll out ~10% traffic<br/>to shadow route"]
    R10 --> E{"Real-time errors<br/>or SLO breach?"}
    E -->|Yes| ALERT
    E -->|No| OK["Stable — ready for PR"]
```

### Percentage-based routing (conceptual)

Traffic splitting is driven by **gateway + Redis** (or equivalent config): most requests stay on the **existing native** path; a **canary slice** hits **shadow** implementations.

```mermaid
flowchart LR
    REQ["Incoming request"] --> GW2["Gateway"]
    GW2 --> REDIS["Redis: route weights"]
    REDIS --> P90["~90% existing / native"]
    REDIS --> P10["~10% shadow (staging)"]
```

### Validation checklist (staging)

| Dimension | Gate |
|-----------|------|
| **Contract conformance** | Responses and persistence match OpenAPI / spec / DTO contracts. |
| **Side effects** | No unintended external calls; mocks and policies respected. |
| **Runtime errors** | **Zero 5xx** in a defined window (e.g., **1 hour**) on canary traffic. |
| **Performance** | **p95 latency &lt; 200 ms** (tune per domain). |
| **Security** | No `eval` / `exec`, no raw unparameterized SQL, secrets not logged. |

---

## 2.3 Phase C — Hot (Promotion to Native)

**Goal:** Move from **shadow** to **first-class** PHP on `main`, route **100%** of traffic to the native stack, and **remove the LLM from the request path** for that feature.

```mermaid
sequenceDiagram
    autonumber
    participant L as LLM / automation
    participant GH as GitHub
    participant DEV as Developer
    participant HOOK as Webhook / CI
    participant R as Redis / gateway config

    L->>GH: Open PR (ssab/auto → main)<br/>Service + Repository + tests + Spec
    DEV->>GH: Review PR
    alt Approve & merge
        GH->>HOOK: merge event
        HOOK->>R: Update routes → 100% native
        Note over R: AI exits hot path
    else Review comments
        GH->>HOOK: review / comment event
        HOOK->>L: Feed comments + diff context
        L->>GH: New commit (iterate)
        DEV->>GH: Re-review (loop)
    end
```

### PR contents (illustrative tree)

```text
PR: ssab/auto → main
├── spec/
│   └── feature-xyz.yaml          # authoritative spec snapshot
├── src/
│   ├── Domain/
│   │   └── ...                   # entities, value objects
│   ├── Application/
│   │   └── Service/
│   │       └── XyzService.php
│   └── Infrastructure/
│       └── Repository/
│           └── XyzRepository.php
├── tests/
│   └── Unit/
│       └── XyzServiceTest.php
└── generated/shadow/ ...         # cleared or relocated after merge (policy)
```

### States and demotion paths

```mermaid
stateDiagram-v2
    [*] --> Cold
    Cold --> Staging : synthesis + sandbox OK
    Staging --> Hot : PR merged + routing 100% native

    Hot --> Cold : breaking schema / migration incompatible with native code
    Staging --> Cold : critical errors / repeated validation failure
    Cold --> Cold : LLM retry loop (bounded)
```

---

## 2.4 State Transitions

### Promotion

| From | To | Typical trigger |
|------|-----|-----------------|
| **Cold** | **Staging** | Sandbox validation passes; artifacts stored; canary enabled. |
| **Staging** | **Hot** | **PR approved** and merged; monitoring shows **zero blocking errors**; Redis/gateway set to **100% native**. |

### Demotion / alerts

| From | To | Typical trigger |
|------|-----|-----------------|
| **Staging** | **Cold** | **5xx** or contract violations on canary; rollback canary weight. |
| **Hot** | **Cold** | **DB migration** or contract change invalidates native implementation. |
| **Cold** | **Alert** | **Three consecutive** synthesis/validation failures; human intervention. |

```mermaid
flowchart TB
    Cold(("Cold"))
    Staging(("Staging"))
    Hot(("Hot"))
    Alert(("Alert / human"))

    Cold -->|"mocks + sandbox OK"| Staging
    Staging -->|"PR merged, clean window"| Hot

    Staging -->|"5xx / critical errors"| Cold
    Hot -->|"schema / migration break"| Cold
    Cold -->|"3 failures in a row"| Alert
```

---

## 2.5 Expected Timelines

End-to-end timing is dominated by **monitoring windows** and **human review**, not by the seconds-long cold generation.

```mermaid
gantt
    title SSAB promotion funnel (illustrative timeline — axis in seconds)
    dateFormat X
    axisFormat %s s

    section Cold
    Generation & validation (5–15 s typical) :cold, 0, 15

    section Staging
    Canary monitoring (1–2 h) :staging, after cold, 7200

    section Hot
    Code review & merge (1–24 h) :hot, after staging, 86400
```

_Note:_ The Gantt axis uses **seconds** as abstract units: Cold ≈ **15 s**, Staging bar ≈ **2 h** (7200 s), Hot bar ≈ **24 h** (86400 s). Adjust in your internal docs if you prefer real datetime scales.

### Phase duration summary

| Phase | Duration (order of magnitude) | What drives it |
|-------|------------------------------|----------------|
| **Cold** | **5–15 s** (or up to ~15 s with retries) | LLM + MCP + sandbox |
| **Staging** | **1–2 h** monitoring | Error-free canary, SLO checks |
| **Hot** | **1–24 h** | Human PR review, CI, merge |
| **Total** | **~2–26 h** wall-clock | Often faster than “wait for sprint capacity” |

### Comparison with a traditional CRUD ticket

For a **simple CRUD** feature, a conventional team often spends **1–5 days** across refinement, implementation, review, and deployment—much of it on repetitive structure SSAB automates under contracts.

| Flow | Typical calendar time (simple CRUD) |
|------|--------------------------------------|
| **Traditional** | **1–5 days** |
| **SSAB funnel** | **~2–26 hours** (mostly review + observation, not typing boilerplate) |

The win is not “magic speed” but **relocating effort** from boilerplate to **curation**, **contracts**, and **review**—with a **deterministic** runtime after **Hot**.
