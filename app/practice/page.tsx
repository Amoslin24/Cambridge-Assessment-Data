'use client'; // 告诉网页：这是一个可以点击交互的页面

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PracticePage() {
  const [question, setQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);

  // 页面加载时去数据库拿题
  useEffect(() => {
    async function fetchQuestion() {
      const { data } = await supabase.from('questions').select('*').limit(1);
      if (data && data.length > 0) setQuestion(data[0]);
      setLoading(false);
    }
    fetchQuestion();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading Valruna Challenges...</div>;
  if (!question) return <div className="p-10 text-center">No questions found.</div>;

  const options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;

  const handleCheck = (option: string) => {
    if (showResult) return; // 如果已经出结果了，就不让再点了
    setSelectedOption(option);
    setShowResult(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        
        {/* 顶部标签 */}
        <div className="flex gap-2 mb-6">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">{question.level}</span>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase">{question.skill}</span>
        </div>

        {/* 题目正文 */}
        <h2 className="text-xl text-slate-800 font-semibold mb-8 leading-relaxed">{question.content}</h2>

        {/* 选项按钮 */}
        <div className="grid gap-3">
          {options.map((option: string, index: number) => {
            // 定义按钮的颜色逻辑
            // 重新定义的“高清晰度”按钮样式
let buttonStyle = "border-slate-300 bg-white text-slate-900 shadow-sm hover:border-blue-900 hover:bg-blue-50";

if (showResult) {
  if (option === question.correct_answer) {
    buttonStyle = "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20";
  } else if (option === selectedOption) {
    buttonStyle = "border-red-500 bg-red-50 text-red-700";
  } else {
    // 没选中的选项稍微变淡，突出正确答案
    buttonStyle = "opacity-40 border-slate-200 bg-slate-50 text-slate-400";
  }
}

            return (
              <button 
                key={index}
                onClick={() => handleCheck(option)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all text-lg font-bold ${buttonStyle}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* 结果和解析面板 */}
        {showResult && (
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className={`font-bold mb-2 ${selectedOption === question.correct_answer ? 'text-emerald-600' : 'text-red-600'}`}>
              {selectedOption === question.correct_answer ? '✓ Excellent! Correct.' : '✗ Not quite right.'}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              <span className="font-bold text-slate-900">Explanation: </span>
              {question.explanation}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}