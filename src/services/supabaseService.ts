import { supabase } from '../lib/supabase';
import { User, UserRole, Student, ClassItem, SubjectItem, AttendanceRecord, AttendanceEntry } from '../types';
import {
  getClasses,
  getSubjects,
  getStudents,
  getAttendanceRecords,
  getUsers,
  saveClass,
  saveSubject,
  saveStudent,
  saveUser,
  saveAttendanceRecord,
} from '../storage';

// --- MAPPERS ---

export function mapUserToDb(user: User) {
  return {
    id: user.id,
    username: user.username,
    password_hash: user.password || 'password123',
    full_name: user.fullName,
    role: user.role,
    title: user.title || null,
    department: user.department || null,
    email: user.email,
    mobile_number: user.mobileNumber || null,
    employee_id: user.employeeId || null,
  };
}

export function mapUserFromDb(row: any): User {
  return {
    id: row.id,
    username: row.username,
    password: row.password_hash || 'password123',
    fullName: row.full_name,
    role: row.role as UserRole,
    title: row.title || '',
    department: row.department || '',
    email: row.email,
    mobileNumber: row.mobile_number || undefined,
    employeeId: row.employee_id || undefined,
    createdAt: row.created_at,
  };
}

export function mapClassToDb(cls: ClassItem) {
  return {
    id: cls.id,
    name: cls.name,
    grade_level: cls.gradeLevel,
    section: cls.section,
    academic_year: cls.academicYear,
    room: cls.room,
    adviser: cls.adviser,
  };
}

export function mapClassFromDb(row: any): ClassItem {
  return {
    id: row.id,
    name: row.name,
    gradeLevel: row.grade_level,
    section: row.section,
    academicYear: row.academic_year,
    room: row.room,
    adviser: row.adviser,
  };
}

export function mapSubjectToDb(sub: SubjectItem) {
  return {
    id: sub.id,
    code: sub.code,
    name: sub.name,
    department: sub.department,
    units: sub.units,
  };
}

export function mapSubjectFromDb(row: any): SubjectItem {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    department: row.department,
    units: row.units,
  };
}

export function mapStudentToDb(std: Student) {
  return {
    id: std.id,
    student_number: std.studentNumber,
    first_name: std.firstName,
    last_name: std.lastName,
    middle_name: std.middleName || null,
    gender: std.gender,
    class_id: std.classId,
    email: std.email || null,
    guardian_name: std.guardianName || null,
    guardian_phone: std.guardianPhone || null,
    status: std.status,
    enrollment_date: std.enrollmentDate,
  };
}

export function mapStudentFromDb(row: any): Student {
  return {
    id: row.id,
    studentNumber: row.student_number,
    firstName: row.first_name,
    lastName: row.last_name,
    middleName: row.middle_name || undefined,
    gender: row.gender,
    classId: row.class_id,
    email: row.email || undefined,
    guardianName: row.guardian_name || undefined,
    guardianPhone: row.guardian_phone || undefined,
    status: row.status,
    enrollmentDate: row.enrollment_date,
  };
}

export function mapAttendanceRecordToDb(rec: AttendanceRecord) {
  return {
    id: rec.id,
    class_id: rec.classId,
    subject_id: rec.subjectId,
    attendance_date: rec.date,
    time_slot: rec.timeSlot,
    recorded_by_user_id: rec.recordedByUserId,
    recorded_by_name: rec.recordedByName,
    notes: rec.notes || null,
  };
}

// --- SYNC SERVICES ---

export interface SyncResult {
  success: boolean;
  message: string;
  count?: number;
  error?: any;
}

/**
 * Upload all current local records (users, classes, subjects, students, attendance) into Supabase
 */
export async function pushLocalDataToSupabase(): Promise<SyncResult> {
  try {
    const users = getUsers();
    const classes = getClasses();
    const subjects = getSubjects();
    const students = getStudents();
    const records = getAttendanceRecords();

    // 1. Users / Instructors / Registrars
    if (users.length > 0) {
      const dbUsers = users.map(mapUserToDb);
      const { error: userErr } = await supabase.from('users').upsert(dbUsers, { onConflict: 'id' });
      if (userErr) console.warn('Users upload notice:', userErr.message);
    }

    // 2. Classes
    if (classes.length > 0) {
      const dbClasses = classes.map(mapClassToDb);
      const { error } = await supabase.from('classes').upsert(dbClasses, { onConflict: 'id' });
      if (error) throw new Error(`Classes upload error: ${error.message}`);
    }

    // 3. Subjects
    if (subjects.length > 0) {
      const dbSubjects = subjects.map(mapSubjectToDb);
      const { error } = await supabase.from('subjects').upsert(dbSubjects, { onConflict: 'id' });
      if (error) throw new Error(`Subjects upload error: ${error.message}`);
    }

    // 4. Students
    if (students.length > 0) {
      const dbStudents = students.map(mapStudentToDb);
      const { error } = await supabase.from('students').upsert(dbStudents, { onConflict: 'id' });
      if (error) throw new Error(`Students upload error: ${error.message}`);
    }

    // 5. Attendance Records & Entries
    if (records.length > 0) {
      for (const rec of records) {
        const dbRecord = mapAttendanceRecordToDb(rec);
        const { error: recError } = await supabase.from('attendance_records').upsert([dbRecord], { onConflict: 'id' });
        if (recError) console.warn('Attendance record upsert warning:', recError);

        if (rec.entries && rec.entries.length > 0) {
          const dbEntries = rec.entries.map((entry) => ({
            attendance_record_id: rec.id,
            student_id: entry.studentId,
            status: entry.status,
            remarks: entry.remarks || null,
          }));
          await supabase.from('attendance_entries').upsert(dbEntries, { onConflict: 'attendance_record_id,student_id' });
        }
      }
    }

    return {
      success: true,
      message: `Successfully synchronized ${users.length} users, ${students.length} students, ${classes.length} classes, ${subjects.length} subjects, and ${records.length} attendance sheets to Supabase!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Error pushing data to Supabase',
      error: err,
    };
  }
}

/**
 * Fetch all records from Supabase and cache locally
 */
export async function pullDataFromSupabase(): Promise<SyncResult> {
  try {
    // 1. Fetch users
    const { data: dbUsers, error: userErr } = await supabase.from('users').select('*');
    if (!userErr && dbUsers && dbUsers.length > 0) {
      dbUsers.forEach((row) => saveUser(mapUserFromDb(row), false));
    }

    // 2. Fetch classes
    const { data: dbClasses, error: classErr } = await supabase.from('classes').select('*');
    if (classErr) throw new Error(`Failed to load classes: ${classErr.message}`);

    // 3. Fetch subjects
    const { data: dbSubjects, error: subErr } = await supabase.from('subjects').select('*');
    if (subErr) throw new Error(`Failed to load subjects: ${subErr.message}`);

    // 4. Fetch students
    const { data: dbStudents, error: stdErr } = await supabase.from('students').select('*');
    if (stdErr) throw new Error(`Failed to load students: ${stdErr.message}`);

    // 5. Fetch attendance records
    const { data: dbRecords, error: recErr } = await supabase.from('attendance_records').select('*');
    if (recErr) throw new Error(`Failed to load attendance records: ${recErr.message}`);

    // 6. Fetch attendance entries
    const { data: dbEntries } = await supabase.from('attendance_entries').select('*');

    // Update local storage caches
    if (dbClasses && dbClasses.length > 0) {
      dbClasses.forEach((row) => saveClass(mapClassFromDb(row), false));
    }
    if (dbSubjects && dbSubjects.length > 0) {
      dbSubjects.forEach((row) => saveSubject(mapSubjectFromDb(row), false));
    }
    if (dbStudents && dbStudents.length > 0) {
      dbStudents.forEach((row) => saveStudent(mapStudentFromDb(row), false));
    }

    if (dbRecords && dbRecords.length > 0) {
      dbRecords.forEach((recRow) => {
        const matchingEntries: AttendanceEntry[] = (dbEntries || [])
          .filter((e: any) => e.attendance_record_id === recRow.id)
          .map((e: any) => ({
            studentId: e.student_id,
            status: e.status,
            remarks: e.remarks || undefined,
          }));

        saveAttendanceRecord({
          id: recRow.id,
          classId: recRow.class_id,
          subjectId: recRow.subject_id,
          date: recRow.attendance_date,
          timeSlot: recRow.time_slot,
          recordedByUserId: recRow.recorded_by_user_id,
          recordedByName: recRow.recorded_by_name,
          notes: recRow.notes || undefined,
          entries: matchingEntries,
          recordedAt: recRow.created_at || new Date().toISOString(),
        }, false);
      });
    }

    return {
      success: true,
      message: `Downloaded ${(dbUsers || []).length} users, ${(dbStudents || []).length} students, ${(dbClasses || []).length} classes, and ${(dbRecords || []).length} attendance records from Supabase!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Error pulling data from Supabase',
      error: err,
    };
  }
}

// Single item cloud handlers (fire-and-forget or awaited)
export async function syncUserCloud(user: User, action: 'save' | 'delete') {
  try {
    if (action === 'save') {
      await supabase.from('users').upsert([mapUserToDb(user)], { onConflict: 'id' });
    } else {
      await supabase.from('users').delete().eq('id', user.id);
    }
  } catch (err) {
    console.warn('Background Supabase user sync notice:', err);
  }
}

export async function syncStudentCloud(student: Student, action: 'save' | 'delete') {
  try {
    if (action === 'save') {
      await supabase.from('students').upsert([mapStudentToDb(student)], { onConflict: 'id' });
    } else {
      await supabase.from('students').delete().eq('id', student.id);
    }
  } catch (err) {
    console.warn('Background Supabase student sync notice:', err);
  }
}

export async function syncClassCloud(classItem: ClassItem, action: 'save' | 'delete') {
  try {
    if (action === 'save') {
      await supabase.from('classes').upsert([mapClassToDb(classItem)], { onConflict: 'id' });
    } else {
      await supabase.from('classes').delete().eq('id', classItem.id);
    }
  } catch (err) {
    console.warn('Background Supabase class sync notice:', err);
  }
}

export async function syncSubjectCloud(subject: SubjectItem, action: 'save' | 'delete') {
  try {
    if (action === 'save') {
      await supabase.from('subjects').upsert([mapSubjectToDb(subject)], { onConflict: 'id' });
    } else {
      await supabase.from('subjects').delete().eq('id', subject.id);
    }
  } catch (err) {
    console.warn('Background Supabase subject sync notice:', err);
  }
}

export async function syncAttendanceRecordCloud(record: AttendanceRecord) {
  try {
    await supabase.from('attendance_records').upsert([mapAttendanceRecordToDb(record)], { onConflict: 'id' });
    if (record.entries && record.entries.length > 0) {
      const dbEntries = record.entries.map((entry) => ({
        attendance_record_id: record.id,
        student_id: entry.studentId,
        status: entry.status,
        remarks: entry.remarks || null,
      }));
      await supabase.from('attendance_entries').upsert(dbEntries, { onConflict: 'attendance_record_id,student_id' });
    }
  } catch (err) {
    console.warn('Background Supabase attendance sync notice:', err);
  }
}

export async function syncAttendanceRecordDeleteCloud(recordId: string) {
  try {
    await supabase.from('attendance_entries').delete().eq('attendance_record_id', recordId);
    await supabase.from('attendance_records').delete().eq('id', recordId);
  } catch (err) {
    console.warn('Background Supabase attendance delete notice:', err);
  }
}
