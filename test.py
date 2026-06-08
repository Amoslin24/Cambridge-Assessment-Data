import os
import sys
import io
from google import genai
from dotenv import load_dotenv

# 强制标准输出使用 UTF-8，避免中文/Unicode 触发 ascii 编码错误
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
elif hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# 加载 .env 文件
load_dotenv() 

# 初始化
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("请先在 .env 或环境变量中设置 GEMINI_API_KEY。")

client = genai.Client(api_key=api_key)

print("Listing available models...")

try:
    # 获取所有模型
    for m in client.models.list():
        # 打印出所有模型的 name
        print(f"Model found: {m.name}")
            
except Exception as e:
    print(f"Error: {e}")
