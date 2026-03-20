# 4. Contracts & Validation

## 4.1 Philosophy: Contract-First

No code is generated without a prior **contract**. The **Spec** is the single source of truth for what an endpoint must do. The executable checks against that Spec are the **tests**—and in SSAB, those tests **are** the living documentation.

```mermaid
flowchart LR
    subgraph Legacy["Without a contract"]
        L1["Developer writes code"] --> L2["Manual / ad-hoc testing"]
        L2 --> L3["Docs written later<br/>or never"]
    end

    subgraph SSAB["SSAB (contract-first)"]
        S1["PM / Dev writes Spec"] --> S2["AI generates code"]
        S2 --> S3["Code validated<br/>against Spec"]
        S3 --> S4["Contract = test = doc"]
    end

    style L3 fill:#D0021B,color:#fff
    style S4 fill:#417505,color:#fff
```

---

## 4.2 Spec Structure

Each endpoint has a JSON (or YAML) specification under `specs/`. The Spec binds **input**, **output**, **side effects**, and **scenarios** that the sandbox will replay.

### Full example: `specs/post_user.json`

```json
{
  "endpoint": "/user",
  "method": "POST",
  "version": "1.0",
  "description": "Create a new user account",
  "owner": "product-team",

  "input": {
    "content_type": "application/json",
    "schema": {
      "email": { "type": "string", "format": "email", "required": true },
      "passkey": { "type": "string", "min_length": 8, "required": true },
      "name": { "type": "string", "required": false }
    }
  },

  "output": {
    "success": {
      "status": 201,
      "schema": {
        "token": { "type": "string", "format": "jwt" },
        "userData": {
          "type": "object",
          "properties": {
            "id": { "type": "string", "format": "uuid" },
            "email": { "type": "string" },
            "created_at": { "type": "string", "format": "datetime" }
          }
        }
      }
    },
    "errors": [
      { "condition": "Duplicate email", "status": 409, "body": { "error": "USER_ALREADY_EXISTS" } },
      { "condition": "Invalid email", "status": 422, "body": { "error": "INVALID_EMAIL" } },
      { "condition": "Weak passkey", "status": 422, "body": { "error": "WEAK_PASSKEY" } }
    ]
  },

  "side_effects": [
    "Insert a row into table `users`",
    "Hash passkey with bcrypt before persistence",
    "Issue a JWT with 24h expiry"
  ],

  "scenarios": [
    {
      "name": "Happy path — user created",
      "input": { "email": "jon@doe.com", "passkey": "securePass123" },
      "expect": {
        "status": 201,
        "body_contains": ["token", "userData"],
        "body_match": { "userData.email": "jon@doe.com" }
      },
      "db_assert": {
        "table": "users",
        "where": { "email": "jon@doe.com" },
        "exists": true
      }
    },
    {
      "name": "Error — duplicate email",
      "precondition": {
        "db_seed": {
          "table": "users",
          "data": { "email": "existing@email.com", "password_hash": "xxx" }
        }
      },
      "input": { "email": "existing@email.com", "passkey": "securePass123" },
      "expect": {
        "status": 409,
        "body_match": { "error": "USER_ALREADY_EXISTS" }
      }
    },
    {
      "name": "Error — invalid email",
      "input": { "email": "not-an-email", "passkey": "securePass123" },
      "expect": {
        "status": 422,
        "body_match": { "error": "INVALID_EMAIL" }
      }
    },
    {
      "name": "Error — weak passkey",
      "input": { "email": "new@email.com", "passkey": "123" },
      "expect": {
        "status": 422,
        "body_match": { "error": "WEAK_PASSKEY" }
      }
    }
  ]
}
```

### Anatomy of a Spec

```mermaid
flowchart TD
    SPEC["Spec file"] --> META["Metadata<br/>endpoint, method, version, owner"]
    SPEC --> IN["Input schema<br/>types, formats, required"]
    SPEC --> OUT["Output schema<br/>success + error catalog"]
    SPEC --> SIDE["Side effects<br/>DB, messages, tokens"]
    SPEC --> SC["Scenarios<br/>executable examples"]

    SC --> HAPPY["Happy path<br/>+ db_assert"]
    SC --> ERR["Error paths<br/>+ preconditions"]
    SC --> EDGE["Edge cases<br/>boundary inputs"]

    style SPEC fill:#4A90D9,color:#fff
    style SC fill:#F5A623,color:#fff
    style HAPPY fill:#417505,color:#fff
    style ERR fill:#D0021B,color:#fff
```

---

## 4.3 Who Writes the Contracts?

SSAB **democratizes feature definition**: product, frontend, and backend perspectives converge into one machine-checkable Spec before any codegen runs.

```mermaid
flowchart TB
    subgraph PM["Product Manager"]
        P1["Natural language rules"]
        P2["e.g. On signup return token + profile;<br/>if email exists return conflict."]
    end

    subgraph FE["Frontend developer"]
        F1["Public API contract"]
        F2["input: email, passkey, name<br/>output: token, userData<br/>errors: 409, 422"]
    end

    subgraph BE["Backend developer"]
        B1["Side effects & security"]
        B2["bcrypt cost, JWT claims,<br/>PII constraints, idempotency"]
    end

    P1 --> USPEC["Unified Spec"]
    F1 --> USPEC
    B1 --> USPEC
    USPEC --> LLM["LLM generates code"]

    style USPEC fill:#7B68EE,color:#fff
```

| Role | Defines | Example |
|------|---------|---------|
| **PM** | Business rules in prose | “First purchase gets 20% off until date X.” |
| **Frontend dev** | Request/response shapes clients rely on | `{ email, passkey }` → `{ token, userData }` |
| **Backend dev** | Side effects, security, data integrity | “Bcrypt cost 12; no plaintext secrets in logs.” |

---

## 4.4 The Validation Process (Sandbox)

Generated code does **not** land in production immediately. It runs inside an **isolated sandbox** against every **scenario** in the Spec: seed, execute, assert, then roll back.

```mermaid
sequenceDiagram
    participant LLM as LLM
    participant GW as Gateway
    participant SB as Sandbox
    participant DB as Test DB
    participant SPEC as Spec

    LLM->>GW: Generated PHP
    GW->>SPEC: Load scenarios[]
    loop Each scenario
        GW->>DB: BEGIN TRANSACTION
        alt precondition.db_seed
            GW->>DB: Apply db_seed
        end
        GW->>SB: Execute handler with scenario.input
        SB-->>GW: HTTP-like result
        GW->>GW: Compare vs scenario.expect
        alt db_assert present
            GW->>DB: Verify db_assert
        end
        GW->>DB: ROLLBACK
    end
    alt All scenarios passed
        GW->>GW: Approve for promotion path
    else Any failure
        GW->>LLM: Resend with failure diff + logs
    end
```

### Sandbox isolation

```mermaid
flowchart TB
    subgraph Prod["Production"]
        PDB[("Production DB")]
        PFS["Production filesystem"]
    end

    subgraph SBX["Sandbox"]
        CNT["Ephemeral Docker container"]
        TDB[("Test DB<br/>transactions + ROLLBACK")]
        TFS["Temp filesystem<br/>for artifacts"]
    end

    PDB -.->|"Schema only<br/>(no prod data)"| TDB
    CNT --> TDB
    CNT --> TFS

    style CNT fill:#F5A623,color:#fff
    style PDB fill:#417505,color:#fff
    style TDB fill:#4A90D9,color:#fff
```

**Guarantees**

- Generated validation **never reads or writes real customer data**.
- Each scenario is wrapped in a **transaction** that ends in **ROLLBACK** (or equivalent isolation).
- The sandbox **container is destroyed** after the run.
- Dangerous PHP surfaces are blocked (e.g. **`disable_functions`** for `exec`, `shell_exec`, `system`, etc., plus policy in the image).

---

## 4.5 Approval Criteria

Promotion to staging (and later **hot**) requires passing **all** gates. Failures loop back to the LLM with structured diagnostics until a retry budget is exhausted.

```mermaid
flowchart TD
    CODE["Generated code"] --> C1{"All scenarios<br/>passed?"}
    C1 -->|No| FAIL["Reject"]
    C1 -->|Yes| C2{"Lint OK?"}
    C2 -->|No| FAIL
    C2 -->|Yes| C3{"No forbidden<br/>functions?"}
    C3 -->|No| FAIL
    C3 -->|Yes| C4{"Follows DDD<br/>structure?"}
    C4 -->|No| FAIL
    C4 -->|Yes| C5{"Performance<br/>< 200ms?"}
    C5 -->|No| FAIL
    C5 -->|Yes| OK["Approved → promote<br/>to Staging"]

    FAIL --> R{"Retries < 3?"}
    R -->|Yes| LLM["Resend to LLM<br/>with error details"]
    R -->|No| ALERT["Alert developer"]
    LLM --> CODE

    style OK fill:#417505,color:#fff
    style FAIL fill:#D0021B,color:#fff
    style ALERT fill:#D0021B,color:#fff
```

| # | Criterion | What “pass” means | Automatic? |
|---|-----------|-------------------|------------|
| 1 | **Functional conformance** | Responses match `scenario.expect` for every scenario | Yes |
| 2 | **Correct side effects** | `db_assert` and declared side effects hold | Yes |
| 3 | **Static analysis (PHPStan)** | Configured level passes with no new baseline violations | Yes |
| 4 | **Security** | No forbidden calls; parameterized SQL; secret/PII policies | Yes |
| 5 | **DDD structure** | Controller / Service / Repository boundaries respected | Yes |
| 6 | **Performance** | Scenario execution under **200ms** (tunable per project) | Yes |
| 7 | **Human code review** | Maintainer approves the PR / change | **No** |

---

## 4.6 Spec Versioning

Specs evolve with the product. When a business rule changes, the Spec is edited; the system detects drift and **invalidates** synthesized code so regeneration stays honest.

```mermaid
stateDiagram-v2
    [*] --> V1: PM creates Spec v1
    V1 --> Hot: AI generates + validates + PR approved
    Hot --> V2: PM updates business rule
    V2 --> Cold: Spec hash changed — code invalidated
    Cold --> Hot: AI regenerates against new Spec

    note right of V2 : Example — discount changes from 10% to 15%
```

**End-to-end flow**

```mermaid
flowchart LR
    EDIT["PM/Dev edits Spec"] --> HASH["New spec_hash<br/>stored / compared"]
    HASH --> REQ["Next Gateway request"]
    REQ --> MISMATCH{"spec_hash mismatch<br/>vs Redis / artifact?"}
    MISMATCH -->|Yes| INV["Invalidate old handler"]
    INV --> GEN["LLM regenerates"]
    GEN --> VAL["Sandbox + CI"]
    VAL --> PR["PR + human review"]
    MISMATCH -->|No| RUN["Serve current hot code"]

    style INV fill:#F5A623,color:#fff
    style GEN fill:#7B68EE,color:#fff
```

This keeps production behavior aligned with the **latest** Spec: backend engineers are not the bottleneck for every wording or rule tweak—the **contract** drives regeneration, validation, and review.
