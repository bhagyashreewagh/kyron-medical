import twilio from 'twilio';

interface AppointmentDetails {
  patientFirstName: string;
  patientPhone: string;
  doctorName: string;
  date: string;
  time: string;
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (!digits.startsWith('1') && digits.length === 10) digits = '1' + digits;
  return '+' + digits;
}

export async function sendAppointmentSMS(appt: AppointmentDetails): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log('📱 SMS (Twilio not configured) — Would send to:', appt.patientPhone);
    return;
  }

  const client = twilio(accountSid, authToken);
  const to = normalizePhone(appt.patientPhone);
  const body = `Kyron Medical: Hi ${appt.patientFirstName}! Your appointment with ${appt.doctorName} is confirmed for ${formatDateShort(appt.date)} at ${appt.time}. To reschedule call (212) 555-0100. Reply STOP to unsubscribe.`;

  await client.messages.create({ body, from: fromNumber, to });
  console.log('📱 SMS sent via Twilio to', to);
}
