# BlackStar AI: Retrieval-Augmented Generation (RAG) System
**CS4241 - Introduction to Artificial Intelligence (End of Semester Examination)**
**Academic City University**

**Student Name:** Nana Bentil Saah  
**Index Number:** 10012200016

---

## 🚀 Project Overview
BlackStar AI is a custom-built RAG system designed to provide grounded, citation-backed answers regarding the **2025 Ghana Budget Statement** and **Ghana Election Results**. The system implements a complete pipeline—from data engineering and hybrid retrieval to grounded prompt construction—without the use of high-level frameworks like LangChain or LlamaIndex.

### Key Performance Metrics
*   **Retrieval Recall@5**: **0.77** (Hybrid Search) vs 0.51 (Baseline Vector).
*   **Top-1 Accuracy**: **0.625** (Innovation Component: Domain-Specific Scoring).
*   **Hallucination Rate**: Reduced to **27.7%** (compared to 50.0% for Pure LLM baseline).
*   **Citation Compliance**: 100% grounding on retrieved contexts in grounded mode.

---

## 🏗️ Architecture
The system utilizes a modern decoupled stack:
*   **Frontend**: Next.js 14, Tailwind CSS, and Assistant-UI (Deployed on Vercel).
*   **Backend**: FastAPI, FAISS, and Scikit-Learn (Deployed on Render).
*   **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2` (384-dim).
*   **LLM**: OpenAI `gpt-4o-mini`.

---

## 📁 Project Structure
```text
code/
├── backend/            # FastAPI application & RAG logic
│   ├── app/            # API endpoints & lifecycle
│   ├── scripts/        # Experimental & pipeline scripts
│   └── requirements.txt
├── frontend/           # Next.js chat interface
├── data/               # Raw and processed datasets (CSV & PDF)
├── indexes/            # FAISS vector index & TF-IDF matrices
├── logs/               # Detailed experiment & run logs
├── eval/               # Quantitative evaluation results (JSON)
└── docs/               # Manual rubrics & analysis reports
```

---

## 🧪 Running the Pipeline
To reproduce the experimental results or run the system locally:

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Data Preparation & Evaluation
Detailed scripts are available in `backend/scripts/`:
- `run_data_preparation.py`: Cleaning and chunking.
- `run_retrieval_system.py`: Baseline vs. Hybrid benchmarks.
- `run_innovation_scoring.py`: Domain-specific scoring evaluation.
- `run_adversarial_evaluation.py`: RAG vs. Pure LLM comparison.

---

## 🧪 Experiment Logs & Audits
The system maintains a rigorous logging architecture for reproducibility and auditing:

*   **Quantitative Results (`eval/`)**: Final aggregated metrics for each pipeline stage (Chunking, Retrieval, Innovation, Adversarial).
*   **Experimental Summaries (`logs/experiments/`)**: Detailed per-query logs for each benchmark run, including similarity scores and LLM responses.
*   **Live Trace Logs (`logs/runs/`)**: Every query processed by the production API generates a unique JSON trace containing the full retrieval context, final prompt, and stage-by-stage timing.
*   **Manual Rubrics (`docs/manual_logs/`)**: Human-labeled assessments of the adversarial evaluation, validating the automated hallucination metrics reported in the technical paper.

---

## 🔗 Deployment Links
- **GitHub**: [https://github.com/brabentil/AI_10012200016](https://github.com/brabentil/AI_10012200016)
- **Production URL**: [https://blackstart-ai.vercel.app/](https://blackstart-ai.vercel.app/)
- **Backend API**: [https://ai-10012200016.onrender.com/](https://ai-10012200016.onrender.com/)
