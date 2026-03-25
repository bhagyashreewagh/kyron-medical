import twilio from 'twilio';
function formatDateShort(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}
export async function sendAppointmentSMS(appt) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!accountSid || !authToken || !fromNumber) {
        console.log('📱 SMS (Twilio not configured) — Would send to:', appt.patientPhone);
        console.log(`   "Kyron Medical: Hi ${appt.patientFirstName}! Your appt with ${appt.doctorName} is confirmed for ${formatDateShort(appt.date)} at ${appt.time}. Call (212) 555-0100 to reschedule. Reply STOP to opt out."`);
        return;
    }
    const client = twilio(accountSid, authToken);
    // Normalize phone number to E.164
    let toNumber = appt.patientPhone.replace(/\D/g, '');
    if (!toNumber.startsWith('1') && toNumber.length === 10) {
        toNumber = '1' + toNumber;
    }
    toNumber = '+' + toNumber;
    const body = `Kyron Medical: Hi ${appt.patientFirstName}! ✓ Your appointment with ${appt.doctorName} is confirmed for ${formatDateShort(appt.date)} at ${appt.time}. To reschedule, call (212) 555-0100. Reply STOP to unsubscribe.`;
    await client.messages.create({ body, from: fromNumber, to: toNumber });
    console.log('📱 SMS confirmation sent to', toNumber);
}
//# sourceMappingURL=sms.js.map