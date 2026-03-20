# 5. Feedback Loop — The Learning Cycle

## 5.1 Overview

The Feedback Loop transforms SSAB from a simple code generator into a system that **evolves**. Human code review comments feed back into the LLM, which corrects code and learns recurring patterns. Over time, the same conventions appear less often in review because they become encoded as **Skills** and prompt context.

```mermaid
flowchart TB
    subgraph Correction["Correction cycle (short loop)"]
        A1[AI generates code] --> A2[Opens PR]
        A2 --> A3[Developer reviews]
        A3 --> A4[Comments on PR]
        A4 --> A5[Webhook captures event]
        A5 --> A6[AI processes feedback]
        A6 --> A7[Fixes code]
        A7 --> A8[New commit on branch]
        A8 --> A3
    end

    subgraph Learning["Learning cycle (long loop)"]
        A4 --> B1[Comments stream]
        B1 --> B2[Pattern analysis]
        B2 --> B3[New Skill drafted]
        B3 --> B4[Pending approval]
        B4 --> B5[Skill activated]
        B5 --> A1
    end

    style A6 fill:#e8f5e9
    style B3 fill:#e3f2fd
```

---

## 5.2 The Correction Cycle (Short Loop)

The short loop happens **within a single pull request**: the developer comments, the AI proposes a fix, and the developer re-evaluates. Validation and retries keep changes aligned with the **Spec** before anything is committed.

### Sequence: from comment to fix

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer
    participant GH as GitHub
    participant WH as Webhook Handler
    participant CB as Context Builder
    participant LLM as LLM
    participant SB as Sandbox
    participant Git as Git / PR branch

    Dev->>GH: Comment on line 42:<br/>"Use Carbon::now() instead of date()"
    GH->>WH: pull_request_review_comment event
    WH->>CB: Build correction context
    Note over CB: Mount: full file, line 42,<br/>comment text, Spec, Skills,<br/>PR comment history
    CB->>LLM: Correction prompt + context
    LLM-->>CB: Corrected code / patch
    CB->>SB: Validate against Spec
    alt Validation OK
        SB-->>WH: PASS
        WH->>Git: git add, commit, push
        Git-->>GH: Commit on PR branch
        GH-->>Dev: Inline reply:<br/>"Fixed in commit abc123"
    else Validation FAIL
        SB-->>WH: FAIL
        loop Up to 3 attempts
            WH->>LLM: Retry with failure details
            LLM-->>WH: Revised code
            WH->>SB: Re-validate
        end
    end
```

### Example correction prompt structure

The following is a **representative** structure (field names and ordering may vary by implementation):

```text
ROLE: You are correcting PHP backend code for an SSAB-generated endpoint.

GOAL: Apply the review feedback while preserving Spec compliance and DDD structure.

CONTEXT:
- Repository / service / file path: {path}
- Full current file: ```php ... ```
- Commented line(s): {start}-{end}
- Review comment (verbatim): "{comment_text}"
- Original Spec (JSON): {spec_json}
- Active Skills (summaries): {skills_bullets}
- Prior PR comments on this file (thread): {thread_history}

CONSTRAINTS:
- Output only the changed file or unified diff as instructed.
- Respect existing namespaces, imports, and test contracts.
- Prefer Carbon for datetimes if team Skill says so.

VALIDATION HINTS:
- Expected HTTP status / body shape from Spec: {expectation_summary}
```

---

## 5.3 The Learning Cycle (Long Loop)

The long loop analyzes **recurring patterns** across many PRs. When the same semantic issue appears often enough, SSAB drafts a **new Skill** for human approval before it influences future generations.

### From scattered comments to an approved Skill

```mermaid
flowchart TD
    C1["PR #12: Use Carbon"] --> DB[(Feedback DB)]
    C2["PR #15: Use Carbon for dates"] --> DB
    C3["PR #18: Don't use date(), use Carbon"] --> DB
    DB --> PA[Pattern Analyzer]
    PA --> Q{Same pattern<br/>≥ 3 times?}
    Q -->|Yes| GS[Generate new Skill<br/>status: pending]
    Q -->|No| WAIT[Keep accumulating]
    GS --> N1[Notify Dev:<br/>"New skill suggested. Approve?"]
    N1 --> A{Dev approves?}
    A -->|Yes| ACT[Skill active for<br/>all future generations]
    A -->|No| DISC[Discarded / archived]

    style ACT fill:#c8e6c9
    style DISC fill:#ffcdd2
```

### How the pattern analyzer works

```mermaid
flowchart LR
    RC[All review comments] --> E[Embedding]
    E --> CL[Clustering by<br/>semantic similarity]
    CL --> F[Filter clusters<br/>≥ 3 occurrences]
    F --> DS[Draft new Skill<br/>pending approval]

    style DS fill:#bbdefb
```

---

## 5.4 Types of Processable Feedback

```mermaid
flowchart TB
    subgraph Direct["Direct corrections (green)"]
        D1["Replace X with Y"] --> D1a[Direct substitution]
        D2["Add null validation"] --> D2a[Insert guard clause]
        D3["Remove this block"] --> D3a[Delete / narrow scope]
    end

    subgraph Arch["Architectural patterns (blue)"]
        A1["Belongs in Repository"] --> A1a[Move logic across layers]
        A2["Use Strategy pattern"] --> A2a[Refactor structure]
        A3["Extract this method"] --> A3a[Refactoring / SRP]
    end

    subgraph Biz["Business rules (yellow)"]
        B1["Max discount 50%"] --> B1a[Add constraint / validation]
        B2["Field is required"] --> B2a[Add validation rule]
    end

    subgraph Amb["Ambiguous (red)"]
        U1["Doesn't seem right"] --> U1a[Ask for specifics]
        U2["Review this logic"] --> U2a[Ask for context / examples]
    end

    style Direct fill:#e8f5e9
    style Arch fill:#e3f2fd
    style Biz fill:#fff9c4
    style Amb fill:#ffebee
```

| Type | AI action | Confidence |
|------|-----------|------------|
| Direct correction | Apply targeted edit (replace, guard, delete) | High |
| Architectural pattern | Refactor across layers / patterns / extraction | Medium |
| Business rule | Add validation, invariants, domain constraints | High–Medium |
| Ambiguous | Clarifying questions; avoid speculative rewrites | N/A |

---

## 5.5 Protection Against Infinite Loops

A real risk is a **correction ping-pong**: the AI fixes, the developer disagrees, the AI “fixes” again in the wrong direction, and the thread never converges.

```mermaid
flowchart TD
    START[Comment received] --> ATT[Correction attempt]
    ATT --> T{Tests pass?}
    T -->|Yes| COMMIT[Commit to PR branch]
    T -->|No| A3{Attempt < 3?}
    A3 -->|Yes| ATT
    A3 -->|No| ESC[Escalate to Dev<br/>stop auto-fix]

    COMMIT --> SEC{New comment on<br/>same section?}
    SEC -->|No| RES[Resolved]
    SEC -->|Yes| BNC{Bounces on same<br/>section ≥ 2?}
    BNC -->|No| ATT
    BNC -->|Yes| MAN[Mark: Requires manual intervention<br/>Notify Dev]

    style MAN fill:#ffcdd2
    style RES fill:#c8e6c9
```

### Protection rules

| Rule | Limit |
|------|--------|
| Max correction attempts per comment | 3 |
| Max bounces on the same code section | 2 |
| Max auto-commits per PR | 10 |
| Max total auto-correction time per PR | 1 hour |

---

## 5.6 Persistent Memory

The Feedback Loop feeds a **persistent knowledge base** that spans a single PR, a whole project, and (optionally) organization-wide standards.

```mermaid
flowchart TB
    subgraph ST["Short term (per PR)"]
        S1[Current comments]
        S2[Endpoint / Spec context]
        S3[Active thread state]
    end

    subgraph MT["Medium term (per project)"]
        M1[Approved Skills]
        M2[Team preferences<br/>e.g. Carbon, Eloquent idioms]
        M3[Project glossary]
    end

    subgraph LT["Long term (global / org)"]
        L1[Architecture rules]
        L2[Security patterns]
        L3[Naming & style conventions]
    end

    ST --> LLM[LLM context]
    MT --> LLM
    LT --> LLM

    style ST fill:#fff3e0
    style MT fill:#e8eaf6
    style LT fill:#e0f2f1
```

### Quality evolution over time

```mermaid
flowchart LR
    W1[Week 1:<br/>Basic code,<br/>many review comments,<br/>5+ corrections/PR]
    W4[Week 4:<br/>Follows team patterns,<br/>minor comments,<br/>2–3 corrections/PR]
    W12[Week 12:<br/>Masters conventions,<br/>nearly automatic reviews,<br/>0–1 corrections/PR]

    W1 --> W4 --> W12

    style W1 fill:#ffcdd2
    style W4 fill:#fff9c4
    style W12 fill:#c8e6c9
```

---

*This document describes intended SSAB behavior. Exact thresholds, storage, and orchestration depend on your deployment and governance policies.*
