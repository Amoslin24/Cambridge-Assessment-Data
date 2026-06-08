import ssl
# 解决 macOS 顽固的 SSL 证书问题
ssl._create_default_https_context = ssl._create_unverified_context

import os
import pyperclip
from supabase import create_client
from google import genai  # 使用最新的 google-genai 库

# --- 1. 配置信息 ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    raise RuntimeError("请先设置 SUPABASE_URL、SUPABASE_ANON_KEY、GEMINI_API_KEY 环境变量。")

# 初始化客户端
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client = genai.Client(api_key=GEMINI_API_KEY)

def valruna_pro_upgrade(unit, lesson):
    print(f"🚀 Valruna 正在处理 Power Up 3 Unit {unit} Lesson {lesson}...")
    
    # 1. 检索数据
    res = supabase.table("power_up_3").select("*").eq("unit", unit).eq("lesson_no", lesson).execute()
    if not res.data:
        print("❌ 数据库未找到该课内容。")
        return
    data = res.data[0]
    
    # 2. 设定更有“探险感”的提示词 [cite: 30-31, 108]
    prompt = f"""
    你是 Valruna AI 助教。基于以下教材数据，为老师生成一份排版精美的反馈：
    课题：{data['topic']}
    词汇：{', '.join(data['core_vocab'])} [cite: 177-184]
    语法：{data['grammar_focus']} [cite: 79]
    练习册：Activity Book {data['workbook_pages']} [cite: 165]
    
    要求：
    - 背景结合印尼 Krakatau 岛和大力士 Ivan 的情境 [cite: 35, 108]。
    - 明确作业：1. 练习册完成；2. 以上单词【默写】；3. 用核心语法造 3 个句子。
    - 使用 Markdown 格式。
    """
    
    # 使用最新的 SDK 调用方式（API 当前支持 gemini-2.0-flash 等）
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        final_output = response.text
        print("\n" + "✨" * 15 + " VALRUNA OUTPUT " + "✨" * 15)
        print(final_output)
        print("✨" * 46)
    except Exception as e:
        print(f"⚠️ gemini-2.5-flash 不可用，尝试 gemini-2.0-flash-001...")
        response = client.models.generate_content(
            model="gemini-2.0-flash-001",
            contents=prompt
        )
        final_output = response.text
    
    # 4. 自动化输出
    # 动作 A: 存入本地文件
    filename = f"U{unit}L{lesson}_Report.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(final_output)
    
    # 动作 B: 拷贝到剪贴板
    pyperclip.copy(final_output)
    
    print("\n" + "✨" * 10 + " 任务完成 " + "✨" * 10)
    print(f"✅ 文案已自动拷贝到【剪贴板】。")
    print(f"✅ 完整备份已保存至: {filename}")
    print("现在你可以直接去 Craft 按 Cmd+V 粘贴了！")

# 启动
valruna_pro_upgrade(3, 1)
