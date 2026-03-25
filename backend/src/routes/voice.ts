import { Router, Request, Response } from 'express';
import { sessions } from './chat.js';
import { initiateVoiceCall, storeCallRecord, getCallHistory } from '../services/vapi.js';

const router = Router();

// POST /api/voice/initiate — trigger outbound call, passing chat context
router.post('/initiate', async (req: Request, res: Response) => {
  const { sessionId, patientPhone } = req.body as {
    sessionId?: string;
    patientPhone?: string;
  };

  // Resolve phone: from request body or from session
  let session = sessionId ? sessions.get(sessionId) : undefined;
  const phone = patientPhone || session?.patientInfo?.phone;

  if (!phone) {
    res.status(400).json({ error: 'Phone number required. Please provide your phone number in the chat first.' });
    return;
  }

  try {
    // Build patient info map for context
    const patientInfo: Record<string, string> = {
      firstName: session?.patientInfo?.firstName || '',
      lastName: session?.patientInfo?.lastName || '',
      dob: session?.patientInfo?.dob || '',
      phone: phone,
      email: session?.patientInfo?.email || '',
      reason: session?.patientInfo?.reason || '',
      doctorId: session?.patientInfo?.doctorId || '',
      doctorName: session?.patientInfo?.doctorName || '',
      bookedAppointment: session?.patientInfo?.bookedAppointment || '',
    };

    // Check for prior call history (call-back continuity feature)
    const callHistory = getCallHistory(phone);
    if (callHistory.length > 0) {
      const lastCall = callHistory[callHistory.length - 1];
      patientInfo.previousCallSummary = lastCall.summary;
    }

    const result = await initiateVoiceCall({
      patientPhone: phone,
      messages: session?.messages || [],
      patientInfo,
    });

    res.json({
      success: true,
      callId: result.callId,
      status: result.status,
      message: `Calling ${phone}... Please pick up in the next few seconds!`,
    });
  } catch (err: unknown) {
    console.error('Voice call error:', err);
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to initiate call: ' + message });
  }
});

// POST /api/voice/webhook — Vapi webhook for call events (call-back continuity)
router.post('/webhook', async (req: Request, res: Response) => {
  const event = req.body;
  console.log('📞 Vapi webhook event:', event?.message?.type);

  if (event?.message?.type === 'end-of-call-report') {
    const { call, transcript, summary } = event.message;
    const customerPhone = call?.customer?.number || '';

    if (customerPhone && (transcript || summary)) {
      storeCallRecord({
        callId: call.id,
        patientPhone: customerPhone,
        transcript: transcript || '',
        summary: summary || transcript?.slice(0, 500) || '',
        createdAt: new Date(),
      });
    }
  }

  res.json({ received: true });
});

// GET /api/voice/history/:phone — get call history for a phone number
router.get('/history/:phone', (req: Request, res: Response) => {
  const records = getCallHistory(req.params.phone);
  res.json({ records });
});

export default router;
