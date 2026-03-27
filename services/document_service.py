import PyPDF2
from io import BytesIO

class DocumentService:
    MAX_CONTEXT_LENGTH = 500  # Muy bajo para pruebas rápidas
    
    @staticmethod
    def extract_text_from_pdf(content: bytes) -> str:
        """Extract text from PDF content"""
        try:
            pdf_file = BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n"
            
            return text.strip()
        except Exception as e:
            print(f"Error extracting PDF text: {str(e)}")
            return f"Error extracting PDF content: {str(e)}"
    
    @staticmethod
    def optimize_context_for_ollama(text: str, max_length: int = None) -> str:
        """Optimize text context for Ollama processing"""
        if max_length is None:
            max_length = DocumentService.MAX_CONTEXT_LENGTH
        
        if len(text) <= max_length:
            return text
        
        # Truncate and add warning
        truncated_text = text[:max_length]
        warning = f"\n\n[WARNING: Document truncated to {max_length} characters for optimal processing. Original length: {len(text)} characters]"
        
        return truncated_text + warning
    
    @staticmethod
    def extract_text_from_file(content: bytes, filename: str) -> str:
        """Extract text based on file type"""
        if filename.lower().endswith('.pdf'):
            raw_text = DocumentService.extract_text_from_pdf(content)
            return DocumentService.optimize_context_for_ollama(raw_text)
        elif filename.lower().endswith('.txt'):
            raw_text = content.decode('utf-8', errors='ignore')
            return DocumentService.optimize_context_for_ollama(raw_text)
        elif filename.lower().endswith('.docx'):
            return "DOCX file uploaded - text extraction requires additional library (python-docx)"
        else:
            return f"Unsupported file format: {filename}"
