# 📚 AI Teaching Assistant (v2) – Complete Running & Setup Guide

**Programme:** B.Tech CSE, Semester 7  
**Project:** An Agentic RAG System for Course-Grounded Socratic Tutoring, Discussion Halls, and Multi-Classrooms  
**Guide:** Ms. Ria Pyne  
**Team:** Aminul Islam, Ayan Mahapatra, Md Yusuf, Soniya Samanta, Soubhik Das  

---

## 🏗️ 1. Architecture & Port Reference

The system runs as a multi-tier full-stack application backed by containerized databases:

| Service | Technology | Port / Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Next.js (App Router), React 19, Tailwind CSS | `http://localhost:3000` | Agorapulse-inspired UI with Classroom Switcher, Discussion Halls, Private Tutor, and PDF Viewer |
| **Backend API & Realtime** | Node.js, Express.js, Socket.IO, LangGraph.js | `http://localhost:5000` | REST API, Ingestion Pipeline, Agentic RAG Router, and WebSocket Gateway |
| **Relational Database** | PostgreSQL 16 (in Docker) | `localhost:5433` (mapped from 5432) | Stores Users, Classrooms, Memberships, Discussion Halls, Messages, and Query Logs |
| **Vector Database** | ChromaDB (in Docker) | `http://localhost:8001` (mapped from 8000) | Stores course chunk vectors isolated by `classroomId` |
| **Embedding Engine** | Google Gemini (`gemini-embedding-2`) | Cloud API | Computes dense 3072-dimensional vector embeddings for PDF chunks and questions |
| **LLM Inference** | Llama 3.1 (`openai/gpt-oss-120b`) via Groq | Cloud API | Performs structured question classification and Direct/Socratic generation |

---

## 📋 2. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher (v20+ or v24 recommended)
- **npm**: v9.0.0 or higher
- **Docker & Docker Compose**: Docker 24+ with compose v2+
- **API Keys**:
  - `GOOGLE_API_KEY`: For Google text embeddings (set as default)
  - `GROQ_API_KEY`: For Groq Llama 3.1 inference

---

## 🚀 3. Step-by-Step Running Guide

### Step 1: Start Docker Containers (PostgreSQL & ChromaDB)

In the project root directory, run:

```bash
docker compose up -d
```

Verify that both containers are running and healthy:

```bash
docker compose ps
```

You should see:
```text
NAME                IMAGE                    STATUS                    PORTS
ai-tutor-chromadb   chromadb/chroma:latest   Up (healthy)              0.0.0.0:8001->8000/tcp
ai-tutor-postgres   postgres:16-alpine       Up (healthy)              0.0.0.0:5433->5432/tcp
```

---

### Step 2: Configure Environment Variables

The backend environment file is located at `backend/.env`. Ensure it contains:

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL in Docker
DATABASE_URL=postgresql://aitutor_user:aitutor_password@localhost:5433/aitutor?schema=public
JWT_SECRET=teaching-assistant-super-secret-jwt-key-btech-2026

# ChromaDB in Docker
CHROMA_URL=http://localhost:8001
CHROMA_COLLECTION=course_materials

# Google Gemini Embeddings (Default)
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_EMBEDDING_MODEL=gemini-embedding-2

# Groq Llama 3.1 LLM
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# RAG Parameters
CHUNK_SIZE=600
CHUNK_OVERLAP=100
TOP_K=4
RELEVANCE_THRESHOLD=0.55
SOCRATIC_TURN_LIMIT=3
DEFAULT_ROUTE=factual
```

---

### Step 3: Install Dependencies & Setup Database

1. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Push Database Schema to PostgreSQL:**
   ```bash
   npx prisma db push
   ```
   *(This automatically creates all relational tables in the Docker PostgreSQL database and generates the Prisma Client)*

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

---

### Step 4: Start the Backend Server

From the `backend/` directory:

```bash
npm run dev
```

The backend server will:
- Connect to PostgreSQL in Docker.
- Automatically seed default accounts and the initial B.Tech CSE Semester 7 classroom.
- Connect to ChromaDB in Docker at `http://localhost:8001`.
- Start the Socket.IO real-time gateway and REST API on `http://localhost:5000`.

---

### Step 5: Start the Frontend Application

In a separate terminal, from the `frontend/` directory:

```bash
npm run dev
```

The client will start at:
👉 **`http://localhost:3000`**

Open `http://localhost:3000` in your web browser.

---

## 🔑 4. Pre-seeded Demo Accounts & Credentials

The system comes pre-seeded with instructor and student accounts for testing:

| Role | Name | Email | Password | Pre-enrolled Classroom |
| :--- | :--- | :--- | :--- | :--- |
| **Teacher (Owner)** | Prof. Ria Pyne | `teacher@brainware.edu` | `teacher123` | *Operating Systems & Distributed Computing* (Code: `CSE701`) |
| **Student** | Aminul Islam | `student@brainware.edu` | `student123` | *Operating Systems & Distributed Computing* (Code: `CSE701`) |

> 💡 **Quick Switcher:** You can switch between Teacher and Student instantly with 1-click in the UI by clicking the user avatar in the top-right header and selecting **"Teacher"** or **"Student"** under *Quick Demo Switcher*.

---

## 🎯 5. Feature Walkthrough & Verification

### A. Multi-Classroom Navigation & Join Codes
1. **Classroom Rail (Far Left):** Switch between enrolled classrooms with distinct circular course emblems.
2. **Create Classroom (+ Button):** Teachers can create new course workspaces with custom names and subjects.
3. **Join Classroom (Login Icon):** Enter any 6-character code (e.g. `CSE701`) to enroll instantly as a Student.
4. **Members & Settings Tab:** Shows the classroom roster, role badges (`Teacher`, `Student`), and a 1-click copy button for the course join code.

### B. Discussion Halls (Real-Time Socket.IO)
1. Select the **"Discussion Halls"** tab.
2. Browse default channels:
   - `#general`: Open peer discussion and study group collaboration.
   - `#doubts`: Dedicated Q&A hall.
   - `#announcements`: Instructor announcements channel.
3. **Live Chat & Presence:** Open two browser tabs (one as Teacher, one as Student). Messages appear live in < 1 second, and online users are reflected on the right presence list.
4. **Summoning AI in a Hall:**
   - Type `@assistant <question>` (e.g. `@assistant What is a Semaphore and what are its atomic operations?`).
   - The UI broadcasts a 3-dot thinking pulse to all connected students.
   - The AI responds with an **AI Tutor** badge and clickable `[Source: filename · p.X]` chips grounded in that classroom's course PDFs.
5. **Teacher Moderation:** Teachers and TAs can click **"Lock Hall"** at the top right to make a channel read-only during exams or maintenance.

### C. Private AI Teaching Assistant (Agentic RAG)
1. Select the **"AI Teaching Assistant"** tab.
2. **Direct Answer Agent (Factual Queries):**
   - Ask: *"What is the difference between a process and a thread?"*
   - Returns a concise, grounded definition citing exact PDF page numbers.
3. **Socratic Tutor Agent (Conceptual Queries):**
   - Ask: *"Why does Quicksort degrade to O(n^2) time on sorted input?"*
   - The assistant asks a guiding question and hints at relevant course material to encourage active reasoning.
4. **"Just Give Me the Answer" Override:**
   - In Socratic mode, students can click the orange **"Just Give Me the Answer"** button at the bottom to skip interactive guidance and receive the complete explanation immediately.
5. **Out-of-Scope Protection:**
   - Questions not covered by the course syllabus (e.g. *"What is the capital of France?"*) are politely refused without hallucination.

### D. Course Resources & Slide-Over Page Viewer
1. Select the **"Course Resources"** tab.
2. Drag and drop any syllabus PDF into the Agorapulse coral dropzone.
3. The server extracts text page-by-page, computes checksums to prevent duplicates, creates 600-character chunks with 100-character overlap, and embeds them into ChromaDB.
4. In any chat answer, clicking a source chip (e.g. `[notes.pdf · p.3]`) opens the slide-over **Source Viewer**, displaying the exact textbook page text with prev/next navigation.

---

## 🧪 6. Running Automated Tests

To run the complete Vitest automated test suite covering all modules (PDF ingestion, chunking, ChromaDB vector retrieval, Groq Llama 3.1 classifier, and LangGraph workflow):

```bash
cd backend
npm test
```

Expected output:
```text
✓ tests/chunking.test.ts (3 tests)
✓ tests/classifier.test.ts (2 tests)
✓ tests/retrieval.test.ts (2 tests)
✓ tests/agentWorkflow.test.ts (4 tests)

Test Files  4 passed (4)
Tests       11 passed (11)
```

To test the frontend production build:

```bash
cd frontend
npm run build
```

---

## 🛠️ 7. Troubleshooting & FAQs

### Port Already in Use (EADDRINUSE 5000, 5433, or 8001)
If another process is using port 5000, 5433, or 8001:
```bash
# Free port 5000 (Backend)
fuser -k 5000/tcp

# Check Docker container status
docker compose ps
```

### Resetting or Restarting Docker Containers
```bash
# Restart containers
docker compose restart

# Complete reset with fresh volume
docker compose down -v
docker compose up -d
cd backend && npx prisma db push
```

### ChromaDB Offline Fallback
If the ChromaDB container is ever stopped, the backend automatically activates an in-memory vector store backed by `uploads/vector_store.json`, ensuring zero downtime during demonstrations.

