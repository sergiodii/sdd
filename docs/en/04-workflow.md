# 4. Workflow

## 4.1 The SDD Development Cycle

```mermaid
graph TD
    A["1. Write Spec"] --> B["2. Review Spec (PR)"]
    B --> C["3. Synthesize Code"]
    C --> D["4. Validate Against Spec"]
    D -->|Pass| E["5. Review Code (PR)"]
    D -->|Fail| C
    E -->|Approve| F["6. Merge to Production"]
    E -->|Feedback| C
    F --> G["7. Monitor & Evolve"]
    G -->|"New requirement"| A

    style A fill:#4A90D9,color:#fff
    style C fill:#7B68EE,color:#fff
    style D fill:#F5A623,color:#fff
    style E fill:#417505,color:#fff
    style F fill:#2D7D2D,color:#fff
```

---

## 4.2 Step by Step

### Step 1 — Write the Spec

**Who:** PM, Frontend Dev, Backend Dev, or anyone on the team.

**What:** Add a new task section to the domain spec file in `.sdd/specs/<domain>.md` defining:
- What the endpoint should do
- What it receives and returns
- What errors are possible
- What test scenarios to validate

**How:** Open the editor (or GitHub's browser editor), write the spec, commit and push.

### Step 2 — Review the Spec

**Who:** The team (via Pull Request).

**What:** The spec is reviewed like any other code change. Team members verify:
- Are the business rules correct?
- Are edge cases covered?
- Is the input/output schema what the frontend expects?
- Are security requirements specified?

```mermaid
sequenceDiagram
    participant Dev as Dev/PM
    participant GH as GitHub
    participant Team as Team

    Dev->>GH: Push new task section in .sdd/specs/user.md
    Dev->>GH: Open PR for spec review
    GH->>Team: Notification: new spec PR
    Team->>GH: Review, comment, suggest changes
    Dev->>GH: Address feedback, update spec
    Team->>GH: Approve
    GH->>GH: Merge spec to main
```

### Step 3 — Synthesize Code

**Who:** AI tool (Cursor, CI/CD pipeline, or custom engine) or a human developer.

**What:** Code is generated following:
- The spec (what to build)
- The skills (how to build it)
- The existing codebase (context)

```mermaid
graph LR
    SPEC["📋 Spec"] --> TOOL["Synthesis Tool"]
    SKILLS["⚙️ Skills"] --> TOOL
    CODEBASE["📁 Existing Code"] --> TOOL
    TOOL --> CODE["📦 Generated Code"]

    style TOOL fill:#7B68EE,color:#fff
```

**With Cursor:** The developer opens Cursor, references the spec, and asks Cursor to generate the code. Cursor follows the project's rules (which mirror the SDD skills).

**With CI/CD:** A GitHub Action detects the new spec, calls an LLM with the spec + skills as context, and generates the code automatically.

**Manually:** The developer reads the spec and writes the code by hand, following the skills.

### Step 4 — Validate Against Spec

**Who:** Automated pipeline or manual testing.

**What:** The synthesized code is executed against the spec's test scenarios:

```mermaid
flowchart TD
    CODE["Synthesized Code"] --> LOOP["For each test scenario"]

    LOOP --> SEED["Apply seed data<br/>(if specified)"]
    SEED --> EXEC["Execute code<br/>with scenario input"]
    EXEC --> CHECK{"Output matches<br/>expected?"}
    CHECK -->|Yes| DB_CHECK{"Side effects<br/>correct?"}
    CHECK -->|No| FAIL["❌ Scenario failed"]
    DB_CHECK -->|Yes| PASS["✅ Scenario passed"]
    DB_CHECK -->|No| FAIL

    PASS --> NEXT{"More scenarios?"}
    NEXT -->|Yes| LOOP
    NEXT -->|No| APPROVED["All scenarios passed ✅"]

    FAIL --> RETRY{"Retries < 3?"}
    RETRY -->|Yes| RESYNTH["Re-synthesize with<br/>error context"]
    RETRY -->|No| ALERT["🚨 Alert developer"]
    RESYNTH --> LOOP

    style APPROVED fill:#417505,color:#fff
    style FAIL fill:#D0021B,color:#fff
```

### Step 5 — Review Code

**Who:** Backend Dev or Tech Lead.

**What:** The synthesized code is reviewed in a PR, just like any human-written code:
- Does it follow the skills/architecture?
- Is the logic correct?
- Are there security concerns?
- Is the code readable and maintainable?

If the reviewer leaves feedback, the code is re-synthesized with the feedback as additional context.

### Step 6 — Merge to Production

**Who:** Reviewer approves, CI/CD deploys.

**What:** Standard merge and deploy. The code is now in production, indistinguishable from human-written code.

### Step 7 — Monitor & Evolve

**Who:** Team.

**What:**
- If a bug is found in production, the failing scenario is added to the spec
- If a new requirement emerges, a new spec (or spec update) is created
- If a code review correction repeats across PRs, a new skill is created

---

## 4.3 Roles and Responsibilities

```mermaid
graph TB
    subgraph "Spec Phase"
        PM["PM writes business rules"]
        FE["Frontend defines schemas"]
        BE_SPEC["Backend adds constraints"]
    end

    subgraph "Synthesis Phase"
        AI["AI/Tool generates code"]
        DEV_WRITE["or Dev writes manually"]
    end

    subgraph "Validation Phase"
        AUTO["Automated validation<br/>against spec"]
    end

    subgraph "Governance Phase"
        BE_REVIEW["Backend reviews PR"]
        FEEDBACK["Feedback → re-synthesis"]
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

## 4.4 Concurrency — Multiple Specs at Once

When multiple developers add tasks to the same domain spec, they each add a **separate section** in the same file. If two developers edit different sections, the merge conflict is trivial — just like editing different functions in the same code file:

```mermaid
sequenceDiagram
    participant A as Dev A
    participant B as Dev B
    participant GH as GitHub
    participant SDD as Synthesis

    A->>GH: Adds "TASK-14 - v1" section to specs/user.md
    B->>GH: Adds "TASK-24 - v1" section to specs/user.md

    Note over GH: Different sections in same file<br/>trivial merge if conflict occurs

    GH->>SDD: Generate code from updated user.md
    SDD->>GH: PR with generated code

    Note over GH: Dev A later evolves the spec

    A->>GH: Adds "TASK-14 - v2" section to specs/user.md
    GH->>SDD: Re-generate from latest spec
```

Each task is a section (`## TASK-14 - v1`), not a separate file. The spec file grows naturally with the domain, preserving full history and shared context (e.g., domain-level auth rules at the top).

---

## 4.5 Project Structure

```
my-project/
├── cmd/                        ← app entrypoint (human-managed)
├── internal/                   ← application code (synthesized + human)
│   ├── user/
│   │   ├── handler.go
│   │   ├── service.go
│   │   ├── repository.go
│   │   └── entity.go
│   └── order/
│       ├── handler.go
│       ├── service.go
│       └── ...
├── .sdd/                       ← SDD configuration
│   ├── specs/                  ← specs (the source of truth)
│   │   ├── user.md             ← all /user endpoints and tasks
│   │   └── order.md            ← all /order endpoints and tasks
│   ├── skills/                 ← architectural rules
│   │   ├── go-ddd.md
│   │   ├── security.md
│   │   └── error-handling.md
│   └── config.yaml             ← project configuration
├── tests/                      ← tests (generated from spec scenarios)
├── go.mod
└── .github/
    └── workflows/              ← CI/CD (optional automation)
```

### What SDD can modify vs what it can't

| Path | SDD can modify? | Reason |
|------|----------------|--------|
| `internal/` | Yes | Synthesized code lives here |
| `tests/` | Yes | Tests generated from spec scenarios |
| `.sdd/specs/` | Never | Human input, source of truth |
| `.sdd/skills/` | Suggest only | Can propose new skills via PR |
| `.sdd/config.yaml` | Never | Project configuration |
| `cmd/` | Never | App entrypoint, human-managed |
| `.github/` | Never | Pipeline definitions, human-managed |
