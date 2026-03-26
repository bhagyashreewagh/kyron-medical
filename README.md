# Kyron Medical — AI Patient Assistant

A full-stack web application providing an intelligent, human-like AI chat assistant for Kyron Medical Group patients. Features appointment scheduling, prescription refills, voice call handoff, and more.

🌐 **Live:** https://kyronmedical.duckdns.org

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript (ESM) |
| AI Chat | Anthropic Claude (claude-sonnet-4-6) via streaming SSE |
| Voice AI | Vapi.ai — outbound calls + inbound call-back continuity |
| Email | Nodemailer + Brevo SMTP |
| SMS | Twilio (opt-in) |
| Calendar | Google Calendar API (service account) |
| Hosting | AWS EC2 (t3.micro) + Nginx + Let's Encrypt SSL |

---

## Features

### Core
- **Conversational AI intake** — Collects name, DOB, phone, email, and reason naturally in a guided 11-step flow
- **Semantic provider matching** — Routes patients to the right specialist based on their condition; says "we don't treat that" and offers a referral number otherwise
- **Real-time slot selection** — 60 days of availability across 5 doctors; handles natural requests like "do you have something on a Tuesday?"
- **Email confirmation** — HTML email sent automatically on booking via Brevo SMTP
- **SMS opt-in** — Twilio text reminders; patient must explicitly consent (TCPA compliant)
- **Voice call handoff** — One-click button switches the chat to a live phone call; Kyra retains the full web chat context seamlessly
- **Streaming responses** — Claude streams tokens in real-time for a live, human-like feel
- **Liquid glass UI** — Glassmorphism panels, animated orbs, Kyron Medical navy/cyan branding

### Pioneer Features ⭐
- **Call-back continuity** — If a call drops and the patient calls back inbound, Vapi fires `assistant-request` → server responds with full prior call transcript + patient DB record injected as context; Kyra picks up exactly where she left off — even after server restarts
- **Persistent returning patient detection** — Patient records saved to `patients.json` on booking (name, DOB, phone, email, last visit, last doctor). On any new session, the moment a matching phone/email appears in chat, Kyra auto-recognizes the patient, greets them by name, and skips all intake questions
- **Next Available ASAP** — Patient asks "what's the soonest appointment?" → Kyra immediately shows the 3 nearest slots across all doctors with no intake required upfront
- **Smart pre-visit prep** — After confirming, Kyra gives 1–2 specialty-specific tips (e.g. "avoid caffeine 24h before your cardiology visit")
- **Google Calendar integration** — Auto-creates a calendar event on booking via Google service account
- **Duplicate booking guard** — Slot-level lock prevents double-booking even across server restarts

---

## Project Structure

```
kyron-medical/
├── backend/
│   ├── src/
│   │   ├── data/doctors.ts        # 5 specialists + 60-day slot generation
│   │   ├── services/
│   │   │   ├── claude.ts          # Anthropic SDK, system prompt, streaming
│   │   │   ├── email.ts           # Nodemailer HTML confirmation emails
│   │   │   ├── sms.ts             # Twilio SMS
│   │   │   ├── vapi.ts            # Vapi outbound calls + inbound assistant config (OpenAI nova voice)
│   │   │   ├── patients.ts        # Persistent patient store (patients.json) for returning patient detection
│   │   │   └── calendar.ts        # Google Calendar event creation
│   │   ├── routes/
│   │   │   ├── chat.ts            # SSE streaming chat + booking signal parser
│   │   │   ├── appointments.ts    # Doctors/slots REST API
│   │   │   └── voice.ts           # Voice initiation + Vapi webhook handler
│   │   └── server.ts              # Express app entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx  # Main chat UI + voice modal
│   │   │   ├── Message.tsx        # Message bubble + appointment card
│   │   │   ├── WelcomeScreen.tsx  # Animated first-visit splash
│   │   │   └── TypingIndicator.tsx
│   │   ├── hooks/useChat.ts       # Chat state + SSE client + card injection
│   │   └── App.tsx                # Layout, animated background, sidebars
│   └── package.json
├── .env.example                   # All required environment variables
├── deploy.sh                      # One-command Ubuntu EC2 setup
└── nginx.conf                     # Reference Nginx config
```

---

## Quick Start (Local)

### 1. Clone and install
```bash
git clone https://github.com/bhagyashreewagh/kyron-medical.git
cd kyron-medical
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your API keys (see below)
```

**Required:**
- `ANTHROPIC_API_KEY` — [Anthropic Console](https://console.anthropic.com)

**For voice calls:**
- `VAPI_API_KEY` — [Vapi Dashboard](https://vapi.ai)
- `VAPI_PHONE_NUMBER_ID` — Provision a phone number in Vapi dashboard

**For emails:**
- `BREVO_API_KEY`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` (Brevo free tier)
- Or: `GMAIL_USER` + `GMAIL_APP_PASSWORD`

**For SMS:**
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

**For Google Calendar (optional):**
- `GOOGLE_SERVICE_ACCOUNT_JSON` — paste entire service account JSON as one line
- `GOOGLE_CALENDAR_ID` — calendar ID to create events on

### 3. Run development servers
```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Visit `http://localhost:5173`

---

## EC2 Deployment

### Prerequisites
- Ubuntu 22.04 LTS EC2 instance (t3.micro or larger)
- Elastic IP associated
- Security group: ports 22, 80, 443 open
- Domain/subdomain pointing to your Elastic IP (DuckDNS works free)

### One-command deploy
```bash
# On your EC2 instance:
export DOMAIN=yourdomain.com
export EMAIL=you@email.com
bash deploy.sh
```

Then add your API keys:
```bash
sudo nano /opt/kyron-medical/.env
pm2 restart kyron-medical
```

### Vapi Webhook Setup
In your [Vapi dashboard](https://vapi.ai) → Phone Numbers → your number → set Server URL to:
```
https://yourdomain.com/api/voice/webhook
```
This enables **call-back continuity** — when a patient calls inbound, Vapi fires `assistant-request` and the server responds with the full assistant config + previous call context.

---

## Providers

| Doctor | Specialty | Treats |
|--------|-----------|--------|
| Dr. Sarah Chen | Orthopedics & Sports Medicine | Bones, joints, back pain, sports injuries |
| Dr. Marcus Johnson | Cardiology | Heart, chest pain, blood pressure, palpitations |
| Dr. Priya Patel | Dermatology | Skin conditions, rashes, acne, hair loss |
| Dr. Robert Kim | Neurology | Brain, headaches, migraines, seizures, memory |
| Dr. Elena Rodriguez | Gastroenterology | Stomach, IBS, GERD, bloating, liver |

---

## Safety

The AI assistant:
- **Never** provides medical advice, diagnoses, or treatment recommendations
- Directs all emergencies to **911**
- Requires explicit patient consent before sending SMS (TCPA compliant)
- In-memory chat sessions expire after 24h
- Patient records (name, DOB, phone, email) persisted to `patients.json` for returning patient detection — no sensitive medical data stored
- Sanitizes all booking signals before storing or displaying to users
