---
article: true
article_history: true
article_kind: industry
article_latest: true
article_series: finance
article_summary: >-
  AI in New Zealand finance is moving from pilots into bounded production: open
  banking and AI-assisted lending are scaling, adviser use is rising, and
  regulators are tightening expectations for cyber, governance and third-party
  risk. Autonomous high-stakes decision-making remains limited.
article_updated_at: '2026-11-01T21:00:34+13:00'
article_version: false
description: >-
  AI in New Zealand finance is moving from pilots into bounded production: open
  banking and AI-assisted lending are scaling, adviser use is rising, and…
permalink: /whitepaper/finance/
title: AI in Finance
---

# AI in Finance in Aotearoa New Zealand: A Living Whitepaper

AI in New Zealand finance is moving from pilots into bounded production: open banking and AI-assisted lending are scaling, adviser use is rising, and regulators are tightening expectations for cyber, governance and third-party risk. Autonomous high-stakes decision-making remains limited.

## Executive Summary

- **Adoption is deepening in bounded workflows.** Contact-centre assistance, transcription, summarisation, sentiment analysis and fraud controls remain the strongest production use cases. Westpac has now added automated income and expense categorisation to personal-loan applications, while customers must still review the results before submitting an application. ([Westpac’s Akahu announcement](https://www.westpac.co.nz/about-us/media/westpac-nz-partners-with-akahu-to-speed-up-lending-applications-for-customers/)) ([westpac.co.nz](https://www.westpac.co.nz/about-us/media/westpac-nz-partners-with-akahu-to-speed-up-lending-applications-for-customers/))
- **Open banking is becoming an operating utility.** MBIE reported more than 604,000 payment requests worth over NZ$165 million and more than 23.4 million data-sharing requests in September 2026. The number of accredited requestors reached 15. ([MBIE’s uptake statistics](https://www.mbie.govt.nz/business-and-employment/business/consumer-data-right/consumer-data-right-in-aotearoa-new-zealand/uptake-of-consumer-data-right)) ([mbie.govt.nz](https://www.mbie.govt.nz/business-and-employment/business/consumer-data-right/consumer-data-right-in-aotearoa-new-zealand/uptake-of-consumer-data-right?utm_source=openai))
- **Financial-adviser adoption appears higher than previously evidenced, but the data is survey-based.** An FPSB study reported that 87% of 104 New Zealand respondents were using AI, compared with 80% globally. This is evidence of professional experimentation and adoption, not proof that AI is generating regulated advice or operating at scale across the advice market. ([FPSB research](https://fpsb.org/impact-of-ai-on-financial-planning-global-research/); [NZ Adviser report](https://app-mpamag-eastus.azurewebsites.net/nz/news/general/nz-financial-planners-outpace-global-peers-on-ai-adoption/592623)) ([fpsb.org](https://fpsb.org/impact-of-ai-on-financial-planning-global-research/))
- **Regulatory attention has shifted from exploration toward supervisory expectations.** On 15 October, the RBNZ and FMA outlined expectations covering frontier-AI cyber risk, governance, oversight, operational resilience and third-party concentration. ([RBNZ and FMA statement](https://www.rbnz.govt.nz/news-and-events/news/2026/10/rbnz-and-fma-outline-supervisory-expectations-on-cyber-and-ai-risks)) ([rbnz.govt.nz](https://www.rbnz.govt.nz/news-and-events/news/2026/10/rbnz-and-fma-outline-supervisory-expectations-on-cyber-and-ai-risks))
- **Consumer uptake is growing, but trust remains conditional.** Kiwibank’s 2026 survey found that 12% of respondents had used AI for budgeting or savings advice, while AUT research found that people with lower financial capability and less investment experience were among the least willing to use robo-advice. Both findings are relevant to inclusion and consumer-protection design. ([Kiwibank State of Savings Index](https://www.kiwibank.co.nz/about-us/news-and-updates/media-releases/kiwi-are-finding-ways-to-save-the-banking-system-needs-to-keep-up/); [AUT research](https://www.aut.ac.nz/news/stories/who-is-and-isnt-using-robo-advisers)) ([kiwibank.co.nz](https://www.kiwibank.co.nz/about-us/news-and-updates/media-releases/kiwi-are-finding-ways-to-save-the-banking-system-needs-to-keep-up/))
- **The strongest evidence remains concentrated in human-in-the-loop systems.** Public disclosures still do not demonstrate scaled autonomous lending, personalised advice, investment management, claims adjudication or agentic payments.
- **Agentic finance is progressing through controlled access rather than open delegation.** Sharesies is developing a read-only connection between customer portfolios and external AI agents, but the feature is still in development and available only through a waitlist. ([Sharesies agentic access](https://www.sharesies.nz/agentic)) ([sharesies.nz](https://www.sharesies.nz/agentic?utm_source=openai))

The overall direction is therefore one of **incremental operationalisation**: AI is increasingly embedded in live financial processes, but permissions, customer review, human accountability and existing conduct obligations remain central.

## What Has Changed Since the Last Update

### Open banking has continued to scale

MBIE’s September figures show further growth in regulated open banking:

- More than **604,000 payment requests** were processed.
- The combined value exceeded **NZ$165 million**.
- More than **23.4 million data-sharing requests** were processed.
- **15 organisations** had been approved as accredited requestors.

Payment requests increased by 8.6% from August and payment value by 4.2%. Data-sharing requests fell by 4.8% month-on-month but remained 152.6% above the May baseline. The figures confirm live and growing use, although they do not identify how much activity supports AI-based affordability assessment, personalisation, financial coaching or fraud detection. Open banking remains an enabling infrastructure layer rather than direct evidence of AI adoption. ([mbie.govt.nz](https://www.mbie.govt.nz/business-and-employment/business/consumer-data-right/consumer-data-right-in-aotearoa-new-zealand/uptake-of-consumer-data-right?utm_source=openai))

Westpac has supplied additional, company-reported evidence of adoption. It says open-banking users increased six-fold over the past year, with more than 181,000 unique users benefiting from payments or data sharing. In September, it recorded a 46% monthly increase in account-access requests. These figures are useful indicators of operational activity but have not been independently verified. ([Westpac’s adoption update](https://www.westpac.co.nz/about-us/media/westpac-nz-sees-open-banking-adoption-soar/)) ([westpac.co.nz](https://www.westpac.co.nz/about-us/media/westpac-nz-sees-open-banking-adoption-soar/))

Kiwibank’s current customer-facing pages now describe both payment initiation and account-information sharing through supported third parties. The formal regulatory deadline for Kiwibank to provide account-information services remains **1 December 2026**, so the current position appears to be an early or staged rollout rather than evidence that the entire required capability is complete. ([Kiwibank open banking](https://www.kiwibank.co.nz/banking-with-us/open-banking/); [MBIE banking regulations](https://www.mbie.govt.nz/business-and-employment/business/consumer-data-right/consumer-data-right-policy-design/open-banking)) ([kiwibank.co.nz](https://www.kiwibank.co.nz/banking-with-us/open-banking/))

### Open banking is now being used inside lending workflows

The most material new deployment is Westpac’s partnership with Akahu. Personal-loan applicants can have transaction data from Westpac and other uploaded statements combined and automatically categorised into income and expense groups. Customers must review and amend those categories before submitting the application.

This is not autonomous credit decisioning. It is **data preparation and workflow automation around a lending process**. Westpac says lending applications remain subject to eligibility criteria, lending criteria and applicable terms. The deployment nevertheless matters because it moves open banking closer to a consequential financial decision while retaining a customer review step and existing lending controls. ([westpac.co.nz](https://www.westpac.co.nz/about-us/media/westpac-nz-partners-with-akahu-to-speed-up-lending-applications-for-customers/))

### Evidence from financial advice has strengthened, but remains uneven

The Financial Planning Standards Board’s 2026 global research found that eight in ten financial planners worldwide either use AI or plan to use it within the next 12 months. It also found that 93% reported improved work efficiency, while privacy, cybersecurity, accuracy and reliability remained the leading concerns. ([fpsb.org](https://fpsb.org/impact-of-ai-on-financial-planning-global-research/))

The New Zealand subset reported by NZ Adviser comprised 104 respondents, of whom 87% said they were using AI. New Zealand respondents were also more optimistic than the global sample about AI improving financial advice. These results suggest that AI is becoming a normal professional tool within at least part of the advice community. They do not establish how many firms are using AI in client-facing recommendations, how many have formal policies, or whether adoption is concentrated among larger or digitally confident practices. ([mpamag.com](https://www.mpamag.com/nz/news/general/nz-financial-planners-outpace-global-peers-on-ai-adoption/592623?utm_source=openai))

The FMA’s own thematic review remains incomplete. Its surveys closed on **18 September 2026**, but no findings or sector-wide adoption figures had been published by 1 November. The review is therefore still a fact-finding exercise rather than a new AI-specific rulebook. ([FMA thematic review](https://www.fma.govt.nz/library/reports-and-papers/thematic-review-ai-in-financial-advice/)) ([fma.govt.nz](https://www.fma.govt.nz/library/reports-and-papers/thematic-review-ai-in-financial-advice/?utm_source=openai))

### Regulators have made frontier-AI risk more explicit

The RBNZ and FMA’s 15 October statement is the clearest regulatory development since the previous update. The regulators identified three areas requiring attention:

1. Increased cyber risk.
2. Evolving governance and oversight challenges.
3. Growing third-party and concentration risk.

They also stated that boards and senior management should know where AI is being used, understand the associated risks and identify who is accountable. The statement builds on existing prudential, conduct, cyber and operational-resilience obligations rather than creating a standalone AI-finance regime. ([rbnz.govt.nz](https://www.rbnz.govt.nz/news-and-events/news/2026/10/rbnz-and-fma-outline-supervisory-expectations-on-cyber-and-ai-risks))

The National Cyber Security Centre has separately issued guidance on managing AI token consumption. For financial institutions, this adds a practical operational-resilience issue: uncontrolled model usage can affect cost, capacity, availability, service levels and vendor dependence. It is guidance rather than a finance-sector regulation, but it is relevant to institutions embedding large language models in customer service or internal operations. ([NCSC token-consumption guidance](https://www.ncsc.govt.nz/protect-your-organisation/managing-ai-token-consumption-for-operational-resilience/)) ([ncsc.govt.nz](https://www.ncsc.govt.nz/protect-your-organisation/managing-ai-token-consumption-for-operational-resilience/))

### Consumer-facing investment AI is moving toward controlled access

Sharesies continues to offer AI Search for investment discovery. Its newer agentic-access initiative goes further: the company is developing a model-context-protocol connection that would allow an external AI agent to access portfolio values, balances and holdings on a read-only basis.

The controls are significant. Sharesies describes explicit and scoped consent, revocable access, isolated permissions and no transfer of customer credentials to the agent. The feature is still “coming soon”, access is not guaranteed and the company says it may decide not to proceed. This is an early-access experiment, not autonomous trading or portfolio management. ([sharesies.nz](https://www.sharesies.nz/agentic?utm_source=openai))

## Current State of AI Adoption

| Use case | Current position | Assessment |
|---|---|---|
| Contact-centre assistance | Live at ASB, Westpac, Kiwibank and insurers | Most established production pattern |
| Voicebots and conversational IVR | Used for simple questions and call routing | Bounded, measurable and human-escalated |
| Transcription, summarisation and knowledge assistance | Operating in banking and insurance contact centres | Production use, though performance data is limited |
| Sentiment, complaints and vulnerability detection | Vero has rolled out analysis across consumer and business operations | Early production with conduct implications |
| Fraud and scam prevention | Strategic priority across banks, insurers and regulators | Established capability, limited public metrics |
| Open banking | Growing payment and data-sharing volumes | Operational infrastructure enabling future AI services |
| Lending workflow automation | Westpac uses automated categorisation in personal-loan applications | Live, but not autonomous credit decisioning |
| Financial advice | High reported professional adoption; FMA review ongoing | Expanding, but AI-specific conduct evidence remains thin |
| Investment discovery | Sharesies AI Search is live | Customer-facing, expressly not advice |
| Portfolio access by AI agents | Sharesies read-only MCP connection in development | Experimental and permissioned |
| Claims automation | Tower reports one fully automated motor claim | Narrow straight-through processing |
| Autonomous investment management | No strong public evidence of scaled local deployment | Limited disclosure |
| Agentic payments | Controlled demonstrations and readiness programmes | Not mainstream customer banking |

### Customer service remains the centre of gravity

The sector’s clearest production pattern continues to place AI between a customer interaction and a human employee.

ASB says conversational IVR can answer simple questions and route callers to specialists, contributing to an approximately 40% reduction in average call-wait times compared with FY25. This is a company-reported result and does not disclose containment rates, transfer rates, error rates or customer-outcome effects. ([ASB FY26 result](https://www.asb.co.nz/documents/media-centre/media-releases/as-full-year-result-2026.html)) ([asb.co.nz](https://www.asb.co.nz/documents/media-centre/media-releases/as-full-year-result-2026.html?utm_source=openai))

Westpac’s Dynamics 365 contact-centre platform supports staff with customer and product information during live conversations. Kiwibank has also reported introducing AI-powered tools into customer-service operations. Tower uses real-time transcription, summaries, knowledge assistance and automated quality monitoring, while Vero analyses interactions for sentiment, potential complaints and vulnerability indicators. ([Westpac contact-centre deployment](https://www.westpac.co.nz/about-us/media/westpac-nz-becomes-first-major-nz-company-to-launch-microsoft-ai-tool-to-support-human-to-human-customer-conversations/); [Kiwibank FY26 result](https://www.kiwibank.co.nz/about-us/news-and-updates/media-releases/kiwibank-full-year-results-for-the-year-ended-30-june-2026/); [Tower deployment](https://www.tower.co.nz/news/contact-centre-cuts-call-time/); [Vero deployment](https://suminsured.vero.co.nz/newsroom/vero-launches-ai-powered-customer-sentiment-monitoring-to-streng.html)) ([westpac.co.nz](https://www.westpac.co.nz/about-us/media/westpac-nz-becomes-first-major-nz-company-to-launch-microsoft-ai-tool-to-support-human-to-human-customer-conversations/?utm_source=openai))

The public evidence is strongest on efficiency. Institutions disclose shorter calls, lower handling times or more interactions analysed. They disclose much less about accuracy, customer satisfaction, repeat contacts, accessibility, workforce effects or outcomes for vulnerable customers.

### Lending adoption is moving from analysis toward action

The Westpac-Akahu deployment marks an important change in the boundary between AI assistance and consequential finance. Automatic categorisation affects the information used in a loan application, even though it does not itself approve or decline the loan.

Separate Experian research reported that 76% of surveyed New Zealand financial institutions were using agentic AI for underwriting decision support. However, the result came from vendor-sponsored research and should not be treated as a representative measure of production deployment. The same reporting indicated that only 2% described their data as fully ready for AI-driven decisioning. ([mpamag.com](https://www.mpamag.com/nz/news/general/kiwis-open-to-ai-agents-applying-for-credit-experian-finds/590075))

The evidence therefore points to demand ahead of maturity: lenders are testing AI-assisted affordability and underwriting workflows, but data quality, explainability, trust and accountability remain constraints.

### Advice adoption is rising faster than public governance evidence

The FPSB survey indicates that advisers are using AI for research, analysis, documentation, workflow and client support. The FMA’s March access-to-advice review similarly found that the predominant local pattern was AI enabling advisers rather than replacing them. It identified tools for client analysis, compliance checking, records of advice, budgeting and digital advice delivery. ([FMA access-to-advice review](https://www.fma.govt.nz/assets/Reports/Access-to-advice-Financial-advice-sector-challenges-and-opportunities.pdf)) ([fma.govt.nz](https://www.fma.govt.nz/assets/Reports/Access-to-advice-Financial-advice-sector-challenges-and-opportunities.pdf?utm_source=openai))

The main evidence gap is not whether advisers are trying AI. It is how firms govern it. There is little public information on approved tools, data-retention rules, prompt and output review, record-keeping, bias testing, client disclosure or professional-indemnity treatment.

AUT research adds an important inclusion warning. In a survey of nearly 1,000 New Zealand adults, people with lower financial capability and less investment experience were among the least willing to use robo-advice. Feeling safe, informed and in control was strongly associated with willingness to adopt. Cheaper digital advice will not automatically reach those most in need of it. ([aut.ac.nz](https://www.aut.ac.nz/news/stories/who-is-and-isnt-using-robo-advisers))

### Fraud and scam prevention remains strategically important, but poorly measured publicly

Fraud detection, transaction monitoring, identity verification and scam intervention remain among the most credible AI applications in finance. Payments NZ’s 2026 consumer research found that 76% of respondents were concerned about fraud and scams when making payments, while 55% identified safety and security as the most important factor when considering a new payment method. ([Payments NZ consumer research](https://www.paymentsnz.co.nz/resources/articles/consumer-research-2026/)) ([paymentsnz.co.nz](https://www.paymentsnz.co.nz/resources/articles/consumer-research-2026/))

The public evidence still rarely includes:

- False-positive and false-negative rates.
- Fraud losses avoided.
- The number of legitimate payments delayed or blocked.
- Customer outcomes after automated intervention.
- How vulnerable or digitally excluded customers are treated.
- Human review and appeal processes.

For boards and regulators, the relevant question is not simply whether AI flags more suspicious activity. It is whether institutions can explain, contest and remediate decisions that affect access to money.

### Insurance automation has crossed a narrow threshold

Tower’s FY26 disclosure remains the clearest public New Zealand example of automation reaching a consequential insurance process. The company reported completing its first fully automated motor claim from lodgement through approval and payment without manual intervention. It also reported expanded claims automation and a reduction in average call-handling time. ([Tower FY26 results](https://www.tower.co.nz/wp-content/uploads/2026/05/HY26-Results-Announcement.pdf)) ([tower.co.nz](https://www.tower.co.nz/wp-content/uploads/2026/05/HY26-Results-Announcement.pdf?utm_source=openai))

This should be classified as **bounded straight-through processing**, not general autonomous claims adjudication. The public disclosure does not establish the volume of eligible claims, the complexity or value of the reported case, exception rates, customer appeal rights or comparative outcomes.

Vero’s deployment is a different but important application. Its sentiment analysis scans interactions for dissatisfaction, possible complaints and vulnerability indicators, with staff reviewing flagged cases. The company reports more than 65,000 sentiment outcomes and analysis of approximately 10% of customer email and voice interactions. These are vendor- and company-reported results, not independent validation of classification accuracy or improved outcomes. ([suminsured.vero.co.nz](https://suminsured.vero.co.nz/newsroom/vero-launches-ai-powered-customer-sentiment-monitoring-to-streng.html?utm_source=openai))

### Agentic payments remain infrastructure-led

Visa’s Agentic Ready programme includes ANZ New Zealand, ASB, BNZ and Kiwibank. Mastercard and Westpac have completed authenticated agent-led transactions. These developments test identity, consent, tokenisation, fraud controls and transaction visibility. ([Visa Agentic Ready](https://www.visa.co.nz/about-visa/newsroom/press-releases/visa-welcomes-partners-into-agentic-ready-program-to-unlock-agentic-commerce.html); [Mastercard and Westpac](https://www.mastercard.com/news/ap/en/newsroom/press-releases/en/2026/mastercard-completes-new-zealands-first-authenticated-agentic-transactions-with-westpac-bringing-trust-transparency-and-security-to-ai-powered-commerce/)) ([visa.co.nz](https://www.visa.co.nz/about-visa/newsroom/press-releases/visa-welcomes-partners-into-agentic-ready-program-to-unlock-agentic-commerce.html?utm_source=openai))

They do not demonstrate mainstream autonomous banking. The next evidence threshold is not another successful demonstration; it is controlled customer use with clear spending limits, records of consent, dispute arrangements, reversibility and reporting of failed or disputed transactions.

## Governance, Policy and Regulation

### The regulatory model remains principles-based

New Zealand has not introduced a standalone AI-finance licensing regime. Existing requirements relating to conduct, privacy, credit, outsourcing, operational resilience, cyber risk, fair treatment and record-keeping continue to apply when AI is introduced.

The FMA’s AI-in-advice review is intended to build practical understanding of adoption, risks and safeguards. Its stated areas include governance, oversight, suitability, record-keeping and consumer outcomes. Until the FMA publishes its findings, firms should not treat the review as permission to relax existing obligations. ([fma.govt.nz](https://www.fma.govt.nz/library/reports-and-papers/thematic-review-ai-in-financial-advice/?utm_source=openai))

### Frontier AI has become a supervisory issue

The RBNZ and FMA’s October expectations make clear that frontier AI is being considered as part of regulated entities’ existing risk-management responsibilities. Particular attention is directed to:

- Cyber attacks enabled or accelerated by frontier models.
- AI systems that act with greater autonomy or access wider integrations.
- Governance gaps where boards do not know where AI is deployed.
- Concentration risk where multiple institutions depend on the same model, cloud or platform provider.
- Operational-resilience failures if a model or provider becomes unavailable.

This is a significant shift in emphasis. AI risk is no longer framed only as a question of model accuracy. It is also a question of system dependency, accountability and recoverability. ([rbnz.govt.nz](https://www.rbnz.govt.nz/news-and-events/news/2026/10/rbnz-and-fma-outline-supervisory-expectations-on-cyber-and-ai-risks))

### Consumer warnings are becoming more direct

During World Investor Week in October, the FMA warned that AI-generated investment information may be inaccurate, outdated or misleading, and may present recommendations without understanding an individual’s circumstances, goals or risk tolerance. It advised consumers to treat AI output as one source of information rather than a personal recommendation. ([FMA World Investor Week](https://www.fma.govt.nz/library/campaigns/world-investor-week-2026)) ([fma.govt.nz](https://www.fma.govt.nz/library/campaigns/world-investor-week-2026?utm_source=openai))

This guidance is relevant to regulated firms even when the AI tool is not formally labelled as advice. Search, education and discovery products can influence investment behaviour without making an explicit recommendation. Product classification, disclosures and escalation to licensed advice therefore remain important.

### Operational resilience and third-party risk are becoming central

The FMA’s October operational-resilience work covers areas including outsourcing, technology systems, information security, business continuity and governance across several financial sectors. It is not an AI-specific review, but its themes align closely with the risks created by AI platforms and cloud dependencies. ([FMA operational-resilience thematic](https://www.fma.govt.nz/library/reports-and-papers/operational-resilience-thematic/)) ([fma.govt.nz](https://www.fma.govt.nz/library/reports-and-papers/operational-resilience-thematic/?utm_source=openai))

For institutions deploying AI, minimum governance questions now include:

- Which systems use AI, and for what decisions?
- What data is sent to external providers?
- How are model changes and performance monitored?
- What happens if a provider is unavailable?
- Can staff reconstruct how an output influenced an action?
- What controls prevent prompt injection, data leakage or unauthorised tool use?
- Who owns customer remediation when an AI-enabled process fails?

### Open-banking governance is entering a regulated-led phase

The Payments NZ API Centre ceased operating on 30 September 2026, while MBIE assumed responsibility for regulatory standards management. Open banking remains operational, but standards, certification, participant support and transition arrangements continue to matter.

This is relevant to AI because future services will depend on reliable, consented and traceable access to financial data. Westpac’s lending workflow and Kiwibank’s budgeting and data-sharing integrations illustrate the direction of travel: AI capabilities will increasingly be built on top of governed data-sharing infrastructure rather than isolated models.

## Case Studies

### Westpac and Akahu: automated financial-data preparation for lending

Westpac’s personal-loan workflow combines transaction data from Westpac and other financial providers, automatically categorises income and expenses, and presents the results for customer review.

**Assessment:** This is strong evidence of live AI- or automation-enabled lending support, but not autonomous lending. The customer remains responsible for reviewing the categories, and Westpac retains eligibility and lending controls. The next evidence threshold is whether the system reduces application times without increasing misclassification, exclusion or customer remediation. ([westpac.co.nz](https://www.westpac.co.nz/about-us/media/westpac-nz-partners-with-akahu-to-speed-up-lending-applications-for-customers/))

### Westpac: open banking at customer scale

Westpac reports more than 700,000 open-banking payments worth over NZ$300 million and more than 181,000 unique users across payment and data-sharing services. It has integrated with 11 third parties, including Akahu, POLi and Worldline.

**Assessment:** The figures demonstrate that open banking is moving beyond infrastructure readiness. They remain company-reported and do not reveal how much activity is linked to AI. Their significance lies in creating the data and payment rails on which more advanced financial applications can be built. ([westpac.co.nz](https://www.westpac.co.nz/about-us/media/westpac-nz-sees-open-banking-adoption-soar/))

### ASB, Tower and Vero: production service automation

ASB reports a 40% reduction in average call-wait times associated with conversational IVR. Tower reports more than 796,000 minutes saved through its AI-enabled contact centre and a 15% reduction in customer interaction time. Vero reports sentiment analysis across approximately 10% of customer email and voice interactions. ([asb.co.nz](https://www.asb.co.nz/documents/media-centre/media-releases/as-full-year-result-2026.html?utm_source=openai))

**Assessment:** Together, these deployments show the strongest local pattern: AI supports routing, transcription, summarisation, quality monitoring and early identification of customer distress. The operational case is credible, but public outcome measurement remains limited.

### Financial advice: adoption ahead of disclosure

The FPSB study suggests that AI use among New Zealand financial planners may be above the global average. Financial Advice New Zealand has also developed AI-focused professional education and practical sessions for advisers.

**Assessment:** The advice sector is moving from awareness to capability-building. However, the public evidence does not distinguish adequately between general productivity tools, adviser copilots, digital advice, personalised recommendations and AI-generated regulated advice. The FMA’s findings will be important in establishing that boundary. ([fpsb.org](https://fpsb.org/impact-of-ai-on-financial-planning-global-research/))

### Sharesies: from AI search toward permissioned agents

Sharesies’ AI Search is positioned as investment discovery rather than advice. Its new agentic initiative would allow external AI agents to access selected portfolio information on a read-only basis, subject to explicit and revocable permissions.

**Assessment:** This is a useful example of staged product design. Sharesies is testing agent access before permitting actions such as trading. The waitlist and read-only scope indicate that the company is treating portfolio access as a higher-risk capability than search and summarisation. ([sharesies.nz](https://www.sharesies.nz/investments?utm_source=openai))

## Trends

### 1. AI is moving from the front office into decision preparation

The most important change is not full automation of decisions. It is the automation of the information and workflow immediately before those decisions.

Examples include:

- Categorising income and expenses before a loan application.
- Summarising customer conversations before a staff response.
- Flagging possible vulnerability before a complaint escalates.
- Preparing investment information before a customer decides what to research.
- Extracting and organising data for an adviser or underwriter.

This pattern can produce substantial efficiency gains while preserving a human decision point. It also means that risk can arise even when the final decision remains human: errors in categorisation, prioritisation or summarisation can shape the information a person sees.

### 2. The gap between adoption and measurement is widening

There is now credible evidence that AI is being used in live finance workflows. There is much less evidence on whether it improves outcomes.

Institutions and vendors commonly report:

- Time saved.
- Reduced handling time.
- Increased volumes processed.
- More interactions analysed.
- Higher user or adviser confidence.

They rarely publish:

- Error and hallucination rates.
- Human override rates.
- False positives and false negatives.
- Complaint and remediation data.
- Performance by demographic group.
- Model drift and change-management records.
- Total cost of ownership.
- Workforce redeployment or job-quality effects.

This makes cross-firm comparison difficult and allows deployment claims to appear more mature than the available evidence supports.

### 3. Data foundations remain the practical constraint

Open banking is improving access to structured, consented data, but it does not solve:

- Identity matching.
- Data lineage.
- Affordability definitions.
- Missing or inconsistent transaction descriptions.
- Consent expiry and revocation.
- Explainability.
- Responsibility when third-party data is wrong.

Westpac’s requirement that customers review categorised information before submission illustrates the point. Automation can reduce friction, but data quality and customer control remain necessary safeguards.

### 4. Consumer trust follows the consequence of the action

Consumers appear more comfortable with AI that answers questions, detects scams or reduces administration than with AI that decides whether a loan is approved, a claim is paid or an investment is suitable.

Payments NZ found that safety and security remain the leading considerations for new payment methods. AUT research similarly found that people were more willing to consider robo-advice when they felt secure, informed and in control. ([paymentsnz.co.nz](https://www.paymentsnz.co.nz/resources/articles/consumer-research-2026/))

The commercial implication is that disclosure alone will not be enough. Customers will also need understandable explanations, meaningful review or appeal channels and confidence that a human or accountable institution can intervene.

### 5. The access question is becoming more important

AI could reduce the cost of advice and make some financial services more accessible. The risk is that tools are designed primarily for already confident, digitally capable customers.

AUT’s findings suggest that people who might benefit most from lower-cost digital advice may be least willing to use it. This places greater weight on:

- Plain-language explanations.
- Trusted human support.
- Culturally appropriate engagement.
- Accessible complaint and remediation channels.
- Clear boundaries between information and advice.
- Design that does not assume high financial or digital literacy.

### 6. Agentic finance is advancing through permissioning

The emerging local pattern is not unrestricted delegation. It is constrained access:

- Read-only portfolio access rather than trading.
- Authenticated payment demonstrations rather than general autonomous spending.
- Pre-categorised lending data rather than automatic approval.
- Human review of sentiment and vulnerability flags.
- Narrow contact-centre permissions rather than unrestricted account action.

This suggests that the immediate future of agentic finance in New Zealand will be shaped by identity, consent, limits, auditability and reversibility more than by model capability alone.

## Outlook

### Through the remainder of 2026

The most important developments to watch are:

1. **The FMA’s findings on AI in financial advice**  
   The key issue will be whether the regulator distinguishes clearly between internal productivity tools, adviser support, digital guidance, personalised recommendations and AI that independently delivers regulated advice.

2. **Kiwibank’s formal account-information deadline on 1 December 2026**  
   This should broaden the population able to use regulated open banking and increase the data available to budgeting, lending and financial-management services.

3. **Evidence from AI-assisted lending**  
   Stakeholders should look for application-time reductions, customer correction rates, exclusion effects and whether automated categorisation changes approval outcomes.

4. **Claims automation at scale**  
   The next meaningful evidence threshold for Tower and other insurers is automated-claim volume, eligibility rules, exception rates, appeals and customer outcomes.

5. **Supervisory follow-through on frontier-AI risk**  
   Boards and senior management should expect more detailed questions about AI inventories, third-party providers, cyber controls, model changes and operational resilience.

6. **Agentic portfolio and payment trials**  
   Public evidence will improve if firms disclose not only successful demonstrations but also failed, disputed, blocked or reversed transactions.

### Into 2027

The likely path is incremental expansion:

- AI copilots will become standard in customer service, advice and operations.
- Fraud and scam controls will integrate more closely with identity, payments and customer communications.
- Open-banking data will support more budgeting, cash-flow and embedded-finance services.
- Digital and hybrid advice models will expand under closer FMA scrutiny.
- Lending and claims automation will grow in narrow, rule-defined segments.
- Financial institutions will formalise AI inventories, approval processes and third-party controls.
- Consumers will increasingly expect clear disclosure when AI materially shapes a financial interaction or decision.

The principal strategic risk is not a failure to adopt AI. It is adoption that expands faster than measurement, accountability and resilience controls.

## Overall Assessment

As of **1 November 2026**, AI in Aotearoa New Zealand finance is **operationally established in customer service, workflow automation, fraud-related activity, open banking and selected insurance processes. Advice adoption is rising, while lending, investment access and agentic payments are moving into controlled production or early-access phases.**

Since the previous update:

- Open banking has continued to grow and is now being embedded in lending workflows.
- Westpac has added automated financial-data categorisation to personal-loan applications.
- Kiwibank is advertising customer-facing data-sharing functionality ahead of its formal 1 December deadline.
- Adviser AI adoption has become more visible through new professional research, although the evidence remains survey-based.
- The FMA’s AI advice review remains unfinished.
- RBNZ and FMA have made frontier-AI cyber, governance and concentration risks explicit supervisory concerns.
- Sharesies has progressed from AI-powered investment search toward a controlled, read-only agent-access model.
- No evidence has emerged of scaled autonomous lending, advice, investment management or claims adjudication.

The dominant operating model remains:

> **AI as copilot, classifier, data-preparation layer, workflow engine and bounded automation—with human accountability retained for higher-consequence outcomes.**

The strategic question is now whether financial institutions can demonstrate that these systems produce reliable and fair customer outcomes, remain resilient when external models or providers fail, protect privacy and agency, and preserve meaningful human accountability as AI moves closer to execution.