export type UserRole = 'instructor' | 'registrar';

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  title: string;
  department: string;
  email: string;
  mobileNumber?: string;
  employeeId?: string;
  createdAt?: string;
}

export interface Student {
  id: string;
  studentNumber: string; // e.g., "STD-2026-001"
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: 'Male' | 'Female' | 'Other';
  classId: string; // References ClassItem.id
  email: string;
  guardianName: string;
  guardianPhone: string;
  status: 'Active' | 'Inactive' | 'Transferred';
  enrollmentDate: string;
}

export interface ClassItem {
  id: string;
  name: string; // e.g., "Grade 10 - Rizal"
  gradeLevel: string; // e.g., "Grade 10"
  section: string; // e.g., "Rizal"
  academicYear: string; // e.g., "2025-2026"
  room: string; // e.g., "Room 302"
  adviser: string;
}

export interface SubjectItem {
  id: string;
  code: string; // e.g., "SCI-101"
  name: string; // e.g., "Biology & Environmental Science"
  department: string; // e.g., "Science"
  units: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  timeSlot?: string;
  recordedByUserId: string;
  recordedByName: string;
  recordedAt: string; // ISO timestamp
  entries: AttendanceEntry[];
  notes?: string;
}

export interface AttendanceReportSummary {
  classId: string;
  subjectId?: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  totalStudentsEnrolled: number;
  overallPresent: number;
  overallLate: number;
  overallAbsent: number;
  overallRate: number; // percentage e.g. 92.4
  studentSummaries: {
    student: Student;
    present: number;
    late: number;
    absent: number;
    total: number;
    attendanceRate: number;
  }[];
}

export interface AcademyInfo {
  name: string;
  code: string;
  tagline: string;
  academicYear: string;
  semester: string;
  address: string;
  contactNumber: string;
  email: string;
  principal: string;
  registrarName: string;
  systemTimezone: string;
  platformVersion: string;
  accreditationNumber?: string;
}
