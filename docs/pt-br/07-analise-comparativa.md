# 7. Análise comparativa

## 7.1 SDD vs desenvolvimento tradicional

```mermaid
graph LR
    subgraph "Tradicional"
        direction TB
        T1["PM descreve feature verbalmente"] --> T2["Dev interpreta"]
        T2 --> T3["Dev escreve código"]
        T3 --> T4["Dev escreve testes (talvez)"]
        T4 --> T5["QA testa manualmente"]
        T5 --> T6["Docs escritas (talvez)"]
    end

    subgraph "SDD"
        direction TB
        S1["Qualquer pessoa escreve spec"] --> S2["Código sintetizado"]
        S2 --> S3["Validado contra a spec"]
        S3 --> S4["Humanos revisam"]
        S4 --> S5["Spec = teste = doc (sempre)"]
    end

    style T4 fill:#D0021B,color:#fff
    style T6 fill:#D0021B,color:#fff
    style S1 fill:#4A90D9,color:#fff
    style S3 fill:#417505,color:#fff
    style S5 fill:#417505,color:#fff
```

| Aspecto | Tradicional | SDD |
|---------|-------------|-----|
| **Requisitos** | Verbais, tickets no Jira, reuniões | Arquivo de spec no repositório |
| **Testes** | Escritos depois do código (ou nunca) | Definidos antes do código (na spec) |
| **Documentação** | Doc separada (geralmente desatualizada) | A spec É a documentação |
| **Consistência** | Depende do desenvolvedor | Imposta pelas skills |
| **Rastreabilidade** | "Quem decidiu isso?" → histórico no Slack | "Quem decidiu isso?" → git blame na spec |
| **Onboarding** | "Lê o código" | "Lê as specs" |

---

## 7.2 SDD vs TDD

SDD e TDD são complementares, não concorrentes. O SDD **engloba** o TDD:

```mermaid
graph TD
    subgraph "TDD"
        T1["Escrever teste"] --> T2["Escrever código que passa no teste"]
        T2 --> T3["Refatorar"]
        T3 --> T1
    end

    subgraph "SDD"
        S1["Escrever spec<br/>(inclui cenários de teste)"] --> S2["Sintetizar código"]
        S2 --> S3["Validar contra a spec"]
        S3 --> S4["Revisar e refinar"]
        S4 --> S1
    end

    style S1 fill:#4A90D9,color:#fff
```

| Aspecto | TDD | SDD |
|---------|-----|-----|
| **Primeiro artefato** | Teste unitário | Spec (contém testes e mais) |
| **Escopo do primeiro artefato** | Uma função/método | Feature/endpoint inteiro |
| **Quem escreve** | Desenvolvedor | Qualquer pessoa (PM, dev, frontend) |
| **Valor como documentação** | Baixo (testes são técnicos) | Alto (specs são legíveis) |
| **O que orienta** | Implementação do código | Código, testes, docs, validação |

**Diferença-chave:** No TDD, o teste é puramente técnico — só desenvolvedores leem. No SDD, a spec é legível para todo o time. Um PM pode olhar uma spec e verificar se a regra de negócio está definida corretamente.

---

## 7.3 SDD vs BDD

BDD (Behavior-Driven Development) usa sintaxe Gherkin para descrever comportamento:

```gherkin
Given a user with email "existing@email.com" exists
When I POST /user with email "existing@email.com"
Then I should receive status 409
And the response should contain "USER_ALREADY_EXISTS"
```

O SDD chega ao mesmo resultado com menos cerimônia:

```markdown
### Error — Duplicate Email
**Seed:** insert user with email "existing@email.com"
**Input:** { "email": "existing@email.com", "passkey": "securePass123" }
**Expect:** status 409, body { "error": "USER_ALREADY_EXISTS" }
```

| Aspecto | BDD | SDD |
|---------|-----|-----|
| **Formato** | Gherkin (Given/When/Then) | Markdown (linguagem natural) |
| **Ferramentas** | Cucumber, SpecFlow, etc. | Nenhuma (Markdown é universal) |
| **Curva de aprendizado** | Sintaxe Gherkin | Nenhuma (é só Markdown) |
| **Escopo** | Cenários de comportamento | Definição completa da feature (input, saída, erros, efeitos colaterais, testes) |
| **Quem lê** | QA, desenvolvedores | Todo mundo |

---

## 7.4 SDD vs DDD

DDD (Domain-Driven Design) foca em modelar o domínio. O SDD não substitui o DDD — ele usa DDD por meio de skills:

```mermaid
graph LR
    SDD_SPEC["Spec SDD<br/>(o que construir)"] --> SYNTH["Síntese"]
    DDD_SKILL["Skill DDD<br/>(como estruturar)"] --> SYNTH
    SYNTH --> CODE["Código seguindo<br/>padrões DDD"]

    style SDD_SPEC fill:#4A90D9,color:#fff
    style DDD_SKILL fill:#7B68EE,color:#fff
    style CODE fill:#417505,color:#fff
```

Um time pode usar SDD com skills DDD: a spec define o que o endpoint faz, e a skill DDD garante que o código siga padrões domain-driven (entidades, serviços, repositórios).

---

## 7.5 Vantagens do SDD

```mermaid
mindmap
  root((SDD<br/>Vantagens))
    Clareza
      Specs eliminam ambiguidade
      Todo mundo lê a mesma fonte
      Nada se perde na tradução
    Qualidade
      Testes sempre existem
      Validação contra o contrato
      Skills impõem consistência
    Velocidade
      Síntese com IA acelera entrega
      Menos vai-e-volta em requisitos
      Revisão da spec pega problemas cedo
    Rastreabilidade
      Git blame nas specs
      Quem pediu o quê, quando
      Trilha de auditoria completa
    Acessibilidade
      PMs podem escrever specs
      Devs frontend definem schemas
      Sem gatekeeping técnico
    Evolução
      Feedback vira skills
      Sistema melhora com o tempo
      Specs versionam com o negócio
```

### 1. Specs eliminam ambiguidade

No desenvolvimento tradicional, requisitos ficam em tickets do Jira, Slack, atas de reunião e na cabeça das pessoas. No SDD, o requisito é um arquivo no repositório — versionado, revisável e executável.

### 2. Testes sempre existem

No SDD, não dá para ter código sem testes. A spec define cenários de teste antes de existir código. Isso é mais forte que TDD porque os cenários fazem parte do requisito, não são pensados depois.

### 3. Documentação viva

A spec está sempre atualizada porque o código é validado contra ela. Se a spec muda, o código tem que mudar. Se o código não bate com a spec, a validação falha. A documentação não pode ficar defasada.

### 4. Acessível a quem não é engenheiro

Um Product Manager pode escrever: "Quando o usuário se registrar, devolver um token. Se o e-mail já existir, devolver erro." Isso é uma spec válida. Não precisa de conhecimento técnico para definir o que o software deve fazer.

### 5. Adoção progressiva

O SDD não exige uma virada big-bang. Um time pode começar:
1. Escrevendo specs só para features novas
2. Usando skills como documentação de padrões de código
3. Adicionando automação de validação aos poucos

---

## 7.6 Riscos e desafios

```mermaid
mindmap
  root((SDD<br/>Desafios))
    Disciplina
      Time precisa escrever spec primeiro
      Specs precisam ser revisadas
      Mudança de cultura necessária
    Qualidade da spec
      Specs ambíguas geram código ruim
      Casos de borda faltando
      Super-especificação vs sub-especificação
    Limitações de IA
      Limites de context window
      Não-determinismo entre execuções
      Lógica complexa pode precisar código manual
    Adoção
      Exige mudança cultural
      Investimento inicial em skills
      Resistência à mudança
```

### 1. Disciplina necessária

O SDD só funciona se o time se comprometer a escrever a spec **antes** do código. Se os desenvolvedores pulam a spec e codificam direto, a metodologia desmorona. Isso é desafio cultural, não técnico.

### 2. Qualidade da spec importa

Spec ruim gera código ruim. Se a spec for ambígua, incompleta ou incorreta, o código sintetizado também será. A revisão da spec (passo 2 do fluxo) é crítica.

### 3. IA não é mágica

A síntese de código com IA funciona bem para padrões bem definidos (CRUDs, validações, integrações). Lógica de negócio complexa, código crítico de desempenho ou algoritmos novos ainda podem exigir desenvolvimento manual. O SDD aceita isso — o desenvolvedor sempre pode escrever à mão seguindo a spec.

### 4. Investimento inicial

Escrever o primeiro conjunto de skills leva tempo. O time precisa codificar decisões arquiteturais, regras de segurança e convenções. É um investimento único que se paga ao longo do projeto.

---

## 7.7 Matriz de decisão: quando usar SDD

```mermaid
quadrantChart
    title Viabilidade do SDD por tipo de projeto
    x-axis Baixa complexidade --> Alta complexidade
    y-axis Equipe pequena --> Equipe grande
    quadrant-1 Ideal para SDD
    quadrant-2 SDD com skills cuidadosas
    quadrant-3 SDD opcional
    quadrant-4 Considerar manual + specs
    REST APIs: [0.2, 0.7]
    Microservices: [0.4, 0.8]
    CRUD Apps: [0.1, 0.5]
    Data Pipelines: [0.5, 0.6]
    Trading Systems: [0.9, 0.3]
    ML Pipelines: [0.8, 0.4]
    CLI Tools: [0.3, 0.2]
    Embedded Systems: [0.9, 0.2]
```

| Cenário | Viabilidade SDD | Observações |
|---------|-----------------|-------------|
| **REST APIs** | ✅ Alta | Caso ideal — input/output bem definidos |
| **Microserviços** | ✅ Alta | Cada serviço tem specs claras |
| **Apps CRUD** | ✅ Alta | Padrões repetitivos, ótimos para síntese |
| **Data pipelines** | ✅ Alta | Transformações claras de entrada/saída |
| **Regras de negócio complexas** | ⚠️ Média | Specs precisam ser muito detalhadas |
| **Trading / HFT** | ❌ Baixa | Crítico em desempenho, exige código afinado à mão |
| **ML pipelines** | ❌ Baixa | Experimental, difícil especificar de antemão |
| **Sistemas embarcados** | ❌ Baixa | Específicos de hardware, difícil sintetizar |

---

## 7.8 Resumo

```mermaid
graph TD
    subgraph "Use SDD quando..."
        Y1["Requisitos podem ser especificados de antemão"]
        Y2["Várias pessoas definem features"]
        Y3["Você quer cobertura de testes garantida"]
        Y4["A documentação precisa permanecer atual"]
        Y5["O código segue padrões repetíveis"]
    end

    subgraph "Considere alternativas quando..."
        N1["A lógica é altamente experimental"]
        N2["O desempenho exige ajuste manual"]
        N3["O time resiste a mudança de processo"]
        N4["Features não podem ser especificadas antes de codar"]
    end

    style Y1 fill:#417505,color:#fff
    style Y2 fill:#417505,color:#fff
    style Y3 fill:#417505,color:#fff
    style Y4 fill:#417505,color:#fff
    style Y5 fill:#417505,color:#fff
    style N1 fill:#D0021B,color:#fff
    style N2 fill:#D0021B,color:#fff
    style N3 fill:#D0021B,color:#fff
    style N4 fill:#D0021B,color:#fff
```

> *"TDD diz: escreva o teste primeiro. BDD diz: escreva o comportamento primeiro. DDD diz: modele o domínio primeiro. SDD diz: escreva a spec primeiro — e deixe o resto seguir."*
