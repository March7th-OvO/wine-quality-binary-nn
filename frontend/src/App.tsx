import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wine, Activity, Layers, ActivitySquare, BarChart3, RefreshCw, Zap, Lightbulb } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import Markdown from 'react-markdown';
import type { WineFeatures, PredictionResult, ModelMetrics } from './types';
import { cn } from './lib/utils';
import * as Slider from '@radix-ui/react-slider';

const DEFAULT_GOOD_WINE: WineFeatures = {
  fixed_acidity: 7.4,
  volatile_acidity: 0.36,
  citric_acid: 0.3,
  residual_sugar: 1.8,
  chlorides: 0.074,
  free_sulfur_dioxide: 17,
  total_sulfur_dioxide: 24,
  density: 0.99419,
  pH: 3.24,
  sulphates: 0.7,
  alcohol: 11.4
};

const DEFAULT_POOR_WINE: WineFeatures = {
  fixed_acidity: 8.1,
  volatile_acidity: 0.85,
  citric_acid: 0.08,
  residual_sugar: 2.1,
  chlorides: 0.12,
  free_sulfur_dioxide: 10,
  total_sulfur_dioxide: 35,
  density: 0.99720,
  pH: 3.3,
  sulphates: 0.45,
  alcohol: 9.0
};

const FEATURE_META = [
  { key: 'alcohol', label: '酒精度 (%)', min: 8, max: 15, step: 0.1 },
  { key: 'volatile_acidity', label: '挥发性酸度', min: 0.1, max: 1.6, step: 0.01 },
  { key: 'sulphates', label: '硫酸盐', min: 0.3, max: 2.0, step: 0.01 },
  { key: 'fixed_acidity', label: '固定酸度', min: 4, max: 16, step: 0.1 },
  { key: 'citric_acid', label: '柠檬酸', min: 0, max: 1, step: 0.01 },
  { key: 'residual_sugar', label: '残糖', min: 1, max: 15, step: 0.1 },
  { key: 'chlorides', label: '氯化物', min: 0.01, max: 0.6, step: 0.001 },
  { key: 'density', label: '密度', min: 0.99, max: 1.004, step: 0.0001 },
  { key: 'pH', label: 'pH', min: 2.7, max: 4.0, step: 0.01 },
  { key: 'free_sulfur_dioxide', label: '游离二氧化硫', min: 1, max: 72, step: 1 },
  { key: 'total_sulfur_dioxide', label: '总二氧化硫', min: 6, max: 289, step: 1 },
] as const;

export default function App() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [features, setFeatures] = useState<WineFeatures>(DEFAULT_GOOD_WINE);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expertOpinion, setExpertOpinion] = useState<string | null>(null);
  const [loadingOpinion, setLoadingOpinion] = useState(false);

  useEffect(() => {
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error("Could not load metrics", err));
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    setPrediction(null);
    setExpertOpinion(null);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
      });
      const data = await res.json();
      setPrediction(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetOpinion = async () => {
    if (!prediction) return;
    setLoadingOpinion(true);
    setExpertOpinion(null);
    try {
      const res = await fetch('/api/expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, prediction }),
      });
      const data = await res.json();
      setExpertOpinion(data.opinion);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOpinion(false);
    }
  };

  const handleSliderChange = (key: keyof WineFeatures, val: number) => {
    setFeatures(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-slate-100 flex flex-col overflow-x-hidden">
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0f0f0f] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center shadow-lg shadow-red-900/40">
            <div className="w-3 h-3 bg-white rotate-45"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-red-500 to-rose-300 bg-clip-text text-transparent">
            ENOVISION AI <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] ml-2 hidden sm:inline-block">v2.4.1</span>
          </h1>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
            <span className="text-xs font-medium text-slate-400 font-mono hidden sm:inline-block">模型就绪: wine_mlp.pt</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {/* Left Column: Metrics Dashboard */}
        <section className="lg:w-72 flex flex-col gap-4 shrink-0">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">模型性能指标</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <MetricCard title="准确率" value={metrics?.accuracy} icon={<ActivitySquare size={14} />} delay={0.1} />
            <MetricCard title="精确率" value={metrics?.precision} icon={<Layers size={14} />} delay={0.2} />
            <MetricCard title="F1 分数" value={metrics?.f1_score} icon={<Activity size={14} />} delay={0.3} />
            <MetricCard title="AUC" value={metrics?.auc} icon={<BarChart3 size={14} />} delay={0.4} />
          </div>

          <div className="bg-[#141414] border border-white/5 p-4 sm:p-6 rounded-xl h-[300px] mt-2 shadow-xl shadow-black/20 hidden lg:block">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">指标概览</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={
                metrics ? [
                  { name: '准确率', value: metrics.accuracy * 100 },
                  { name: '精确率', value: metrics.precision * 100 },
                  { name: '召回率', value: metrics.recall * 100 },
                  { name: 'F1', value: metrics.f1_score * 100 }
                ] : []
              }>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#141414', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {metrics && ['准确率', '精确率', '召回率', 'F1'].map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#b91c1c' : '#991b1b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 lg:mt-auto hidden lg:block">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">预设样本</h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setFeatures(DEFAULT_GOOD_WINE)}
                className="w-full text-left px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 hover:bg-white/10 transition-colors"
              >
                填充: <span className="text-red-400">优质年份 2018</span>
              </button>
              <button
                onClick={() => setFeatures(DEFAULT_POOR_WINE)}
                className="w-full text-left px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 hover:bg-white/10 transition-colors"
              >
                填充: <span className="text-slate-200">普通混合 (品质 4)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Prediction Interface */}
        <section className="flex-1 flex flex-col gap-6 w-full lg:max-w-none">
          <div className="bg-[#141414] border border-white/5 p-6 sm:p-8 rounded-2xl flex-1 flex flex-col shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                <div className="w-1 h-6 bg-red-700 rounded-full"></div>
                理化参数输入
              </h2>

              {/* Presets for mobile/tablet */}
              <div className="flex lg:hidden space-x-2">
                <button
                  onClick={() => setFeatures(DEFAULT_GOOD_WINE)}
                  className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-red-400 transition-colors"
                >
                  优质
                </button>
                <button
                  onClick={() => setFeatures(DEFAULT_POOR_WINE)}
                  className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-slate-300 transition-colors"
                >
                  普通
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-8 gap-x-10">
              {FEATURE_META.map((feat) => (
                <div key={feat.key} className="space-y-3">
                  <div className="flex justify-between items-center text-[11px] uppercase tracking-tighter text-slate-400">
                    <span>{feat.label}</span>
                    <input
                      type="number"
                      value={features[feat.key]}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          handleSliderChange(feat.key, val);
                        }
                      }}
                      step={feat.step}
                      min={feat.min}
                      max={feat.max}
                      className="w-16 text-right text-slate-200 font-mono text-[12px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                    />
                  </div>
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[features[feat.key]]}
                    max={feat.max}
                    min={feat.min}
                    step={feat.step}
                    onValueChange={(val) => handleSliderChange(feat.key, val[0])}
                  >
                    <Slider.Track className="bg-white/5 relative grow rounded-full h-1.5 overflow-hidden">
                      <Slider.Range className="absolute bg-red-700 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb
                      className="block w-4 h-4 bg-white border-2 border-red-700 rounded-full shadow-sm hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors cursor-grab active:cursor-grabbing"
                      aria-label={feat.label}
                    />
                  </Slider.Root>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-center pb-2">
              <button
                onClick={handlePredict}
                disabled={loading}
                className={cn(
                  "relative px-12 py-4 rounded-full font-bold text-sm tracking-widest transition-all text-white",
                  loading
                    ? "bg-stone-800 border border-white/10 text-stone-400 cursor-not-allowed"
                    : "bg-red-800 hover:bg-red-700 shadow-[0_10px_30px_-5px_rgba(153,27,27,0.6)]"
                )}
              >
                <span className={cn("flex items-center", loading ? "opacity-0" : "opacity-100")}>
                  开始品质评估
                </span>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw size={20} className="animate-spin text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div>
            <AnimatePresence mode="wait">
              {prediction ? (
                <div key="result-container" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "flex flex-col md:flex-row items-center border relative overflow-hidden gap-10 p-8 rounded-2xl",
                    prediction.label === 1
                      ? "bg-gradient-to-r from-red-950 via-[#1a0606] to-[#0f0f0f] border-red-900/30 shadow-xl shadow-red-900/20"
                      : "bg-[#141414] border-white/5"
                  )}
                >
                  <div className="flex flex-col flex-1 text-center md:text-left z-10">
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", prediction.label === 1 ? "text-red-500" : "text-slate-500")}>
                      预测结果
                    </span>
                    <h3 className={cn("text-3xl lg:text-4xl font-serif tracking-tight", prediction.label === 1 ? "text-white" : "text-slate-300")}>
                      {prediction.label === 1 ? "优质红酒" : "普通混合"}
                    </h3>
                    <p className={cn("text-xs mt-1 italic", prediction.label === 1 ? "text-red-300/60" : "text-slate-500")}>
                      {prediction.label === 1
                        ? "该样本以高置信度超过品质阈值。"
                        : "检测到典型的普通餐酒特征。"
                      }
                    </p>
                  </div>

                  <div className="flex-1 flex justify-center items-center gap-6 md:gap-12 w-full md:w-auto z-10">
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">ML 分类</div>
                      <div className={cn("text-2xl font-mono", prediction.label === 1 ? "text-white" : "text-slate-400")}>
                        {prediction.label === 1 ? "优质" : "普通"}
                      </div>
                    </div>
                    <div className="h-12 w-px bg-white/10 hidden md:block"></div>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">置信概率</div>
                      <div className={cn("text-3xl font-mono", prediction.label === 1 ? "text-red-400" : "text-slate-400")}>
                        {(prediction.probability * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {prediction.label === 1 && (
                    <div className="w-full md:w-32 flex justify-center md:justify-end z-10 mt-4 md:mt-0">
                      <div className="relative w-20 h-20">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="226" strokeDashoffset={226 - (226 * prediction.probability)} className="text-red-700 transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-red-500 text-lg">🍷</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* AI Sommelier Opinion Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#141414] border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                       <Lightbulb size={16} className="text-yellow-500" />
                       AI 侍酒师品鉴意见
                    </h3>
                    {!expertOpinion && (
                      <button
                        onClick={handleGetOpinion}
                        disabled={loadingOpinion}
                        className={cn(
                          "px-4 py-2 rounded-md font-medium text-xs tracking-wider transition-all",
                          loadingOpinion
                            ? "bg-white/5 text-slate-500 cursor-not-allowed"
                            : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        )}
                      >
                         {loadingOpinion ? "分析中..." : "请求品鉴"}
                      </button>
                    )}
                  </div>

                  {expertOpinion ? (
                    <div className="text-base text-slate-300 leading-relaxed bg-[#0a0a0a] p-5 rounded-xl border border-white/5 [&>p]:mb-4 [&>p:last-child]:mb-0 [&>strong]:text-white [&>strong]:font-semibold">
                       <Markdown>{expertOpinion}</Markdown>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      {loadingOpinion ? "正在基于机器学习模型的化学分析生成专家品鉴意见..." : "请求 AI 为此配方生成专业的侍酒师品鉴意见。"}
                    </div>
                  )}
                </motion.div>
                </div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-white/5 bg-[#141414] p-8 flex flex-col items-center justify-center text-center min-h-[176px]"
                >
                  <h3 className="text-lg font-medium text-slate-400 mb-2">等待评估</h3>
                  <p className="text-sm text-slate-600 max-w-xs">
                    调整参数以进行模型推理
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Footer Status */}
      <footer className="h-8 px-6 bg-[#080808] border-t border-white/5 flex items-center justify-between text-[10px] text-slate-600 w-full mt-auto">
        <div className="hidden sm:block">PyTorch 后端引擎运行中 (FastAPI 推理模式)</div>
        <div className="block sm:hidden">PyTorch 引擎</div>
        <div className="flex gap-4">
          <span className="hidden sm:inline-block">StandardScaler 已启用</span>
          <span className="hidden sm:inline-block">BCEWithLogitsLoss 已应用</span>
          <span className="text-slate-400">© 2024 VINTAGE ANALYTICS LAB</span>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ title, value, icon, delay }: { title: string, value?: number, icon: React.ReactNode, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#141414] border border-white/5 p-4 rounded-xl flex flex-col"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
          {icon}
          {title}
        </span>
      </div>
      <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
        {value ? `${(value * 100).toFixed(1)}%` : '---'}
      </div>
    </motion.div>
  );
}
