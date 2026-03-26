import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { streamChatResponse, ConversationMessage } from '../services/claude.js';
import { sendAppointmentConfirmation } from '../services/email.js';
import { sendAppointmentSMS } from '../services/sms.js';
import { bookSlot } from '../data/doctors.js';
import { createCalendarEvent } from '../services/calendar.js';
import { savePatient, findPatient, extractContactInfo, PatientRecord } from '../services/patients.js';

const router = Router();

// ─── Session Store ───────────────────────────────────────────────────────────

export interface PatientInfo {
  firstName?: string;
  lastName?: string;
  dob?: string;
  phone?: string;
  email?: string;
  reason?: string;
  doctorId?: string;
  doctorName?: string;
  bookedAppointment?: string;
}

export interface Session {
  id: string;
  messages: ConversationMessage[];
  patientInfo: PatientInfo;
  knownPatient?: PatientRecord | null; // populated when returning patient detected
  createdAt: Date;
  lastActivity: Date;
}

export const sessions = new Map<string, Session>();

// Clean up sessions older than 24h every hour
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (session.lastActivity.getTime() < cutoff) sessions.delete(id);
  }
}, 60 * 60 * 1000);

function getOrCreateSession(sessionId: string): Session {
  if (sessions.has(sessionId)) {
    const s = sessions.get(sessionId)!;
    s.lastActivity = new Date();
    return s;
  }
  const session: Session = {
    id: sessionId,
    messages: [],
    patientInfo: {},
    createdAt: new Date(),
    lastActivity: new Date(),
  };
  sessions.set(sessionId, session);
  return session;
}

// ─── Parse Appointment Signal ─────────────────────────────────────────────────

const BOOKING_REGEX = /APPOINTMENT_CONFIRMED:(\{[^}]+\})/;

interface AppointmentPayload {
  patientFirstName: string;
  patientLastName: string;
  dob: string;
  phone: string;
  email: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  slotId: string;
  reason: string;
  smsOptIn: boolean;
}

export interface AppointmentDetails {
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  reason: string;
}

async function processBookingSignal(
  raw: string,
  session: Session
): Promise<{ cleanResponse: string; booked: boolean; appointmentDetails?: AppointmentDetails }> {
  const match = raw.match(BOOKING_REGEX);
  if (!match) return { cleanResponse: raw, booked: false };

  // Guard: only book once per session (survives restarts via slot state)
  if (session.patientInfo.bookedAppointment) {
    console.log('⚠️ Duplicate booking signal in session — ignoring.');
    const cleanResponse = raw.replace(BOOKING_REGEX, '').trim();
    return { cleanResponse, booked: false };
  }

  const cleanResponse = raw.replace(BOOKING_REGEX, '').trim();

  try {
    const payload: AppointmentPayload = JSON.parse(match[1]);

    // Update session patient info
    session.patientInfo = {
      firstName: payload.patientFirstName,
      lastName: payload.patientLastName,
      dob: payload.dob,
      phone: payload.phone,
      email: payload.email,
      reason: payload.reason,
      doctorId: payload.doctorId,
      doctorName: payload.doctorName,
      bookedAppointment: `${payload.date} at ${payload.time} with ${payload.doctorName}`,
    };

    // Mark slot as booked — if already booked, skip all confirmations
    if (payload.slotId) {
      const slotResult = bookSlot(payload.slotId);
      if (slotResult === 'already_booked') {
        console.log('⚠️ Slot already booked — suppressing duplicate email/SMS.');
        const cleanResponse = raw.replace(BOOKING_REGEX, '').trim();
        return { cleanResponse, booked: false };
      }
    }

    // Persist patient for future returning-patient detection
    try {
      savePatient({
        firstName: payload.patientFirstName,
        lastName: payload.patientLastName,
        dob: payload.dob,
        phone: payload.phone,
        email: payload.email,
        lastVisit: `${payload.date} at ${payload.time}`,
        lastDoctor: payload.doctorName,
        lastReason: payload.reason,
      });
    } catch (err) {
      console.error('Patient save error:', err);
    }

    // Send confirmation email
    try {
      await sendAppointmentConfirmation({
        patientFirstName: payload.patientFirstName,
        patientLastName: payload.patientLastName,
        email: payload.email,
        doctorName: payload.doctorName,
        specialty: payload.specialty,
        date: payload.date,
        time: payload.time,
        reason: payload.reason,
      });
    } catch (err) {
      console.error('Email send error:', err);
    }

    // Create Google Calendar event
    try {
      await createCalendarEvent({
        patientFirstName: payload.patientFirstName,
        patientLastName: payload.patientLastName,
        patientEmail: payload.email,
        doctorName: payload.doctorName,
        specialty: payload.specialty,
        date: payload.date,
        time: payload.time,
        reason: payload.reason,
      });
    } catch (err) {
      console.error('Calendar error:', err);
    }

    // Send SMS if opted in
    if (payload.smsOptIn) {
      try {
        await sendAppointmentSMS({
          patientFirstName: payload.patientFirstName,
          patientPhone: payload.phone,
          doctorName: payload.doctorName,
          date: payload.date,
          time: payload.time,
        });
      } catch (err) {
        console.error('SMS send error:', err);
      }
    }

    console.log(
      `✅ Appointment booked: ${payload.patientFirstName} ${payload.patientLastName} with ${payload.doctorName} on ${payload.date} at ${payload.time}`
    );

    const appointmentDetails: AppointmentDetails = {
      doctorName: payload.doctorName,
      specialty: payload.specialty,
      date: payload.date,
      time: payload.time,
      reason: payload.reason,
    };

    return { cleanResponse, booked: true, appointmentDetails };
  } catch (err) {
    console.error('Failed to parse appointment payload:', err, match[1]);
    return { cleanResponse, booked: false };
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/chat — streaming chat endpoint
router.post('/', async (req: Request, res: Response) => {
  const { message, sessionId: clientSessionId } = req.body as {
    message: string;
    sessionId?: string;
  };

  if (!message?.trim()) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  const sessionId = clientSessionId || uuidv4();
  const session = getOrCreateSession(sessionId);

  // Add user message
  session.messages.push({ role: 'user', content: message.trim() });

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx hint
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send sessionId immediately
  send({ sessionId });

  // ── Returning patient lookup ───────────────────────────────────────────────
  // Scan all messages so far for phone/email — look up in persistent store
  if (!session.knownPatient) {
    try {
      const allText = session.messages.map((m) => m.content).join(' ');
      const { phones, emails } = extractContactInfo(allText);
      let found: PatientRecord | null = null;
      for (const email of emails) {
        found = findPatient(email);
        if (found) break;
      }
      if (!found) {
        for (const phone of phones) {
          found = findPatient(phone);
          if (found) break;
        }
      }
      session.knownPatient = found;
      if (found) {
        console.log(`👤 Returning patient detected: ${found.firstName} ${found.lastName}`);
      }

      // ── Mid-conversation save ──────────────────────────────────────────────
      // If we have phone + email from session but no DB record yet, save a stub
      // so future sessions recognize this patient even without a full booking
      if (!found && phones.length > 0 && emails.length > 0) {
        const pi = session.patientInfo;
        // Extract name: look for user message right after Kyra asked for name
        let extractedName = '';
        const msgs = session.messages;
        for (let i = 1; i < msgs.length; i++) {
          const prev = msgs[i - 1];
          const curr = msgs[i];
          if (
            prev.role === 'assistant' &&
            /name|first.*last|full name/i.test(prev.content) &&
            curr.role === 'user'
          ) {
            const candidate = curr.content.trim();
            // Accept if it looks like a name: 1-3 words, mostly letters
            if (/^[A-Za-z]+([\s'-][A-Za-z]+){0,2}$/.test(candidate) && candidate.length < 40) {
              extractedName = candidate;
              break;
            }
          }
        }
        // Fallback: "my name is X"
        if (!extractedName) {
          const m = allText.match(/(?:my name is|I(?:'m| am))\s+([A-Za-z]+(?: [A-Za-z]+)?)/i);
          if (m) extractedName = m[1].trim();
        }
        const nameParts = extractedName.split(/\s+/);
        try {
          savePatient({
            firstName: pi.firstName || nameParts[0] || '',
            lastName: pi.lastName || nameParts[1] || '',
            dob: pi.dob || '',
            phone: phones[0],
            email: emails[0],
          });
          console.log(`👤 Partial patient record saved (mid-conversation)`);
        } catch (e) {
          // non-fatal
        }
      }
    } catch (err) {
      console.error('Patient lookup error (non-fatal):', err);
    }
  }

  let fullResponse = '';

  try {
    // Stream tokens but stop forwarding once the booking marker appears
    let seenBookingMarker = false;
    fullResponse = await streamChatResponse(session.messages, (chunk) => {
      if (seenBookingMarker) return;
      if (chunk.includes('APPOINTMENT_CONFIRMED:')) {
        seenBookingMarker = true;
        const beforeMarker = chunk.split('APPOINTMENT_CONFIRMED:')[0];
        if (beforeMarker) send({ text: beforeMarker });
        return;
      }
      send({ text: chunk });
    }, session.knownPatient ?? null);

    // Process booking signal on full response
    const { cleanResponse, booked, appointmentDetails } = await processBookingSignal(fullResponse, session);

    // Store clean assistant message in history
    session.messages.push({ role: 'assistant', content: cleanResponse });

    // Always send replaceMessage so frontend shows final clean text
    send({ replaceMessage: cleanResponse, done: true, booked, appointmentDetails, sessionId });
  } catch (err) {
    console.error('Chat error:', err);
    send({ error: 'An error occurred. Please try again.', done: true });
  }

  res.end();
});

// GET /api/chat/session/:id — get session info (for voice handoff)
router.get('/session/:id', (req: Request, res: Response) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json({
    sessionId: session.id,
    patientInfo: session.patientInfo,
    messageCount: session.messages.length,
    createdAt: session.createdAt,
  });
});

export default router;
