from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uuid
import asyncio
import aiofiles
import json
from dotenv import load_dotenv
from pathlib import Path

# Import our modules
from config import Config
from services.ollama_service import OllamaService
from services.document_service import DocumentService
from models.schemas import QueryRequest, DocumentResponse

load_dotenv()

# Initialize services
ollama_service = OllamaService()

# Create directories
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
STATIC_DIR = Path("static")
STATIC_DIR.mkdir(exist_ok=True)
TEMPLATES_DIR = Path("templates")
TEMPLATES_DIR.mkdir(exist_ok=True)

# In-memory storage
document_store = {}
query_results = {}

def load_existing_documents():
    """Load existing documents from filesystem into memory"""
    try:
        from services.document_service import DocumentService
        
        if UPLOAD_DIR.exists():
            for file_path in UPLOAD_DIR.glob("*"):
                if file_path.is_file():
                    try:
                        # Extract document ID from filename
                        filename = file_path.name
                        if '_' in filename:
                            doc_id = filename.split('_', 1)[0]
                            original_filename = filename.split('_', 1)[1]
                        else:
                            doc_id = str(uuid.uuid4())
                            original_filename = filename
                        
                        # Read file content
                        with open(file_path, 'rb') as f:
                            content = f.read()
                        
                        # Extract text content
                        extracted_content = DocumentService.extract_text_from_file(content, original_filename)
                        
                        # Load into memory
                        document_store[doc_id] = {
                            "filename": original_filename,
                            "filepath": str(file_path),
                            "size": len(content),
                            "content": extracted_content
                        }
                        
                        print(f"Loaded existing document: {original_filename} (ID: {doc_id})")
                        
                    except Exception as e:
                        print(f"Error loading document {filename}: {str(e)}")
                        
    except Exception as e:
        print(f"Error loading existing documents: {str(e)}")

# Load existing documents on startup
load_existing_documents()

app = FastAPI(title="RAG Document API", description="Simple RAG application for document upload and querying")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=HTMLResponse)
async def home():
    """Serve the main HTML page"""
    with open("templates/index.html", "r") as f:
        return f.read()

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload document endpoint"""
    try:
        doc_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{doc_id}_{file.filename}"
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        extracted_content = DocumentService.extract_text_from_file(content, file.filename)
        
        document_store[doc_id] = {
            "filename": file.filename,
            "filepath": str(file_path),
            "size": len(content),
            "content": extracted_content
        }
        
        return DocumentResponse(
            document_id=doc_id,
            filename=file.filename,
            size=len(content),
            message="Document uploaded successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@app.get("/documents")
async def get_documents():
    """Get list of uploaded documents"""
    return {
        "documents": [
            {
                "document_id": doc_id,
                "filename": doc_info["filename"],
                "size": doc_info["size"],
                "content": doc_info["content"]
            }
            for doc_id, doc_info in document_store.items()
        ],
        "total": len(document_store)
    }

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a specific document"""
    try:
        if document_id not in document_store:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete file from filesystem
        file_path = document_store[document_id]["filepath"]
        try:
            Path(file_path).unlink(missing_ok=True)
        except Exception:
            pass  # Continue even if file deletion fails
        
        # Remove from memory
        del document_store[document_id]
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

@app.post("/query")
async def query_documents(request: QueryRequest):
    """Query documents endpoint (non-streaming for production compatibility)"""
    try:
        if not document_store:
            raise HTTPException(status_code=400, detail="No documents uploaded yet")
        
        context = "\n\n".join([
            f"Document {doc_id}: {doc_info.get('content', 'Binary content not displayed')}"
            for doc_id, doc_info in document_store.items()
        ])
        
        if not context.strip():
            context = "Documents have been uploaded but content could not be extracted for text-based processing."
        
        prompt = f"""Based on the following document context, please answer the question:

Context:
{context}

Question: {request.query}

Please provide a comprehensive answer based only on the provided context."""
        
        # Use non-streaming response for better production compatibility
        response_text = await ollama_service.generate_response(prompt)
        
        # Save to history
        query_id = str(uuid.uuid4())
        query_results[query_id] = {
            "query": request.query,
            "response": response_text,
            "timestamp": str(asyncio.get_event_loop().time())
        }
        
        return {
            "query_id": query_id,
            "response": response_text,
            "type": "complete"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@app.get("/history")
async def get_query_history():
    """Get query history"""
    return {
        "history": [
            {
                "query_id": query_id,
                "query": data["query"],
                "response": data["response"],
                "timestamp": data["timestamp"]
            }
            for query_id, data in query_results.items()
        ],
        "total": len(query_results)
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "ollama_url": Config.get_ollama_url(),
        "documents_count": len(document_store)
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting RAG application...")
    print(f"Ollama URL: {Config.get_ollama_url()}")
    print(f"Timeout: {Config.TIMEOUT_SECONDS} seconds")
    uvicorn.run(app, host="0.0.0.0", port=8000)
