# 🐍 FloatChat: Flask + PostgreSQL + AI Oceanography Backend

This is the backend server for **FloatChat**, built in **Python** using the **Flask** microframework. It acts as the orchestration layer between the React frontend, a **Neon Serverless PostgreSQL** database, a **Chroma Vector Database** for metadata semantic lookup, and advanced AI services (**Google Gemini API** & **Ollama**).

---

## 🚀 Key Functional Systems

1. **Enhanced Hybrid ARGO System (`argo_system.py`)**:
   - Integrates a **hybrid processing pipeline**: uses flexible regex-based pattern matching to retrieve instantaneous, highly accurate static statistics for common questions.
   - For complex, dynamic queries, it falls back to a **PostgreSQL query engine** that compiles optimized parameters, queries the Neon Cloud DB, parses telemetry dataframes with Pandas, and routes the context to the active LLM.

2. **Gemini Thinking System (`gemini.py`)**:
   - Manages connections to Google's generative models (`gemini-1.5-flash`).
   - Powers the **Thinking Mode** which reads high-density, raw tables of Temperature, Salinity, and Pressure from the database, summarizes trends using oceanographic principles, references conversation memory logs, and generates a scientific diagnosis.
   - Implements local JSON-based history archives (`ollama_history.json`).

3. **Matplotlib Graph Generator (`graphs.py`)**:
   - Intercepts requests looking for visualizations (triggered by keywords like *plot*, *graph*, *chart*).
   - Dynamically parses the underlying PostgreSQL datasets using Pandas and draws custom, highly styled ocean depth profiles or Hovmöller diagrams.
   - Saves them locally to the `graphs/` folder, which the server serves as high-speed static assets.

4. **Embeddings & Vector Indexer (`download_model.py`)**:
   - Automatically downloads the `all-MiniLM-L6-v2` ONNX sentence transformer from HuggingFace to your local cache.
   - ChromaDB uses these mathematical vectors to index ARGO profiling float locations (latitudes/longitudes), performing proximity searches to find matching WMO IDs within fractions of a second.

---

## 📡 API Reference endpoints

### 1. Execute AI Query / Graph
* **URL**: `/api/chat`
* **Method**: `POST`
* **Content-Type**: `application/json`
* **Payload**:
```json
{
  "query": "Compare the salinity of the Northern Bay of Bengal and the Arabian Sea",
  "isThinkingMode": true,
  "chatMemory": [
    { "question": "Previous user question", "answer": "Previous assistant response" }
  ]
}
```
* **Success Response (Text)**:
```json
{
  "message": "The average salinity in the Northern Bay of Bengal is 32.9 PSU, which is lower than the Arabian Sea (36.1 PSU) due to heavy freshwater discharge from the Ganges-Brahmaputra river system."
}
```
* **Success Response (Graph)**:
```json
{
  "graph_path": "/graphs/generated_plot_1716382104.png"
}
```

### 2. Static Graph Serving
* **URL**: `/graphs/<filename>`
* **Method**: `GET`
* **Response**: Serves the physical PNG image.

---

## 🛠️ Python Installation & Setup

Ensure Python (3.10+) is installed and you are running commands from inside the `backend` folder:

### 1. Set Up Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate Virtual Environment:
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Required Packages
Create a `requirements.txt` file (if you do not have one) and install it:
```bash
pip install flask flask-cors psycopg2-binary pandas numpy chromadb sentence-transformers google-generativeai matplotlib rich requests openpyxl huggingface-hub
```

### 3. Fetch sentence-transformers ONNX models
Download local caching embeddings model using:
```bash
python download_model.py
```

### 4. Set Up Environment Variables
Set your Gemini API key (the application includes a default key, but for custom setups you can override):
```bash
# PowerShell
$env:GOOGLE_API_KEY="YOUR_GEMINI_KEY"

# Linux/macOS
export GOOGLE_API_KEY="YOUR_GEMINI_KEY"
```

### 5. Launch Server
Runs the web service on [http://localhost:5000](http://localhost:5000) with hot-reloading active:
```bash
python server.py
```

---

## 📂 Backend File Architecture

```bash
backend/
├── chroma_db/             # Local database storing vector coordinates
├── graphs/                # Directory where dynamic matplotlib plots are saved
├── argo_system.py         # Primary hybrid processor and PostgreSQL connection
├── download_model.py      # HuggingFace hub downloader for sentence-transformers
├── gemini.py              # Google Gemini API connector & thinking model logic
├── graphs.py              # Visual graphing classes built on Matplotlib
├── server.py              # Main Flask server setting CORS and routing endpoints
└── ollama_history.json    # JSON storage tracking query logs
```
