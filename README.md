# AI Teaching Assistant (v2) – Classrooms, Discussion Halls & Agentic RAG

**B.Tech CSE Semester 7 Project**  
**Guide:** Ms. Ria Pyne  
**Team Members:** Aminul Islam, Ayan Mahapatra, Md Yusuf, Soniya Samanta, Soubhik Das  

> 📖 **Looking for the complete running guide?** See **[INSTRUCTIONS.md](file:///run/media/aminul/01DD2E93317DEF70/B.Tech%20CSE%20Notes%20(BRAINWARE%20UNIVERSITY)/Semister%207/project/INSTRUCTIONS.md)** for a step-by-step setup walkthrough, pre-seeded demo credentials, and feature guide.

---

## 🚀 Overview

The **AI Teaching Assistant v2** is a multi-classroom web platform where instructors create course workspaces, upload syllabus PDFs, and invite students via 6-character join codes. The system features:

1. **Course-Grounded Agentic RAG:**
   - **Direct Answer Agent:** For factual definitions, formulas, and lookups with exact file and page citations.
   - **Socratic Tutor Agent:** Guides students through conceptual reasoning with progressive hints and page references before revealing answers.
   - **"Just Give Me the Answer" Override:** Allows students to skip interactive guidance whenever needed.
   - **Classroom Isolation:** Vectors and resources are strictly partitioned per classroom to prevent cross-course leaks.
2. **Real-Time Discussion Halls (Socket.IO):**
   - Live multi-user channels (`#general`, `#doubts`, `#announcements`).
   - Summon AI directly in discussion halls by typing `@assistant <question>`. The AI responds live for all students with citations.
   - Live online presence indicators and instructor channel lock tools.
3. **Agorapulse-Inspired UI:**
   - Modern B2B SaaS theme with Deep Obsidian Navy (`#0A0E1A`), Energetic Coral (`#FF5B22`), and slide-over textbook page viewers.
4. **PostgreSQL & ChromaDB in Docker:**
   - PostgreSQL 16 container managing relational users, classrooms, memberships, halls, and messages.
   - ChromaDB container managing isolated dense vector embeddings.

---

## 🏛️ System Architecture

```mermaid
flowchart LR
  subgraph Client
    UI[Next.js + Tailwind CSS<br/>Classrooms, Discussion Halls, AI Tutor, Resources]
  end

  subgraph Backend Services
    API[Express.js REST APIs<br/>Auth, Classrooms, Resources]
    RT[Socket.IO Gateway<br/>Real-Time Halls & @assistant]
    LG[LangGraph.js Router<br/>Direct Answer vs Socratic Tutor]
  end

  subgraph Docker Containers
    PG[(PostgreSQL 16 Container<br/>Users, Classrooms, Halls, Messages)]
    CH[(ChromaDB Container<br/>Classroom-Isolated Vectors)]
  end

  subgraph AI Models
    GEM[Google Gemini Embeddings<br/>gemini-embedding-2 Default]
    GROQ[Llama 3.1 via Groq<br/>Structured Classifier & Generator]
  end

  UI --> API
  UI <--> RT
  API --> PG
  API --> LG
  RT --> PG
  RT -->|@assistant| LG
  LG --> CH
  LG --> GEM
  LG --> GROQ
```

---

## ⚡ Quickstart

### 1. Start Docker Containers (PostgreSQL & ChromaDB)
```bash
docker compose up -d
```

### 2. Configure Backend
```bash
cp backend/.env.example backend/.env
# Verify GOOGLE_API_KEY and GROQ_API_KEY in backend/.env
cd backend
npm install
npx prisma db push
npm run dev
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🔑 Demo Accounts

| Role | Email | Password | Pre-enrolled Classroom |
|---|---|---|---|
| **Teacher (Owner)** | `teacher@brainware.edu` | `teacher123` | Operating Systems (Code: `CSE701`) |
| **Student** | `student@brainware.edu` | `student123` | Operating Systems (Code: `CSE701`) |

*(Use the 1-click Quick Demo Switcher in the top-right header to switch roles instantly)*

---

## 🧪 Automated Tests

Run the Vitest test suite:
```bash
cd backend && npm test
```
- Chunking & page metadata preservation
- Vector similarity retrieval & relevance filtering
- Question classification (Groq structured JSON output)
- LangGraph agentic routing & out-of-scope refusals
