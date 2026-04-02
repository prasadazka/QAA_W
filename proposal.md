# AI-Powered Chatbot System

## WhatsApp & Website Integration

### Registration & Student Affairs Department — Qatar Aeronautical Academy (QAA)

---

## 1. Executive Summary

Qatar Aeronautical Academy (QAA) seeks to modernize and streamline student engagement across its Registration and Student Affairs departments through a secure, scalable, and bilingual **AI-Powered Chatbot System**.

This proposal outlines the design, development, deployment, and support of an enterprise-grade conversational AI platform operating across **WhatsApp (Business API)** and the **QAA website**, providing intelligent automation, governed responses, and seamless escalation to human agents.

The proposed solution goes beyond a basic chatbot by introducing student identification, automated ticketing, response quality governance, voice message handling, and compliance-ready analytics — ensuring high service quality, operational efficiency, and future readiness.

---

## 2. Business Challenges

QAA currently faces the following challenges:

- High volume of repetitive inquiries handled manually
- Delayed responses during admission and peak periods
- Limited after-hours support
- No centralized visibility into inquiry patterns or service performance
- Inconsistent responses across communication channels
- Increasing demand for secure handling of student-specific information

---

## 3. Proposed Solution Overview

We propose an **AI-Powered Multi-Channel Chatbot Platform** with the following capabilities:

- WhatsApp chatbots for Registration and Student Affairs
- Website chatbot widget for Registration inquiries
- Bilingual conversational AI (Arabic & English)
- Excel-driven decision tree with AI intent matching
- Secure student identification for Student Affairs
- Automated ticket creation and departmental routing
- Response quality control and continuous learning
- Voice message processing
- Centralized admin dashboard with analytics and compliance reporting

This solution balances automation with human oversight, ensuring accuracy, reliability, and trust.

---

## 4. Project Objectives

- Provide instant, accurate responses to student inquiries
- Reduce manual workload for Registration and Student Affairs teams
- Offer 24/7 support for common questions
- Ensure consistent and governed responses across channels
- Securely handle student-specific information
- Improve student satisfaction and engagement
- Enable data-driven service improvement
- Build a scalable platform for future integrations (SIS, LMS)

---

## 5. Scope of Work

### 5.1 Communication Channels

**WhatsApp (Business API)**

Two dedicated chatbot instances:

| Chatbot | Target Users | Key Functions |
|---|---|---|
| Registration Bot | Prospective Students | Programs, admission requirements, fees, scholarships, application process |
| Student Affairs Bot | Current Students | Student services, administrative requests, finance & IT support |

**Website Chatbot Widget**

- Embedded on qaa.edu.qa
- Registration inquiries only
- Shared knowledge base with WhatsApp Registration Bot

### 5.2 Core Chatbot Features

**Hybrid Interaction Model**

- Structured menu-driven navigation (decision tree)
- Free-text natural language queries
- Seamless switching between both modes

**Bilingual Support**

- Arabic & English responses
- Automatic language detection
- Manual language switching at any stage

**Knowledge Sources**

- Excel-based FAQ database (primary)
- QAA website content (secondary)
- Digital brochures and documents
- AI-powered summarization for long content

### 5.3 Welcome & Conversation Flow

- Bilingual welcome message
- Clear menu options
- Free-text input at any point
- Context-aware follow-up questions

### 5.4 Live Agent Escalation

- Automatic escalation on low AI confidence
- Manual escalation on user request
- Full conversation history passed to agent
- Agents respond directly via WhatsApp
- Intelligent load balancing and role-based routing

### 5.5 After-Hours Handling

- AI responses available 24/7
- Bilingual away message outside office hours
- Pending escalations queued for next business day

### 5.6 User Feedback & Follow-up

- Post-conversation rating (stars / thumbs up-down)
- Optional text feedback
- Automated resolution confirmation
- Flagging of unresolved or low-rated cases

### 5.7 Student Identification & Access Control

For the Student Affairs WhatsApp chatbot, the system shall support secure student identification through a lightweight Student ID verification process:

- Differentiation between anonymous users and verified students
- Restricted access to sensitive student-specific information
- Secure session handling
- Designed for future integration with QAA's Student Information System (SIS)

### 5.8 Auto Ticket Creation & Department Routing

- Automatic ticket creation upon defined escalation rules
- Ticket routing via email and/or helpdesk platforms (e.g., Freshdesk)
- Routing to IT, Finance, Training, and Administration departments
- Each ticket includes:
  - Conversation history
  - User details (if available)
  - Category, priority, timestamps, and channel
- Ticket status and resolution available in admin reports

### 5.9 Voice Message Support

- Processing of voice messages in Arabic and English
- Support for common Arabic dialects
- Speech-to-Text conversion
- Low-confidence transcription fallback to text prompt or live agent escalation

### 5.10 Disclaimer Message

A bilingual disclaimer shall be displayed at the start of each conversation and remain accessible.

### 5.11 Live Agent Management System

- No separate agent portal required
- All escalated conversations delivered via WhatsApp
- Real-time queue visibility
- Agent availability and workload tracking
- Concurrent chat limits per agent
- Supervisor escalation and transfer options

### 5.12 Administrative Dashboard & Analytics

**Real-Time Monitoring**

- Active conversations
- AI vs agent-handled chats
- Response times
- Queue length and wait times
- Agent utilization

**Historical & Compliance Reports**

- Daily / weekly / monthly analytics
- Peak usage analysis
- FAQ trends and escalation rates
- Ticket resolution metrics
- User satisfaction scores
- Audit trails and data access logs

### 5.13 Knowledge Base Management System

- Excel-based FAQ import (Arabic & English)
- Hierarchical decision tree structure
- Version control and change history
- Audit trail for all updates
- Manual and automated inclusion of new FAQs
- Scheduled website content synchronization
- AI-assisted content summarization

### 5.14 Response Quality Control System

- AI confidence score monitoring
- Configurable escalation thresholds
- Review and approval workflows
- Supervisor quality audits
- Identification of knowledge gaps
- Continuous learning through validated corrections

### 5.15 Security, Access & Compliance

- Hosting in Qatar (Azure or Google Cloud)
- Data residency compliance
- Role-based access control (RBAC)
- Full audit logging of admin actions
- Secure credential and secret management
- WhatsApp Business API security compliance

### 5.16 Professional Services

**Requirement Gathering**

- Stakeholder workshops
- Gap analysis and recommendations

**Training**

- Admin, supervisor, and agent training
- Train-the-trainer sessions
- User manuals and documentation

**Support & Maintenance**

- Post-implementation support
- Helpdesk during business hours
- Regular system updates and security patches

---

## 6. Key Deliverables

1. WhatsApp Registration Chatbot
2. WhatsApp Student Affairs Chatbot
3. Website Chatbot Widget
4. Live Agent Management System
5. Admin Dashboard & Analytics
6. Knowledge Base Management System
7. Response Quality Control System
8. Ticketing Integration
9. Documentation & Training
10. Backup & Disaster Recovery Plan

---

## 7. Proposed Architecture

> *Architecture diagram to be included.*

**Benefits to QAA:**

- Faster response times
- Reduced operational workload
- Secure handling of student data
- Consistent, governed responses
- Actionable analytics and insights
- Scalable and future-ready platform
- Modern digital student experience

---

## 8. Cost Estimation

**Project Development Cost:** USD 160,000
*(In words: One Hundred Sixty Thousand US Dollars only)*

### Tentative GCP Consumption Cost Range

| Environment | Monthly Cost | Project Duration | Purpose | Remarks |
|---|---|---|---|---|
| Development | $650 – $1,000 | $3,900 – $6,000 (6 Months) | Development, testing, experimentation | GCP Cloud services consumption estimate is tentative during development phase till Go-Live. |
| Staging | $4,150 – $5,500 | $16,600 – $22,000 (4 Months) | Pre-production testing, UAT | Post Go-Live, client retains staging & production environments for continued operations & maintenance. |
| Production | $4,150 – $5,500 | $8,300 – $11,000 (2 Months) | Live system, 24/7 availability | |
| **TOTAL** | **$8,950 – $12,000** | **$28,800 – $39,000** | **Complete infrastructure** | |

> **Note:** Cloud Infra & AI Services utilization costs to be borne by Client. Prices are based on GCP component utilization and consumption with projected anticipation of token rate for AI Services. Actual rates may vary in real time.

---

## 9. Implementation Timeline

**24 weeks (6 months)** from project kick-off to production go-live and stabilization.

### Stage 1

#### Phase 0 — Project Initiation & Governance Setup (Weeks 1–2)

**Activities:**

- Formal project kickoff with QAA stakeholders
- Confirm scope, assumptions, dependencies, and success criteria
- Define SLAs, escalation rules, confidence thresholds, KPIs
- WhatsApp Business API onboarding coordination
- Data privacy, hosting, and compliance confirmation (Qatar region)
- Project governance, reporting cadence, and risk management setup

**Deliverables:**

- Approved project plan & timeline
- Governance model & communication plan
- Final requirement confirmation document

#### Phase 1 — Platform Foundation & Cloud Setup (Weeks 3–6)

**Activities:**

- Cloud infrastructure setup (Qatar Azure / Qatar GCP)
- Security baseline: RBAC, audit logging, secrets management
- Core backend services, databases, session management
- WhatsApp Business API integration (Registration Bot + Student Affairs Bot)
- Website chatbot widget framework with QAA branding

**Deliverables:**

- Secure base platform in development environment
- WhatsApp connectivity validated (2 numbers)
- Website chatbot widget embedded in staging
- Admin login & role structure enabled

#### Phase 2 — Knowledge Base & Decision Tree Implementation (Weeks 7–10)

**Activities:**

- Student ID verification for Student Affairs chatbot
- Anonymous vs verified user handling
- Import Excel-based FAQ knowledge base (Arabic & English)
- Category & sub-category decision tree mapping
- Hybrid interaction logic (menu + free-text)
- Website content ingestion & brochure repository
- AI summarization and follow-up question logic

**Deliverables:**

- Registration chatbot knowledge base v1
- Student Affairs chatbot knowledge base v1
- Bilingual responses validated
- Decision tree navigation approved

#### Phase 3 — Live Agent Escalation & Routing (Weeks 11–13)

**Activities:**

- Low-confidence, user-requested, and sensitive-query escalation rules
- Unified agent queue logic
- Intelligent load balancing & role-based routing
- Conversation context handover to agents via WhatsApp
- After-hours handling workflows

**Deliverables:**

- End-to-end AI → Agent escalation flow
- Agent routing & queue dashboards
- After-hours behaviour validated

### Stage 2

#### Phase 4 — Advanced Capabilities v1.1 (Weeks 14–18)

**Activities:**

- Auto ticket creation & routing (Email / Helpdesk — e.g., Freshdesk)
- Sensitive data access enforcement
- Ticket lifecycle tracking for reports
- Response Quality Control System
  - Confidence scoring
  - Review & approval workflows
  - Supervisor QA dashboards
- Voice message processing (Arabic & English)
  - Fallback and auto-escalation on low confidence
- Bilingual disclaimer enforcement

**Deliverables:**

- Student authentication module live in staging
- Ticketing workflows fully operational
- Response quality control system enabled
- Voice message support with fallback logic

#### Phase 5 — Analytics, Compliance & Performance Hardening (Weeks 19–21)

**Activities:**

- Real-time and historical analytics dashboards
- Compliance & audit reports (admin actions, access logs)
- User satisfaction & ticket resolution metrics
- Performance testing (concurrency, peak load)
- Auto-scaling, monitoring, and alerting configuration

**Deliverables:**

- Final analytics & reporting suite
- SLA readiness validation
- Monitoring & alerting enabled

#### Phase 6 — UAT, Training, Go-Live & Stabilization (Weeks 22–24)

**Activities:**

- User Acceptance Testing (Registration & Student Affairs)
- Defect fixes and refinements
- Administrator, supervisor, and agent training
- Documentation & user manuals
- Production cutover (WhatsApp numbers + website widget)
- Hypercare & stabilization support

**Deliverables:**

- UAT sign-off
- Production go-live
- Trained QAA teams
- Final handover & runbooks

---

## 10. Development Stack (Proposed Technology Stack)

### 10.1 Application & Integration Layer

| Component | Technology | Purpose |
|---|---|---|
| Backend API Layer | Python (FastAPI) | Core chatbot logic, orchestration, authentication, ticketing, analytics |
| API Gateway | GCP API Gateway | Secure entry point, routing, rate limiting |
| WhatsApp Integration | WhatsApp Business API | WhatsApp chatbot communication |
| Website Chatbot Widget | JavaScript / React Widget | Embedded chatbot on QAA website |
| Webhooks | HTTPS / REST | Message delivery, escalation, ticket triggers |

### 10.2 AI, NLP & Voice Layer

| Component | Technology | Purpose |
|---|---|---|
| NLP / Intent Engine | LLM + NLU Engine | Intent detection, response generation |
| Decision Tree Engine | Excel-driven Rule Engine | Menu-based chatbot flows |
| AI Summarization | LLM-based | Website & brochure summarization |
| Confidence Scoring | AI Confidence Layer | Escalation decision logic |
| Speech-to-Text | Google Speech-to-Text | Voice message processing (Arabic & English) |
| Language Detection | NLP Engine | Automatic Arabic / English detection |

### 10.3 Data & Knowledge Layer

| Component | Technology | Purpose |
|---|---|---|
| Primary Database | Cloud SQL (PostgreSQL) | FAQs, tickets, users, sessions, reports |
| Cache / Session Store | Memorystore (Redis) | Conversation state, performance |
| Knowledge Base Storage | PostgreSQL + Cloud Storage | FAQs, documents, versions |
| File Storage | Cloud Storage | Brochures, uploads, logs |
| Search / Indexing | DB + Metadata Index | Fast FAQ & content lookup |

### 10.4 Admin, Analytics & Governance

| Component | Technology | Purpose |
|---|---|---|
| Admin Dashboard (UI) | React.js / Next.js | KB management, QA review, reports |
| Authentication | IAM / JWT / OAuth | Secure admin & role-based access |
| RBAC | Custom + IAM | Role-based permissions |
| Analytics Engine | Backend + SQL | Dashboards & reports |
| Audit Logging | Cloud Logging | Compliance & traceability |

### 10.5 Google Cloud Infrastructure (Qatar Region)

| GCP Service | Purpose |
|---|---|
| Vertex AI | Language detection, response generation |
| Cloud Load Balancing | Distributes incoming traffic from WhatsApp Business API and Website Widget across backend services for high availability |
| API Gateway (GCP) | Secure entry point for all chatbot requests — routing, authentication, rate limiting, and request validation |
| Cloud Armor (WAF) | Protects the system from web attacks, DDoS, and malicious traffic with firewall and security rules |
| Cloud Run | Hosts core chatbot services, admin dashboard backend, and agent routing services with automatic scaling |
| Cloud SQL (PostgreSQL) | Stores structured data — FAQs, configuration, chat metadata, user sessions, and reporting data |
| BigQuery | Logging, metrics storage |
| Memorystore (Redis) | In-memory caching for chat sessions, conversation state, and performance optimization |
| Cloud Storage | Documents, brochures, logs, and uploaded files used by the chatbot and knowledge base |
| Cloud Logging | Audit logs, API access logs, error logs, and system events for monitoring and compliance |
| Cloud Monitoring | Real-time system monitoring, alerts, and performance metrics for operations and SLA tracking |
| Cloud CDN | Accelerates delivery of the website chatbot widget and static assets globally with low latency |
| IAM | Manages secure access control for admins, services, and APIs using roles and service accounts |
| Secret Manager | Securely stores sensitive credentials — WhatsApp API keys, database passwords, and tokens |
| VPC Firewall Rules | Controls network-level access between services, databases, and external systems |
| Backup & DR (Cloud SQL + Storage) | Automated backups and disaster recovery for databases and critical data |
| Cloud Scheduler *(Optional)* | Schedules periodic tasks — data sync, cleanup jobs, and health checks |
| Cloud Pub/Sub *(Optional)* | Asynchronous messaging for events — escalations, notifications, and analytics processing |

---

## 11. Core Delivery Team

| Role | Count | Responsibility | Engagement |
|---|---|---|---|
| Project Manager | 1 | Planning, governance, reporting, client coordination | Full (24 weeks) |
| Solution Architect (AI & Cloud) | 1 | Overall architecture, security, AI design | Full (Weeks 1–12), Partial (later) |
| Backend Engineers (Python) | 2 | Chatbot logic, APIs, ticketing, auth, analytics | Full (24 weeks) |
| Frontend Engineer | 1 | Admin dashboard & website widget | Full (Weeks 3–18) |
| AI / NLP Engineer | 1 | NLP tuning, confidence scoring, summarization, voice | Full (Weeks 5–18) |
| DevOps / Cloud Engineer | 2 | Cloud setup, CI/CD, monitoring, scaling | Partial (Weeks 1–10, 19–24) |
| QA / Test Engineer | 2 | Functional, integration, UAT support | Full (Weeks 8–24) |

---

## 12. Conclusion

This AI-Powered Chatbot System provides QAA with a secure, scalable, and governed digital student engagement platform. By combining intelligent automation with structured human oversight, QAA can significantly enhance service quality while optimizing internal operations and preparing for future digital expansion.
