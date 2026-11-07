import React from 'react';
import { Brain, Cpu, ShieldAlert, CheckCircle2, Clock, AlertTriangle, ArrowRight, Activity, HelpCircle } from 'lucide-react';

export default function AIAgentPanel({
  aiStatus,
  latestDecision,
  recentDecisions,
  operatingMode
}) {
  const classification = latestDecision?.classification || aiStatus?.status?.classification || 'IDLE';
  const confidence = latestDecision?.confidence ?? (aiStatus?.accuracy ? (aiStatus.accuracy * 100) : 95.0);
  const recommendation = latestDecision?.recommendation || 'Continuous telemetry monitoring. System awaiting load activation.';
  const reason = latestDecision?.reason || 'Both loads in quiescent baseline. Power within nominal limits.';
  const suggestedAction = latestDecision?.suggested_action || 'KEEP';
  const actionTaken = latestDecision?.action_taken || 'MONITORED';

  const getBadgeStyle = (cls) => {
    switch (cls) {
      case 'NORMAL':
        return 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-glow-emerald';
      case 'IDLE':
        return 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300';
      case 'HIGH_CONSUMPTION':
        return 'bg-amber-950/40 border-amber-500/50 text-amber-300';
      case 'ABNORMAL':
        return 'bg-rose-950/40 border-rose-500/60 text-rose-300 shadow-glow-rose animate-pulse';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center space-x-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span>AI AGENT DECISION CENTER (RANDOM FOREST CLASSIFIER)</span>
        </h2>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-[#1E2E4A] text-slate-400">
          Model: {aiStatus?.model_type || 'RandomForest'} • 100 Trees
        </span>
      </div>

      {/* Main AI Diagnostic Panel */}
      <div className="glass-panel-elevated p-5 rounded">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Classification & Confidence */}
          <div className="space-y-4 border-b lg:border-b-0 lg:border-r border-[#1E2E4A] pb-4 lg:pb-0 lg:pr-6">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                LOAD STATE CLASSIFICATION
              </span>
              <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-sm font-mono font-bold tracking-wide uppercase ${getBadgeStyle(classification)}`}>
                <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                <span>{classification}</span>
              </div>
            </div>

            {/* Confidence Gauge */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">MODEL CONFIDENCE</span>
                <span className="text-base font-mono font-bold text-cyan-400">{confidence.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
                />
              </div>
            </div>

            {/* Suggested Action */}
            <div className="pt-2 border-t border-[#1E2E4A]">
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">SUGGESTED CONTROL ACTION</span>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-slate-900 border border-[#1E2E4A] text-slate-200">
                  {suggestedAction}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Execution: <strong className="text-slate-200">{actionTaken}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Middle Column: Recommendation & Engineering Rationale */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold block mb-1">
                AI OPTIMIZATION RECOMMENDATION
              </span>
              <p className="text-sm font-medium text-slate-100 bg-slate-950/60 p-3 rounded border border-cyan-500/20">
                {recommendation}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                ENGINEERING REASONING & TELEMETRY ANALYSIS
              </span>
              <p className="text-xs font-mono text-slate-300 bg-slate-900/60 p-3 rounded border border-[#1E2E4A] leading-relaxed">
                {reason}
              </p>
            </div>

            {/* 4-Stage Autonomous Workflow Pipeline */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                CLOSED-LOOP AGENT WORKFLOW (OBSERVE → ANALYSE → DECIDE → ACT → VERIFY)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded bg-slate-900/80 border border-emerald-500/30 text-emerald-400 text-center">
                  <span className="text-[9px] font-mono uppercase block text-slate-400">STAGE 1</span>
                  <span className="text-xs font-mono font-bold block">1. OBSERVE</span>
                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5">INA219 V & I</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-emerald-500/30 text-emerald-400 text-center">
                  <span className="text-[9px] font-mono uppercase block text-slate-400">STAGE 2</span>
                  <span className="text-xs font-mono font-bold block">2. ANALYSE</span>
                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5">Random Forest</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-cyan-500/40 text-cyan-300 text-center shadow-glow-cyan">
                  <span className="text-[9px] font-mono uppercase block text-slate-400">STAGE 3</span>
                  <span className="text-xs font-mono font-bold block">3. DECIDE</span>
                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5">Safety & Budget</span>
                </div>
                <div className={`p-2 rounded border text-center ${
                  operatingMode === 'AUTO'
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}>
                  <span className="text-[9px] font-mono uppercase block text-slate-500">STAGE 4</span>
                  <span className="text-xs font-mono font-bold block">4. ACT</span>
                  <span className="text-[9px] font-mono block mt-0.5">{operatingMode === 'AUTO' ? 'Relay Trigger' : 'Operator Advisory'}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Model Transparency Disclosure Notice */}
        <div className="mt-4 pt-3 border-t border-[#1E2E4A] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Demonstration baseline: Trained on synthetic model (accuracy: 100.0%).</span>
          </span>
          <span className="text-slate-500">
            Retrain available via <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">train_model.py</code>
          </span>
        </div>
      </div>

      {/* Decision Log Table */}
      {recentDecisions && recentDecisions.length > 0 && (
        <div className="glass-panel p-4 rounded overflow-hidden">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block mb-3">
            RECENT AUTONOMOUS AI DECISIONS LOG
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1E2E4A] text-slate-400 text-[10px] uppercase">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Classification</th>
                  <th className="pb-2">Confidence</th>
                  <th className="pb-2">Observed Power</th>
                  <th className="pb-2">Suggested Action</th>
                  <th className="pb-2">Action Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2E4A]/40 text-slate-300">
                {recentDecisions.slice(0, 5).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/50">
                    <td className="py-2 text-slate-400">
                      {d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="py-2 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        d.classification === 'NORMAL' ? 'text-emerald-400 bg-emerald-950/40' :
                        d.classification === 'IDLE' ? 'text-cyan-400 bg-cyan-950/40' :
                        d.classification === 'HIGH_CONSUMPTION' ? 'text-amber-400 bg-amber-950/40' :
                        'text-rose-400 bg-rose-950/40'
                      }`}>
                        {d.classification}
                      </span>
                    </td>
                    <td className="py-2">{d.confidence ? `${d.confidence.toFixed(1)}%` : '100%'}</td>
                    <td className="py-2 text-cyan-300">{d.power_observed_mw?.toFixed(0)} mW</td>
                    <td className="py-2 font-semibold text-slate-200">{d.suggested_action}</td>
                    <td className="py-2 text-slate-400">{d.action_taken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

