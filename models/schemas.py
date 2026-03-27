from pydantic import BaseModel

class QueryRequest(BaseModel):
    query: str

class DocumentResponse(BaseModel):
    document_id: str
    filename: str
    size: int
    message: str

class QueryResponse(BaseModel):
    query_id: str
    response: str
    message: str
