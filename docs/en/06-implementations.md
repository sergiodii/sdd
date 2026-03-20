# 6. Implementations

SDD is a methodology, not a tool. It can be implemented with different tools depending on the team's size, needs, and existing infrastructure.

```mermaid
graph TD
    SDD["SDD Methodology"] --> CURSOR["Cursor + Rules"]
    SDD --> CICD["CI/CD + LLM"]
    SDD --> VSTATE["vState"]
    SDD --> MANUAL["Manual Development"]
    SDD --> CUSTOM["Custom Engine"]

    style SDD fill:#4A90D9,color:#fff
    style CURSOR fill:#7B68EE,color:#fff
    style CICD fill:#F5A623,color:#fff
    style VSTATE fill:#417505,color:#fff
```

---

## 6.1 Cursor + Rules (Recommended for Most Teams)

The simplest and most practical implementation. SDD skills become Cursor rules, and the developer uses Cursor to synthesize code with the spec as context.

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Cursor as Cursor IDE
    participant Rules as .cursor/rules/
    participant Spec as .sdd/specs/

    Dev->>Spec: Creates/reads spec
    Dev->>Cursor: "Generate POST /user following the spec"
    Cursor->>Rules: Loads project rules (= SDD skills)
    Cursor->>Spec: Reads spec for context
    Cursor->>Cursor: Synthesizes code
    Cursor-->>Dev: Generated code in editor
    Dev->>Dev: Reviews, tests locally
    Dev->>Dev: Opens PR
```

### Setup

1. Write your SDD skills in `.sdd/skills/`
2. Copy or symlink them to `.cursor/rules/`
3. Write specs in `.sdd/specs/`
4. When developing, reference the spec in Cursor chat
5. Cursor generates code following the rules

### When to Use

- Solo developers or small teams (2-10)
- Teams already using Cursor
- When you want SDD benefits without infrastructure overhead
- Starting with SDD for the first time

### Pros and Cons

| Pros | Cons |
|------|------|
| Zero infrastructure cost | Developer must manually reference specs |
| Immediate setup (minutes) | No automated validation pipeline |
| Developer stays in control | No automatic PR generation |
| Leverages existing tooling | Depends on Cursor specifically |

---

## 6.2 CI/CD + LLM Pipeline

A more automated approach where GitHub Actions (or similar) detect new specs and trigger code synthesis via an LLM API.

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant Action as GitHub Action
    participant LLM as LLM (Claude/GPT)
    participant Tests as Test Runner

    Dev->>GH: Push new spec to .sdd/specs/
    GH->>Action: Trigger: spec file changed

    Action->>Action: Load spec + skills + existing code
    Action->>LLM: Send prompt with full context
    LLM-->>Action: Generated code

    Action->>Tests: Validate against spec scenarios
    Tests-->>Action: Results

    alt All tests pass
        Action->>GH: Create branch, commit code, open PR
        GH->>Dev: PR notification
    else Tests fail
        Action->>LLM: Re-send with error details (retry)
    end

    Dev->>GH: Review PR
    alt Approve
        Dev->>GH: Merge
    else Comment
        GH->>Action: Webhook: PR comment
        Action->>LLM: Process feedback, generate fix
        Action->>GH: New commit on PR
    end
```

### Setup

1. Configure LLM API key in GitHub Secrets
2. Create GitHub Action workflows:
   - `sdd-generate.yml` — triggers on spec changes
   - `sdd-review.yml` — triggers on PR comments
   - `sdd-validate.yml` — runs on every PR
3. Write specs and skills as usual

### Example GitHub Action

```yaml
name: SDD Generate
on:
  push:
    paths:
      - '.sdd/specs/**'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Detect changed specs
        id: specs
        run: |
          echo "files=$(git diff --name-only HEAD~1 -- .sdd/specs/)" >> $GITHUB_OUTPUT

      - name: Generate code from spec
        env:
          LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
        run: |
          # Read spec + skills, call LLM, save generated code
          # Validate against spec scenarios
          # If valid, commit and create PR

      - name: Create PR
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh pr create --title "[SDD] Generated code for ${{ steps.specs.outputs.files }}" \
                       --body "Auto-generated from spec. Please review."
```

### When to Use

- Medium to large teams (10+)
- When you want fully automated code generation
- When PMs need to trigger code generation without using an IDE
- When you want automated validation in CI

### Pros and Cons

| Pros | Cons |
|------|------|
| Fully automated synthesis | Infrastructure setup required |
| PMs can trigger generation | LLM API costs |
| Automated validation | More complex pipeline to maintain |
| Consistent output | Debugging pipeline issues |

---

## 6.3 vState

[vState](https://vstate.dogether.com.br/) is a versioned state protocol that applies SDD principles to state management and code evolution.

```mermaid
graph LR
    SPEC["📋 SDD Spec"] --> VSTATE["vState Protocol"]
    VSTATE --> VERSIONED["Versioned state<br/>transitions"]
    VERSIONED --> CODE["Code that evolves<br/>with the spec"]

    style VSTATE fill:#417505,color:#fff
```

vState uses the core SDD concepts:
- Specs define the expected state and transitions
- Code is generated/evolved based on versioned specs
- Validation ensures the code matches the spec at every version

### When to Use

- When state management and versioning are central to the application
- When you need formal state transition tracking
- When you want SDD applied beyond just API endpoints

---

## 6.4 Manual Development (SDD Without AI)

SDD works even without AI. A developer reads the spec and writes code by hand. The spec still provides:

- Clear requirements (no ambiguity)
- Built-in test scenarios (no missing tests)
- Living documentation (never outdated)

```mermaid
graph LR
    A["Dev reads spec"] --> B["Dev writes code"]
    B --> C["Dev writes tests<br/>(from spec scenarios)"]
    C --> D["Tests pass?"]
    D -->|Yes| E["Open PR"]
    D -->|No| B

    style A fill:#4A90D9,color:#fff
    style B fill:#417505,color:#fff
```

### When to Use

- Teams not ready for AI tooling
- Highly regulated environments where AI-generated code is not allowed
- Complex business logic where manual implementation is preferred
- As a stepping stone before adopting AI-assisted SDD

---

## 6.5 Choosing an Implementation

```mermaid
flowchart TD
    START["Adopting SDD"] --> SIZE{"Team size?"}

    SIZE -->|"1-5 devs"| CURSOR_Q{"Already using<br/>Cursor?"}
    SIZE -->|"5-20 devs"| AUTOMATION{"Want automated<br/>generation?"}
    SIZE -->|"20+ devs"| CICD_REC["CI/CD + LLM<br/>(recommended)"]

    CURSOR_Q -->|Yes| CURSOR_REC["Cursor + Rules<br/>(recommended)"]
    CURSOR_Q -->|No| MANUAL_Q{"Want AI<br/>assistance?"}
    MANUAL_Q -->|Yes| CURSOR_REC
    MANUAL_Q -->|No| MANUAL_REC["Manual SDD<br/>(spec + tests)"]

    AUTOMATION -->|Yes| CICD_REC
    AUTOMATION -->|No| CURSOR_REC

    style CURSOR_REC fill:#7B68EE,color:#fff
    style CICD_REC fill:#F5A623,color:#fff
    style MANUAL_REC fill:#417505,color:#fff
```

| Implementation | Setup Time | Ongoing Cost | Automation Level | Best For |
|---------------|-----------|-------------|-----------------|---------|
| **Cursor + Rules** | Minutes | Cursor subscription | Low (dev-driven) | Small teams, getting started |
| **CI/CD + LLM** | Days-weeks | LLM API costs | High (automated) | Medium-large teams, scale |
| **vState** | Hours | Varies | Medium | State-heavy applications |
| **Manual** | Minutes | None | None | Regulated, complex logic |
