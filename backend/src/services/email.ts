import nodemailer from 'nodemailer';

interface AppointmentDetails {
  patientFirstName: string;
  patientLastName: string;
  email: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  reason: string;
}

function createTransporter() {
  // Use SMTP credentials from env. Falls back to Ethereal (test) if not set.
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Gmail shorthand
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  return null;
}

function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildEmailHtml(appt: AppointmentDetails): string {
  const displayDate = formatDateForDisplay(appt.date);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmation — Kyron Medical</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a3a8f 0%,#0ea5e9 100%);padding:40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:8px 20px;margin-bottom:16px;">
              <span style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Kyron Medical Group</span>
            </div>
            <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;">Appointment Confirmed ✓</h1>
            <p style="color:rgba(255,255,255,0.8);font-size:15px;margin:0;">We look forward to seeing you!</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="font-size:16px;color:#374151;margin:0 0 24px;">
              Dear <strong>${appt.patientFirstName}</strong>,
            </p>
            <p style="font-size:15px;color:#4b5563;margin:0 0 28px;line-height:1.6;">
              Your appointment with Kyron Medical Group has been successfully scheduled. Here are your appointment details:
            </p>

            <!-- Appointment Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border-radius:12px;border:1px solid #e0e7ff;overflow:hidden;margin-bottom:28px;">
              <tr>
                <td style="padding:0;">
                  <table width="100%" cellpadding="16" cellspacing="0">
                    <tr style="border-bottom:1px solid #e0e7ff;">
                      <td style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;width:35%;">Provider</td>
                      <td style="font-size:15px;color:#111827;font-weight:600;">${appt.doctorName}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e0e7ff;">
                      <td style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Specialty</td>
                      <td style="font-size:15px;color:#111827;">${appt.specialty}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e0e7ff;">
                      <td style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Date</td>
                      <td style="font-size:15px;color:#111827;font-weight:600;">${displayDate}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e0e7ff;">
                      <td style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Time</td>
                      <td style="font-size:15px;color:#111827;font-weight:600;">${appt.time}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Reason</td>
                      <td style="font-size:15px;color:#111827;">${appt.reason}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Location -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fff7ed;border-radius:12px;border:1px solid #fed7aa;padding:20px;">
                  <p style="font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">📍 Location</p>
                  <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">
                    Kyron Medical Group<br>
                    2847 Madison Avenue, Suite 700<br>
                    New York, NY 10028<br>
                    <strong>Phone:</strong> (212) 555-0100
                  </p>
                </td>
              </tr>
            </table>

            <!-- What to Bring -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;padding:20px;">
                  <p style="font-size:13px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">📋 What to Bring</p>
                  <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;">
                    <li>Valid government-issued photo ID</li>
                    <li>Insurance card(s)</li>
                    <li>List of current medications and dosages</li>
                    <li>Any relevant medical records or test results</li>
                    <li>Completed new patient forms (if applicable)</li>
                  </ul>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center;">
                  <p style="font-size:14px;color:#4b5563;margin:0 0 8px;">Need to reschedule or cancel?</p>
                  <p style="font-size:15px;font-weight:600;color:#1a3a8f;margin:0;">Call us at <a href="tel:+12125550100" style="color:#1a3a8f;text-decoration:none;">(212) 555-0100</a></p>
                  <p style="font-size:13px;color:#6b7280;margin:8px 0 0;">Please give us at least 24 hours notice for cancellations.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px;text-align:center;">
            <p style="font-size:13px;color:#9ca3af;margin:0 0 4px;">Kyron Medical Group · 2847 Madison Avenue, Suite 700, New York, NY 10028</p>
            <p style="font-size:12px;color:#d1d5db;margin:0;">This is an automated message. Please do not reply to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendAppointmentConfirmation(appt: AppointmentDetails): Promise<void> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('📧 EMAIL (no transporter configured) — Would send to:', appt.email);
    console.log('   Subject: Your Appointment at Kyron Medical is Confirmed');
    console.log('   Patient:', `${appt.patientFirstName} ${appt.patientLastName}`);
    console.log('   Doctor:', appt.doctorName);
    console.log('   Date:', appt.date, 'at', appt.time);
    return;
  }

  const fromAddress = process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@kyronmedical.com';

  await transporter.sendMail({
    from: `"Kyron Medical Group" <${fromAddress}>`,
    to: appt.email,
    subject: `Appointment Confirmed — ${appt.doctorName} on ${formatDateForDisplay(appt.date)}`,
    text: `Dear ${appt.patientFirstName},\n\nYour appointment is confirmed.\n\nProvider: ${appt.doctorName}\nDate: ${formatDateForDisplay(appt.date)}\nTime: ${appt.time}\nReason: ${appt.reason}\n\nLocation: Kyron Medical Group, 2847 Madison Avenue Suite 700, New York NY 10028\nPhone: (212) 555-0100\n\nThank you,\nKyron Medical Group`,
    html: buildEmailHtml(appt),
  });

  console.log('📧 Confirmation email sent to', appt.email);
}
