import { User, UserRole, Student, ClassItem, SubjectItem, AttendanceRecord, AcademyInfo } from './types';
import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE_RECORDS,
} from './mockData';
import {
  syncClassCloud,
  syncSubjectCloud,
  syncStudentCloud,
  syncAttendanceRecordCloud,
  syncAttendanceRecordDeleteCloud,
  syncUserCloud,
} from './services/supabaseService';

const STORAGE_KEYS = {
  USERS: 'school_attendance_users_v1',
  CURRENT_USER: 'school_attendance_current_user_v1',
  CLASSES: 'school_attendance_classes_v1',
  SUBJECTS: 'school_attendance_subjects_v1',
  STUDENTS: 'school_attendance_students_v1',
  ATTENDANCE: 'school_attendance_records_v1',
  ACADEMY_INFO: 'school_attendance_academy_info_v1',
};

export const DEFAULT_ACADEMY_INFO: AcademyInfo = {
  name: 'Christy Jean Academy',
  code: 'CJA',
  tagline: 'Excellence in Academic Discipline & Character Formation',
  academicYear: '2025 - 2026',
  semester: 'Second Semester',
  address: 'Brgy. San Jose, Rodriguez (Montalban), Rizal, Philippines',
  contactNumber: '+63 (02) 8921-4820 / +63 917 552 9184',
  email: 'registrar@christyjeanacademy.edu.ph',
  principal: 'Dr. Maria Elena Santos, Ed.D',
  registrarName: 'Office of the University Registrar',
  systemTimezone: 'Asia/Manila (GMT+8)',
  platformVersion: 'Academic Attendance Portal v2.4',
  accreditationNumber: 'DEPED-RO4A-RPO-2024-089',
};

// Safe JSON parser
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage`, err);
  }
}

// Ensure default data is initialized
export function initializeStorage() {
  const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!storedUsers) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  } else {
    // Ensure existing stored users have mobileNumber populated from INITIAL_USERS if missing
    try {
      const parsed: User[] = JSON.parse(storedUsers);
      let updated = false;
      parsed.forEach((user) => {
        const initial = INITIAL_USERS.find((init) => init.username.toLowerCase() === user.username.toLowerCase());
        if (initial) {
          if (!user.mobileNumber && initial.mobileNumber) {
            user.mobileNumber = initial.mobileNumber;
            updated = true;
          }
          if (!user.email && initial.email) {
            user.email = initial.email;
            updated = true;
          }
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
      }
    } catch {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE_RECORDS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACADEMY_INFO)) {
    localStorage.setItem(STORAGE_KEYS.ACADEMY_INFO, JSON.stringify(DEFAULT_ACADEMY_INFO));
  }
}

// Reset data back to default demo
export function resetToDemoData(): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE_RECORDS));
  localStorage.setItem(STORAGE_KEYS.ACADEMY_INFO, JSON.stringify(DEFAULT_ACADEMY_INFO));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('academy-info-updated', { detail: DEFAULT_ACADEMY_INFO }));
  }
}

// --- ACADEMY / INSTITUTION INFORMATION ---

export function getAcademyInfo(): AcademyInfo {
  return getStored<AcademyInfo>(STORAGE_KEYS.ACADEMY_INFO, DEFAULT_ACADEMY_INFO);
}

export function saveAcademyInfo(info: AcademyInfo): void {
  setStored(STORAGE_KEYS.ACADEMY_INFO, info);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('academy-info-updated', { detail: info }));
  }
}

// --- AUTHENTICATION & SESSION ---

export function validateCredentials(
  identifier: string,
  password: string
): { success: boolean; user?: User; error?: string } {
  initializeStorage();
  const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  const cleanIdentifier = identifier.trim().toLowerCase();

  const user = users.find(
    (u) =>
      (u.username.toLowerCase() === cleanIdentifier ||
        (u.email && u.email.toLowerCase() === cleanIdentifier)) &&
      u.password === password
  );

  if (!user) {
    return {
      success: false,
      error: 'Invalid email/username or password. Please check your credentials and try again.',
    };
  }

  // Return safe user without password
  const safeUser: User = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    title: user.title,
    department: user.department,
    email: user.email,
  };

  setStored<User>(STORAGE_KEYS.CURRENT_USER, safeUser);
  return { success: true, user: safeUser };
}

export function normalizePhoneNumber(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length >= 11) {
    return '0' + digits.slice(2);
  }
  if (digits.length === 10 && digits.startsWith('9')) {
    return '0' + digits;
  }
  return digits;
}

export function verifyAccountByEmailAndMobile(
  email: string,
  mobile: string
): { success: boolean; user?: User; error?: string } {
  initializeStorage();
  const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  const cleanEmail = email.trim().toLowerCase();
  const cleanMobile = normalizePhoneNumber(mobile);

  if (!cleanEmail || !cleanMobile) {
    return {
      success: false,
      error: 'The email or mobile number you entered does not match our records. Please try again.',
    };
  }

  const user = users.find((u) => {
    const uEmail = (u.email || '').trim().toLowerCase();
    const uMobile = normalizePhoneNumber(u.mobileNumber || '');
    return uEmail === cleanEmail && uMobile === cleanMobile;
  });

  if (!user) {
    return {
      success: false,
      error: 'The email or mobile number you entered does not match our records. Please try again.',
    };
  }

  return { success: true, user };
}

export function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long.' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return { isValid: false, error: 'Password must include both letters and numbers.' };
  }
  return { isValid: true };
}

export function resetUserPasswordById(
  userId: string,
  newPassword: string
): { success: boolean; error?: string } {
  initializeStorage();
  const strength = validatePasswordStrength(newPassword);
  if (!strength.isValid) {
    return { success: false, error: strength.error };
  }

  const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  const userIndex = users.findIndex((u) => u.id === userId || u.username.toLowerCase() === userId.toLowerCase());
  if (userIndex === -1) {
    return { success: false, error: 'User account not found.' };
  }

  users[userIndex].password = newPassword;
  setStored(STORAGE_KEYS.USERS, users);
  return { success: true };
}

export interface RegisterUserData {
  role: UserRole;
  fullName: string;
  employeeId?: string;
  department: string;
  title: string;
  email: string;
  mobileNumber: string;
  username: string;
  password: string;
}

export function registerUser(data: RegisterUserData): { success: boolean; user?: User; error?: string } {
  initializeStorage();
  const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  
  const cleanUsername = data.username.trim().toLowerCase();
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanMobile = normalizePhoneNumber(data.mobileNumber);
  
  if (!data.fullName.trim()) {
    return { success: false, error: 'Full name is required.' };
  }
  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters.' };
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
    return { success: false, error: 'Username can only contain letters, numbers, dots, and hyphens.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'A valid institutional email address is required.' };
  }
  if (!cleanMobile || cleanMobile.length < 7) {
    return { success: false, error: 'A valid mobile phone number is required (at least 7 digits).' };
  }
  if (!data.department.trim()) {
    return { success: false, error: 'Department or office designation is required.' };
  }
  if (!data.title.trim()) {
    return { success: false, error: 'Professional title or position is required.' };
  }
  
  const strength = validatePasswordStrength(data.password);
  if (!strength.isValid) {
    return { success: false, error: strength.error };
  }

  // Check username uniqueness
  let finalUsername = cleanUsername;
  if (users.some((u) => u.username.toLowerCase() === finalUsername)) {
    finalUsername = `${cleanUsername}.${Math.floor(100 + Math.random() * 900)}`;
  }

  // Check email uniqueness
  const existingEmail = users.find((u) => (u.email || '').trim().toLowerCase() === cleanEmail);
  if (existingEmail) {
    return { success: false, error: `The email "${cleanEmail}" is already registered. Please sign in or use a different email.` };
  }

  const generatedId = `user-${data.role.slice(0, 4)}-${Date.now()}`;
  const assignedEmployeeId = (data.employeeId || '').trim() || `${data.role === 'instructor' ? 'FAC' : 'REG'}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const newUser: User = {
    id: generatedId,
    username: finalUsername,
    password: data.password,
    fullName: data.fullName.trim(),
    role: data.role,
    title: data.title.trim(),
    department: data.department.trim(),
    email: cleanEmail,
    mobileNumber: cleanMobile,
    employeeId: assignedEmployeeId,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  setStored(STORAGE_KEYS.USERS, users);

  const safeUser: User = {
    id: newUser.id,
    username: newUser.username,
    fullName: newUser.fullName,
    role: newUser.role,
    title: newUser.title,
    department: newUser.department,
    email: newUser.email,
    mobileNumber: newUser.mobileNumber,
    employeeId: newUser.employeeId,
    createdAt: newUser.createdAt,
  };

  return { success: true, user: safeUser };
}

export function findUserByUsernameOrEmail(identifier: string): { found: boolean; user?: { username: string; fullName: string; email: string; role: string } } {
  initializeStorage();
  const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  const clean = identifier.trim().toLowerCase();
  const user = users.find(
    (u) => u.username.toLowerCase() === clean || (u.email && u.email.toLowerCase() === clean)
  );

  if (!user) {
    return { found: false };
  }

  return {
    found: true,
    user: {
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
}

export function resetUserPassword(
  identifier: string,
  newPassword: string
): { success: boolean; error?: string; username?: string } {
  initializeStorage();
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  const clean = identifier.trim().toLowerCase();
  const index = users.findIndex(
    (u) => u.username.toLowerCase() === clean || (u.email && u.email.toLowerCase() === clean)
  );

  if (index === -1) {
    return { success: false, error: 'No account found matching this username or email.' };
  }

  users[index].password = newPassword;
  setStored(STORAGE_KEYS.USERS, users);

  return { success: true, username: users[index].username };
}

export function getCurrentUser(): User | null {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!item) return null;
    return JSON.parse(item);
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// --- USERS / INSTRUCTORS / ADMINS ---

export function getUsers(): User[] {
  const raw = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  const seen = new Set<string>();
  const deduplicated: User[] = [];
  for (const item of raw) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      deduplicated.push(item);
    }
  }
  if (deduplicated.length !== raw.length) {
    setStored(STORAGE_KEYS.USERS, deduplicated);
  }
  return deduplicated;
}

export function saveUser(user: User, shouldSync = true): void {
  const users = getUsers();
  const index = users.findIndex(
    (u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase()
  );
  if (index >= 0) {
    users[index] = { ...users[index], ...user };
  } else {
    users.push(user);
  }
  setStored(STORAGE_KEYS.USERS, users);
  if (shouldSync) {
    syncUserCloud(user, 'save');
  }
}

export function deleteUser(userId: string): { success: boolean; error?: string } {
  const users = getUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return { success: false, error: 'User account not found.' };
  
  if (target.role === 'registrar' && users.filter((u) => u.role === 'registrar').length <= 1) {
    return { success: false, error: 'Cannot delete the only registrar/administrator account.' };
  }

  const list = users.filter((u) => u.id !== userId);
  setStored(STORAGE_KEYS.USERS, list);
  syncUserCloud(target, 'delete');
  return { success: true };
}

// --- CLASSES ---

export function getClasses(): ClassItem[] {
  const raw = getStored<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const seen = new Set<string>();
  const deduplicated: ClassItem[] = [];
  for (const item of raw) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      deduplicated.push(item);
    }
  }
  if (deduplicated.length !== raw.length) {
    setStored(STORAGE_KEYS.CLASSES, deduplicated);
  }
  return deduplicated;
}

export function saveClass(classItem: ClassItem, shouldSync = true): void {
  const list = getClasses();
  const index = list.findIndex((c) => c.id === classItem.id);
  if (index >= 0) {
    list[index] = classItem;
  } else {
    list.push(classItem);
  }
  setStored(STORAGE_KEYS.CLASSES, list);
  if (shouldSync) {
    syncClassCloud(classItem, 'save');
  }
}

export function deleteClass(classId: string): { success: boolean; error?: string } {
  const students = getStudents();
  const enrolled = students.filter((s) => s.classId === classId);
  if (enrolled.length > 0) {
    return {
      success: false,
      error: `Cannot delete class because ${enrolled.length} student(s) are currently enrolled. Reassign or delete them first.`,
    };
  }
  const list = getClasses().filter((c) => c.id !== classId);
  setStored(STORAGE_KEYS.CLASSES, list);
  syncClassCloud({ id: classId } as any, 'delete');
  return { success: true };
}

// --- SUBJECTS ---

export function getSubjects(): SubjectItem[] {
  const raw = getStored<SubjectItem[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  const seen = new Set<string>();
  const deduplicated: SubjectItem[] = [];
  for (const item of raw) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      deduplicated.push(item);
    }
  }
  if (deduplicated.length !== raw.length) {
    setStored(STORAGE_KEYS.SUBJECTS, deduplicated);
  }
  return deduplicated;
}

export function saveSubject(subjectItem: SubjectItem, shouldSync = true): void {
  const list = getSubjects();
  const index = list.findIndex((s) => s.id === subjectItem.id);
  if (index >= 0) {
    list[index] = subjectItem;
  } else {
    list.push(subjectItem);
  }
  setStored(STORAGE_KEYS.SUBJECTS, list);
  if (shouldSync) {
    syncSubjectCloud(subjectItem, 'save');
  }
}

export function deleteSubject(subjectId: string): void {
  const list = getSubjects().filter((s) => s.id !== subjectId);
  setStored(STORAGE_KEYS.SUBJECTS, list);
  syncSubjectCloud({ id: subjectId } as any, 'delete');
}

// --- STUDENTS ---

export function getStudents(): Student[] {
  const raw = getStored<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  const seen = new Set<string>();
  const deduplicated: Student[] = [];
  for (const item of raw) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      deduplicated.push(item);
    }
  }
  if (deduplicated.length !== raw.length) {
    setStored(STORAGE_KEYS.STUDENTS, deduplicated);
  }
  return deduplicated;
}

export function saveStudent(student: Student, shouldSync = true): void {
  const list = getStudents();
  const index = list.findIndex((s) => s.id === student.id);
  if (index >= 0) {
    list[index] = student;
  } else {
    list.unshift(student);
  }
  setStored(STORAGE_KEYS.STUDENTS, list);
  if (shouldSync) {
    syncStudentCloud(student, 'save');
  }
}

export function deleteStudent(studentId: string): void {
  const list = getStudents().filter((s) => s.id !== studentId);
  setStored(STORAGE_KEYS.STUDENTS, list);
  syncStudentCloud({ id: studentId } as any, 'delete');
}

// --- ATTENDANCE RECORDS ---

export function getAttendanceRecords(): AttendanceRecord[] {
  const raw = getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE_RECORDS);
  const seen = new Set<string>();
  const deduplicated: AttendanceRecord[] = [];
  for (const item of raw) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      deduplicated.push(item);
    }
  }
  if (deduplicated.length !== raw.length) {
    setStored(STORAGE_KEYS.ATTENDANCE, deduplicated);
  }
  return deduplicated;
}

export function saveAttendanceRecord(record: AttendanceRecord, shouldSync = true): void {
  const list = getAttendanceRecords();
  // Check if an entry already exists by unique ID first, then by composite (classId, subjectId, date)
  const index = list.findIndex(
    (r) => r.id === record.id || (r.classId === record.classId && r.subjectId === record.subjectId && r.date === record.date)
  );
  if (index >= 0) {
    list[index] = { ...list[index], ...record, id: list[index].id || record.id };
  } else {
    list.unshift(record);
  }
  setStored(STORAGE_KEYS.ATTENDANCE, list);
  if (shouldSync) {
    syncAttendanceRecordCloud(record);
  }
}

export function deleteAttendanceRecord(recordId: string): void {
  const list = getAttendanceRecords().filter((r) => r.id !== recordId);
  setStored(STORAGE_KEYS.ATTENDANCE, list);
  syncAttendanceRecordDeleteCloud(recordId);
}
