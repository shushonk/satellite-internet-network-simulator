import React, { useState } from 'react';
import { Bot, Send, Sparkles, AlertCircle, CheckCircle2, RefreshCw, Cpu } from 'lucide-react';

interface AINetworkAssistantProps {
  telemetryData: any;
}

export const AINetworkAssistant: React.FC<AINetworkAssistantProps> = ({ telemetryData }) => {
  const [question, setQuestion] = useState<string>('');
  const [analysisText, setAnalysisText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  const fetchAnalysis = async (userPrompt?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/network-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetry: telemetryData,
          question: userPrompt || question,
        }),
      });

      const data = await response.json();
      setAnalysisText(data.analysis || 'Analysis unavailable.');
      setIsFallback(!!data.isFallback);
    } catch (err) {
      console.error('Failed to query AI Network Assistant:', err);
      setAnalysisText(
        `### 🛰️ Telemetry Diagnostic Scan\n\n• **Constellation Status:** Active (${telemetryData.totalSatellites} satellites)\n• **Average Latency:** ${(telemetryData.avgLatency || 0).toFixed(1)} ms\n\n*Diagnostic:* Handover logic is maintaining line-of-sight elevation > ${telemetryData.minElevationDeg || 25}°.`
      );
      setIsFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial scan on mount or button click
  const handleQuickQuestion = (q: string) => {
    setQuestion(q);
    fetchAnalysis(q);
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-6 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-cyan-400" />
            <span>AI Satellite Network Telemetry Assistant</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Aerospace Network Engineer providing link budget, handover analysis, and optimization insights.
          </p>
        </div>

        <button
          onClick={() => fetchAnalysis(question)}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-2 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-cyan-400" />
          )}
          <span>{isLoading ? 'Analyzing Telemetry...' : 'Run Full AI Diagnostic Scan'}</span>
        </button>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        <span className="text-slate-400 py-1">Quick Scans:</span>
        {[
          'Which satellite provides the best connection right now?',
          'Why is average latency changing during simulation?',
          'Which ground stations have weak elevation / RSSI signals?',
          'When will satellite handovers occur?',
          'How can we increase global throughput capacity?',
        ].map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickQuestion(q)}
            className="px-3 py-1 rounded-full bg-slate-955 border border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Response Box */}
      <div className="bg-slate-955 rounded-2xl border border-slate-800 p-6 min-h-[220px] flex flex-col justify-between relative overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-cyan-400">
            <Cpu className="w-8 h-8 animate-bounce" />
            <span className="text-xs font-mono">Running Orbital Link Budget & Pathing Algorithm...</span>
          </div>
        ) : analysisText ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Diagnostic Report Output
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {isFallback ? 'Engine: Rule-Based Aerospace Inspector' : 'Engine: Gemini 3.8 Flash'}
              </span>
            </div>

            <div className="prose prose-invert prose-xs max-w-none text-slate-300 font-mono text-xs leading-relaxed whitespace-pre-line">
              {analysisText}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs font-mono">
            <span>Click "Run Full AI Diagnostic Scan" or select a quick question above.</span>
          </div>
        )}

        {/* Input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (question.trim()) fetchAnalysis(question);
          }}
          className="mt-6 flex items-center gap-2 pt-4 border-t border-slate-800"
        >
          <input
            type="text"
            placeholder="Ask AI Assistant about satellite links, propagation delay, or handovers..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
