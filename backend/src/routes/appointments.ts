import { Router, Request, Response } from 'express';
import { sessions } from './chat.js';
import { DOCTORS, getDoctorById, getAvailableSlots } from '../data/doctors.js';

const router = Router();

// GET /api/appointments/doctors — list all doctors
router.get('/doctors', (_req: Request, res: Response) => {
  res.json({
    doctors: DOCTORS.map((d) => ({
      id: d.id,
      name: d.name,
      title: d.title,
      specialty: d.specialty,
      bio: d.bio,
    })),
  });
});

// GET /api/appointments/slots/:doctorId — get available slots for a doctor
router.get('/slots/:doctorId', (req: Request, res: Response) => {
  const { doctorId } = req.params;
  const { dayOfWeek, timeOfDay, limit } = req.query as Record<string, string>;

  const doctor = getDoctorById(doctorId);
  if (!doctor) {
    res.status(404).json({ error: 'Doctor not found' });
    return;
  }

  const slots = getAvailableSlots(doctorId, {
    dayOfWeek,
    timeOfDay,
    limit: limit ? parseInt(limit) : 10,
  });

  res.json({ doctorId, doctorName: doctor.name, slots });
});

// GET /api/appointments/session/:sessionId — get appointment from session
router.get('/session/:sessionId', (req: Request, res: Response) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json({
    patientInfo: session.patientInfo,
    hasAppointment: !!session.patientInfo.bookedAppointment,
    appointment: session.patientInfo.bookedAppointment || null,
  });
});

export default router;
