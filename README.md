# VedaAI – AI Assessment Creator

**[🔗 View Deployed Application](#)** *(Add your deployed link here)*

VedaAI is a full-stack AI-powered assessment generator application built based on standard school exam parameters. It enables teachers to create assignments, define questions types, counts, and marks, optionally upload context material (PDF/TXT), and generate a structured exam-grade question paper complete with an answer key and PDF export in real-time.

---

## ✨ Core Features
- **Assignment Creation**: Form for creating assignments with due dates, question types, number of questions, marks, and additional instructions.
- **AI Question Generation**: Converts input into structured prompts to generate distinct sections (A, B, etc.), questions, difficulties (easy/medium/hard), and marks.
- **Enhanced Output Display**: Clean, readable exam paper layout grouped by sections, displaying question text, difficulty tags, and marks.
- **Student Info Section**: Designated fields on the exam paper for Student Name, Roll Number, and Section.
- **Real-time Processing Updates**: Live WebSockets integration to display assessment generation progress in real-time.

## ⭐ Bonus Features
- **Review & Refinement Workflow**  
  Teachers can preview, edit, regenerate, or refine questions before exporting the final paper.
- **Multi-Agent AI Pipeline**  
  Creator, Reviewer, and Solver agents collaboratively generate, validate, and refine assessments.
- **Difficulty Distribution Control**  
  Configure exact Easy / Medium / Hard ratios enforced during AI generation.
- **AI Output Validation Layer**  
  Automatically validates marks, question counts, duplicates, and section consistency before saving.
- **Hallucination Detection (Solver Agent)**  
  Secondary AI verification layer detects incorrect or inconsistent generated answers.
- **Real-time WebSockets & BullMQ Queues**  
  Live generation progress updates powered by Socket.io, Redis, and BullMQ.
- **Context Chunking + Retrieval (Mini-RAG)**  
  Uploaded PDFs are chunked and only the most relevant context is injected into prompts.
- **Polished Responsive UI**  
  Modern Tailwind UI with responsive layouts, smooth animations, and optimized mobile support.
- **Auto Save Drafts**  
  Form state is automatically persisted locally to prevent accidental data loss.
- **Skeleton Loaders & Micro-interactions**  
  Dynamic loading states and transitions for a premium user experience.
- **Advanced State Management**  
  Centralized Zustand store architecture for scalable and optimized frontend state handling.
- **Analytics Dashboard**  
  Visualizes generation statistics and assessment metrics using Recharts.
- **Authentication & Personalization**  
  User settings, profile customization, and persistent local preferences support.
- **Real Exam PDF Layout**  
  A4-optimized PDF export with proper page breaks, headers, footers, and print-ready formatting.
---

## 🏗️ Architecture Overview & Approach

```text
[ Frontend: Next.js ] ──(HTTP Post: Config + Upload)──> [ Backend: Express ]
       ▲                                                          │
       │ (Socket.io WebSockets)                                   ▼ (Mongoose DB: PENDING status)
       │                                                   [ MongoDB Database ]
       │                                                          │
       │                                                          ▼ (Push job details)
       │                                                   [ Redis / BullMQ Queue ]
       │                                                          │
       │ (Active Progress Stream)                                 ▼ (Pop & process)
[ WebSocket Client ] <─────────────────────────────────── [ Worker Thread ]
                                                                  │
                                                                  ▼ (Query schema context)
                                                           [ AI: Grok/Groq/OpenAI ]
                                                                  │
                                                                  ▼ (Save sections & answers)
                                                           [ MongoDB DB: COMPLETED status]
```

1. **Submission**: The teacher submits the stepper form (topic, due date, additional guidelines, question criteria, and optional reference files).
2. **Database & Queueing**: The Express backend creates an `Assignment` in MongoDB with status `PENDING` and dispatches a background task to the Redis-backed **BullMQ** queue. The API returns `202 Accepted` immediately.
3. **Processing Overlay**: The frontend switches to Step 2 (processing monitor) and initiates a WebSocket connection via `socket.io-client`. It joins a dedicated channel room (`assignment:<id>`) for real-time state updates.
4. **Document Parsing & AI Generation**: The BullMQ Worker parses reference text from uploaded documents (using `pdf-parse` for PDFs) and submits a structured system prompt to an **OpenAI-compatible LLM provider** (like Grok, Groq, or OpenAI) using JSON Mode to guarantee output validity.
5. **Real-time Feedback**: The worker emits progress percentages and status messages to the client at each stage over WebSockets.
6. **Completion**: Once saved to MongoDB, status turns `COMPLETED`. The client redirects to the outputs sheet, displaying the formal formatted exam paper and the separate Answer Key. The teacher can download it as a print-ready PDF generated dynamically on the server via `pdfkit`.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Zustand (state management), Socket.io Client.
- **Backend**: Node.js, Express, TypeScript, Mongoose (MongoDB), Redis, BullMQ (job queues), Socket.io (WebSocket broadcasts), Multer (file parsing), pdf-parse, PDFKit (PDF rendering).
- **AI Engine**: Standard OpenAI-compatible API interface (Grok, Groq, OpenAI).

---

## 🚀 Setup & Execution Instructions

### Prerequisites
Make sure you have [Node.js v20+](https://nodejs.org/) and [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed on your machine.

---

### Step 1: Start Database Containers (MongoDB & Redis)
In the root directory, run the following Docker command to start both MongoDB and Redis in the background:
```bash
docker compose up -d
```
*Alternatively, you can start standalone containers on default ports (MongoDB on `27017` and Redis on `6379`).*

---

### Step 2: Configure Backend Environment Variables
1. Navigate to the `backend/` folder.
2. Edit the `.env` file (which has been pre-created for you).
3. Insert your **API Key** and configure the endpoint base URL and model name:

```env
# Server Configurations
PORT=5001

# Database URIs
MONGO_URI=mongodb://localhost:27017/veda-ai
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# LLM Configuration (OpenAI-compatible)
# For Grok (x.ai):
LLM_API_KEY=your_xai_grok_key_here
LLM_BASE_URL=https://api.x.ai/v1
LLM_MODEL=grok-beta

# Or For Groq:
# LLM_API_KEY=your_groq_key_here
# LLM_BASE_URL=https://api.groq.com/openai/v1
# LLM_MODEL=llama-3.3-70b-versatile
```

---

### Step 3: Run the Backend Server
In the root directory, open a terminal and execute:
```bash
cd backend
npm run dev
```
The server will boot, establish database connections, and start listening on port `5001`.

---

### Step 4: Run the Next.js Frontend
Open a new terminal in the root directory and execute:
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view and interact with the application.
