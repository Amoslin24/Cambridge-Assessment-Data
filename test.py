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
# 注意：如果 .env 没生效，请直接把 Key 填在下面引号里测试
api_key = os.getenv("AIzaSyC8vkU4F1AUCk4PYEukor342etyRJOd0cY") 
if not api_key:
    # 如果没读取到环境变量，请手动填入你的 Key
    api_key = "AIzaSyC8vkU4F1AUCk4PYEukor342etyRJOd0cY"

client = genai.Client(api_key=api_key)

print("Listing available models...")

try:
    # 获取所有模型
    for m in client.models.list():
        # 打印出所有模型的 name
        print(f"Model found: {m.name}")
            
except Exception as e:
    print(f"Error: {e}")