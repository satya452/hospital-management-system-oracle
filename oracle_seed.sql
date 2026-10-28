-- Auto-generated data migration from SQLite to Oracle

-- 1. DEPARTMENTS (15 rows)
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1001, 'Cardiology', 'Building A, Floor 2', '011-2001');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1002, 'Neurology', 'Building A, Floor 3', '011-2002');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1003, 'Orthopedics', 'Building B, Floor 1', '011-2003');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1004, 'Pediatrics', 'Building C, Floor 1', '011-2004');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1005, 'Dermatology', 'Building B, Floor 2', '011-2005');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1006, 'Ophthalmology', 'Building C, Floor 2', '011-2006');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1007, 'Oncology', 'Building D, Floor 1', '011-2007');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1008, 'Gastroenterology', 'Building A, Floor 4', '011-2008');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1009, 'Pulmonology', 'Building D, Floor 2', '011-2009');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1010, 'Nephrology', 'Building B, Floor 3', '011-2010');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1011, 'Endocrinology', 'Building C, Floor 3', '011-2011');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1012, 'Psychiatry', 'Building E, Floor 1', '011-2012');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1013, 'Radiology', 'Building A, Floor 1', '011-2013');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1014, 'General Medicine', 'Building A, Floor 1', '011-2014');
INSERT INTO DEPARTMENT (dept_id, dept_name, location, phone) VALUES (1015, 'ENT', 'Building E, Floor 2', '011-2015');
COMMIT;

-- 2. DOCTORS (20 rows)
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10001, 'Dr. Arun Sharma', 'Interventional Cardiology', '9876500001', 'arun.sharma@hms.in', 1200, TO_DATE('2020-03-15', 'YYYY-MM-DD'), 1001);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10002, 'Dr. Priya Mehta', 'Electrophysiology', '9876500002', 'priya.mehta@hms.in', 1100, TO_DATE('2019-07-20', 'YYYY-MM-DD'), 1001);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10003, 'Dr. Rajesh Kumar', 'Neurosurgery', '9876500003', 'rajesh.kumar@hms.in', 1500, TO_DATE('2018-01-10', 'YYYY-MM-DD'), 1002);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10004, 'Dr. Sneha Iyer', 'Neurophysiology', '9876500004', 'sneha.iyer@hms.in', 1300, TO_DATE('2021-05-25', 'YYYY-MM-DD'), 1002);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10005, 'Dr. Vikram Singh', 'Joint Replacement', '9876500005', 'vikram.singh@hms.in', 1000, TO_DATE('2017-11-01', 'YYYY-MM-DD'), 1003);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10006, 'Dr. Ananya Reddy', 'Spine Surgery', '9876500006', 'ananya.reddy@hms.in', 1100, TO_DATE('2020-09-14', 'YYYY-MM-DD'), 1003);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10007, 'Dr. Kavitha Nair', 'Neonatology', '9876500007', 'kavitha.nair@hms.in', 800, TO_DATE('2019-02-28', 'YYYY-MM-DD'), 1004);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10008, 'Dr. Suresh Patel', 'Pediatric Surgery', '9876500008', 'suresh.patel@hms.in', 900, TO_DATE('2021-08-05', 'YYYY-MM-DD'), 1004);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10009, 'Dr. Deepa Joshi', 'Cosmetic Dermatology', '9876500009', 'deepa.joshi@hms.in', 950, TO_DATE('2022-01-12', 'YYYY-MM-DD'), 1005);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10010, 'Dr. Mohammed Ali', 'Retina Specialist', '9876500010', 'mohammed.ali@hms.in', 1050, TO_DATE('2018-06-18', 'YYYY-MM-DD'), 1006);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10011, 'Dr. Lakshmi Rao', 'Medical Oncology', '9876500011', 'lakshmi.rao@hms.in', 1600, TO_DATE('2016-04-22', 'YYYY-MM-DD'), 1007);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10012, 'Dr. Karthik Menon', 'Hepatology', '9876500012', 'karthik.menon@hms.in', 1200, TO_DATE('2019-10-30', 'YYYY-MM-DD'), 1008);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10013, 'Dr. Ritu Gupta', 'Pulmonary Medicine', '9876500013', 'ritu.gupta@hms.in', 1000, TO_DATE('2020-12-01', 'YYYY-MM-DD'), 1009);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10014, 'Dr. Amit Verma', 'Dialysis', '9876500014', 'amit.verma@hms.in', 1100, TO_DATE('2017-03-08', 'YYYY-MM-DD'), 1010);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10015, 'Dr. Fatima Khan', 'Diabetology', '9876500015', 'fatima.khan@hms.in', 950, TO_DATE('2021-07-15', 'YYYY-MM-DD'), 1011);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10016, 'Dr. Sanjay Mishra', 'Clinical Psychiatry', '9876500016', 'sanjay.mishra@hms.in', 1300, TO_DATE('2018-09-25', 'YYYY-MM-DD'), 1012);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10017, 'Dr. Nandini Das', 'Diagnostic Radiology', '9876500017', 'nandini.das@hms.in', 700, TO_DATE('2022-04-10', 'YYYY-MM-DD'), 1013);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10018, 'Dr. Rahul Tiwari', 'Internal Medicine', '9876500018', 'rahul.tiwari@hms.in', 600, TO_DATE('2023-01-05', 'YYYY-MM-DD'), 1014);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10019, 'Dr. Pooja Saxena', 'ENT Surgery', '9876500019', 'pooja.saxena@hms.in', 850, TO_DATE('2020-06-20', 'YYYY-MM-DD'), 1015);
INSERT INTO DOCTOR (doctor_id, doc_name, specialization, phone, email, consultation_fee, joining_date, dept_id) VALUES (10020, 'Dr. Manish Agarwal', 'Preventive Cardiology', '9876500020', 'manish.agarwal@hms.in', 1050, TO_DATE('2021-11-11', 'YYYY-MM-DD'), 1001);
COMMIT;

-- 3. PATIENTS (21 rows)
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100001, 'Aarav Patel', TO_DATE('1990-05-14', 'YYYY-MM-DD'), 'M', 'O+', '9900100001', '12 MG Road, Mumbai', TO_DATE('2024-01-10', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100002, 'Ishita Sharma', TO_DATE('1985-11-22', 'YYYY-MM-DD'), 'F', 'A+', '9900100002', '45 Park Street, Kolkata', TO_DATE('2024-01-15', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100003, 'Rohan Gupta', TO_DATE('1978-03-08', 'YYYY-MM-DD'), 'M', 'B+', '9900100003', '78 Ring Road, Delhi', TO_DATE('2024-02-01', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100004, 'Meera Krishnan', TO_DATE('2000-07-30', 'YYYY-MM-DD'), 'F', 'AB+', '9900100004', '23 Lake View, Chennai', TO_DATE('2024-02-14', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100005, 'Arjun Nair', TO_DATE('1995-09-12', 'YYYY-MM-DD'), 'M', 'A-', '9900100005', '56 Hill Road, Kochi', TO_DATE('2024-02-20', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100006, 'Diya Reddy', TO_DATE('1988-01-25', 'YYYY-MM-DD'), 'F', 'O-', '9900100006', '90 Banjara Hills, Hyderabad', TO_DATE('2024-03-05', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100007, 'Kabir Ahmed', TO_DATE('1972-12-03', 'YYYY-MM-DD'), 'M', 'B-', '9900100007', '34 Civil Lines, Lucknow', TO_DATE('2024-03-10', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100008, 'Ananya Joshi', TO_DATE('2005-06-18', 'YYYY-MM-DD'), 'F', 'AB-', '9900100008', '67 FC Road, Pune', TO_DATE('2024-03-22', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100009, 'Vivaan Tiwari', TO_DATE('1998-04-07', 'YYYY-MM-DD'), 'M', 'O+', '9900100009', '12 GT Road, Kanpur', TO_DATE('2024-04-01', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100010, 'Saanvi Rao', TO_DATE('1992-08-20', 'YYYY-MM-DD'), 'F', 'A+', '9900100010', '89 Residency Rd, Bangalore', TO_DATE('2024-04-15', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100011, 'Aditya Verma', TO_DATE('1980-02-14', 'YYYY-MM-DD'), 'M', 'B+', '9900100011', '45 Mall Road, Shimla', TO_DATE('2024-05-01', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100012, 'Kavya Menon', TO_DATE('2003-10-09', 'YYYY-MM-DD'), 'F', 'O+', '9900100012', '23 Beach Road, Vizag', TO_DATE('2024-05-10', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100013, 'Dev Saxena', TO_DATE('1975-07-16', 'YYYY-MM-DD'), 'M', 'AB+', '9900100013', '78 Ashram Road, Ahmedabad', TO_DATE('2024-05-20', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100014, 'Riya Bose', TO_DATE('1999-11-28', 'YYYY-MM-DD'), 'F', 'A-', '9900100014', '56 College Street, Kolkata', TO_DATE('2024-06-01', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100015, 'Harsh Agarwal', TO_DATE('1987-05-03', 'YYYY-MM-DD'), 'M', 'B-', '9900100015', '90 Janpath, Delhi', TO_DATE('2024-06-15', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100016, 'Tara Singh', TO_DATE('1993-09-21', 'YYYY-MM-DD'), 'F', 'O-', '9900100016', '34 Sector 17, Chandigarh', TO_DATE('2024-07-01', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100017, 'Yash Mishra', TO_DATE('2001-01-11', 'YYYY-MM-DD'), 'M', 'A+', '9900100017', '67 Station Road, Bhopal', TO_DATE('2024-07-10', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100018, 'Nisha Pillai', TO_DATE('1996-03-29', 'YYYY-MM-DD'), 'F', 'AB-', '9900100018', '12 MG Road, Trivandrum', TO_DATE('2024-07-20', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100019, 'Karan Malhotra', TO_DATE('1984-08-06', 'YYYY-MM-DD'), 'M', 'O+', '9900100019', '45 Connaught Place, Delhi', TO_DATE('2024-08-01', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100020, 'Simran Kaur', TO_DATE('1991-12-15', 'YYYY-MM-DD'), 'F', 'B+', '9900100020', '78 Model Town, Jalandhar', TO_DATE('2024-08-10', 'YYYY-MM-DD'));
INSERT INTO PATIENT (patient_id, patient_name, dob, gender, blood_group, phone, address, registered_date) VALUES (100021, 'Krish Jain', TO_DATE('2007-01-02', 'YYYY-MM-DD'), 'M', 'A+', '9012345677', 'Ratanada, Jodhpur', TO_DATE('2026-10-19', 'YYYY-MM-DD'));
COMMIT;

-- 4. MEDICINES (20 rows)
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50001, 'Amoxicillin 500mg', 'Cipla Ltd', 12.5, 500);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50002, 'Paracetamol 650mg', 'GSK Pharma', 5, 1000);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50003, 'Metformin 500mg', 'Sun Pharma', 8, 800);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50004, 'Atorvastatin 20mg', 'Ranbaxy Labs', 15, 600);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50005, 'Amlodipine 5mg', 'Lupin Ltd', 10, 686);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50006, 'Omeprazole 20mg', 'Dr Reddys', 18, 450);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50007, 'Ciprofloxacin 500mg', 'Cipla Ltd', 22, 350);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50008, 'Ibuprofen 400mg', 'Abbott India', 7.5, 900);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50009, 'Cetirizine 10mg', 'Mankind Pharma', 4, 1200);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50010, 'Azithromycin 500mg', 'Zydus Cadila', 35, 200);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50011, 'Diclofenac 50mg', 'Torrent Pharma', 6, 850);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50012, 'Metoprolol 50mg', 'Sun Pharma', 12, 400);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50013, 'Losartan 50mg', 'Cipla Ltd', 14, 550);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50014, 'Pantoprazole 40mg', 'Alkem Labs', 20, 380);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50015, 'Clopidogrel 75mg', 'Cadila Healthcare', 25, 300);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50016, 'Doxycycline 100mg', 'Lupin Ltd', 16, 420);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50017, 'Prednisolone 10mg', 'GSK Pharma', 9, 650);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50018, 'Ranitidine 150mg', 'Dr Reddys', 11, 500);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50019, 'Gabapentin 300mg', 'Sun Pharma', 28, 250);
INSERT INTO MEDICINE (medicine_id, med_name, manufacturer, unit_price, stock_qty) VALUES (50020, 'Salbutamol 4mg', 'Cipla Ltd', 8.5, 750);
COMMIT;

-- 5. APPOINTMENTS (22 rows)
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000001, 100001, 10001, TO_DATE('2024-09-01', 'YYYY-MM-DD'), '09:00', 'Completed', 'Mild angina, stable condition');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000002, 100002, 10003, TO_DATE('2024-09-01', 'YYYY-MM-DD'), '10:00', 'Completed', 'Migraine with aura');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000003, 100003, 10005, TO_DATE('2024-09-02', 'YYYY-MM-DD'), '09:30', 'Completed', 'Knee osteoarthritis Grade II');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000004, 100004, 10007, TO_DATE('2024-09-02', 'YYYY-MM-DD'), '11:00', 'Completed', 'Upper respiratory infection');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000005, 100005, 10009, TO_DATE('2024-09-03', 'YYYY-MM-DD'), '09:00', 'Completed', 'Contact dermatitis');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000006, 100006, 10011, TO_DATE('2024-09-03', 'YYYY-MM-DD'), '14:00', 'Completed', 'Breast lump evaluation - benign');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000007, 100007, 10012, TO_DATE('2024-09-04', 'YYYY-MM-DD'), '10:00', 'Completed', 'Gastroesophageal reflux disease');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000008, 100008, 10013, TO_DATE('2024-09-04', 'YYYY-MM-DD'), '11:30', 'Completed', 'Mild bronchial asthma');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000009, 100009, 10015, TO_DATE('2024-09-05', 'YYYY-MM-DD'), '09:00', 'Completed', 'Type 2 Diabetes Mellitus');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000010, 100010, 10016, TO_DATE('2024-09-05', 'YYYY-MM-DD'), '15:00', 'Completed', 'Generalized anxiety disorder');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000011, 100011, 10002, TO_DATE('2024-09-06', 'YYYY-MM-DD'), '09:30', 'Completed', 'Atrial fibrillation');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000012, 100012, 10004, TO_DATE('2024-09-06', 'YYYY-MM-DD'), '10:00', 'Completed', 'Tension headache');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000013, 100013, 10006, TO_DATE('2024-09-07', 'YYYY-MM-DD'), '11:00', 'Completed', 'Lumbar disc herniation');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000014, 100014, 10008, TO_DATE('2024-09-07', 'YYYY-MM-DD'), '14:00', 'Completed', 'Acute appendicitis');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000015, 100015, 10010, TO_DATE('2024-09-08', 'YYYY-MM-DD'), '09:00', 'Completed', 'Diabetic retinopathy screening');
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000016, 100016, 10014, TO_DATE('2026-10-20', 'YYYY-MM-DD'), '10:00', 'Cancelled', NULL);
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000017, 100017, 10018, TO_DATE('2026-10-21', 'YYYY-MM-DD'), '09:30', 'Scheduled', NULL);
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000018, 100018, 10019, TO_DATE('2026-10-21', 'YYYY-MM-DD'), '09:30', 'Scheduled', NULL);
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000019, 100019, 10020, TO_DATE('2026-10-21', 'YYYY-MM-DD'), '14:00', 'Scheduled', NULL);
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000020, 100020, 10001, TO_DATE('2026-10-22', 'YYYY-MM-DD'), '10:00', 'Cancelled', NULL);
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000021, 100020, 10001, TO_DATE('2026-10-22', 'YYYY-MM-DD'), '10:00', 'Scheduled', NULL);
INSERT INTO APPOINTMENT (appt_id, patient_id, doctor_id, appt_date, appt_time, status, diagnosis) VALUES (2000022, 100021, 10018, TO_DATE('2026-10-20', 'YYYY-MM-DD'), '09:00', 'Scheduled', NULL);
COMMIT;

-- Disable inventory auto-decrement trigger for initial seed migration
ALTER TRIGGER trg_inventory_auto_decrement DISABLE;

-- 6. PRESCRIPTIONS (22 rows)
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000001, 2000001, 50005, '1 tablet twice daily', 30, 60);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000002, 2000001, 50015, '1 tablet once daily', 30, 30);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000003, 2000002, 50008, '1 tablet thrice daily', 7, 21);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000004, 2000002, 50002, '1 tablet as needed', 7, 14);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000005, 2000003, 50011, '1 tablet twice daily', 14, 28);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000006, 2000003, 50008, '1 tablet twice daily', 14, 28);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000007, 2000004, 50001, '1 capsule thrice daily', 5, 15);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000008, 2000004, 50002, '1 tablet thrice daily', 3, 9);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000009, 2000005, 50017, '1 tablet twice daily', 10, 20);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000010, 2000005, 50009, '1 tablet once daily', 10, 10);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000011, 2000006, 50002, '1 tablet twice daily', 5, 10);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000012, 2000007, 50006, '1 capsule before breakfast', 14, 14);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000013, 2000007, 50014, '1 tablet before dinner', 14, 14);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000014, 2000008, 50020, '1 tablet thrice daily', 7, 21);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000015, 2000009, 50003, '1 tablet twice daily', 90, 180);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000016, 2000010, 50019, '1 capsule at bedtime', 30, 30);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000017, 2000011, 50012, '1 tablet twice daily', 30, 60);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000018, 2000012, 50002, '1 tablet as needed', 5, 10);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000019, 2000013, 50011, '1 tablet twice daily', 14, 28);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000020, 2000014, 50001, '1 capsule thrice daily', 7, 21);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000021, 2000015, 50005, '1 tablet once daily', 30, 30);
INSERT INTO PRESCRIPTION (presc_id, appt_id, medicine_id, dosage, duration_days, quantity) VALUES (30000022, 2000020, 50005, '1 tablet twice daily', 7, 14);
COMMIT;
ALTER TRIGGER trg_inventory_auto_decrement ENABLE;

-- 7. BILLS (15 rows)
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000001, 2000001, 1200, 1350, 2550, 'Paid', TO_DATE('2026-10-19', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000002, 2000002, 1500, 217.5, 1717.5, 'Paid', TO_DATE('2024-09-01', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000003, 2000003, 1000, 378, 1378, 'Paid', TO_DATE('2024-09-02', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000004, 2000004, 800, 232.5, 1032.5, 'Paid', TO_DATE('2024-09-02', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000005, 2000005, 950, 220, 1170, 'Paid', TO_DATE('2024-09-03', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000006, 2000006, 1600, 50, 1650, 'Paid', TO_DATE('2024-09-03', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000007, 2000007, 1200, 532, 1732, 'Pending', TO_DATE('2024-09-04', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000008, 2000008, 1000, 178.5, 1178.5, 'Pending', TO_DATE('2024-09-04', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000009, 2000009, 950, 1440, 2390, 'Paid', TO_DATE('2024-09-05', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000010, 2000010, 1300, 840, 2140, 'Pending', TO_DATE('2024-09-05', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000011, 2000011, 1100, 720, 1820, 'Paid', TO_DATE('2024-09-06', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000012, 2000012, 1300, 50, 1350, 'Paid', TO_DATE('2024-09-06', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000013, 2000013, 1100, 168, 1268, 'Pending', TO_DATE('2024-09-07', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000014, 2000014, 900, 262.5, 1162.5, 'Paid', TO_DATE('2024-09-07', 'YYYY-MM-DD'));
INSERT INTO BILL (bill_id, appt_id, consultation_charge, medicine_charge, total_amount, payment_status, bill_date) VALUES (40000015, 2000015, 1050, 300, 1350, 'Pending', TO_DATE('2024-09-08', 'YYYY-MM-DD'));
COMMIT;

-- Synchronize sequences to highest migrated IDs

BEGIN
    FOR r IN (SELECT MAX(dept_id) as m FROM DEPARTMENT) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE dept_seq';
        EXECUTE IMMEDIATE 'CREATE SEQUENCE dept_seq START WITH ' || (r.m + 1) || ' INCREMENT BY 1 NOCACHE';
    END LOOP;
    FOR r IN (SELECT MAX(doctor_id) as m FROM DOCTOR) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE doctor_seq';
        EXECUTE IMMEDIATE 'CREATE SEQUENCE doctor_seq START WITH ' || (r.m + 1) || ' INCREMENT BY 1 NOCACHE';
    END LOOP;
    FOR r IN (SELECT MAX(patient_id) as m FROM PATIENT) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE patient_seq';
        EXECUTE IMMEDIATE 'CREATE SEQUENCE patient_seq START WITH ' || (r.m + 1) || ' INCREMENT BY 1 NOCACHE';
    END LOOP;
    FOR r IN (SELECT MAX(appt_id) as m FROM APPOINTMENT) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE appt_seq';
        EXECUTE IMMEDIATE 'CREATE SEQUENCE appt_seq START WITH ' || (r.m + 1) || ' INCREMENT BY 1 NOCACHE';
    END LOOP;
    FOR r IN (SELECT MAX(medicine_id) as m FROM MEDICINE) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE medicine_seq';
        EXECUTE IMMEDIATE 'CREATE SEQUENCE medicine_seq START WITH ' || (r.m + 1) || ' INCREMENT BY 1 NOCACHE';
    END LOOP;
    FOR r IN (SELECT MAX(presc_id) as m FROM PRESCRIPTION) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE presc_seq';
        EXECUTE IMMEDIATE 'CREATE SEQUENCE presc_seq START WITH ' || (r.m + 1) || ' INCREMENT BY 1 NOCACHE';
    END LOOP;
    FOR r IN (SELECT MAX(bill_id) as m FROM BILL) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE bill_seq';
        EXECUTE IMMEDIATE 'CREATE SEQUENCE bill_seq START WITH ' || (r.m + 1) || ' INCREMENT BY 1 NOCACHE';
    END LOOP;
END;
/
PROMPT Data migration from SQLite to Oracle complete.
