# Kyron Medical — AI Patient Assistant

Kyron Medical is an AI-powered front desk assistant for a medical group. Patients chat with **Kyra** — an AI assistant that books appointments, answers questions, and can even call patients on the phone — all without any human staff involved.

🌐 **Live demo:** https://kyronmedical.duckdns.org

---

## What it does

A patient visits the site and chats with Kyra. Kyra:
1. Asks what's wrong and figures out which doctor they need
2. Shows available appointment slots and books one
3. Sends a confirmation email (and optional SMS reminder)
4. Can switch to a real phone call mid-conversation — and remembers everything from the chat

---

## Built With

| What | How |
|------|-----|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Voice calls | Vapi.ai |
| Email | Brevo SMTP |
| SMS | Twilio |
| Calendar | Google Calendar API |
| Hosting | AWS EC2 + Nginx + SSL |

---

## Features

### The basics
- **Natural conversation** — Kyra chats like a real receptionist, not a form. Collects name, date of birth, phone, email, and reason for visit naturally
- **Smart doctor matching** — Describes back pain? Gets routed to Orthopedics. Chest pain? Cardiology. Kyra says "we don't treat that" for anything outside the practice and gives a referral number
- **Live appointment booking** — 60 days of real slots across 5 doctors. Handles requests like "do you have anything on a Friday afternoon?"
- **Email confirmation** — Booking confirmation sent automatically with appointment details
- **SMS reminders** — Optional text reminder; patient must say yes first (legally required)
- **Phone call handoff** — One button switches from chat to a live phone call with Kyra. She remembers the whole conversation
- **Typing animation** — Responses stream in real-time, word by word, like a real person typing

### Pioneer features ⭐
These go beyond what a standard chatbot does:

- **Call-back continuity** — If a call drops and the patient calls back, Kyra picks up right where she left off. She remembers the patient and the full prior conversation — even if the server restarted
- **Returning patient detection** — Patient records are saved after booking. Next time a patient chats and gives their phone or email, Kyra instantly recognizes them, greets them by name, and skips all the intake questions
- **Smart name detection** — Kyra figures out the patient's name from natural replies (e.g. just typing "John Smith" after being asked), not just "my name is John"
- **Next available ASAP** — Patient says "what's the soonest you have?" → Kyra shows the 3 nearest open slots across all doctors, instantly
- **Pre-visit tips** — After booking, Kyra gives 1–2 relevant tips based on the specialty (e.g. "avoid caffeine for 24 hours before your cardiology visit")
- **Google Calendar sync** — A calendar event is created automatically when an appointment is booked
- **No double-booking** — Slots are locked the moment they're booked. Can't be taken again even if the server restarts
- **Always-visible reset** — Patients can start a fresh conversation at any time with one click

---

## Doctors

| Doctor | Specialty |
|--------|-----------|
| Dr. Sarah Chen | Orthopedics & Sports Medicine |
| Dr. Marcus Johnson | Cardiology |
| Dr. Priya Patel | Dermatology |
| Dr. Robert Kim | Neurology |
| Dr. Elena Rodriguez | Gastroenterology |

---

## How to run it locally

### Step 1 — Clone and install
```bash
git clone https://github.com/bhagyashreewagh/kyron-medical.git
cd kyron-medical

cd backend && npm install
cd ../frontend && npm install
```

### Step 2 — Add your API keys
```bash
cp .env.example .env
# Open .env and fill in your keys
```

**You need:**
- `ANTHROPIC_API_KEY` → get it at [console.anthropic.com](https://console.anthropic.com)

**For voice calls:**
- `VAPI_API_KEY` and `VAPI_PHONE_NUMBER_ID` → [vapi.ai](https://vapi.ai)

**For email:**
- `BREVO_API_KEY`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` (Brevo has a free tier)
- Or use Gmail: `GMAIL_USER` + `GMAIL_APP_PASSWORD`

**For SMS:**
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

**For Google Calendar (optional):**
- `GOOGLE_SERVICE_ACCOUNT_JSON` — paste your service account JSON as one line
- `GOOGLE_CALENDAR_ID` — the calendar to add events to

### Step 3 — Start the servers
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open **http://localhost:5173**

---

## Deploying to AWS EC2

### What you need
- Ubuntu 22.04 EC2 instance (t3.micro is fine)
- A domain or subdomain pointing to your server's IP (DuckDNS is free)
- Ports 22, 80, and 443 open in your security group

### One command to deploy
```bash
export DOMAIN=yourdomain.com
export EMAIL=you@email.com
bash deploy.sh
```

Then add your API keys on the server:
```bash
sudo nano /opt/kyron-medical/.env
pm2 restart kyron-medical
```

### Set up the Vapi webhook
In your Vapi dashboard → Phone Numbers → your number → Server URL:
```
https://yourdomain.com/api/voice/webhook
```
This is what powers **call-back continuity** — Vapi pings this URL when a patient calls in, and the server responds with Kyra's full config + the patient's previous conversation.

---

## Project structure

```
kyron-medical/
├── backend/
│   └── src/
│       ├── data/doctors.ts          # 5 doctors + 60-day slot generation
│       ├── services/
│       │   ├── claude.ts            # AI system prompt + streaming
│       │   ├── vapi.ts              # Voice call setup (OpenAI nova voice)
│       │   ├── patients.ts          # Returning patient storage (patients.json)
│       │   ├── email.ts             # Booking confirmation emails
│       │   ├── sms.ts               # Twilio SMS reminders
│       │   └── calendar.ts          # Google Calendar event creation
│       └── routes/
│           ├── chat.ts              # Main chat API (streaming SSE)
│           ├── appointments.ts      # Doctors & slots API
│           └── voice.ts             # Voice call + Vapi webhook
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ChatInterface.tsx    # Main chat UI
│       │   ├── Message.tsx          # Message bubbles + appointment card
│       │   └── WelcomeScreen.tsx    # Animated intro screen
│       └── hooks/useChat.ts         # Chat logic + streaming client
├── .env.example                     # All env variables with descriptions
├── deploy.sh                        # Full EC2 setup in one script
└── nginx.conf                       # Nginx config reference
```

---

## Safety

Kyra is a scheduling assistant, not a medical provider:
- Never gives medical advice, diagnoses, or treatment recommendations
- Always directs emergencies to **911**
- Only sends SMS after the patient explicitly agrees (TCPA compliant)
- Patient data stored: name, DOB, phone, email, last visit — nothing medical
- Chat sessions expire after 24 hours
