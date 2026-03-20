# Spec-Driven Development: Escreva a Spec, o Codigo Vem Depois

## Uma nova metodologia de desenvolvimento onde a spec e o requisito, o teste e a documentacao — tudo em um unico arquivo.

---

E se toda feature do seu codebase tivesse uma unica fonte de verdade — um arquivo que simultaneamente descreve o que o software deve fazer, como testa-lo e como ele funciona?

Nao um ticket no Jira desatualizado no sprint 2. Nao uma pagina no Confluence que ninguem mantem. Nao uma mensagem no Slack perdida em uma thread.

Um **arquivo de spec** no repositorio, versionado junto com o codigo, que governa tudo.

Eu chamo de **SDD: Spec-Driven Development**.

---

## O Problema Que Todos Conhecemos

Desenvolvimento de software tem um segredo sujo: **requisitos vivem em todo lugar exceto onde deveriam**.

O PM descreve a feature em uma reuniao. O dev interpreta. O dev front assume um contrato de API. O dev back implementa algo levemente diferente. QA testa baseado no que lembra da reuniao. Documentacao e escrita tres meses depois (ou nunca).

Todo mundo trabalha a partir de uma fonte de verdade diferente. E quando as coisas quebram, a conversa e sempre a mesma: *"Nao era isso que eu quis dizer."*

O TDD deu uma solucao parcial: escreva o teste primeiro, depois o codigo. Mas testes sao tecnicos — so devs os leem. O PM nao consegue olhar um teste unitario e verificar se a regra de negocio esta correta.

O BDD tentou resolver com sintaxe Gherkin. Mas introduziu complexidade de ferramentas (Cucumber, SpecFlow) e uma linguagem nova para aprender.

O SDD tem uma abordagem diferente: **escreva um arquivo Markdown que qualquer pessoa consiga ler**.

---

## O Que e Uma Spec?

Uma spec no SDD e um arquivo Markdown que define tudo sobre uma feature:

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

Esse arquivo serve tres propositos simultaneamente:

1. **E o requisito** — o que o software deve fazer
2. **E a suite de testes** — cenarios que validam a implementacao
3. **E a documentacao** — sempre atualizada, porque o codigo e validado contra ela

O teste **e** a documentacao. Ele nunca pode ficar desatualizado.

---

## SDD na Familia xDD

O SDD nao substitui TDD, BDD ou DDD. Ele se posiciona ao lado deles:

| Paradigma | Primeiro Artefato | Responde |
|-----------|------------------|----------|
| **TDD** | Teste | "Como verifico que funciona?" |
| **BDD** | Comportamento (Gherkin) | "Como deve se comportar?" |
| **DDD** | Modelo de dominio | "Como modelo o dominio?" |
| **SDD** | Spec | "O que deve fazer?" |

O SDD **engloba** o TDD: a spec contem cenarios de teste. Um time usando SDD esta inerentemente fazendo TDD — mas com uma fonte de verdade mais rica e acessivel.

---

## Os Cinco Principios

**1. Spec-First.** Nenhum codigo existe sem uma spec. A spec e escrita antes de qualquer implementacao. Ela define inputs, outputs, erros, side-effects e cenarios de teste.

**2. Governanca Humana.** IA ou ferramentas podem sintetizar codigo, mas humanos definem as restricoes (skills/rules) e aprovam o resultado. Todo codigo passa por review humano.

**3. Validacao Contra Contrato.** O codigo esta pronto quando passa em todos os cenarios de teste da spec — nao quando o dev diz que esta.

**4. Agnostico de Ferramenta.** O SDD funciona com Cursor, Copilot, pipelines CI/CD, engines customizados ou um dev escrevendo codigo a mao. A spec e o input universal.

**5. Evolutivo.** Specs sao versionadas. Quando regras de negocio mudam, a spec e atualizada. O codigo evolui para corresponder.

---

## Skills: As Guardrails Arquiteturais

Specs definem **o que** construir. Skills definem **como** construir.

Skills sao arquivos Markdown que codificam decisoes arquiteturais:

```markdown
# Skill: Security Rules

- NEVER use raw SQL string concatenation
- ALWAYS use parameterized queries
- Passwords MUST be hashed with bcrypt, cost 12 minimum
- JWT tokens MUST use RS256
- NEVER hardcode credentials — use environment variables
```

Skills sao consumidas por qualquer ferramenta de sintese:
- No **Cursor**, skills viram arquivos `.cursor/rules/`
- Em **pipelines CI/CD**, skills sao injetadas no prompt da LLM
- Em **desenvolvimento manual**, skills sao o documento de padroes de codigo

Escreva uma vez, use em todo lugar.

---

## Quem Escreve a Spec?

Todo mundo.

| Papel | Contribui com |
|-------|--------------|
| **Product Manager** | Regras de negocio em linguagem natural |
| **Dev Frontend** | Schemas de input/output |
| **Dev Backend** | Side effects, restricoes de seguranca, edge cases |

Um PM pode escrever: *"Quando o usuario se registrar, retorne um token. Se o email ja existir, retorne erro."* Isso e uma spec valida. O dev back pode adicionar: *"Hash com bcrypt cost 12. JWT expira em 24h."*

A spec e revisada em um PR, como codigo. O time converge na versao final pelo processo normal de review.

---

## Lidando Com Concorrencia

O que acontece quando dois devs criam specs para o mesmo dominio?

O SDD usa **um arquivo por dominio** com secoes de tarefa:

```markdown
# /user
Sempre use JWT para TODOS os metodos, exceto POST

## TAREFA-14 - v1
Adiciona POST /user
(... detalhes do endpoint ...)

## TAREFA-24 - v1
Adiciona PUT /user
(... detalhes do endpoint ...)

## TAREFA-14 - v2
POST /user agora recebe idade
(... detalhes da mudanca ...)
```

Cada tarefa e uma secao no mesmo arquivo, nao um arquivo separado. Dois devs adicionam secoes diferentes — se houver conflito de merge, e trivial de resolver (assim como editar funcoes diferentes no mesmo arquivo de codigo).

Sem etapa de consolidacao. Sem limpeza de arquivos. A spec cresce naturalmente com o dominio.

---

## Como Implementar o SDD

O SDD e uma metodologia, nao uma ferramenta. Voce escolhe a implementacao que cabe no seu time:

**Para times pequenos (1-10):** Use o Cursor com rules que espelham suas skills SDD. Referencie as specs ao gerar codigo. Simples, zero infraestrutura.

**Para times medios (10+):** Adicione automacao de CI/CD. Uma GitHub Action detecta specs novas, chama uma LLM, gera codigo, valida contra os cenarios de teste e abre um PR automaticamente.

**Para qualquer time:** Mesmo sem IA, o SDD funciona. O dev le a spec e escreve codigo a mao. A spec ainda garante requisitos claros, cenarios de teste embutidos e documentacao viva.

---

## O Que o SDD NAO E

O SDD **nao e** "deixar a IA escrever seu codigo." IA e uma ferramenta de sintese possivel, mas e opcional.

O SDD **nao e** substituto para code review. Governanca humana e um principio fundamental.

O SDD **nao e** um processo rigido. Um endpoint simples pode ter uma spec de 10 linhas. Uma feature complexa pode ter uma spec de 200 linhas. Adeque o detalhe a complexidade.

O SDD **nao e** limitado a APIs. Qualquer software que possa ser especificado (input → processamento → output) pode usar SDD.

---

## Comecando

Voce pode adotar o SDD em 30 minutos:

1. Crie uma pasta `.sdd/specs/` no seu projeto
2. Escreva sua primeira spec para uma feature nova
3. Crie uma pasta `.sdd/skills/` e escreva 2-3 regras arquiteturais
4. Desenvolva a feature seguindo a spec
5. Valide: o codigo corresponde aos cenarios de teste da spec?

Pronto. Sem ferramentas para instalar, sem infraestrutura para configurar. A spec e um arquivo Markdown. As skills sao arquivos Markdown. Comece por ai.

A documentacao completa esta disponivel no GitHub:

👉 **[github.com/sergiodii/sdd](https://github.com/sergiodii/sdd)**

---

> *"O TDD diz: escreva o teste primeiro. O SDD diz: escreva a spec primeiro — o teste, a doc e o contrato sao a mesma coisa."*
