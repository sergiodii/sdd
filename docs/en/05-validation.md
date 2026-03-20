# 5. Validation

## 5.1 The Contract

In SDD, the spec is a **contract**. Code is not "done" when it compiles — it's done when it **passes all test scenarios defined in the spec**.

```mermaid
graph LR
    CODE["📦 Code"] --> VALIDATE{"Matches spec<br/>contract?"}
    VALIDATE -->|Yes| VALID["✅ Valid"]
    VALIDATE -->|No| INVALID["❌ Invalid"]

    style VALID fill:#417505,color:#fff
    style INVALID fill:#D0021B,color:#fff
```

This is the fundamental difference from traditional development: the acceptance criteria are **formalized and executable**, not implicit or verbal.

---

## 5.2 What Gets Validated

```mermaid
flowchart TD
    CODE["Synthesized Code"] --> C1{"Functional<br/>conformance"}
    C1 -->|Pass| C2{"Side effects<br/>correct"}
    C1 -->|Fail| REJECT["❌"]
    C2 -->|Pass| C3{"Follows<br/>skills"}
    C2 -->|Fail| REJECT
    C3 -->|Pass| C4{"Static analysis<br/>(lint/SAST)"}
    C3 -->|Fail| REJECT
    C4 -->|Pass| C5{"Performance<br/>acceptable"}
    C4 -->|Fail| REJECT
    C5 -->|Pass| APPROVE["✅ Ready for review"]
    C5 -->|Fail| REJECT

    REJECT --> RETRY{"Retries < 3?"}
    RETRY -->|Yes| RESYNTH["Re-synthesize"]
    RETRY -->|No| HUMAN["🚨 Human intervention"]

    style APPROVE fill:#417505,color:#fff
    style REJECT fill:#D0021B,color:#fff
    style HUMAN fill:#D0021B,color:#fff
```

| # | Check | Method | Automated? |
|---|-------|--------|-----------|
| 1 | **Functional conformance** | Execute code with spec input, compare output | Yes |
| 2 | **Side effects** | Verify database/state changes match spec | Yes |
| 3 | **Skill compliance** | Verify code follows architectural rules | Yes (lint + structure check) |
| 4 | **Static analysis** | Run linter, SAST, type checker | Yes |
| 5 | **Performance** | Execution time within acceptable range | Yes |
| 6 | **Human review** | Developer reviews code quality, logic, security | No |

---

## 5.3 Validation Process

```mermaid
sequenceDiagram
    participant CODE as Synthesized Code
    participant RUNNER as Test Runner
    participant SPEC as Spec Scenarios
    participant DB as Test Database

    RUNNER->>SPEC: Load scenarios

    loop For each scenario
        alt Has seed/precondition
            RUNNER->>DB: Apply seed data
        end

        RUNNER->>DB: BEGIN TRANSACTION
        RUNNER->>CODE: Execute with scenario.input
        CODE-->>RUNNER: Response (status + body)

        RUNNER->>RUNNER: Compare response vs scenario.expect

        alt Has db_assert
            RUNNER->>DB: Verify db_assert conditions
        end

        RUNNER->>DB: ROLLBACK

        alt Scenario passed
            RUNNER->>RUNNER: ✅ Next scenario
        else Scenario failed
            RUNNER->>RUNNER: ❌ Log failure details
        end
    end

    alt All scenarios passed
        RUNNER->>RUNNER: ✅ Code validated
    else Any scenario failed
        RUNNER->>RUNNER: ❌ Report failures
    end
```

### Key Guarantees

- **Isolation**: Each scenario runs in a database transaction that is rolled back afterward. Tests never pollute each other.
- **Seed data**: Scenarios can define preconditions (e.g., "a user with this email already exists") that are set up before execution.
- **DB assertions**: Beyond checking the response, validation can verify that the correct database changes were made.
- **Deterministic**: Same spec + same code = same result, every time.

---

## 5.4 Validation in Different Contexts

### With Cursor (Local Development)

The developer synthesizes code locally with Cursor, then runs the validation:

```mermaid
graph LR
    A["Dev writes spec"] --> B["Cursor generates code"]
    B --> C["Dev runs tests locally"]
    C --> D["Tests validate against spec"]
    D --> E["Dev opens PR"]

    style B fill:#7B68EE,color:#fff
    style D fill:#F5A623,color:#fff
```

### With CI/CD (Automated Pipeline)

A GitHub Action generates code and validates automatically:

```mermaid
graph LR
    A["Spec pushed"] --> B["Action generates code"]
    B --> C["Action runs validation"]
    C --> D["Action opens PR"]
    D --> E["Dev reviews"]

    style B fill:#7B68EE,color:#fff
    style C fill:#F5A623,color:#fff
```

### Manual Development

A developer writes code by hand and validates against the spec:

```mermaid
graph LR
    A["Dev reads spec"] --> B["Dev writes code"]
    B --> C["Dev runs tests"]
    C --> D["Tests validate against spec"]
    D --> E["Dev opens PR"]

    style B fill:#417505,color:#fff
    style D fill:#F5A623,color:#fff
```

In all three cases, the **validation step is the same**: run the spec's test scenarios against the code. The synthesis method is irrelevant — what matters is that the code conforms to the contract.

---

## 5.5 Approval Criteria

For code to be promoted from "synthesized" to "production-ready", it must pass:

```mermaid
graph TD
    subgraph "Automated (must pass)"
        A1["All spec scenarios pass"]
        A2["No lint errors"]
        A3["No prohibited functions"]
        A4["Follows DDD structure"]
        A5["Compiles / builds"]
    end

    subgraph "Human (must approve)"
        H1["Logic is correct"]
        H2["Security is adequate"]
        H3["Code is readable"]
        H4["No unnecessary complexity"]
    end

    A1 --> GATE{"All automated<br/>checks pass?"}
    A2 --> GATE
    A3 --> GATE
    A4 --> GATE
    A5 --> GATE

    GATE -->|No| BLOCK["❌ PR blocked"]
    GATE -->|Yes| HUMAN_REVIEW["Human review"]
    HUMAN_REVIEW --> H1
    HUMAN_REVIEW --> H2
    HUMAN_REVIEW --> H3
    HUMAN_REVIEW --> H4

    style BLOCK fill:#D0021B,color:#fff
    style HUMAN_REVIEW fill:#417505,color:#fff
```

---

## 5.6 The Feedback Loop

When a human reviewer provides feedback, it creates value at two levels:

```mermaid
graph TD
    COMMENT["💬 Review comment"] --> SHORT["Short-term:<br/>Fix this PR"]
    COMMENT --> LONG["Long-term:<br/>Improve all future synthesis"]

    SHORT --> FIX["Re-synthesize with<br/>feedback context"]
    FIX --> COMMIT["New commit on PR"]

    LONG --> PATTERN{"Same feedback<br/>3+ times?"}
    PATTERN -->|Yes| SKILL["Create new skill"]
    PATTERN -->|No| STORE["Store for analysis"]

    SKILL --> FUTURE["All future code<br/>follows this rule"]

    style SHORT fill:#F5A623,color:#fff
    style LONG fill:#417505,color:#fff
    style SKILL fill:#7B68EE,color:#fff
```

This means every code review comment has **permanent value**. It doesn't just fix one PR — it potentially prevents the same mistake in every future synthesis.
