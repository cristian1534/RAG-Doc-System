# RAG Document System

Una aplicación RAG simple para subir documentos y consultar sobre ellos utilizando FastAPI y Ollama.

## Características

- 📄 Subida de documentos (PDF, DOCX, TXT)
- �️ Eliminación de documentos individuales
- �🔍 Consultas sobre los documentos subidos
- 📜 Historial de consultas con toggle
- 🤖 Integración con Ollama para procesamiento de lenguaje natural
- 🖥️ Interfaz web simple estilo Windows
- ⚡ FastAPI con documentación Swagger automática
- 🐳 Docker para deploy en producción

## Instalación

### Local Development

1. Clonar el repositorio
2. Crear entorno virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # o
   venv\Scripts\activate  # Windows
   ```
3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Editar `.env`:
   ```
   OLLAMA_URL=https://tu-servidor-ollama/api/generate
   TIMEOUT_SECONDS=180
   ```
5. Ejecutar la aplicación:
   ```bash
   python main.py
   ```

### Docker

```bash
# Build
docker build -t rag-document-system .

# Run
docker run -p 8000:8000 -e OLLAMA_URL=tu-url rag-document-system
```

## Deploy en Render.io

### Prerequisites
- Cuenta en Render.io
- Repositorio GitHub con el código

### Pasos para Deploy

1. **Subir a Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Ready for Render deployment"
   git remote add origin <tu-repo-github>
   git push -u origin main
   ```

2. **Crear Servicio en Render (Consola)**
   - Ir a [Render.com](https://render.com)
   - Click "New" → "Web Service"
   - Conectar tu repositorio GitHub
   - Configurar:
     - **Name**: rag-document-system
     - **Runtime**: Docker
     - **Dockerfile Path**: ./Dockerfile
     - **Instance Type**: Free ($0/month)

3. **Environment Variables en Render**
   En el dashboard de Render agregar:
   - `OLLAMA_URL`: Tu URL de Ollama
   - `TIMEOUT_SECONDS`: 180

4. **Deploy**
   - Click "Create Web Service"
   - Render construirá y desplegará automáticamente
   - Monitorear los logs de construcción

### Storage Efímero
⚠️ **Importante**: El directorio `uploads/` es efímero en Docker:
- ✅ Los documentos persisten mientras el contenedor está activo
- ❌ Se pierden cuando Render reinicia el servicio (cada ~24 horas)
- 💡 Para producción, considera Render Disks (pago) o cloud storage

## Uso

### Interfaz Web
1. Abre `http://localhost:8000` en tu navegador
2. **Upload Document**: Sube archivos PDF, DOCX o TXT
3. **Manage Documents**: Lista y elimina documentos (Show/Hide toggle)
4. **Query Documents**: Realiza consultas sobre los documentos
5. **Query History**: Revisa consultas anteriores (Show/Hide toggle)

### API Endpoints

#### POST /upload
Sube un documento al sistema.

**Request:** `multipart/form-data`
- `file`: Archivo a subir (PDF, DOCX, TXT)

**Response:**
```json
{
  "document_id": "uuid",
  "filename": "documento.pdf",
  "size": 1024,
  "message": "Document uploaded successfully"
}
```

#### POST /query
Realiza una consulta sobre los documentos subidos.

**Request:** `application/json`
```json
{
  "query": "¿Cuál es el contenido principal del documento?"
}
```

**Response:** (Streaming)
```
data: {"chunk": "respuesta parcial", "type": "content"}
data: {"query_id": "uuid", "type": "complete"}
```

#### GET /documents
Lista todos los documentos subidos.

#### DELETE /documents/{document_id}
Elimina un documento específico.

#### GET /history
Devuelve el historial de consultas.

#### GET /health
Verifica el estado del sistema y la conexión con Ollama.

#### GET /docs
Documentación Swagger automática de FastAPI.

## Configuración

### Variables de Entorno
- `OLLAMA_URL`: URL del servidor Ollama (requerido)
- `TIMEOUT_SECONDS`: Timeout para consultas (default: 180)

### Estructura de Archivos
```
├── Dockerfile              # Configuración del contenedor
├── .gitignore              # Reglas para Git
├── requirements.txt        # Dependencias Python
├── main.py                 # Aplicación FastAPI principal
├── config.py               # Configuración
├── services/               # Lógica de negocio
│   ├── ollama_service.py   # Servicio Ollama
│   └── document_service.py # Procesamiento de documentos
├── models/                 # Modelos de datos
├── static/                 # Archivos estáticos (JS, CSS)
├── templates/              # Plantillas HTML
└── uploads/                # Documentos subidos (efímero)
```

## Notas Técnicas

- **Streaming**: Adaptado para proxy ngrok (stream: false)
- **Timeout**: 180 segundos para consultas largas
- **Documentos**: Extraídos y truncados para evitar timeouts
- **Storage**: Efímero en Docker, persistente solo mientras el contenedor vive
- **Frontend**: JavaScript vanilla con ES5 para compatibilidad
- **Backend**: FastAPI async con manejo de errores

## Troubleshooting

### Problemas Comunes
- **Error 500 Ollama**: Verificar URL y modelo (`mistral:latest`)
- **Timeout en queries**: Reducir tamaño de documentos o aumentar timeout
- **Documentos no aparecen**: Reiniciar aplicación (carga docs existentes)
- **Streaming no funciona**: El proxy ngrok free no soporta streaming

### Logs y Monitoreo
- Render: Dashboard → Service → Logs
- Local: Consola donde ejecutas `python main.py`
- Health check: `GET /health`

## Licencia

MIT License - Libre para uso comercial y personal.
# RAG-Doc-System
