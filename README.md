# Kyron Medical — AI Patient Assistant

A full-stack web application providing an intelligent, human-like AI chat assistant for Kyron Medical Group patients. Features appointment scheduling, prescription refills, voice call handoff, and more.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| AI Chat | Anthropic Claude (claude-sonnet-4-6) via streaming SSE |
| Voice AI | Vapi.ai (outbound phone calls with full chat context) |
| Email | Nodemailer (Gmail / SMTP) |
| SMS | Twilio |
| Hosting | AWS EC2 + Nginx + Let's Encrypt SSL |

## Features

- **Conversational AI intake** — Collects name, DOB, phone, email, and reason naturally
- **Semantic provider matching** — Routes patients to the right specialist (Orthopedics, Cardiology, Dermatology, Neurology, Gastroenterology)
- **Real-time slot selection** — 60 days of availability, handles "do you have Tuesday?" style requests
- **Email confirmation** — Beautiful HTML email sent on booking
- **SMS opt-in** — Twilio text message reminders (patient must consent)
- **Voice call handoff** — One click to switch chat → phone call; AI retains full context
- **Call-back continuity** ⭐ — If a call drops, patient calls back and AI remembers the entire prior conversation
- **Streaming responses** — Claude streams tokens in real-time for a live, human-like feel
- **Liquid glass UI** — iOS 26-inspired glassmorphism with animated orbs and Kyron Medical branding

## Project Structure

```
kyron-medical/
├── backend/
│   ├── src/
│   │   ├── data/doctors.ts        # 5 specialists + 60-day availability
│   │   ├── services/
│   │   │   ├── claude.ts          # Anthropic SDK + system prompt
│   │   │   ├── email.ts           # Nodemailer confirmation emails
│   │   │   ├── sms.ts             # Twilio SMS
│   │   │   └── vapi.ts            # Vapi outbound calls + webhook
│   │   ├── routes/
│   │   │   ├── chat.ts            # SSE streaming chat endpoint
│   │   │   ├── appointments.ts    # Doctors/slots API
│   │   │   └── voice.ts           # Voice initiation + Vapi webhook
│   │   └── server.ts              # Express app
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx  # Main chat UI
│   │   │   ├── Message.tsx        # Individual message bubble
│   │   │   ├── VoiceCallButton.tsx # Phone call trigger
│   │   │   └── TypingIndicator.tsx
│   │   ├── hooks/useChat.ts       # Chat state + SSE streaming
│   │   └── App.tsx                # Layout + background
│   └── package.json
├── .env.example                   # Required environment variables
├── deploy.sh                      # One-command EC2 deployment
└── nginx.conf                     # Reference Nginx config
```

## Quick Start (Local)

### 1. Clone and install
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

**Required:**
- `ANTHROPIC_API_KEY` — [Anthropic Console](https://console.anthropic.com)

**For voice calls:**
- `VAPI_API_KEY` — [Vapi Dashboard](https://vapi.ai)
- `VAPI_PHONE_NUMBER_ID` — Provision a phone number in Vapi dashboard

**For emails:**
- `GMAIL_USER` + `GMAIL_APP_PASSWORD` (easiest), or `SMTP_*` vars

**For SMS:**
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### 3. Run development servers
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Visit `http://localhost:5173`

## EC2 Deployment

### Prerequisites
- Ubuntu 22.04 LTS EC2 instance (t3.small or larger)
- Elastic IP associated
- Security group: ports 22, 80, 443 open
- Domain name pointing to your Elastic IP

### Deploy
```bash
# On your EC2 instance:
export DOMAIN=yourdomain.com
export EMAIL=admin@yourdomain.com
bash deploy.sh
```

Then add your API keys:
```bash
cp /opt/kyron-medical/.env.example /opt/kyron-medical/.env
nano /opt/kyron-medical/.env
pm2 restart kyron-medical
```

### Vapi Webhook Setup
In your Vapi dashboard, set the webhook URL to:
```
https://yourdomain.com/api/voice/webhook
```
This enables call-back continuity (AI remembers previous calls).

## Providers

| Doctor | Specialty | Treats |
|--------|-----------|--------|
| Dr. Sarah Chen | Orthopedics | Bones, joints, back pain, sports injuries |
| Dr. Marcus Johnson | Cardiology | Heart, chest pain, blood pressure |
| Dr. Priya Patel | Dermatology | Skin, rashes, acne, hair loss |
| Dr. Robert Kim | Neurology | Brain, headaches, seizures, memory |
| Dr. Elena Rodriguez | Gastroenterology | Stomach, IBS, GERD, liver |

## Safety

The AI assistant:
- **Never** provides medical advice, diagnoses, or treatment recommendations
- Directs emergencies to 911
- Requires explicit SMS opt-in (TCPA compliance)
- Stores no PHI in persistent storage (in-memory sessions only)
