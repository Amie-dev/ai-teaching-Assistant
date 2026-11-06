# PRD v2: AI Teaching Assistant – Classrooms, Discussion Halls and Agentic RAG Tutoring

**Programme:** B.Tech CSE, Semester 7
**Guide:** Ms. Ria Pyne
**Team:** Aminul Islam, Ayan Mahapatra, Md Yusuf, Soniya Samanta, Soubhik Das
**Version:** 2.0 (2026-11-06)
**Status:** Draft for team review

**What changed from v1:** v1 was a single-user PDF chat tutor. v2 turns it into a multi-classroom platform. Teachers create classrooms, each classroom has its own resources, and each classroom has several discussion halls where many students talk in real time. The AI tutor (agentic RAG with Socratic mode) works inside each classroom and inside halls, using only that classroom's resources.

---

## 1. Overview

### 1.1 Product summary

A web platform where a teacher creates a **classroom**, uploads **resources** (PDFs) for it, and invites students. Students get a course-grounded **AI Teaching Assistant** that answers factual questions directly and guides conceptual questions Socratically, always citing source file and page. Each classroom also has multiple **discussion halls** where students and teachers chat live, and anyone can summon the AI inside a hall.

### 1.2 Vision

One place per course where the material, the AI help and the peer discussion live together, and every AI answer can be checked against the course's own resources.

### 1.3 Problem statement

| Problem | Impact |
| --- | --- |
| Instructor access is limited outside class hours | Students wait for help or give up |
| Course PDFs are hard to search by meaning | Ctrl+F misses context |
| General LLMs hallucinate or drift from the course | Wrong or off-syllabus answers |
| Factual and conceptual questions need different teaching styles | Over-explaining facts or giving away concepts |
| Course material, chat apps and AI tools are scattered | Context is lost; discussions are not tied to the material |
| Peer discussion has no structure (one big group chat) | Topics mix; answers get buried |

### 1.4 Primary innovation

1. Course-grounded RAG, isolated per classroom.
2. Agentic routing that picks direct answers or Socratic guidance per question.
3. Discussion halls with an AI participant that cites the classroom's own resources.

---

## 2. Goals, non-goals and success metrics

### 2.1 Goals

| ID | Goal |
| --- | --- |
| G1 | Teachers can create classrooms and upload their own resources. |
| G2 | Every AI answer is grounded only in that classroom's resources, with source file and page. |
| G3 | Questions are classified (factual vs conceptual) and routed to the Direct Answer or Socratic Tutor agent. |
| G4 | A user can belong to multiple classrooms and switch between them. |
| G5 | Each classroom has multiple discussion halls with real-time chat for many students at once. |
| G6 | Students can call the AI inside a hall and everyone sees the cited answer. |
| G7 | Teachers can moderate halls and see what students struggle with. |

### 2.2 Non-goals (this version)

- Grading, assignments and gradebooks.
- Video or voice calls in halls (text only).
- Scanned or handwritten PDFs (OCR is future scope).
- Integration with external LMS tools (Moodle, Google Classroom).
- Native mobile apps (responsive web only).

### 2.3 Success metrics (proposed targets; replace with measured values)

| Area | Metric | Target |
| --- | --- | --- |
| AI quality | Retrieval relevance (relevant chunk in top-k) | 85% or higher |
| AI quality | Classifier accuracy (factual vs conceptual) | 90% or higher |
| AI quality | Answer grounding (supported by cited source) | 90% or higher |
| AI quality | Out-of-scope questions answered with "not found" | 95% or higher |
| Isolation | Answers citing a resource from another classroom | 0 |
| Performance | AI answer time (average, end to end) | Under 6 s |
| Performance | Hall message delivery (sender to all online members) | Under 1 s |
| Capacity | Concurrent users in one hall (demo target) | 50 or more |
| Engagement | Share of students who post in a hall or ask the AI in a week | Tracked, baseline set in pilot |
| Feedback | Helpful rating on AI answers | 80% or higher thumbs up |

---

## 3. Users, roles and permissions

### 3.1 Personas

| Persona | Needs | Pain today |
| --- | --- | --- |
| Teacher / instructor | Create a classroom, upload resources once, trust the AI, see where students struggle, keep discussion on topic | Repeats explanations; cannot see unanswered doubts; worries about AI misinformation |
| Student | Fast, correct, syllabus-aligned help; learn the concept; talk with classmates | No help at night; generic chatbots go off-syllabus; chats not tied to the material |
| Teaching assistant (TA, optional) | Help moderate and manage resources | No tools between teacher and student |
| Platform admin (optional) | Manage users and abuse reports | Not needed for the demo |

### 3.2 Permission matrix

| Action | Teacher (owner) | TA | Student |
| --- | --- | --- | --- |
| Create / edit / archive classroom | Yes | No | No |
| Invite or remove members, change roles | Yes | Invite only | No |
| Upload, publish, delete resources | Yes | Yes | No |
| View published resources | Yes | Yes | Yes |
| Ask the AI (private chat) | Yes | Yes | Yes |
| Create / lock / archive discussion halls | Yes | Yes | Propose a hall (needs approval, optional) |
| Post and reply in halls | Yes | Yes | Yes (unless muted) |
| Pin, delete messages, mute members | Yes | Yes | No (can report) |
| Call the AI in a hall (`@assistant`) | Yes | Yes | Yes (rate limited) |
| See classroom analytics | Yes | Yes (read) | No |

---

## 4. Key user flows

1. **Teacher sets up a course:** sign up → create classroom (name, subject, description) → upload PDFs → publish → share join code or invite link → default halls are created.
2. **Student joins:** sign in → enter join code → classroom appears in the sidebar → opens resources, AI assistant and halls.
3. **Student asks the AI privately:** opens a classroom's Assistant tab → asks a question → system retrieves from that classroom's resources → classifies → Direct Answer or Socratic reply with source chips → opens the source page.
4. **Student discusses in a hall:** opens a hall → sees live messages and who is online → posts, replies in a thread, reacts → types `@assistant` with a question → AI answers in the hall with sources for everyone.
5. **Teacher moderates:** pins an announcement, deletes an off-topic message, mutes a member, locks a hall during an exam.
6. **Teacher reviews analytics:** sees most asked topics, questions the AI could not answer ("gaps"), and which resources are cited most; uploads a missing resource.

---

## 5. Feature requirements

Priority: **P0** = must for demo, **P1** = should, **P2** = could.

### 5.1 Accounts and authentication

| ID | Requirement | Priority |
| --- | --- | --- |
| AUTH-1 | Sign up and sign in with email and password; passwords hashed | P0 |
| AUTH-2 | Roles (teacher, student) set per classroom membership, not globally | P0 |
| AUTH-3 | Session handled with secure tokens; logout invalidates the session | P0 |
| AUTH-4 | Profile with display name and avatar | P1 |
| AUTH-5 | Social login (for example Google) | P2 |

### 5.2 Classrooms

| ID | Requirement | Priority |
| --- | --- | --- |
| CR-1 | A teacher can create a classroom with name, subject, description and optional cover | P0 |
| CR-2 | Each classroom has a unique join code and an invite link that can be reset or disabled | P0 |
| CR-3 | A user can belong to many classrooms; a sidebar lists them with unread counts | P0 |
| CR-4 | Classroom has a member list with roles (teacher, TA, student) | P0 |
| CR-5 | Teacher can remove members and change roles | P1 |
| CR-6 | Classroom can be archived (read-only) and restored | P1 |
| CR-7 | Classroom settings: AI on/off, Socratic turn limit, hall creation rules | P1 |
| CR-8 | Announcements pinned at the top of the classroom | P2 |

### 5.3 Classroom resources

Each classroom owns its resources. Nothing is shared across classrooms unless a teacher uploads it again.

| ID | Requirement | Priority |
| --- | --- | --- |
| RES-1 | Teacher or TA uploads one or more PDFs to a classroom | P0 |
| RES-2 | Upload is validated (type, size) and shows indexing status: uploaded, indexing, ready, failed | P0 |
| RES-3 | Text is extracted page by page with source and page metadata, then chunked and embedded | P0 |
| RES-4 | Vectors are stored per classroom so retrieval only searches that classroom's resources | P0 |
| RES-5 | Resources can be organized by unit or topic tag | P1 |
| RES-6 | Resources have draft and published states; only published ones are searchable | P1 |
| RES-7 | Deleting a resource removes its file, chunks and vectors | P0 |
| RES-8 | Re-uploading the same file does not create duplicate vectors | P1 |
| RES-9 | Students can view and download published resources | P0 |
| RES-10 | Source viewer opens a resource at the cited page | P1 |
| RES-11 | Support for slides, DOCX and links as resources | P2 |

### 5.4 AI Teaching Assistant (per classroom)

| ID | Requirement | Priority |
| --- | --- | --- |
| AI-1 | The assistant answers only from the classroom's published resources | P0 |
| AI-2 | Question is embedded; top-k chunks above a relevance threshold are retrieved | P0 |
| AI-3 | If nothing passes the threshold, the assistant says the material does not cover it and does not guess | P0 |
| AI-4 | Llama 3.1 via Groq classifies the question as factual or conceptual (structured output with confidence) | P0 |
| AI-5 | LangGraph.js routes factual to the Direct Answer agent and conceptual to the Socratic Tutor agent | P0 |
| AI-6 | Every answer lists sources as file and page; chips open the source viewer | P0 |
| AI-7 | Private chat history per student per classroom, with follow-up memory | P1 |
| AI-8 | "Just give me the answer" control in Socratic mode; automatic full answer after N turns (default 3) | P1 |
| AI-9 | Thumbs up / down on answers, with optional reason | P1 |
| AI-10 | Hybrid retrieval (keyword plus vector) or re-ranking to improve relevance | P2 |
| AI-11 | Quiz mode: generate practice questions from a chosen resource or unit and check answers | P2 |
| AI-12 | Summarize a resource or unit with page citations | P2 |

### 5.5 Discussion halls

A classroom has many halls. Each hall is its own room for real-time conversation among the classroom's members.

| ID | Requirement | Priority |
| --- | --- | --- |
| DH-1 | Each classroom gets default halls on creation (for example General, Doubts, Announcements) | P0 |
| DH-2 | Teacher or TA can create more halls with name, description and topic (for example one per unit, exam prep, project groups) | P0 |
| DH-3 | Hall types: **Open** (all classroom members), **Private** (invited members only), **Announcement** (only teachers post) | P0 / P1 |
| DH-4 | Many students can be connected to the same hall at once; messages appear live for everyone | P0 |
| DH-5 | Message history is saved and loads on entry with infinite scroll | P0 |
| DH-6 | Presence: online members list and typing indicator | P1 |
| DH-7 | Replies and threads on a message | P1 |
| DH-8 | Mentions: `@name` notifies the person; `@assistant` calls the AI | P0 (`@assistant`) / P1 (names) |
| DH-9 | Reactions (emoji) on messages | P2 |
| DH-10 | Attach an image or file to a message (size limited) | P1 |
| DH-11 | Link a message to a resource page (for example "see Chapter 3, p.14") that opens the source viewer | P1 |
| DH-12 | Pin messages; edit and delete own messages | P1 |
| DH-13 | Unread counts per hall and a "jump to latest" control | P1 |
| DH-14 | Search messages within a hall and across a classroom | P2 |
| DH-15 | Teacher or TA can lock a hall (read-only), archive it, or delete a message | P0 |
| DH-16 | Teacher or TA can mute a member in a hall for a set time | P1 |
| DH-17 | Members can report a message; reports are visible to teacher and TA | P1 |
| DH-18 | Student-proposed halls need teacher approval | P2 |
| DH-19 | AI hall summary: "summarize the last N messages" with action items | P2 |

### 5.6 AI inside discussion halls

| ID | Requirement | Priority |
| --- | --- | --- |
| HAI-1 | `@assistant <question>` runs the same retrieve → classify → route pipeline, limited to this classroom's resources | P0 |
| HAI-2 | The reply is posted in the hall as an AI message with a visible AI badge and source chips | P0 |
| HAI-3 | In halls the reply is shared, so conceptual questions use short Socratic prompts that other students can join in answering | P1 |
| HAI-4 | Rate limit per user and per hall (proposed: 5 AI calls per user per minute) | P0 |
| HAI-5 | The AI never replies unless called, and never reads halls to train or learn | P0 |
| HAI-6 | AI messages can be deleted by teacher or TA | P1 |
| HAI-7 | Hall context: the AI may use the last few messages in the thread as conversation context | P1 |

### 5.7 Notifications

| ID | Requirement | Priority |
| --- | --- | --- |
| NT-1 | In-app notifications for mentions, replies, new announcements and resource published | P1 |
| NT-2 | Per-hall mute and notification settings | P2 |
| NT-3 | Email digest of unread activity | P2 |

### 5.8 Teacher analytics

| ID | Requirement | Priority |
| --- | --- | --- |
| AN-1 | Top asked topics and count of AI questions per week | P1 |
| AN-2 | Knowledge gaps: questions that failed the relevance threshold, so the teacher can upload missing material | P1 |
| AN-3 | Most cited resources and pages | P2 |
| AN-4 | Classifier split (factual vs conceptual) and helpful rating | P2 |
| AN-5 | Hall activity: messages per hall, active members | P2 |

---

## 6. Technology stack

JavaScript/TypeScript end to end. Rows marked **existing** come from the Review 2 and Review 3 decks. Rows marked **proposed** are new for v2 and should be confirmed by the team.

| Layer | Technology | Status | Role |
| --- | --- | --- | --- |
| Language | JavaScript / TypeScript | Existing | Shared across frontend and backend |
| Frontend | React / Next.js | Existing | Classroom, resources, assistant chat, hall UI, source viewer |
| UI styling | Tailwind CSS (or similar) | Proposed | Responsive layout |
| Backend | Node.js + Express.js | Existing | APIs, ingestion, auth, moderation |
| Real-time | Socket.IO (WebSocket) | Proposed | Live hall messages, presence, typing |
| Orchestration | LangGraph.js | Existing | Agent routing, dialog state, fallbacks |
| Vector DB | ChromaDB | Existing | Similarity search, one collection per classroom |
| Embeddings | OpenAI embeddings | Existing | Chunk and query vectors |
| LLM | Llama 3.1 via Groq API | Existing | Classification and generation |
| PDF parsing | A JS PDF library | Existing (to be named) | Page-level text extraction |
| Relational DB | PostgreSQL with Prisma (or MongoDB) | Proposed | Users, classrooms, memberships, halls, messages, logs |
| Auth | JWT sessions or NextAuth, bcrypt/argon2 password hashing | Proposed | Sign in, roles, protected routes |
| File storage | Local disk for demo, S3-compatible storage later | Proposed | Uploaded PDFs and attachments |
| Cache / pub-sub | Redis | Proposed (P2) | Presence, rate limiting, scale Socket.IO across servers |
| Validation | Zod (or similar) | Proposed | Request and socket payload validation |
| Testing | To be named (for example Jest / Vitest, Playwright) | Open | Unit, API and UI tests |

**Core pipelines**

- AI: React/Next.js → Express.js → LangGraph.js → ChromaDB → Groq / OpenAI.
- Halls: React/Next.js ⇄ Socket.IO ⇄ Express.js → PostgreSQL (history); `@assistant` calls the AI pipeline.

**Isolation decision (proposed):** one ChromaDB collection per classroom, named by classroom ID. Every query is scoped to the classroom the user belongs to. The alternative, a single collection with a `classroomId` metadata filter, is simpler to run but depends on the filter never being omitted. Per-classroom collections make cross-classroom leaks harder.

---

## 7. System architecture

```mermaid
flowchart LR
  subgraph Client
    UI[React / Next.js<br/>Classrooms, Resources, Assistant, Halls]
  end
  subgraph Server[Node.js + Express]
    API[REST APIs<br/>auth, classrooms, resources]
    RT[Socket.IO gateway<br/>halls, presence]
    ING[Ingestion<br/>extract, chunk, embed]
    AG[LangGraph.js<br/>classify and route]
  end
  subgraph Data
    PG[(PostgreSQL<br/>users, classrooms, halls, messages)]
    FS[(File storage<br/>PDFs, attachments)]
    CH[(ChromaDB<br/>one collection per classroom)]
  end
  subgraph Models
    OAI[OpenAI embeddings]
    GQ[Llama 3.1 via Groq]
  end
  UI --> API
  UI <--> RT
  API --> PG
  API --> FS
  API --> ING
  ING --> OAI
  ING --> CH
  RT --> PG
  RT -->|@assistant| AG
  API -->|private chat| AG
  AG --> CH
  AG --> OAI
  AG --> GQ
```

### 7.1 Ingestion flow (per classroom)

1. Teacher uploads a PDF to a classroom.
2. Server checks the teacher's role, validates the file, stores it, and creates a Resource record with status `indexing`.
3. Text is extracted page by page and split into overlapping chunks with metadata: `classroomId`, `resourceId`, file name, page, chunk index.
4. Chunks are embedded with OpenAI embeddings and written to that classroom's ChromaDB collection.
5. Resource status becomes `ready` (or `failed` with a reason). When published, it becomes searchable.

### 7.2 Query flow (private chat or hall)

1. Request arrives with `classroomId`; the server checks the user is a member.
2. Question is embedded; top-k chunks above the threshold are fetched from that classroom's collection only.
3. If none pass, the "not covered by the course material" reply is returned and the question is logged as a gap.
4. Llama 3.1 classifies the question; LangGraph.js routes to the Direct Answer or Socratic Tutor agent.
5. Answer is returned with sources. In a hall it is posted as an AI message and pushed to all members live.

### 7.3 Hall message flow

1. Client connects over WebSocket with its token; server checks classroom membership and hall access.
2. Client joins the hall room; server sends recent history and the online list.
3. A new message is validated, saved to PostgreSQL, then broadcast to everyone in the hall room.
4. If the message contains `@assistant`, a second job calls the AI pipeline and posts the reply as a message from the assistant.

---

## 8. Data model

| Entity | Key fields |
| --- | --- |
| User | `userId`, name, email, password hash, avatar, created at |
| Classroom | `classroomId`, name, subject, description, owner `userId`, join code, settings (AI on/off, Socratic turn limit), status (active, archived) |
| Membership | `userId`, `classroomId`, role (teacher, ta, student), joined at, muted until (optional) |
| Resource | `resourceId`, `classroomId`, title, file path, page count, unit tag, state (draft, published), index status, uploaded by, uploaded at |
| Chunk (in ChromaDB) | `chunkId`, `classroomId`, `resourceId`, file name, page, chunk index, text, vector |
| Hall | `hallId`, `classroomId`, name, description, topic, type (open, private, announcement), status (active, locked, archived), created by |
| HallMember | `hallId`, `userId` (for private halls) |
| Message | `messageId`, `hallId`, author (user or assistant), text, reply-to `messageId`, attachments, sources (file, page), pinned, edited at, deleted at, created at |
| Reaction | `messageId`, `userId`, emoji |
| Report | `reportId`, `messageId`, reporter, reason, status |
| AssistantChat | `chatId`, `userId`, `classroomId`, messages with route label and sources |
| QueryLog | `queryId`, `classroomId`, source (private or hall), question, route label, confidence, retrieved chunk IDs and scores, latency, helpful rating |
| Notification | `notificationId`, `userId`, type, reference, read at |

---

## 9. API and real-time events (proposed)

### 9.1 REST endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout` | Account and session |
| `POST /api/classrooms` | Create a classroom (teacher) |
| `GET /api/classrooms` | List the user's classrooms |
| `POST /api/classrooms/join` | Join with a code |
| `GET /api/classrooms/:id/members` | Member list |
| `PATCH /api/classrooms/:id` | Edit settings or archive |
| `POST /api/classrooms/:id/resources` | Upload a resource |
| `GET /api/classrooms/:id/resources` | List resources and index status |
| `PATCH /api/classrooms/:id/resources/:rid` | Publish, unpublish, retag |
| `DELETE /api/classrooms/:id/resources/:rid` | Delete resource and vectors |
| `GET /api/classrooms/:id/resources/:rid/pages/:n` | Source viewer page |
| `POST /api/classrooms/:id/assistant/chat` | Ask the AI privately; returns answer, route, sources |
| `POST /api/classrooms/:id/halls` | Create a hall |
| `GET /api/classrooms/:id/halls` | List halls with unread counts |
| `GET /api/halls/:hid/messages?before=` | Paged message history |
| `PATCH /api/halls/:hid` | Lock, archive, rename |
| `POST /api/messages/:mid/report` | Report a message |
| `GET /api/classrooms/:id/analytics` | Teacher analytics |

### 9.2 Socket.IO events

| Event | Direction | Payload and behavior |
| --- | --- | --- |
| `hall:join` | Client to server | `hallId`; server checks access, returns history and online list |
| `hall:leave` | Client to server | `hallId` |
| `message:send` | Client to server | `hallId`, text, optional reply-to, attachments |
| `message:new` | Server to clients | Saved message broadcast to the hall |
| `message:edit`, `message:delete` | Both | Update or remove a message |
| `typing` | Both | Typing indicator per hall |
| `presence:update` | Server to clients | Online members in the hall |
| `assistant:thinking` | Server to clients | Shows that the AI is working on a reply |
| `hall:locked` | Server to clients | Hall became read-only |
| `member:muted` | Server to client | User muted for a time |

---

## 10. AI agent behavior

### 10.1 Routing rules

| Step | Condition | Result |
| --- | --- | --- |
| Scope | User is not a member of the classroom | Request rejected |
| Retrieve | Top-k chunks from this classroom's collection | Chunks with scores |
| Relevance check | No chunk passes the threshold | "Not covered by the course material" reply; question logged as a gap; no agent called |
| Classify | `factual` | Direct Answer agent |
| Classify | `conceptual` | Socratic Tutor agent |
| Classify | Parse error or low confidence | Default route (proposed: Direct Answer) |
| Respond | Agent output ready | Answer plus sources (file, page) |

### 10.2 Direct Answer agent

For definitions, formulas, dates, "what is" and "list" questions. Answers in a few sentences using only retrieved chunks, cites file and page, and says what is missing if the chunks only partly answer.

### 10.3 Socratic Tutor agent

For "why", "how does", "explain" and "compare" questions.

- Opens with one guiding question or hint based on the retrieved material.
- Builds on the student's reply across turns using conversation state.
- Points to the relevant page so the student can read it.
- Gives the full explanation on request or after N turns (classroom setting, default 3).
- **In halls:** keeps the prompt short and invites other members to answer before giving the full explanation.

### 10.4 Prompt contracts

| Prompt | Must instruct the model to | Output |
| --- | --- | --- |
| Classifier | Choose exactly one label, with a reason and confidence | JSON: `label`, `confidence`, `reason` |
| Direct Answer | Use only supplied context; cite file and page; say "not found" if absent | Text plus citations |
| Socratic Tutor | Ask guiding questions; do not reveal the full answer on the first turn; use only supplied context | Text plus citations |
| Hall summary (P2) | Summarize only the supplied messages; list open questions and action items | Text |

### 10.5 Failure handling

| Failure | Behavior |
| --- | --- |
| Groq or OpenAI error or timeout | Retry once, then show a friendly error; chat and hall state are kept |
| Rate limit (provider) | Back off and queue; show the thinking state |
| ChromaDB unavailable | Show an error and log it; do not answer without retrieval |
| Model output ignores the context | Check against retrieved chunks, regenerate once, otherwise return the "not found" reply |
| User exceeds AI rate limit | Show a short wait message; no AI call made |

---

## 11. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Access control | Every API and socket event checks classroom membership and role on the server; the client is never trusted |
| Data isolation | Resources, vectors, chats and halls are scoped by `classroomId`; no cross-classroom retrieval |
| Accuracy | Answers must be supported by retrieved chunks; unsupported questions get a "not found" reply |
| Traceability | Every AI answer shows source file and page |
| Performance | AI answer under 6 s average; hall messages under 1 s to online members; ingestion progress visible |
| Scalability | Demo target of 50 concurrent users per hall; Redis adapter for Socket.IO when running more than one server |
| Reliability | Reconnect sockets automatically and fetch missed messages; retries on provider failures |
| Security | API keys only on the server; hashed passwords; file type and size checks; input sanitization against XSS in messages; rate limits on login, upload and AI calls |
| Privacy | Resources and messages are visible only to classroom members; a classroom owner can delete a classroom and all its data; chat logs are not used to train models |
| Moderation | Report, delete, mute and lock tools; an audit log of moderation actions |
| Cost control | Embed each file once; batch embedding calls; AI rate limits; context length and top-k are configurable |
| Maintainability | Chunk size, overlap, top-k, threshold, model names, Socratic turn limit, rate limits are configuration values |
| Usability | Responsive layout, keyboard-friendly chat, clear loading, empty and error states |
| Observability | Log route label, retrieved chunk IDs, scores and latency per AI call; log socket connection counts |

---

## 12. UX requirements

### 12.1 Main screens

| Screen | Contents |
| --- | --- |
| Home / classroom switcher | Sidebar with all classrooms, unread badges, "create" and "join" actions |
| Classroom overview | Name, announcements, member count, quick links |
| Resources | Resource list with status, unit tags, upload (teacher), viewer |
| Assistant | Private AI chat, mode badge (Direct or Socratic), source chips, rating buttons |
| Discussion halls | Hall list on the left, live message area in the middle, online members and pinned messages on the right |
| Hall settings (teacher) | Rename, type, lock, archive, members for private halls |
| Source viewer | Resource page at the cited page, highlighted chunk if available |
| Members | List with roles; invite and remove (teacher) |
| Analytics (teacher) | Top topics, gaps, most cited resources, hall activity |

### 12.2 UX rules

- Always show which classroom you are in.
- AI messages carry an **AI** badge and source chips; human messages do not.
- Clear states for empty chat, uploading, indexing, AI thinking, disconnected and error.
- A "give me the answer" button in Socratic mode.
- Locked halls show a visible read-only banner.

---

## 13. Release plan

| Phase | Scope | Notes |
| --- | --- | --- |
| Phase 1: Core AI tutor | PDF ingestion, ChromaDB, classifier, Direct and Socratic agents, chat UI, source chips (single collection) | Review 3 baseline |
| Phase 2: Classrooms and resources | Auth, classrooms, join codes, memberships, per-classroom resources and vectors, multiple classrooms per user, private AI chat per classroom | Needed for the multi-classroom model |
| Phase 3: Discussion halls | Default and custom halls, real-time chat, history, presence, `@assistant`, moderation (lock, delete, mute) | Core of v2 |
| Phase 4: Polish and insights | Threads, reactions, attachments, notifications, analytics, quiz mode, hybrid retrieval | As time allows |

**Demo minimum (Review 4 / final):** two classrooms with different resources, two or more halls in each, three or more users chatting live in a hall, `@assistant` answering with sources from the right classroom, and a teacher locking a hall.

---

## 14. Evaluation plan

| Test | Method | Pass condition |
| --- | --- | --- |
| Retrieval relevance | N questions with known source page per classroom | Meets target in 2.3 |
| Classifier accuracy | Hand-label N factual and conceptual questions | Meets target in 2.3 |
| Answer grounding | Review sampled answers against cited chunks | Every claim traceable to a cited page |
| Out-of-scope handling | Ask questions the PDFs do not cover | "Not found" reply, no invented answer |
| Classroom isolation | Ask in classroom A about a topic that exists only in classroom B | No answer from B's resources; "not found" |
| Access control | Try API and socket calls as a non-member, a student doing teacher actions | Rejected every time |
| Hall load | Simulate many clients in one hall | Meets delivery and capacity targets |
| Hall reliability | Drop and restore a client connection | Missed messages are fetched; no duplicates |
| `@assistant` in hall | Call the AI from two halls in different classrooms | Replies use the correct classroom's resources and appear for all members |
| Socratic quality | Check conceptual replies open with a guiding question | Rubric agreed with the guide |
| Moderation | Lock hall, mute member, delete message | Takes effect live for all clients |
| User feedback | Pilot with peers and a short survey | Summary in the final deck |

---

## 15. Risks and mitigations

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| AI answers beyond the context (hallucination) | Medium | Strict prompts, relevance threshold, output check, "not found" fallback |
| Cross-classroom data leak | Medium | Per-classroom collections, server-side membership checks, isolation tests |
| Abuse or off-topic content in halls | Medium | Report, delete, mute, lock; teacher and TA roles; audit log |
| Real-time scaling or dropped connections | Medium | Socket.IO reconnect, message history fetch, Redis adapter later |
| AI spam in halls drives cost | Medium | Rate limits per user and hall, configurable top-k and context length |
| Misclassified question gets the wrong teaching style | Medium | Structured output with confidence, default route, "give me the answer" control |
| Scope too large for the time left | High | Phased plan with a defined demo minimum; Phase 4 items are optional |
| Scanned PDFs yield no text | Medium | Detect and warn; OCR as future scope |
| Privacy of student messages and files | Low to medium | Member-only visibility, delete classroom option, no training on chats |

---

## 16. Open questions

- Which database will the team use (PostgreSQL with Prisma, or MongoDB)?
- One ChromaDB collection per classroom, or one collection with a classroom filter?
- Are students allowed to create halls, or only teachers and TAs?
- Should private halls and direct messages between students exist in this version?
- Should the AI in halls answer anyone who mentions it, or only when a teacher enables it per hall?
- How many Socratic turns before the full answer (default 3)?
- Which PDF library and testing tool will be used?
- What did Review 2 suggest and what was done (slide 3 of the Review 3 deck is still a template)?
- Who owns each module, and what are the Review 4 dates?

---

## 17. Sources

- P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," NeurIPS, 2020. arXiv:2005.11401
- A. Dubey et al., "The Llama 3 Herd of Models," Meta AI, 2024. arXiv:2407.21783
- LangGraph.js: langchain-ai.github.io/langgraphjs
- Chroma: docs.trychroma.com
- OpenAI embeddings: platform.openai.com/docs/guides/embeddings
- Groq API: console.groq.com/docs
- Next.js and Express.js: nextjs.org/docs, expressjs.com
- Socket.IO: socket.io/docs
- Project Review 3 deck and the original project proposal deck (provided by the team)
