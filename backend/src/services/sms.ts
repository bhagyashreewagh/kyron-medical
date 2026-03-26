import axios from 'axios';

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
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.log('📱 SMS (Brevo not configured) — Would send to:', appt.patientPhone);
    return;
  }

  const recipient = normalizePhone(appt.patientPhone);
  const content = `Kyron Medical: Hi ${appt.patientFirstName}! Your appointment with ${appt.doctorName} is confirmed for ${formatDateShort(appt.date)} at ${appt.time}. To reschedule call (212) 555-0100. Reply STOP to unsubscribe.`;

  const response = await axios.post(
    'https://api.brevo.com/v3/transactionalSMS/sms',
    {
      sender: 'KyronMed',
      recipient,
      content,
      type: 'transactional',
    },
    {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    }
  );

  console.log('📱 SMS sent to', recipient, '| Brevo status:', response.status, JSON.stringify(response.data));
}
