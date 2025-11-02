-- Seed Data for NeuroBridge Development
-- Password for all users: "password" (hashed with bcrypt)
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5M3r2h.jJ/fKW

-- Insert Users
INSERT INTO users (id, email, password_hash, role, name, phone, date_of_birth, email_verified) VALUES
(1, 'alex.patient@neuro.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5M3r2h.jJ/fKW', 'patient', 'Alex Johnson', '+1-555-0101', '1992-05-15', true),
(2, 'maria.patient@neuro.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5M3r2h.jJ/fKW', 'patient', 'Maria Garcia', '+1-555-0102', '1988-08-22', true),
(3, 'chen.patient@neuro.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5M3r2h.jJ/fKW', 'patient', 'Chen Wei', '+1-555-0103', '1995-11-03', true),
(101, 'dr.evans@neuro.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5M3r2h.jJ/fKW', 'provider', 'Dr. Evelyn Evans', '+1-555-0201', '1980-03-10', true),
(102, 'dr.martinez@neuro.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5M3r2h.jJ/fKW', 'provider', 'Dr. Carlos Martinez', '+1-555-0202', '1975-07-18', true),
(201, 'mentor.thompson@neuro.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5M3r2h.jJ/fKW', 'mentor', 'Dr. Benjamin Thompson', '+1-555-0301', '1970-01-25', true);

-- Reset sequence
SELECT setval('users_id_seq', 250);

-- Insert Patient Details
INSERT INTO patients (user_id, diagnosis, provider_id, address, pharmacy, emergency_contact_name, emergency_contact_phone, blood_pressure, weight_kg, height_cm) VALUES
(1, 'Generalized Anxiety Disorder', 101, '123 Main St, Springfield, IL', 'Springfield Pharmacy', 'Sarah Johnson', '+1-555-1001', '120/80', 70.5, 175),
(2, 'Major Depressive Disorder', 101, '456 Oak Ave, Springfield, IL', 'Oak Street Pharmacy', 'Roberto Garcia', '+1-555-1002', '118/78', 65.0, 162),
(3, 'Bipolar Disorder Type II', 102, '789 Pine Rd, Springfield, IL', 'Springfield Pharmacy', 'Li Wei', '+1-555-1003', '122/82', 72.0, 178);

-- Insert Provider Details
INSERT INTO providers (user_id, license_number, specialty, bio, mentor_id) VALUES
(101, 'PSY-12345-IL', 'Clinical Psychology', 'Specializing in anxiety and mood disorders with 15 years of experience', 201),
(102, 'PSY-67890-IL', 'Psychiatry', 'Board-certified psychiatrist focusing on medication management and therapy', 201);

-- Insert Medications
INSERT INTO medications (patient_id, name, dosage, frequency, prescribed_by, prescribed_date, is_current) VALUES
(1, 'Sertraline (Zoloft)', '50mg', 'Once daily', 101, '2024-09-01', true),
(1, 'Lorazepam (Ativan)', '0.5mg', 'As needed', 101, '2024-09-01', true),
(2, 'Escitalopram (Lexapro)', '10mg', 'Once daily', 101, '2024-08-15', true),
(3, 'Lamotrigine (Lamictal)', '100mg', 'Twice daily', 102, '2024-07-20', true),
(3, 'Quetiapine (Seroquel)', '150mg', 'At bedtime', 102, '2024-07-20', true);

-- Insert Allergies
INSERT INTO allergies (patient_id, name, severity, reaction) VALUES
(1, 'Penicillin', 'severe', 'Anaphylaxis'),
(2, 'Sulfa drugs', 'moderate', 'Rash and itching'),
(3, 'Shellfish', 'mild', 'Mild hives');

-- Insert Appointments
INSERT INTO appointments (patient_id, provider_id, start_time, end_time, status, google_meet_link) VALUES
(1, 101, CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '50 minutes', 'scheduled', 'https://meet.google.com/abc-defg-hij'),
(2, 101, CURRENT_TIMESTAMP + INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '50 minutes', 'scheduled', 'https://meet.google.com/xyz-uvwx-ijk'),
(3, 102, CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '50 minutes', 'scheduled', 'https://meet.google.com/lmn-opqr-stu'),
(1, 101, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '50 minutes', 'completed', NULL),
(2, 101, CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_TIMESTAMP - INTERVAL '14 days' + INTERVAL '50 minutes', 'completed', NULL);

-- Insert Session Notes
INSERT INTO session_notes (patient_id, provider_id, note_type, content, is_ai_generated) VALUES
(1, 101, 'Follow-up', 'Patient reports decreased anxiety symptoms after starting Sertraline. Sleep has improved. Discussed coping strategies for work-related stress. Will continue current medication regimen. Follow-up in 2 weeks.', false),
(2, 101, 'Initial Assessment', 'New patient presenting with symptoms of depression for 6 months. PHQ-9 score: 18 (moderately severe). Started on Escitalopram 10mg daily. Educated on medication effects and timeline. Scheduled for weekly therapy sessions.', false),
(3, 102, 'Medication Review', 'Patient stable on current regimen of Lamotrigine and Quetiapine. No manic or depressive episodes in past month. Sleep pattern normalized. Mood tracking app shows good consistency. Continue current doses.', false);

-- Insert Messages
INSERT INTO messages (sender_id, recipient_id, content, is_read, read_at) VALUES
(1, 101, 'Hi Dr. Evans, I wanted to check if I should take my medication with food?', true, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(101, 1, 'Hello Alex, yes, Sertraline can be taken with or without food. Whatever is more comfortable for you. Let me know if you have any side effects.', true, CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
(2, 101, 'I have been feeling much better this week, thank you!', true, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(101, 2, 'That is wonderful to hear, Maria! Keep up the good work with your coping strategies.', false, NULL);

-- Insert Diagnostic Results
INSERT INTO diagnostic_results (patient_id, provider_id, test_type, score, severity, responses) VALUES
(1, 101, 'GAD-7', 15, 'moderate', '{"q1": 2, "q2": 2, "q3": 3, "q4": 2, "q5": 2, "q6": 2, "q7": 2}'),
(2, 101, 'PHQ-9', 18, 'moderately_severe', '{"q1": 3, "q2": 2, "q3": 2, "q4": 2, "q5": 2, "q6": 2, "q7": 2, "q8": 2, "q9": 1}'),
(3, 102, 'PHQ-9', 8, 'mild', '{"q1": 1, "q2": 1, "q3": 1, "q4": 1, "q5": 1, "q6": 1, "q7": 1, "q8": 1, "q9": 0}');

-- Insert Audit Log samples
INSERT INTO audit_log (user_id, action, resource_type, resource_id, ip_address, details) VALUES
(101, 'VIEW_PATIENT', 'patient', 1, '192.168.1.100', '{"viewed_sections": ["medications", "appointments"]}'),
(101, 'UPDATE_MEDICATION', 'medication', 1, '192.168.1.100', '{"field": "dosage", "old_value": "25mg", "new_value": "50mg"}'),
(1, 'VIEW_APPOINTMENT', 'appointment', 1, '192.168.1.50', '{"appointment_date": "2024-11-15"}');

-- Verify data
SELECT 'Users created: ' || COUNT(*) FROM users;
SELECT 'Patients created: ' || COUNT(*) FROM patients;
SELECT 'Providers created: ' || COUNT(*) FROM providers;
SELECT 'Appointments created: ' || COUNT(*) FROM appointments;
SELECT 'Medications created: ' || COUNT(*) FROM medications;
SELECT 'Session notes created: ' || COUNT(*) FROM session_notes;
