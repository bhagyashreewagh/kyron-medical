import { Calendar, MapPin, Clock, Mail } from 'lucide-react';

interface AppointmentCardProps {
  doctorName: string;
  specialty: string;
  date: string;      // YYYY-MM-DD
  time: string;      // "9:00 AM"
  reason: string;
}

function formatNiceDate(dateStr: string, time: string): string {
  // dateStr is YYYY-MM-DD; parse as local date to avoid timezone shifts
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = date.toLocaleDateString('en-US', { month: 'long' });
  return `${weekday}, ${monthName} ${day} · ${time}`;
}

function buildGoogleCalendarUrl(
  doctorName: string,
  specialty: string,
  dateStr: string,
  time: string,
  reason: string
): string {
  const [year, month, day] = dateStr.split('-').map(Number);

  // Parse time string like "9:00 AM" or "4:30 PM"
  const timeParts = time.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  let hours = 9;
  let minutes = 0;
  if (timeParts) {
    hours = parseInt(timeParts[1]);
    minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${year}${pad(month)}${pad(day)}T${pad(hours)}${pad(minutes)}00`;
  // 1-hour appointment
  const endHours = hours + 1;
  const end = `${year}${pad(month)}${pad(day)}T${pad(endHours)}${pad(minutes)}00`;

  const title = encodeURIComponent(`Appointment with ${doctorName}`);
  const details = encodeURIComponent(
    `Specialty: ${specialty}\nReason: ${reason}\nLocation: 2847 Madison Ave, Suite 700, New York, NY 10028\nPhone: (212) 555-0100`
  );
  const location = encodeURIComponent('2847 Madison Ave, Suite 700, New York, NY 10028');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

export function AppointmentCard({
  doctorName,
  specialty,
  date,
  time,
  reason,
}: AppointmentCardProps) {
  const niceDate = formatNiceDate(date, time);
  const calendarUrl = buildGoogleCalendarUrl(doctorName, specialty, date, time, reason);

  return (
    <div className="flex justify-center my-2 appointment-card-enter">
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(5, 25, 65, 0.75)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          boxShadow:
            '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(52,211,153,0.1), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* Top gradient bar */}
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, #34d399 0%, #059669 50%, #0ea5e9 100%)',
          }}
        />

        {/* Body */}
        <div className="p-5">
          {/* Checkmark + heading */}
          <div className="flex flex-col items-center mb-5">
            {/* Animated checkmark circle */}
            <div
              className="checkmark-circle mb-3 flex items-center justify-center rounded-full"
              style={{
                width: '56px',
                height: '56px',
                background: 'rgba(52,211,153,0.15)',
                border: '2px solid rgba(52,211,153,0.5)',
                boxShadow: '0 0 24px rgba(52,211,153,0.25)',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ overflow: 'visible' }}
              >
                <polyline
                  points="5,14 11,20 23,8"
                  stroke="#34d399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="100"
                  className="checkmark-path"
                />
              </svg>
            </div>

            <h3
              className="font-bold text-lg leading-tight text-center"
              style={{ color: '#ecfdf5' }}
            >
              Appointment Confirmed!
            </h3>
            <p className="text-xs mt-0.5 text-center" style={{ color: '#6ee7b7' }}>
              Your booking is all set
            </p>
          </div>

          {/* Divider */}
          <div
            className="mb-4"
            style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }}
          />

          {/* Details */}
          <div className="space-y-3">
            {/* Doctor */}
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.25)' }}
              >
                <span style={{ fontSize: '14px' }}>👨‍⚕️</span>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                  Provider
                </p>
                <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                  {doctorName}
                </p>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  {specialty}
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)' }}
              >
                <Clock size={13} style={{ color: '#34d399' }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                  Date &amp; Time
                </p>
                <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                  {niceDate}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)' }}
              >
                <MapPin size={13} style={{ color: '#a78bfa' }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                  Location
                </p>
                <p className="text-sm" style={{ color: '#e2e8f0' }}>
                  2847 Madison Ave, Suite 700
                </p>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  New York, NY 10028
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            className="my-4"
            style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }}
          />

          {/* Add to Calendar button */}
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(14,165,233,0.2) 100%)',
              border: '1px solid rgba(52,211,153,0.4)',
              color: '#6ee7b7',
              boxShadow: '0 4px 16px rgba(52,211,153,0.15)',
              textDecoration: 'none',
            }}
          >
            <Calendar size={15} />
            Add to Google Calendar
          </a>

          {/* Email note */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Mail size={11} style={{ color: '#475569' }} />
            <p className="text-xs text-center" style={{ color: '#475569' }}>
              A confirmation email has been sent to you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
