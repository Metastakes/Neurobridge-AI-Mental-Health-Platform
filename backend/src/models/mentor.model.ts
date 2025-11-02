// backend/src/models/mentor.model.ts
import pool from '../config/database';

export interface Mentor {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
}

export interface MentorMentee {
  id: number;
  name: string;
  email: string;
  specialty: string | null;
  patient_count: number;
}

export const mentorModel = {
  // Get current mentor info
  async getCurrentMentor(userId: number) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone
       FROM users u
       WHERE u.id = $1 AND u.role = 'mentor'`,
      [userId]
    );
    return result.rows[0];
  },

  // Get list of providers mentored by this mentor
  async getMentees(mentorId: number) {
    const result = await pool.query(
      `SELECT
        p.id,
        u.name,
        u.email,
        p.specialty,
        COUNT(DISTINCT pat.id) as patient_count
       FROM providers p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN patients pat ON pat.provider_id = u.id
       WHERE p.mentor_id = $1
       GROUP BY p.id, u.name, u.email, p.specialty
       ORDER BY u.name`,
      [mentorId]
    );
    return result.rows;
  },

  // Get mentor statistics
  async getMentorStatistics(mentorId: number) {
    const result = await pool.query(
      `SELECT
        COUNT(DISTINCT p.id) as total_mentees,
        COUNT(DISTINCT pat.id) as total_patients_supervised,
        COUNT(DISTINCT a.id) as total_appointments_supervised,
        COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments
       FROM providers p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN patients pat ON pat.provider_id = u.id
       LEFT JOIN appointments a ON a.provider_id = u.id
       WHERE p.mentor_id = $1`,
      [mentorId]
    );
    return result.rows[0];
  },

  // Get mentee details with their patients
  async getMenteeDetails(mentorId: number, menteeId: number) {
    // First verify this mentee belongs to this mentor
    const menteeCheck = await pool.query(
      `SELECT p.id
       FROM providers p
       WHERE p.user_id = $1 AND p.mentor_id = $2`,
      [menteeId, mentorId]
    );

    if (menteeCheck.rows.length === 0) {
      return null;
    }

    // Get mentee info
    const menteeInfo = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.email,
        p.specialty,
        p.bio,
        p.license_number
       FROM users u
       JOIN providers p ON p.user_id = u.id
       WHERE u.id = $1`,
      [menteeId]
    );

    // Get mentee's patients
    const patients = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.email,
        pat.diagnosis
       FROM patients pat
       JOIN users u ON pat.user_id = u.id
       WHERE pat.provider_id = $1
       ORDER BY u.name`,
      [menteeId]
    );

    // Get mentee's recent appointments
    const appointments = await pool.query(
      `SELECT
        a.id,
        a.appointment_type,
        a.scheduled_start,
        a.scheduled_end,
        a.status,
        u.name as patient_name
       FROM appointments a
       JOIN users u ON a.patient_id = u.id
       WHERE a.provider_id = $1
       ORDER BY a.scheduled_start DESC
       LIMIT 10`,
      [menteeId]
    );

    return {
      mentee: menteeInfo.rows[0],
      patients: patients.rows,
      recent_appointments: appointments.rows,
    };
  },
};
