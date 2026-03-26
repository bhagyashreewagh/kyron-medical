export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // "9:00 AM"
  displayDate: string; // "Monday, March 30"
  available: boolean;
}

export interface OfficeHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  keywords: string[];
  bio: string;
  slots: TimeSlot[];
  officeHours: OfficeHours;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateSlots(doctorId: string, seed: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const times = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '4:30 PM'];

  // Start from March 26, 2026
  const startDate = new Date('2026-03-26T00:00:00');

  for (let day = 0; day < 62; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);

    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // Skip weekends

    const dateStr = formatISODate(date);
    const displayDate = formatDisplayDate(date);

    for (let ti = 0; ti < times.length; ti++) {
      // Deterministic availability — vary by doctor and day
      const hash = (day * 11 + ti * 5 + seed * 3) % 7;
      if (hash < 2) continue; // ~28% slots unavailable

      slots.push({
        id: `${doctorId}-${dateStr}-${ti}`,
        date: dateStr,
        time: times[ti],
        displayDate,
        available: true,
      });
    }
  }

  return slots;
}

export const DOCTORS: Doctor[] = [
  {
    id: 'dr-chen',
    name: 'Dr. Sarah Chen',
    title: 'MD, FAAOS',
    specialty: 'Orthopedics & Sports Medicine',
    keywords: [
      'bone', 'bones', 'joint', 'joints', 'knee', 'hip', 'shoulder', 'spine',
      'back', 'back pain', 'lower back', 'upper back', 'fracture', 'arthritis',
      'sports injury', 'musculoskeletal', 'tendon', 'ligament', 'ankle', 'wrist',
      'elbow', 'foot', 'orthopedic', 'orthopedics', 'rotator cuff', 'ACL', 'meniscus',
      'muscle', 'muscles', 'neck', 'neck pain', 'scoliosis', 'osteoporosis',
    ],
    bio: 'Dr. Sarah Chen is a board-certified orthopedic surgeon with 15 years of experience in sports medicine and joint replacement. She trained at Hospital for Special Surgery in New York.',
    slots: generateSlots('dr-chen', 1),
    officeHours: {
      monday: '8:00 AM – 5:00 PM',
      tuesday: '8:00 AM – 5:00 PM',
      wednesday: '8:00 AM – 5:00 PM',
      thursday: '8:00 AM – 5:00 PM',
      friday: '8:00 AM – 5:00 PM',
      saturday: '9:00 AM – 12:00 PM',
      sunday: 'Closed',
    },
  },
  {
    id: 'dr-johnson',
    name: 'Dr. Marcus Johnson',
    title: 'MD, FACC',
    specialty: 'Cardiology',
    keywords: [
      'heart', 'cardiac', 'chest pain', 'chest', 'blood pressure', 'hypertension',
      'cardiovascular', 'cholesterol', 'palpitations', 'shortness of breath',
      'arrhythmia', 'echocardiogram', 'EKG', 'ECG', 'stent', 'bypass', 'atrial',
      'fibrillation', 'heart failure', 'coronary', 'angina', 'murmur', 'valve',
      'tachycardia', 'bradycardia', 'stroke', 'vascular', 'veins', 'arteries',
    ],
    bio: 'Dr. Marcus Johnson is an interventional cardiologist and Director of the Kyron Cardiac Center. He specializes in preventive cardiology and complex coronary interventions with 18 years of experience.',
    slots: generateSlots('dr-johnson', 2),
    officeHours: {
      monday: '7:00 AM – 6:00 PM',
      tuesday: '7:00 AM – 6:00 PM',
      wednesday: '7:00 AM – 6:00 PM',
      thursday: '7:00 AM – 6:00 PM',
      friday: '7:00 AM – 3:00 PM',
      saturday: 'Closed',
      sunday: 'Closed',
    },
  },
  {
    id: 'dr-patel',
    name: 'Dr. Priya Patel',
    title: 'MD, FAAD',
    specialty: 'Dermatology',
    keywords: [
      'skin', 'rash', 'acne', 'mole', 'eczema', 'psoriasis', 'dermatitis',
      'hair loss', 'nail', 'sunburn', 'hives', 'skin cancer', 'dermatology',
      'lesion', 'biopsy', 'wart', 'melanoma', 'rosacea', 'vitiligo', 'shingles',
      'ringworm', 'dry skin', 'itching', 'scarring', 'stretch marks', 'cosmetic',
      'Botox', 'filler', 'laser', 'face', 'facial', 'wrinkles',
    ],
    bio: 'Dr. Priya Patel is a double-board-certified dermatologist and dermatopathologist. She specializes in medical, surgical, and cosmetic dermatology with expertise in skin cancer detection and treatment.',
    slots: generateSlots('dr-patel', 3),
    officeHours: {
      monday: '9:00 AM – 5:00 PM',
      tuesday: '9:00 AM – 5:00 PM',
      wednesday: '9:00 AM – 5:00 PM',
      thursday: '9:00 AM – 5:00 PM',
      friday: '9:00 AM – 5:00 PM',
      saturday: '10:00 AM – 2:00 PM',
      sunday: 'Closed',
    },
  },
  {
    id: 'dr-kim',
    name: 'Dr. Robert Kim',
    title: 'MD, PhD, FAAN',
    specialty: 'Neurology',
    keywords: [
      'brain', 'headache', 'migraine', 'seizure', 'epilepsy', 'memory',
      'nerve', 'numbness', 'tingling', 'stroke', 'multiple sclerosis', 'MS',
      "Parkinson's", 'parkinsons', "Alzheimer's", 'alzheimers', 'dizziness',
      'vertigo', 'nervous system', 'tremor', 'neuropathy', 'concussion',
      'confusion', 'cognitive', 'neurology', 'neurological', 'balance',
      'coordination', 'weakness', 'paralysis', 'vision problems',
    ],
    bio: 'Dr. Robert Kim holds both an MD and PhD in Neuroscience from Johns Hopkins. He specializes in movement disorders, neurodegenerative diseases, and headache management with 20 years of clinical experience.',
    slots: generateSlots('dr-kim', 4),
    officeHours: {
      monday: '8:00 AM – 6:00 PM',
      tuesday: '10:00 AM – 7:00 PM',
      wednesday: '8:00 AM – 6:00 PM',
      thursday: '10:00 AM – 7:00 PM',
      friday: '8:00 AM – 6:00 PM',
      saturday: 'Closed',
      sunday: 'Closed',
    },
  },
  {
    id: 'dr-rodriguez',
    name: 'Dr. Elena Rodriguez',
    title: 'MD, FACG',
    specialty: 'Gastroenterology',
    keywords: [
      'stomach', 'digestive', 'intestine', 'bowel', 'IBS', "Crohn's", 'crohns',
      'colitis', 'GERD', 'acid reflux', 'heartburn', 'colonoscopy', 'liver',
      'gallbladder', 'nausea', 'bloating', 'diarrhea', 'constipation', 'gas',
      'abdominal pain', 'belly', 'colon', 'rectal', 'hemorrhoids', 'polyps',
      'ulcer', 'pancreatitis', 'pancreas', 'hepatitis', 'celiac', 'gastro',
    ],
    bio: 'Dr. Elena Rodriguez is a gastroenterologist and hepatologist with expertise in inflammatory bowel disease, liver disease, and advanced therapeutic endoscopy. She completed her fellowship at UCSF.',
    slots: generateSlots('dr-rodriguez', 5),
    officeHours: {
      monday: '8:00 AM – 4:30 PM',
      tuesday: '8:00 AM – 4:30 PM',
      wednesday: '8:00 AM – 4:30 PM',
      thursday: '8:00 AM – 4:30 PM',
      friday: '8:00 AM – 4:30 PM',
      saturday: 'By appointment only',
      sunday: 'Closed',
    },
  },
];

// Get doctor by ID
export function getDoctorById(id: string): Doctor | undefined {
  return DOCTORS.find((d) => d.id === id);
}

// Get available slots for a doctor, optionally filtered
export function getAvailableSlots(
  doctorId: string,
  options?: { dayOfWeek?: string; timeOfDay?: string; limit?: number }
): TimeSlot[] {
  const doctor = getDoctorById(doctorId);
  if (!doctor) return [];

  let slots = doctor.slots.filter((s) => s.available);

  if (options?.dayOfWeek) {
    const dow = options.dayOfWeek.toLowerCase();
    slots = slots.filter((s) => s.displayDate.toLowerCase().includes(dow));
  }

  if (options?.timeOfDay) {
    const tod = options.timeOfDay.toLowerCase();
    if (tod.includes('morning')) {
      slots = slots.filter((s) => {
        const hour = parseInt(s.time.split(':')[0]);
        const isPM = s.time.includes('PM');
        return !isPM || hour === 12 ? hour < 12 : false;
      });
    } else if (tod.includes('afternoon')) {
      slots = slots.filter((s) => {
        const isPM = s.time.includes('PM');
        const hour = parseInt(s.time.split(':')[0]);
        return isPM && hour !== 12 ? true : false;
      });
    }
  }

  return slots.slice(0, options?.limit ?? 999);
}

// Book a slot (mark as unavailable)
export function bookSlot(slotId: string): boolean {
  for (const doctor of DOCTORS) {
    const slot = doctor.slots.find((s) => s.id === slotId);
    if (slot) {
      slot.available = false;
      return true;
    }
  }
  return false;
}

// Build office hours summary for system prompt
export function buildOfficeHoursSummary(): string {
  const dayOrder: (keyof OfficeHours)[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  ];
  const dayLabels: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
    friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
  };

  return DOCTORS.map((doc) => {
    const lines = dayOrder
      .map((day) => {
        const hours = doc.officeHours[day];
        return hours ? `  ${dayLabels[day]}: ${hours}` : null;
      })
      .filter(Boolean)
      .join('\n');
    return `${doc.name} (${doc.specialty}):\n${lines}`;
  }).join('\n\n');
}

// Build availability summary for system prompt (compact format, next 30 days)
export function buildAvailabilitySummary(): string {
  const cutoff = new Date('2026-03-26');
  const endDate = new Date(cutoff);
  endDate.setDate(endDate.getDate() + 30);

  return DOCTORS.map((doc) => {
    const upcoming = doc.slots
      .filter((s) => {
        const d = new Date(s.date);
        return s.available && d >= cutoff && d <= endDate;
      })
      .slice(0, 40); // limit per doctor

    const slotLines = upcoming
      .map((s) => `  - ${s.displayDate} at ${s.time} [ID: ${s.id}]`)
      .join('\n');

    return `${doc.name} (${doc.specialty})\n${slotLines}`;
  }).join('\n\n');
}
