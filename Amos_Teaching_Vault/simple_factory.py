import requests
import os

# --- 极简配置 ---
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "jeeves:latest"  # Your custom local model

def ask_jeeves(prompt):
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        return response.json().get("response", "No response received.")
    except Exception as e:
        return f"Error contacting Ollama: {e}"

# --- Test the connection ---
if __name__ == "__main__":
    print("Connecting to your digital butler...")
    result = ask_jeeves("Hello, Jeeves. Are you ready to assist?")
    print(f"Jeeves: {result}")