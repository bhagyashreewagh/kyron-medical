import { useEffect, useState } from 'react';

export function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Begin fade-out after 1.5 s, remove after 2 s
    const fadeTimer = setTimeout(() => setFading(true), 1500);
    const doneTimer = setTimeout(() => onDone(), 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, #0a1628 0%, #020b18 70%)',
        transition: 'opacity 0.5s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      {/* Background animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="orb-1 absolute rounded-full"
          style={{
            width: '500px',
            height: '500px',
            top: '-150px',
            left: '-150px',
            background:
              'radial-gradient(circle, rgba(0,212,255,0.2) 0%, rgba(0,102,255,0.08) 50%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="orb-2 absolute rounded-full"
          style={{
            width: '600px',
            height: '600px',
            bottom: '-200px',
            right: '-150px',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(139,92,246,0.12) 50%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="orb-3 absolute rounded-full"
          style={{
            width: '400px',
            height: '400px',
            top: '40%',
            left: '45%',
            background:
              'radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-6 welcome-content">
        {/* Logo monogram with glow */}
        <div className="relative">
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'rgba(0,212,255,0.15)',
              filter: 'blur(20px)',
              transform: 'scale(1.4)',
            }}
          />
          <div
            className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #0f2460 0%, #1a56db 50%, #0ea5e9 100%)',
              boxShadow:
                '0 0 40px rgba(0,212,255,0.4), 0 0 80px rgba(0,102,255,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
              border: '1px solid rgba(0,212,255,0.3)',
            }}
          >
            <span
              className="font-black text-white"
              style={{ fontSize: '32px', letterSpacing: '-1px' }}
            >
              KM
            </span>
          </div>
        </div>

        {/* Brand name */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span
              className="font-black tracking-[0.15em] uppercase"
              style={{
                fontSize: '22px',
                background: 'linear-gradient(135deg, #e2e8f0 0%, #ffffff 50%, #bfdbfe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Kyron Medical
            </span>
          </div>

          {/* Tagline */}
          <p
            className="text-sm font-medium tracking-widest uppercase"
            style={{
              color: '#00d4ff',
              opacity: 0.85,
              letterSpacing: '0.2em',
            }}
          >
            Your Health, Our Priority
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: '6px',
                height: '6px',
                background: 'rgba(0,212,255,0.6)',
                animation: `typingBounce 1.2s ease-in-out infinite`,
                animationDelay: `${i * 160}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
