import requests
from typing import Dict, Any
from config import Config

class OllamaService:
    def __init__(self):
        self.base_url = Config.get_ollama_url()
        self.timeout = Config.TIMEOUT_SECONDS
    
    async def generate_response_stream(self, prompt: str):
        """Generate streaming response from Ollama"""
        payload = {
            "model": "mistral:latest",
            "prompt": prompt,
            "stream": False  # El proxy ngrok no soporta streaming correctamente
        }
        
        try:
            response = requests.post(
                self.base_url,
                json=payload,
                stream=True,
                timeout=(self.timeout, self.timeout)
            )
            
            if response.status_code != 200:
                error_msg = f"Ollama API error: {response.status_code} - {response.text}"
                raise Exception(error_msg)
            
            # Since we're not using real streaming, get the full response at once
            result = response.json()
            
            # Extract response from the new structure
            response_text = ""
            if 'choices' in result and len(result['choices']) > 0:
                response_text = result['choices'][0].get('text', '')
            elif 'response' in result:
                response_text = result['response']
            elif 'answer' in result:
                response_text = result['answer']
            elif 'text' in result:
                response_text = result['text']
            elif 'content' in result:
                response_text = result['content']
            else:
                response_text = str(result)
            
            if not response_text or response_text == "None":
                raise Exception(f"Invalid response format. Available fields: {list(result.keys())}")
            
            # Yield the full response as one chunk since we can't stream
            yield response_text.strip()
            
        except requests.exceptions.Timeout:
            raise Exception(f"Query processing timed out after {self.timeout} seconds")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error connecting to Ollama: {str(e)}")
        except Exception as e:
            raise Exception(f"Error processing query with Ollama: {str(e)}")
    
    async def generate_response(self, prompt: str) -> str:
        """Generate response from Ollama (non-streaming fallback)"""
        payload = {
            "model": "mistral:latest",
            "prompt": prompt,
            "stream": False
        }
        
        try:
            response = requests.post(
                self.base_url,
                json=payload,
                timeout=(self.timeout, self.timeout)
            )
            
            if response.status_code != 200:
                error_msg = f"Ollama API error: {response.status_code} - {response.text}"
                raise Exception(error_msg)
            
            result = response.json()
            
            # Extract response from the new structure
            response_text = ""
            if 'choices' in result and len(result['choices']) > 0:
                response_text = result['choices'][0].get('text', '')
            elif 'response' in result:
                response_text = result['response']
            elif 'answer' in result:
                response_text = result['answer']
            elif 'text' in result:
                response_text = result['text']
            elif 'content' in result:
                response_text = result['content']
            else:
                response_text = str(result)
            
            if not response_text or response_text == "None":
                raise Exception(f"Invalid response format. Available fields: {list(result.keys())}")
            
            return response_text.strip()
            
        except requests.exceptions.Timeout:
            raise Exception(f"Query processing timed out after {self.timeout} seconds")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error connecting to Ollama: {str(e)}")
        except Exception as e:
            raise Exception(f"Error processing query with Ollama: {str(e)}")
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to Ollama"""
        payload = {
            "model": "mistral",
            "prompt": "Hello, can you respond with just 'OK'?",
            "stream": False
        }
        
        try:
            response = requests.post(
                self.base_url,
                json=payload,
                timeout=(self.timeout, self.timeout)
            )
            
            if response.status_code != 200:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "url": self.base_url
                }
            
            result = response.json()
            return {
                "success": True,
                "response": result.get("response", "No response field"),
                "url": self.base_url
            }
            
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": f"Request timed out after {self.timeout} seconds",
                "url": self.base_url
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "url": self.base_url
            }
