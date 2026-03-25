export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-slide-in-left">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #1a3a8f 0%, #00d4ff 100%)',
          boxShadow: '0 0 12px rgba(0,212,255,0.4)',
        }}
      >
        <span className="text-white text-xs font-bold">K</span>
      </div>

      {/* Bubble */}
      <div
        className="glass-message px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{
          background: 'rgba(26,58,143,0.25)',
          border: '1px solid rgba(0,212,255,0.15)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <div className="typing-dot w-2 h-2 rounded-full bg-cyan-400" />
          <div className="typing-dot w-2 h-2 rounded-full bg-cyan-400" />
          <div className="typing-dot w-2 h-2 rounded-full bg-cyan-400" />
        </div>
      </div>
    </div>
  );
}
