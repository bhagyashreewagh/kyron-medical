import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Store in /opt/kyron-medical/data/ on server, or <project>/data/ locally
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');
const PATIENTS_FILE = path.join(DATA_DIR, 'patients.json');

export interface PatientRecord {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;        // normalized: digits only, with country code
  email: string;        // lowercase
  lastVisit?: string;   // e.g. "2026-03-31 at 3:30 PM"
  lastDoctor?: string;
  lastReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── File helpers ─────────────────────────────────────────────────────────────

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPatients(): PatientRecord[] {
  ensureDataDir();
  if (!fs.existsSync(PATIENTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(PATIENTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function persistPatients(records: PatientRecord[]): void {
  ensureDataDir();
  fs.writeFileSync(PATIENTS_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

// ─── Phone normalizer ─────────────────────────────────────────────────────────

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '1' + digits;
  return digits;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Upsert a patient record — keyed by phone + email */
export function savePatient(record: Omit<PatientRecord, 'createdAt' | 'updatedAt'>): void {
  const patients = loadPatients();
  const normPhone = normalizePhone(record.phone);
  const normEmail = record.email.toLowerCase().trim();

  const idx = patients.findIndex(
    (p) =>
      normalizePhone(p.phone) === normPhone ||
      p.email.toLowerCase() === normEmail
  );

  const now = new Date().toISOString();

  if (idx !== -1) {
    patients[idx] = {
      ...patients[idx],
      ...record,
      phone: normPhone,
      email: normEmail,
      updatedAt: now,
    };
    console.log(`👤 Returning patient updated: ${record.firstName} ${record.lastName}`);
  } else {
    patients.push({
      ...record,
      phone: normPhone,
      email: normEmail,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`👤 New patient saved: ${record.firstName} ${record.lastName}`);
  }

  persistPatients(patients);
}

/** Look up a patient by phone number or email address */
export function findPatient(phoneOrEmail: string): PatientRecord | null {
  const patients = loadPatients();
  const input = phoneOrEmail.trim();

  // Email match
  if (input.includes('@')) {
    const norm = input.toLowerCase();
    return patients.find((p) => p.email.toLowerCase() === norm) ?? null;
  }

  // Phone match
  const normPhone = normalizePhone(input);
  if (normPhone.length >= 10) {
    return patients.find((p) => normalizePhone(p.phone) === normPhone) ?? null;
  }

  return null;
}

/** Extract phone numbers and email addresses from a block of text */
export function extractContactInfo(text: string): { phones: string[]; emails: string[] } {
  const emailRegex = /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\b(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g;

  const emails = [...new Set(text.match(emailRegex) ?? [])];
  const phones = [...new Set((text.match(phoneRegex) ?? []).map((p) => p.replace(/\D/g, '')))].filter(
    (p) => p.length >= 10
  );

  return { phones, emails };
}
