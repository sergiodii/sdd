/**
 * SDD landing — translations (EN default, PT-BR, zh-CN)
 */
window.SDD_I18N = {
    en: {
        meta: {
            title: 'SDD — Spec-Driven Development',
            description: 'A software development methodology where the spec comes first. Write the spec, the code follows.',
            ogDescription: 'Write the spec. The code follows. A new development paradigm alongside TDD, BDD, and DDD.'
        },
        nav: { what: 'What', principles: 'Principles', spec: 'The Spec', workflow: 'Workflow', compare: 'Compare', github: 'GitHub', menu: 'Menu' },
        lang: { en: 'English', pt: 'Português', zh: '中文' },
        hero: {
            badge: 'A new development paradigm',
            title1: 'Write the spec.',
            title2: 'The code follows.',
            subtitle: '<strong>Spec-Driven Development</strong> is a methodology where the spec is the requirement, the test contract, and the documentation — all in one file. Before any line of code is written.',
            learn: 'Learn More',
            viewGithub: 'View on GitHub'
        },
        flow: {
            spec: 'Spec', intent: 'Define intent', skills: 'Skills', constraints: 'Set constraints',
            synthesize: 'Synthesize', genCode: 'Generate code', validate: 'Validate', vsSpec: 'Test vs spec',
            govern: 'Govern', review: 'Human review', ship: 'Ship', prod: 'Production'
        },
        what: {
            badge: 'The Concept', title: 'What is SDD?',
            subtitle: 'SDD sits alongside TDD, BDD, and DDD as a development paradigm. Each answers a different question.',
            imgAlt: 'Spec-First Concept — a Markdown spec transforming into tests, code, and documentation',
            tddFull: 'Test-Driven Development', tddQ: '"How do I verify it works?"', tddA: 'First artifact: <strong>Test</strong>',
            bddFull: 'Behavior-Driven Development', bddQ: '"How should it behave?"', bddA: 'First artifact: <strong>Behavior</strong>',
            dddFull: 'Domain-Driven Design', dddQ: '"How do I model the domain?"', dddA: 'First artifact: <strong>Domain Model</strong>',
            sddFull: 'Spec-Driven Development', sddQ: '"What should it do?"', sddA: 'First artifact: <strong>Spec</strong>',
            quote: 'SDD <strong>encompasses</strong> TDD: the spec contains test scenarios. A team using SDD is inherently doing TDD — but with a richer, more accessible source of truth that everyone on the team can read and write.'
        },
        problem: {
            badge: 'The Problem', title: 'Requirements live everywhere', titleBreak: 'except where they should',
            imgAlt: 'Traditional Development vs Spec-Driven Development comparison',
            tradTitle: 'Traditional Development', sddTitle: 'Spec-Driven Development',
            trad1: 'PM describes feature in a meeting', trad2: 'Dev interprets (differently)', trad3: 'Frontend assumes API contract',
            trad4: 'Backend implements something else', trad5: 'Tests written after (or never)', trad6: 'Docs written later (or never)',
            tradResult: '"That\'s not what I meant."',
            sdd1: 'Anyone writes a spec file', sdd2: 'Spec is reviewed in a PR', sdd3: 'Code is synthesized from spec',
            sdd4: 'Code is validated against spec', sdd5: 'Tests are built into the spec', sdd6: 'The spec <em>is</em> the documentation',
            sddResult: 'Single source of truth. Always.'
        },
        principles: {
            badge: 'Foundation', title: 'Five Principles',
            p1t: 'Spec-First', p1: 'No code exists without a spec. The spec defines inputs, outputs, errors, side-effects, and test scenarios — before any implementation.',
            p2t: 'Human Governance', p2: 'AI synthesizes code, but humans define constraints (skills/rules) and approve the output. Every piece of code passes through human review.',
            p3t: 'Validation Against Contract', p3: 'Code is done when it passes all test scenarios in the spec — not when the developer says so. The spec is the contract.',
            p4t: 'Tool-Agnostic', p4: 'SDD works with Cursor, Copilot, CI/CD pipelines, custom engines, or a developer writing code by hand. The spec is the universal input.',
            p5t: 'Evolvable', p5: 'Specs are versioned. When business rules change, the spec is updated. The code evolves to match. The spec governs the code, not the other way around.'
        },
        spec: {
            badge: 'The Core Artifact', title: 'The Spec',
            subtitle: 'A Markdown file that anyone on the team can write. It defines what the software should do, how to test it, and serves as living documentation.',
            ann1t: "It's the Requirement", ann1: 'What the endpoint does, what it receives, what it returns. No ambiguity.',
            ann2t: "It's the Test Suite", ann2: 'Scenarios with input, expected output, and database assertions. Executable contracts.',
            ann3t: "It's the Documentation", ann3: 'Always up to date. If the spec changes, the code must change. It can never be outdated.'
        },
        specCode: `<span class="code-heading"># POST /user</span>

<span class="code-heading">## Auth</span>
None

<span class="code-heading">## Description</span>
Creates a new user. Validates email format,
hashes password with bcrypt, returns JWT.

<span class="code-heading">## Input</span>
<span class="code-list">- email</span> (string, required, email format)
<span class="code-list">- passkey</span> (string, required, min 8 chars)

<span class="code-heading">## Output (201)</span>
<span class="code-list">- token</span> (string, JWT)
<span class="code-list">- userData</span>
  <span class="code-list">- id</span> (uuid)
  <span class="code-list">- email</span> (string)
  <span class="code-list">- created_at</span> (datetime)

<span class="code-heading">## Errors</span>
<span class="code-list">- 409:</span> Email exists → <span class="code-value">USER_ALREADY_EXISTS</span>
<span class="code-list">- 422:</span> Invalid email → <span class="code-value">INVALID_EMAIL</span>
<span class="code-list">- 422:</span> Weak password → <span class="code-value">WEAK_PASSKEY</span>

<span class="code-heading">## Test Scenarios</span>

<span class="code-heading">### Happy Path</span>
<span class="code-bold">Input:</span> { "email": "jon@doe.com", "passkey": "securePass123" }
<span class="code-bold">Expect:</span> status 201, body contains token
<span class="code-bold">DB:</span> users table has record with email jon@doe.com

<span class="code-heading">### Duplicate Email</span>
<span class="code-bold">Seed:</span> insert user with email existing@email.com
<span class="code-bold">Input:</span> { "email": "existing@email.com", "passkey": "secure123" }
<span class="code-bold">Expect:</span> status 409`,
        skills: {
            badge: 'Guardrails', title: 'Skills & Rules',
            subtitle: 'Specs define <strong>what</strong> to build. Skills define <strong>how</strong> to build it. Architectural constraints that every piece of code must follow.',
            imgAlt: 'Skills and Rules acting as guardrails for code generation',
            arch: 'Architecture', archQ: '"Every endpoint must follow DDD: Handler → Service → Repository"',
            sec: 'Security', secQ: '"Never use raw SQL. Always use parameterized queries. Bcrypt cost 12 minimum."',
            val: 'Validation', valQ: '"Always validate and sanitize all user input. Never trust the client."',
            dep: 'Dependencies', depQ: '"All dependencies injected via constructor. Never instantiate directly."',
            test: 'Testing', testQ: '"Generate unit tests for every service. Edge cases must be covered."',
            nam: 'Naming', namQ: '"Use language conventions. Interfaces don\'t have I prefix. Constructors are New*."',
            portable: 'Skills are portable', cursor: 'Cursor', cicd: 'CI/CD', copilot: 'Copilot', manual: 'Manual',
            cursorPath: '→ .cursor/rules/', cicdPath: '→ LLM system prompt', copilotPath: '→ instructions.md', manualPath: '→ coding standards',
            note: 'Write once, use everywhere. Skills are Markdown files — not tied to any tool.'
        },
        workflow: {
            badge: 'Process', title: 'The Workflow', imgAlt: 'The SDD workflow pipeline — from spec to production',
            s1t: 'Write the Spec', s1: 'PM, frontend dev, or backend dev writes a Markdown file defining the feature: inputs, outputs, errors, side-effects, and test scenarios.', s1w: 'Who: Anyone on the team',
            s2t: 'Review the Spec', s2: 'The spec is reviewed in a Pull Request, just like code. The team verifies business rules, edge cases, and API contracts.', s2w: 'Who: The team (via PR)',
            s3t: 'Synthesize Code', s3: 'Code is generated following the spec and skills. By Cursor, by a CI/CD pipeline calling an LLM, or by a developer writing by hand.', s3w: 'Who: AI tool or developer',
            s4t: 'Validate Against Spec', s4: "The code is executed against the spec's test scenarios. If the output matches the expected contract, the code is valid.", s4w: 'Who: Automated tests',
            s5t: 'Human Review', s5: 'A developer reviews the code for logic, security, and architecture. Feedback feeds back into the synthesis for correction.', s5w: 'Who: Backend dev / Tech lead',
            s6t: 'Ship to Production', s6: 'Approved code is merged and deployed. The spec remains as living documentation. When the spec changes, the cycle restarts.', s6w: 'Who: CI/CD pipeline'
        },
        roles: {
            badge: 'Roles', title: 'Who Does What',
            subtitle: 'SDD democratizes feature definition. Everyone contributes at their level of expertise.',
            imgAlt: 'Who does what — PM, Frontend, and Backend roles in SDD',
            pm: 'Product Manager', pmDoes: 'Defines the <strong>"What"</strong>',
            pmText: 'Writes business rules in natural language. "When the user registers, return a token. If the email exists, return an error."',
            fe: 'Frontend Dev', feDoes: 'Defines the <strong>"Interface"</strong>',
            feText: 'Defines input/output schemas. What the API receives and returns. Error codes the UI needs to handle.',
            be: 'Backend Dev', beDoes: 'Defines the <strong>"How"</strong>',
            beText: 'Writes skills/rules, defines security constraints, reviews generated code. Evolves from code writer to architecture curator.'
        },
        compare: {
            badge: 'Analysis', title: 'Why SDD?',
            thAspect: 'Aspect', thTrad: 'Traditional', thSdd: 'SDD',
            r1a: 'Requirements', r1t: 'Jira tickets, meetings, Slack', r1s: 'Spec file in the repo',
            r2a: 'Tests', r2t: 'Written after code (or never)', r2s: 'Defined before code (in the spec)',
            r3a: 'Documentation', r3t: 'Separate doc (usually outdated)', r3s: 'The spec IS the documentation',
            r4a: 'Consistency', r4t: 'Depends on the developer', r4s: 'Enforced by skills',
            r5a: 'Traceability', r5t: 'Check Slack / memory', r5s: 'Git blame on spec file',
            r6a: 'Onboarding', r6t: '"Read the code"', r6s: '"Read the specs"',
            stat1l: 'Faster feature definition', stat1d: 'Spec replaces meetings + Jira + Confluence',
            stat2l: 'Test coverage guaranteed', stat2d: 'No code without test scenarios in the spec',
            stat3l: 'Outdated documentation', stat3d: 'The spec IS the doc — always in sync'
        },
        start: {
            badge: 'Start Now', title: 'Adopt SDD in 30 Minutes',
            g1: 'Create the SDD structure in your project', g2: 'Define inputs, outputs, errors, and test scenarios',
            g3: 'Codify your architecture decisions and security rules', g4: 'With AI tools or by hand — the spec is the universal input',
            g5: 'Run test scenarios. If they pass, you\'re done.'
        },
        footer: {
            brand: 'Spec-Driven Development', tagline: 'Write the spec. The code follows.',
            docs: 'Documentation', impl: 'Implementations', connect: 'Connect',
            overview: 'Overview', theSpec: 'The Spec', skillsRules: 'Skills & Rules', comp: 'Comparative Analysis',
            allImpl: 'All Implementations', quote: '"TDD says: write the test first. SDD says: write the spec first — the test, the doc, and the contract are all the same thing."'
        },
        docsBase: 'https://github.com/sergiodii/sdd/blob/main/docs/en/',
        docFiles: { overview: '01-overview.md', spec: '02-the-spec.md', skills: '03-skills-and-rules.md', comp: '07-comparative-analysis.md', impl: '06-implementations.md' }
    },
    'pt-BR': {
        meta: {
            title: 'SDD — Desenvolvimento orientado a especificação',
            description: 'Metodologia em que a especificação vem primeiro. Escreva a spec, o código segue.',
            ogDescription: 'Escreva a spec. O código segue. Um novo paradigma ao lado de TDD, BDD e DDD.'
        },
        nav: { what: 'O quê', principles: 'Princípios', spec: 'A spec', workflow: 'Fluxo', compare: 'Comparar', github: 'GitHub', menu: 'Menu' },
        lang: { en: 'English', pt: 'Português', zh: '中文' },
        hero: {
            badge: 'Um novo paradigma de desenvolvimento',
            title1: 'Escreva a spec.',
            title2: 'O código segue.',
            subtitle: '<strong>Spec-Driven Development (SDD)</strong> é uma metodologia em que a spec é o requisito, o contrato de testes e a documentação — tudo em um único arquivo. Antes de qualquer linha de código.',
            learn: 'Saiba mais',
            viewGithub: 'Ver no GitHub'
        },
        flow: {
            spec: 'Spec', intent: 'Definir intenção', skills: 'Skills', constraints: 'Restrições',
            synthesize: 'Sintetizar', genCode: 'Gerar código', validate: 'Validar', vsSpec: 'Teste vs spec',
            govern: 'Governar', review: 'Revisão humana', ship: 'Publicar', prod: 'Produção'
        },
        what: {
            badge: 'O conceito', title: 'O que é SDD?',
            subtitle: 'O SDD convive com TDD, BDD e DDD como paradigma de desenvolvimento. Cada um responde a uma pergunta diferente.',
            imgAlt: 'Conceito spec-first — uma spec Markdown virando testes, código e documentação',
            tddFull: 'Test-Driven Development', tddQ: '"Como verifico se funciona?"', tddA: 'Primeiro artefato: <strong>Teste</strong>',
            bddFull: 'Behavior-Driven Development', bddQ: '"Como deve se comportar?"', bddA: 'Primeiro artefato: <strong>Comportamento</strong>',
            dddFull: 'Domain-Driven Design', dddQ: '"Como modelar o domínio?"', dddA: 'Primeiro artefato: <strong>Modelo de domínio</strong>',
            sddFull: 'Spec-Driven Development', sddQ: '"O que deve fazer?"', sddA: 'Primeiro artefato: <strong>Spec</strong>',
            quote: 'O SDD <strong>engloba</strong> o TDD: a spec contém cenários de teste. Um time em SDD já faz TDD — com uma fonte de verdade mais rica e acessível para todos lerem e escreverem.'
        },
        problem: {
            badge: 'O problema', title: 'Requisitos estão em todo lugar', titleBreak: 'menos onde deveriam',
            imgAlt: 'Comparação desenvolvimento tradicional vs SDD',
            tradTitle: 'Desenvolvimento tradicional', sddTitle: 'Spec-Driven Development',
            trad1: 'PM descreve a feature em reunião', trad2: 'Dev interpreta (diferente)', trad3: 'Front assume contrato da API',
            trad4: 'Back implementa outra coisa', trad5: 'Testes depois do código (ou nunca)', trad6: 'Docs depois (ou nunca)',
            tradResult: '"Não era isso que eu quis dizer."',
            sdd1: 'Qualquer pessoa escreve um arquivo de spec', sdd2: 'Spec revisada em PR', sdd3: 'Código sintetizado a partir da spec',
            sdd4: 'Código validado contra a spec', sdd5: 'Testes embutidos na spec', sdd6: 'A spec <em>é</em> a documentação',
            sddResult: 'Uma única fonte da verdade. Sempre.'
        },
        principles: {
            badge: 'Base', title: 'Cinco princípios',
            p1t: 'Spec primeiro', p1: 'Sem spec não há código. A spec define entradas, saídas, erros, efeitos colaterais e cenários de teste — antes de qualquer implementação.',
            p2t: 'Governança humana', p2: 'A IA sintetiza código, mas humanos definem restrições (skills/regras) e aprovam o resultado. Todo código passa por revisão humana.',
            p3t: 'Validação por contrato', p3: 'O código está pronto quando passa em todos os cenários da spec — não quando o dev acha. A spec é o contrato.',
            p4t: 'Independente de ferramenta', p4: 'SDD funciona com Cursor, Copilot, CI/CD, motores próprios ou dev escrevendo à mão. A spec é a entrada universal.',
            p5t: 'Evoluível', p5: 'Specs versionadas. Quando as regras de negócio mudam, a spec é atualizada. O código evolui para acompanhar. A spec manda no código, não o contrário.'
        },
        spec: {
            badge: 'Artefato central', title: 'A spec',
            subtitle: 'Um arquivo Markdown que qualquer pessoa do time pode escrever. Define o que o software deve fazer, como testar e serve como documentação viva.',
            ann1t: 'É o requisito', ann1: 'O que o endpoint faz, o que recebe e o que devolve. Sem ambiguidade.',
            ann2t: 'É a suíte de testes', ann2: 'Cenários com entrada, saída esperada e asserções de banco. Contratos executáveis.',
            ann3t: 'É a documentação', ann3: 'Sempre atual. Se a spec muda, o código deve mudar. Nunca fica defasada.'
        },
        specCode: `<span class="code-heading"># POST /user</span>

<span class="code-heading">## Autenticação</span>
Nenhuma

<span class="code-heading">## Descrição</span>
Cria um novo usuário. Valida e-mail,
faz hash da senha com bcrypt, retorna JWT.

<span class="code-heading">## Entrada</span>
<span class="code-list">- email</span> (string, obrigatório, formato e-mail)
<span class="code-list">- passkey</span> (string, obrigatório, mín. 8 caracteres)

<span class="code-heading">## Saída (201)</span>
<span class="code-list">- token</span> (string, JWT)
<span class="code-list">- userData</span>
  <span class="code-list">- id</span> (uuid)
  <span class="code-list">- email</span> (string)
  <span class="code-list">- created_at</span> (datetime)

<span class="code-heading">## Erros</span>
<span class="code-list">- 409:</span> E-mail já existe → <span class="code-value">USER_ALREADY_EXISTS</span>
<span class="code-list">- 422:</span> E-mail inválido → <span class="code-value">INVALID_EMAIL</span>
<span class="code-list">- 422:</span> Senha fraca → <span class="code-value">WEAK_PASSKEY</span>

<span class="code-heading">## Cenários de teste</span>

<span class="code-heading">### Caminho feliz</span>
<span class="code-bold">Entrada:</span> { "email": "jon@doe.com", "passkey": "securePass123" }
<span class="code-bold">Esperado:</span> status 201, corpo com token
<span class="code-bold">BD:</span> tabela users com registro jon@doe.com

<span class="code-heading">### E-mail duplicado</span>
<span class="code-bold">Seed:</span> inserir usuário existing@email.com
<span class="code-bold">Entrada:</span> { "email": "existing@email.com", "passkey": "secure123" }
<span class="code-bold">Esperado:</span> status 409`,
        skills: {
            badge: 'Trilhos', title: 'Skills e regras',
            subtitle: 'Specs definem <strong>o quê</strong> construir. Skills definem <strong>como</strong> construir. Restrições de arquitetura que todo código deve seguir.',
            imgAlt: 'Skills e regras como trilhos para geração de código',
            arch: 'Arquitetura', archQ: '"Todo endpoint segue DDD: Handler → Service → Repository"',
            sec: 'Segurança', secQ: '"Sem SQL cru. Sempre consultas parametrizadas. Bcrypt custo mínimo 12."',
            val: 'Validação', valQ: '"Validar e sanitizar toda entrada. Nunca confiar no cliente."',
            dep: 'Dependências', depQ: '"Todas injetadas no construtor. Nunca instanciar direto."',
            test: 'Testes', testQ: '"Testes unitários para cada serviço. Casos de borda cobertos."',
            nam: 'Nomenclatura', namQ: '"Convenções da linguagem. Interfaces sem prefixo I. Construtores New*."',
            portable: 'Skills são portáteis', cursor: 'Cursor', cicd: 'CI/CD', copilot: 'Copilot', manual: 'Manual',
            cursorPath: '→ .cursor/rules/', cicdPath: '→ prompt do LLM', copilotPath: '→ instructions.md', manualPath: '→ padrões de código',
            note: 'Escreva uma vez, use em qualquer lugar. Skills são Markdown — não presas a uma ferramenta.'
        },
        workflow: {
            badge: 'Processo', title: 'O fluxo de trabalho', imgAlt: 'Pipeline SDD — da spec à produção',
            s1t: 'Escrever a spec', s1: 'PM, front ou back escreve Markdown com a feature: entradas, saídas, erros, efeitos e cenários de teste.', s1w: 'Quem: qualquer pessoa do time',
            s2t: 'Revisar a spec', s2: 'A spec é revisada em PR, como código. O time valida regras de negócio, casos extremos e contratos de API.', s2w: 'Quem: o time (via PR)',
            s3t: 'Sintetizar código', s3: 'Código gerado seguindo spec e skills. Cursor, pipeline CI/CD com LLM ou dev à mão.', s3w: 'Quem: ferramenta de IA ou desenvolvedor',
            s4t: 'Validar contra a spec', s4: 'O código roda contra os cenários da spec. Se a saída bate com o contrato, está válido.', s4w: 'Quem: testes automatizados',
            s5t: 'Revisão humana', s5: 'Dev revisa lógica, segurança e arquitetura. Feedback volta para nova síntese se preciso.', s5w: 'Quem: back / tech lead',
            s6t: 'Ir para produção', s6: 'Código aprovado é mergeado e implantado. A spec continua como documentação viva. Mudou a spec, recomeça o ciclo.', s6w: 'Quem: pipeline CI/CD'
        },
        roles: {
            badge: 'Papéis', title: 'Quem faz o quê',
            subtitle: 'O SDD democratiza a definição de features. Cada um contribui no seu nível.',
            imgAlt: 'PM, Frontend e Backend no SDD',
            pm: 'Product Manager', pmDoes: 'Define o <strong>"O quê"</strong>',
            pmText: 'Regras de negócio em linguagem natural. "Ao registrar, retornar token. Se o e-mail existir, retornar erro."',
            fe: 'Dev frontend', feDoes: 'Define a <strong>"Interface"</strong>',
            feText: 'Esquemas de entrada/saída. O que a API recebe e devolve. Códigos de erro para a UI.',
            be: 'Dev backend', beDoes: 'Define o <strong>"Como"</strong>',
            beText: 'Escreve skills/regras, segurança, revisa código gerado. De escritor de código a curador de arquitetura.'
        },
        compare: {
            badge: 'Análise', title: 'Por que SDD?',
            thAspect: 'Aspecto', thTrad: 'Tradicional', thSdd: 'SDD',
            r1a: 'Requisitos', r1t: 'Jira, reuniões, Slack', r1s: 'Arquivo de spec no repositório',
            r2a: 'Testes', r2t: 'Depois do código (ou nunca)', r2s: 'Definidos antes do código (na spec)',
            r3a: 'Documentação', r3t: 'Doc separada (geralmente velha)', r3s: 'A spec É a documentação',
            r4a: 'Consistência', r4t: 'Depende do desenvolvedor', r4s: 'Garantida pelas skills',
            r5a: 'Rastreabilidade', r5t: 'Slack / memória', r5s: 'Git blame na spec',
            r6a: 'Onboarding', r6t: '"Leia o código"', r6s: '"Leia as specs"',
            stat1l: 'Definição de feature mais rápida', stat1d: 'Spec substitui reuniões + Jira + Confluence',
            stat2l: 'Cobertura de testes garantida', stat2d: 'Sem código sem cenários na spec',
            stat3l: 'Documentação desatualizada', stat3d: 'A spec É o doc — sempre alinhado'
        },
        start: {
            badge: 'Comece agora', title: 'Adote SDD em 30 minutos',
            g1: 'Crie a estrutura SDD no projeto', g2: 'Defina entradas, saídas, erros e cenários de teste',
            g3: 'Codifique decisões de arquitetura e segurança', g4: 'Com IA ou à mão — a spec é a entrada universal',
            g5: 'Rode os cenários de teste. Se passarem, pronto.'
        },
        footer: {
            brand: 'Spec-Driven Development', tagline: 'Escreva a spec. O código segue.',
            docs: 'Documentação', impl: 'Implementações', connect: 'Conectar',
            overview: 'Visão geral', theSpec: 'A spec', skillsRules: 'Skills e regras', comp: 'Análise comparativa',
            allImpl: 'Todas as implementações', quote: '"TDD diz: escreva o teste primeiro. SDD diz: escreva a spec primeiro — teste, doc e contrato são a mesma coisa."'
        },
        docsBase: 'https://github.com/sergiodii/sdd/blob/main/docs/pt-br/',
        docFiles: { overview: '01-visao-geral.md', spec: '02-a-spec.md', skills: '03-skills-e-regras.md', comp: '07-analise-comparativa.md', impl: '06-implementacoes.md' }
    },
    'zh-CN': {
        meta: {
            title: 'SDD — 规格驱动开发',
            description: '一种以规格说明为先的软件开发方法论。先写规格，代码随之而生。',
            ogDescription: '先写规格，代码随之而生。与 TDD、BDD、DDD 并列的新范式。'
        },
        nav: { what: '概述', principles: '原则', spec: '规格', workflow: '流程', compare: '对比', github: 'GitHub', menu: '菜单' },
        lang: { en: 'English', pt: 'Português', zh: '中文' },
        hero: {
            badge: '一种新的开发范式',
            title1: '先写规格。',
            title2: '代码随之而生。',
            subtitle: '<strong>规格驱动开发（SDD）</strong>是一种方法论：规格即需求、测试契约与文档——全部集中在一个文件中。在任何代码编写之前。',
            learn: '了解更多',
            viewGithub: '在 GitHub 查看'
        },
        flow: {
            spec: '规格', intent: '明确意图', skills: '技能', constraints: '设定约束',
            synthesize: '合成', genCode: '生成代码', validate: '验证', vsSpec: '对照规格测试',
            govern: '治理', review: '人工评审', ship: '发布', prod: '生产环境'
        },
        what: {
            badge: '概念', title: '什么是 SDD？',
            subtitle: 'SDD 与 TDD、BDD、DDD 并列，是一种开发范式。各自回答不同的问题。',
            imgAlt: '规格优先概念 — Markdown 规格转化为测试、代码与文档',
            tddFull: '测试驱动开发', tddQ: '「如何验证它能工作？」', tddA: '首要产出：<strong>测试</strong>',
            bddFull: '行为驱动开发', bddQ: '「它应如何表现？」', bddA: '首要产出：<strong>行为</strong>',
            dddFull: '领域驱动设计', dddQ: '「如何建模领域？」', dddA: '首要产出：<strong>领域模型</strong>',
            sddFull: '规格驱动开发', sddQ: '「它应该做什么？」', sddA: '首要产出：<strong>规格</strong>',
            quote: 'SDD <strong>涵盖</strong> TDD：规格中包含测试场景。采用 SDD 的团队本质上也在做 TDD——但拥有更丰富、人人可读写的单一事实来源。'
        },
        problem: {
            badge: '问题', title: '需求散落各处', titleBreak: '唯独不在该在的地方',
            imgAlt: '传统开发 vs 规格驱动开发对比',
            tradTitle: '传统开发', sddTitle: '规格驱动开发',
            trad1: '产品经理在会议中描述功能', trad2: '开发者理解各异', trad3: '前端假设 API 契约',
            trad4: '后端实现另一套', trad5: '测试后写或从不写', trad6: '文档后补或从不写',
            tradResult: '「我不是这个意思。」',
            sdd1: '任何人编写规格文件', sdd2: '在 PR 中评审规格', sdd3: '根据规格合成代码',
            sdd4: '对照规格验证代码', sdd5: '测试内建于规格', sdd6: '规格<em>就是</em>文档',
            sddResult: '唯一可信来源。始终如此。'
        },
        principles: {
            badge: '基石', title: '五大原则',
            p1t: '规格优先', p1: '无规格则无代码。规格在实施前定义输入、输出、错误、副作用与测试场景。',
            p2t: '人工治理', p2: 'AI 合成代码，但人类定义约束（技能/规则）并批准结果。每段代码都经人工评审。',
            p3t: '按契约验证', p3: '当代码通过规格中全部测试场景才算完成——而非开发者主观认为完成。规格即契约。',
            p4t: '工具无关', p4: 'SDD 适用于 Cursor、Copilot、CI/CD、定制引擎或手写代码。规格是通用输入。',
            p5t: '可演进', p5: '规格可版本化。业务规则变更时更新规格，代码随之演进。规格驱动代码，而非相反。'
        },
        spec: {
            badge: '核心工件', title: '规格（Spec）',
            subtitle: '团队任何人都能编写的 Markdown 文件。定义软件应做什么、如何测试，并作为活文档。',
            ann1t: '即需求', ann1: '端点做什么、接收什么、返回什么。毫无歧义。',
            ann2t: '即测试套件', ann2: '含输入、期望输出与数据库断言的场景。可执行的契约。',
            ann3t: '即文档', ann3: '永远最新。规格变更则代码必须变更。文档不会过时。'
        },
        specCode: `<span class="code-heading"># POST /user</span>

<span class="code-heading">## 认证</span>
无

<span class="code-heading">## 描述</span>
创建新用户。校验邮箱格式，
使用 bcrypt 哈希密码，返回 JWT。

<span class="code-heading">## 输入</span>
<span class="code-list">- email</span>（字符串，必填，邮箱格式）
<span class="code-list">- passkey</span>（字符串，必填，最少 8 字符）

<span class="code-heading">## 输出 (201)</span>
<span class="code-list">- token</span>（字符串，JWT）
<span class="code-list">- userData</span>
  <span class="code-list">- id</span>（uuid）
  <span class="code-list">- email</span>（字符串）
  <span class="code-list">- created_at</span>（日期时间）

<span class="code-heading">## 错误</span>
<span class="code-list">- 409：</span>邮箱已存在 → <span class="code-value">USER_ALREADY_EXISTS</span>
<span class="code-list">- 422：</span>邮箱无效 → <span class="code-value">INVALID_EMAIL</span>
<span class="code-list">- 422：</span>密码过弱 → <span class="code-value">WEAK_PASSKEY</span>

<span class="code-heading">## 测试场景</span>

<span class="code-heading">### 成功路径</span>
<span class="code-bold">输入：</span>{ "email": "jon@doe.com", "passkey": "securePass123" }
<span class="code-bold">期望：</span>状态 201，响应体含 token
<span class="code-bold">数据库：</span>users 表存在 jon@doe.com 记录

<span class="code-heading">### 重复邮箱</span>
<span class="code-bold">种子数据：</span>插入用户 existing@email.com
<span class="code-bold">输入：</span>{ "email": "existing@email.com", "passkey": "secure123" }
<span class="code-bold">期望：</span>状态 409`,
        skills: {
            badge: '护栏', title: '技能与规则',
            subtitle: '规格定义<strong>做什么</strong>。技能定义<strong>如何做</strong>。每段代码都必须遵守的架构约束。',
            imgAlt: '技能与规则作为代码生成的护栏',
            arch: '架构', archQ: '「每个端点须遵循 DDD：Handler → Service → Repository」',
            sec: '安全', secQ: '「禁止裸 SQL。始终使用参数化查询。bcrypt 成本至少 12。」',
            val: '校验', valQ: '「始终校验并清理用户输入。永不信任客户端。」',
            dep: '依赖', depQ: '「依赖一律通过构造函数注入。禁止直接 new。」',
            test: '测试', testQ: '「每个服务生成单元测试。必须覆盖边界情况。」',
            nam: '命名', namQ: '「遵循语言惯例。接口不加 I 前缀。构造函数用 New*。」',
            portable: '技能可移植', cursor: 'Cursor', cicd: 'CI/CD', copilot: 'Copilot', manual: '手工',
            cursorPath: '→ .cursor/rules/', cicdPath: '→ LLM 系统提示', copilotPath: '→ instructions.md', manualPath: '→ 编码规范',
            note: '一次编写，处处使用。技能是 Markdown 文件——不绑定任何工具。'
        },
        workflow: {
            badge: '流程', title: '工作流', imgAlt: 'SDD 工作流管道 — 从规格到生产',
            s1t: '编写规格', s1: 'PM、前端或后端用 Markdown 定义功能：输入、输出、错误、副作用与测试场景。', s1w: '角色：团队任何人',
            s2t: '评审规格', s2: '规格像代码一样在 Pull Request 中评审。团队验证业务规则、边界情况与 API 契约。', s2w: '角色：团队（通过 PR）',
            s3t: '合成代码', s3: '按规格与技能生成代码。可用 Cursor、调用 LLM 的 CI/CD，或手写。', s3w: '角色：AI 工具或开发者',
            s4t: '对照规格验证', s4: '针对规格的测试场景执行代码。若输出符合契约则有效。', s4w: '角色：自动化测试',
            s5t: '人工评审', s5: '开发者评审逻辑、安全与架构。反馈可回到合成环节修正。', s5w: '角色：后端 / 技术负责人',
            s6t: '上线生产', s6: '批准后合并并部署。规格保留为活文档。规格变更则循环重启。', s6w: '角色：CI/CD 流水线'
        },
        roles: {
            badge: '角色', title: '分工', subtitle: 'SDD 让功能定义民主化。各尽其能。',
            imgAlt: 'PM、前端与后端在 SDD 中的角色',
            pm: '产品经理', pmDoes: '定义<strong>「做什么」</strong>',
            pmText: '用自然语言写业务规则。「用户注册时返回令牌；若邮箱已存在则返回错误。」',
            fe: '前端开发', feDoes: '定义<strong>「接口」</strong>',
            feText: '定义输入/输出模式。API 收什么、返什么。UI 需处理的错误码。',
            be: '后端开发', beDoes: '定义<strong>「如何做」</strong>',
            beText: '编写技能/规则、安全约束、评审生成代码。从写代码的人演进为架构策展人。'
        },
        compare: {
            badge: '分析', title: '为何选择 SDD？',
            thAspect: '方面', thTrad: '传统', thSdd: 'SDD',
            r1a: '需求', r1t: 'Jira、会议、Slack', r1s: '仓库中的规格文件',
            r2a: '测试', r2t: '代码之后写或从不写', r2s: '代码之前定义（在规格中）',
            r3a: '文档', r3t: '独立文档（常过时）', r3s: '规格即文档',
            r4a: '一致性', r4t: '依赖开发者', r4s: '由技能强制执行',
            r5a: '可追溯', r5t: '查 Slack / 凭记忆', r5s: '对规格文件 git blame',
            r6a: '入职', r6t: '「读代码」', r6s: '「读规格」',
            stat1l: '更快定义功能', stat1d: '规格取代会议 + Jira + Confluence',
            stat2l: '测试覆盖有保障', stat2d: '无规格中的场景则无代码',
            stat3l: '文档过时', stat3d: '规格即文档 — 永远同步'
        },
        start: {
            badge: '立即开始', title: '30 分钟上手 SDD',
            g1: '在项目中创建 SDD 目录结构', g2: '定义输入、输出、错误与测试场景',
            g3: '将架构与安全决策写成技能', g4: '用 AI 或手写 — 规格是通用输入',
            g5: '运行测试场景。通过即完成。'
        },
        footer: {
            brand: '规格驱动开发', tagline: '先写规格，代码随之而生。',
            docs: '文档', impl: '实现', connect: '链接',
            overview: '总览', theSpec: '规格', skillsRules: '技能与规则', comp: '对比分析',
            allImpl: '所有实现方式', quote: '「TDD 说：先写测试。SDD 说：先写规格 — 测试、文档与契约本为一体。」'
        },
        docsBase: 'https://github.com/sergiodii/sdd/blob/main/docs/en/',
        docFiles: { overview: '01-overview.md', spec: '02-the-spec.md', skills: '03-skills-and-rules.md', comp: '07-comparative-analysis.md', impl: '06-implementations.md' }
    }
};
