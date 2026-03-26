import { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { WelcomeScreen } from './components/WelcomeScreen';

// ── Animated orb background ─────────────────────────────────────────────────
function Background() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Deep space base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #0a1628 0%, #020b18 60%, #010810 100%)',
        }}
      />

      {/* Orb 1 — cyan, top-left */}
      <div
        className="orb-1 absolute rounded-full opacity-30"
        style={{
          width: '600px',
          height: '600px',
          top: '-200px',
          left: '-150px',
          background:
            'radial-gradient(circle, rgba(0,212,255,0.35) 0%, rgba(0,102,255,0.15) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Orb 2 — blue, bottom-right */}
      <div
        className="orb-2 absolute rounded-full opacity-25"
        style={{
          width: '700px',
          height: '700px',
          bottom: '-250px',
          right: '-200px',
          background:
            'radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(139,92,246,0.2) 50%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Orb 3 — teal, center */}
      <div
        className="orb-3 absolute rounded-full opacity-15"
        style={{
          width: '500px',
          height: '500px',
          top: '30%',
          left: '40%',
          background:
            'radial-gradient(circle, rgba(20,184,166,0.3) 0%, rgba(0,212,255,0.1) 50%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Top vignette */}
      <div
        className="absolute inset-x-0 top-0 h-32"
        style={{
          background: 'linear-gradient(to bottom, rgba(2,11,24,0.8), transparent)',
        }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background: 'linear-gradient(to top, rgba(2,11,24,0.8), transparent)',
        }}
      />
    </div>
  );
}

// ── Doctors strip ────────────────────────────────────────────────────────────
const DOCTORS = [
  { name: 'Dr. Sarah Chen', specialty: 'Orthopedics', icon: '🦴' },
  { name: 'Dr. Marcus Johnson', specialty: 'Cardiology', icon: '❤️' },
  { name: 'Dr. Priya Patel', specialty: 'Dermatology', icon: '🔬' },
  { name: 'Dr. Robert Kim', specialty: 'Neurology', icon: '🧠' },
  { name: 'Dr. Elena Rodriguez', specialty: 'Gastroenterology', icon: '⚕️' },
];

function DoctorsStrip() {
  return (
    <div className="hidden lg:flex flex-col gap-2.5">
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '4px' }}>
        Our Specialists
      </p>
      {DOCTORS.map((doc) => (
        <div
          key={doc.name}
          className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-default"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span style={{ fontSize: '20px' }}>{doc.icon}</span>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#cbd5e1', lineHeight: '1.3' }}>{doc.name}</p>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '1px' }}>{doc.specialty}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  // Show welcome splash only on first load per session
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    if (typeof sessionStorage === 'undefined') return false;
    const seen = sessionStorage.getItem('kyron_welcomed');
    if (seen) return false;
    sessionStorage.setItem('kyron_welcomed', '1');
    return true;
  });

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <Background />

      {showWelcome && <WelcomeScreen onDone={() => setShowWelcome(false)} />}

      <div className="relative z-10 w-full max-w-6xl h-full max-h-[92vh] flex gap-6">

        {/* ── Left sidebar — branding ─────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between w-64 flex-shrink-0 py-4 panel-slide-left">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #1a3a8f, #0ea5e9)',
                  boxShadow: '0 0 20px rgba(0,212,255,0.3)',
                  border: '1px solid rgba(0,212,255,0.2)',
                }}
              >
                <span className="text-white font-bold text-base">K</span>
              </div>
              <div>
                <p style={{ fontSize: '17px', fontWeight: 700, color: '#fff', lineHeight: '1.2' }}>KYRON</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#00d4ff', lineHeight: '1.2', letterSpacing: '0.05em' }}>
                  MEDICAL
                </p>
              </div>
            </div>

            <DoctorsStrip />
          </div>

          {/* Bottom info */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: '15px',
            }}
          >
            <p style={{ color: '#94a3b8', fontWeight: 500, marginBottom: '4px' }}>📍 New York, NY</p>
            <p style={{ color: '#64748b' }}>2847 Madison Ave, Suite 700</p>
            <p style={{ color: '#64748b', marginTop: '6px' }}>📞 (212) 555-0100</p>
            <p style={{ color: '#64748b', marginTop: '6px' }}>Mon–Fri 8AM–6PM</p>
            <p style={{ color: '#64748b' }}>Sat 9AM–1PM</p>
          </div>
        </div>

        {/* ── Chat window ─────────────────────────────────────────────────── */}
        <div
          className="flex-1 flex flex-col rounded-3xl overflow-hidden panel-fade-up"
          style={{
            background: 'rgba(5,15,40,0.7)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow:
              '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(0,212,255,0.05)',
          }}
        >
          <ChatInterface />
        </div>

        {/* ── Right sidebar — info panels ─────────────────────────────────── */}
        <div className="hidden xl:flex flex-col gap-4 w-56 flex-shrink-0 py-4 panel-slide-right">
          {/* Privacy notice */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>🔒 Privacy</p>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
              Your conversation is encrypted and handled with HIPAA-compliant protocols.
            </p>
          </div>

          {/* Features */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#94a3b8', marginBottom: '10px' }}>✨ Features</p>
            <div className="space-y-3">
              {[
                ['📅', 'Appointment scheduling'],
                ['💊', 'Prescription refills'],
                ['📞', 'Voice call handoff'],
                ['📧', 'Email confirmation'],
                ['📱', 'SMS reminders'],
              ].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span style={{ fontSize: '15px' }}>{icon}</span>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.15)',
            }}
          >
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#f87171', marginBottom: '6px' }}>🚨 Emergency</p>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
              If you're experiencing a medical emergency, call{' '}
              <strong style={{ color: '#f87171' }}>911</strong> immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
