// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// 从 .env.local 文件里读取钥匙
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建并导出一个连接客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)