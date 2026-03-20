# Spec-Driven Development: Write the Spec, the Code Follows

## A new development methodology where the spec is the requirement, the test, and the documentation — all in one file.

---

What if every feature in your codebase had a single source of truth — a file that simultaneously described what the software should do, how to test it, and how it works?

Not a Jira ticket that's outdated by sprint 2. Not a Confluence page that nobody maintains. Not a Slack message lost in a thread.

A **spec file** in the repository, versioned alongside the code, that governs everything.

I call it **SDD: Spec-Driven Development**.

---

## The Problem We All Know

Software development has a dirty secret: **requirements live everywhere except where they should**.

The PM describes the feature in a meeting. The developer interprets it. The frontend dev assumes an API contract. The backend dev implements something slightly different. QA tests based on what they remember from the meeting. Documentation is written three months later (or never).

Everyone is working from a different source of truth. And when things break, the conversation is always the same: *"That's not what I meant."*

TDD gave us a partial solution: write the test first, then the code. But tests are technical — only developers read them. The PM can't look at a unit test and verify that the business rule is correct.

BDD tried to fix this with Gherkin syntax. But it introduced tooling complexity (Cucumber, SpecFlow) and a new language to learn.

SDD takes a different approach: **write a Markdown file that anyone can read**.

---

## What is a Spec?

A spec in SDD is a Markdown file that defines everything about a feature:

```markdown
# POST /user

## Auth
None

## Description
Creates a new user. Validates email, hashes password
with bcrypt, returns JWT token.

## Input
- email (string, required, email format)
- passkey (string, required, min 8 chars)

## Output (201)
- token (string, JWT)
- userData
  - id (uuid)
  - email (string)
  - created_at (datetime)

## Errors
- 409: Email already exists → USER_ALREADY_EXISTS
- 422: Invalid email → INVALID_EMAIL
- 422: Weak password → WEAK_PASSKEY

## Test Scenarios

### Happy Path
**Input:** { "email": "jon@doe.com", "passkey": "securePass123" }
**Expect:** status 201, body contains token and userData

### Duplicate Email
**Seed:** insert user with email "existing@email.com"
**Input:** { "email": "existing@email.com", "passkey": "securePass123" }
**Expect:** status 409, body { "error": "USER_ALREADY_EXISTS" }
```

This file serves three purposes simultaneously:

1. **It's the requirement** — what the software should do
2. **It's the test suite** — scenarios that validate the implementation
3. **It's the documentation** — always up to date, because the code is validated against it

The test **is** the documentation. It can never be outdated.

---

## SDD in the xDD Family

SDD doesn't replace TDD, BDD, or DDD. It sits alongside them:

| Paradigm | First Artifact | Answers |
|----------|---------------|---------|
| **TDD** | Test | "How do I verify it works?" |
| **BDD** | Behavior (Gherkin) | "How should it behave?" |
| **DDD** | Domain model | "How do I model the domain?" |
| **SDD** | Spec | "What should it do?" |

SDD **encompasses** TDD: the spec contains test scenarios. A team using SDD is inherently doing TDD — but with a richer, more accessible source of truth.

---

## The Five Principles

**1. Spec-First.** No code exists without a spec. The spec is written before any implementation. It defines inputs, outputs, errors, side-effects, and test scenarios.

**2. Human Governance.** AI or tools can synthesize code, but humans define constraints (skills/rules) and approve the output. Every piece of code passes through human review.

**3. Validation Against Contract.** Code is done when it passes all test scenarios in the spec — not when the developer says so.

**4. Tool-Agnostic.** SDD works with Cursor, Copilot, CI/CD pipelines, custom engines, or a developer writing code by hand. The spec is the universal input.

**5. Evolvable.** Specs are versioned. When business rules change, the spec is updated. The code evolves to match.

---

## Skills: The Architectural Guardrails

Specs define **what** to build. Skills define **how** to build it.

Skills are Markdown files that codify architectural decisions:

```markdown
# Skill: Security Rules

- NEVER use raw SQL string concatenation
- ALWAYS use parameterized queries
- Passwords MUST be hashed with bcrypt, cost 12 minimum
- JWT tokens MUST use RS256
- NEVER hardcode credentials — use environment variables
```

Skills are consumed by whatever tool does the synthesis:
- In **Cursor**, skills become `.cursor/rules/` files
- In **CI/CD pipelines**, skills are injected into the LLM prompt
- In **manual development**, skills are the coding standards doc

Write skills once, use them everywhere.

---

## Who Writes the Spec?

Everyone.

| Role | Contributes |
|------|------------|
| **Product Manager** | Business rules in natural language |
| **Frontend Dev** | Input/output schemas |
| **Backend Dev** | Side effects, security constraints, edge cases |

A PM can write: *"When the user registers, return a token. If the email exists, return an error."* That's a valid spec. A backend dev can add: *"Hash with bcrypt cost 12. JWT expires in 24h."*

The spec is reviewed in a PR, just like code. The team converges on the final version through the normal review process.

---

## Handling Concurrency

What happens when two developers create specs for the same domain?

SDD uses **one file per domain** with task sections:

```markdown
# /user
Always use JWT for ALL methods, except POST

## TASK-14 - v1
Adds POST /user
(... endpoint details ...)

## TASK-24 - v1
Adds PUT /user
(... endpoint details ...)

## TASK-14 - v2
POST /user now receives age field
(... change details ...)
```

Each task is a section in the same file, not a separate file. Two devs add different sections — if a merge conflict occurs, it's trivial to resolve (just like editing different functions in the same code file).

No consolidation step. No file cleanup. The spec grows naturally with the domain.

---

## How to Implement SDD

SDD is a methodology, not a tool. You choose the implementation that fits your team:

**For small teams (1-10):** Use Cursor with rules that mirror your SDD skills. Reference specs when generating code. Simple, zero infrastructure.

**For medium teams (10+):** Add CI/CD automation. A GitHub Action detects new specs, calls an LLM, generates code, validates against test scenarios, and opens a PR automatically.

**For any team:** Even without AI, SDD works. A developer reads the spec and writes code by hand. The spec still guarantees clear requirements, built-in test scenarios, and living documentation.

---

## What SDD is NOT

SDD is **not** "let AI write your code." AI is one possible synthesis tool, but it's optional.

SDD is **not** a replacement for code review. Human governance is a core principle.

SDD is **not** a rigid process. A simple endpoint might have a 10-line spec. A complex feature might have a 200-line spec. Match the detail to the complexity.

SDD is **not** limited to APIs. Any piece of software that can be specified (input → processing → output) can use SDD.

---

## Getting Started

You can adopt SDD in 30 minutes:

1. Create a `.sdd/specs/` folder in your project
2. Write your first spec for a new feature
3. Create a `.sdd/skills/` folder and write 2-3 architectural rules
4. Develop the feature following the spec
5. Validate: does the code match the spec's test scenarios?

That's it. No tools to install, no infrastructure to set up. The spec is a Markdown file. The skills are Markdown files. Start there.

The full documentation is available on GitHub:

👉 **[github.com/sergiodii/sdd](https://github.com/sergiodii/sdd)**

---

> *"TDD says: write the test first. SDD says: write the spec first — the test, the doc, and the contract are all the same thing."*
