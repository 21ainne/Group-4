import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  ClassItem, 
  SubjectItem, 
  Student, 
  AttendanceRecord, 
  AttendanceStatus, 
  AttendanceEntry 
} from '../../types';
import { 
  getClasses, 
  getSubjects, 
  getStudents, 
  getAttendanceRecords, 
  saveAttendanceRecord,
  saveStudent,
  saveClass,
  saveSubject,
  resetToDemoData 
} from '../../storage';
import { 
  Home, 
  Users, 
  GraduationCap, 
  Layers, 
  FileText, 
  Search, 
  ChevronDown, 
  ChevronLeft,
  Menu, 
  X, 
  Maximize, 
  Minimize, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Save, 
  Download, 
  Mail, 
  LogOut, 
  RotateCcw, 
  UserCheck, 
  Send,
  User as UserIcon,
  ShieldCheck,
  Check,
  AlertCircle,
  Calendar,
  Percent,
  CheckCheck,
  AlertTriangle,
  Phone,
  ExternalLink,
  ArrowRight,
  MessageSquare,
  Database
} from 'lucide-react';
import { SupabaseModal } from '../SupabaseModal';

interface InstructorDashboardProps {
  currentUser: User;
  onLogout?: () => void;
  onResetData?: () => void;
}

type TabType = 
  | 'dashboard' 
  | 'profile' 
  | 'all_students' 
  | 'all_teachers' 
  | 'manage_classes' 
  | 'take_attendance' 
  | 'manage_students' 
  | 'attendance_logs' 
  | 'excuse_requests' 
  | 'send_announcement';

export function InstructorDashboard({ currentUser, onLogout, onResetData }: InstructorDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Submenu collapsible states
  const [manageClassesExpanded, setManageClassesExpanded] = useState(true);
  const [takeAttendanceExpanded, setTakeAttendanceExpanded] = useState(true);
  const [manageStudentsExpanded, setManageStudentsExpanded] = useState(false);
  const [sendAnnouncementExpanded, setSendAnnouncementExpanded] = useState(false);

  // Live persistent storage state
  const [classes, setClasses] = useState<ClassItem[]>(() => getClasses());
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => getSubjects());
  const [students, setStudents] = useState<Student[]>(() => getStudents());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => getAttendanceRecords());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  // Attendance Sheet Selection Parameters
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Modals
  const [showQuickSearchModal, setShowQuickSearchModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [showNewSubjectModal, setShowNewSubjectModal] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Absence excuse requests mock list
  const [excuseList, setExcuseList] = useState([
    { id: 'ex-1', studentName: 'Angelica Ramos', studentNumber: '2026-0012', className: 'Grade 10 - St. Jude', date: '2026-09-24', reason: 'Severe Influenza & Medical Consultation', doctorNote: true, status: 'Pending' },
    { id: 'ex-2', studentName: 'Christian Dela Cruz', studentNumber: '2026-0045', className: 'Grade 10 - St. Jude', date: '2026-09-25', reason: 'Inter-School Mathematics Olympiad delegate', doctorNote: false, status: 'Approved' },
    { id: 'ex-3', studentName: 'Bianca Flores', studentNumber: '2026-0089', className: 'Grade 9 - St. Francis', date: '2026-09-22', reason: 'Dental appointment & tooth extraction', doctorNote: true, status: 'Approved' },
    { id: 'ex-4', studentName: 'Joshua Reyes', studentNumber: '2026-0104', className: 'Grade 11 - STEM A', date: '2026-09-26', reason: 'Family bereavement & funeral service', doctorNote: false, status: 'Pending' },
  ]);

  // Notifications & Active Concern Resolution System
  interface NotificationItem {
    id: string;
    title: string;
    subtitle: string;
    timestamp: string;
    type: 'medical_slip' | 'attendance_review' | 'absence_alert';
    isRead: boolean;
    priority: 'high' | 'normal';
    studentName?: string;
    studentNumber?: string;
    className?: string;
    classId?: string;
    subjectName?: string;
    subjectId?: string;
    reason?: string;
    doctorNote?: boolean;
    date?: string;
    guardianName?: string;
    guardianPhone?: string;
    consecutiveAbsences?: number;
    excuseId?: string;
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Angelica Ramos submitted medical slip',
      subtitle: 'Grade 10 - St. Jude · Severe Influenza & Consultation',
      timestamp: '20 mins ago',
      type: 'medical_slip',
      isRead: false,
      priority: 'high',
      studentName: 'Angelica Ramos',
      studentNumber: '2026-0012',
      className: 'Grade 10 - St. Jude',
      reason: 'Severe Influenza & Medical Consultation (Fever 39°C)',
      doctorNote: true,
      date: '2026-09-24',
      guardianName: 'Mrs. Elena Ramos',
      guardianPhone: '+63 917 555 0192',
      excuseId: 'ex-1',
    },
    {
      id: 'notif-2',
      title: 'Attendance submitted for Grade 11 STEM A',
      subtitle: 'Physics · 28 Present · 1 Absent · Needs verification',
      timestamp: '1 hour ago',
      type: 'attendance_review',
      isRead: false,
      priority: 'normal',
      className: 'Grade 11 - STEM A',
      classId: 'cls-3',
      subjectName: 'Physics',
      subjectId: 'sub-3',
      date: '2026-09-26',
    },
    {
      id: 'notif-3',
      title: 'Absence Alert: David Kim (3 Consecutive Days)',
      subtitle: 'Grade 10 - St. Jude · Needs immediate guardian follow-up',
      timestamp: '2 hours ago',
      type: 'absence_alert',
      isRead: false,
      priority: 'high',
      studentName: 'David Kim',
      studentNumber: '2026-0033',
      className: 'Grade 10 - St. Jude',
      consecutiveAbsences: 3,
      guardianName: 'Mr. David Kim Sr.',
      guardianPhone: '+63 918 222 9841',
    },
  ]);

  const [activeConcernNotification, setActiveConcernNotification] = useState<NotificationItem | null>(null);
  const [concernMessageText, setConcernMessageText] = useState('');

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleOpenConcern = (notif: NotificationItem) => {
    // 1. Mark notification as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    // 2. Close dropdown
    setNotificationsOpen(false);
    // 3. Populate default message if contacting guardian
    if (notif.type === 'medical_slip') {
      setConcernMessageText(
        `Dear ${notif.guardianName || 'Guardian'}, regarding ${notif.studentName}'s medical slip for ${notif.className}, the certificate has been verified by the faculty.`
      );
    } else if (notif.type === 'absence_alert') {
      setConcernMessageText(
        `Good day ${notif.guardianName || 'Guardian'}. This is an advisory from Christy Jean Academy regarding ${notif.studentName}'s ${notif.consecutiveAbsences || 3} consecutive absences in ${notif.className}. Please coordinate with the advisor.`
      );
    } else {
      setConcernMessageText('');
    }
    // 4. Open concern modal
    setActiveConcernNotification(notif);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setSaveToast('All attendance alerts marked as read.');
  };

  // Overall attendance rate computation
  const overallAttendanceRate = useMemo(() => {
    let totalEntries = 0;
    let presentEntries = 0;
    attendanceRecords.forEach((rec) => {
      rec.entries.forEach((e) => {
        totalEntries++;
        if (e.status === 'present' || e.status === 'late') {
          presentEntries++;
        }
      });
    });
    if (totalEntries === 0) return 96;
    return Math.round((presentEntries / totalEntries) * 100);
  }, [attendanceRecords]);

  // Filter students for the selected class in attendance sheet
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId && s.status === 'Active');
  }, [students, selectedClassId]);

  const currentClass = useMemo(() => classes.find((c) => c.id === selectedClassId), [classes, selectedClassId]);
  const currentSubject = useMemo(() => subjects.find((s) => s.id === selectedSubjectId), [subjects, selectedSubjectId]);

  // Check if attendance is already recorded for this Class + Subject + Date
  const existingRecord = useMemo(() => {
    return attendanceRecords.find(
      (r) => r.classId === selectedClassId && r.subjectId === selectedSubjectId && r.date === selectedDate
    );
  }, [attendanceRecords, selectedClassId, selectedSubjectId, selectedDate]);

  // Initialize or reset the attendance sheet when class/subject/date changes
  useEffect(() => {
    const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    if (existingRecord) {
      existingRecord.entries.forEach((entry) => {
        initialMap[entry.studentId] = {
          status: entry.status,
          remarks: entry.remarks || '',
        };
      });
      setSessionNotes(existingRecord.notes || '');
    } else {
      classStudents.forEach((student) => {
        initialMap[student.id] = {
          status: 'present',
          remarks: '',
        };
      });
      setSessionNotes('');
    }
    setAttendanceMap(initialMap);
  }, [selectedClassId, selectedSubjectId, selectedDate, existingRecord, classStudents]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status,
        remarks: prev[studentId]?.remarks || '',
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'present',
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    classStudents.forEach((student) => {
      updated[student.id] = {
        status,
        remarks: attendanceMap[student.id]?.remarks || '',
      };
    });
    setAttendanceMap(updated);
  };

  // Live count for current attendance sheet
  const sheetStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    classStudents.forEach((s) => {
      const st = attendanceMap[s.id]?.status;
      if (st === 'present') present++;
      else if (st === 'late') late++;
      else if (st === 'absent') absent++;
    });
    return { present, late, absent, total: classStudents.length };
  }, [classStudents, attendanceMap]);

  // Save attendance to persistent storage
  const handleSaveAttendance = () => {
    if (classStudents.length === 0) {
      alert('Cannot save attendance for an empty class.');
      return;
    }

    const entries: AttendanceEntry[] = classStudents.map((student) => {
      const state = attendanceMap[student.id] || { status: 'present', remarks: '' };
      return {
        studentId: student.id,
        status: state.status,
        remarks: state.remarks.trim() || undefined,
      };
    });

    const record: AttendanceRecord = {
      id: existingRecord ? existingRecord.id : `att-${Date.now()}`,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      date: selectedDate,
      timeSlot: 'Regular Class Period',
      recordedByUserId: currentUser.id,
      recordedByName: currentUser.fullName,
      recordedAt: new Date().toISOString(),
      entries,
      notes: sessionNotes.trim() || undefined,
    };

    saveAttendanceRecord(record);
    const updated = getAttendanceRecords();
    setAttendanceRecords(updated);
    setSaveToast(`Attendance saved successfully for ${currentClass?.name} - ${currentSubject?.name}!`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // New Student State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Male' | 'Female'>('Male');
  const [newStudentClass, setNewStudentClass] = useState(classes[0]?.id || '');
  const [newStudentEmail, setNewStudentEmail] = useState('');

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentId.trim()) return;
    const parts = newStudentName.trim().split(' ');
    const firstName = parts[0] || 'Student';
    const lastName = parts.slice(1).join(' ') || 'User';
    const student: Student = {
      id: `stud-${Date.now()}`,
      studentNumber: newStudentId.trim(),
      firstName,
      lastName,
      gender: newStudentGender,
      classId: newStudentClass,
      guardianName: 'Parent / Guardian',
      guardianPhone: '09170000000',
      email: newStudentEmail.trim() || `${newStudentId.toLowerCase()}@school.edu`,
      status: 'Active',
      enrollmentDate: new Date().toISOString().split('T')[0],
    };
    saveStudent(student);
    setStudents(getStudents());
    setShowNewStudentModal(false);
    setNewStudentName('');
    setNewStudentId('');
    setSaveToast(`Student ${firstName} ${lastName} enrolled successfully.`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Export CSV of Attendance History
  const handleExportCSV = () => {
    const rows = [
      ['Record ID', 'Class Section', 'Course / Subject', 'Session Date', 'Instructor', 'Present', 'Late', 'Absent', 'Total Students', 'Notes'],
      ...attendanceRecords.map((r) => {
        const cls = classes.find((c) => c.id === r.classId)?.name || r.classId;
        const sub = subjects.find((s) => s.id === r.subjectId)?.name || r.subjectId;
        const presentCount = r.entries.filter((e) => e.status === 'present').length;
        const lateCount = r.entries.filter((e) => e.status === 'late').length;
        const absentCount = r.entries.filter((e) => e.status === 'absent').length;
        return [
          r.id, 
          cls, 
          sub, 
          r.date, 
          r.recordedByName, 
          presentCount.toString(), 
          lateCount.toString(), 
          absentCount.toString(), 
          r.entries.length.toString(),
          r.notes || ''
        ];
      })
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Faculty Directory List
  const facultyList = [
    { id: '1', name: 'Prof. Angel Gumantason', department: 'Department of SSG', role: 'Visiting Lecturer / Instructor', email: 'Angelko@gmail.com.edu', phone: '+63 917 123 4567', subjects: 'Mathematics, Biology, General Science' },
    { id: '2', name: 'Dr. Evelyn Reed', department: 'Office of the Registrar', role: 'Head Registrar & Records Officer', email: 'registrar@oakridge.edu', phone: '+63 918 234 5678', subjects: 'Academic Evaluation, Admissions' },
    { id: '3', name: 'Prof. Marcus Vance', department: 'Science & Technology', role: 'Senior Lecturer', email: 'm.vance@school.edu', phone: '+63 919 345 6789', subjects: 'Chemistry, Physics' },
    { id: '4', name: 'Prof. Clara Santos', department: 'Humanities & Social Sciences', role: 'Associate Instructor', email: 'c.santos@school.edu', phone: '+63 920 456 7890', subjects: 'World Literature, Ethics & Civics' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f3f6] flex flex-col font-sans text-slate-800 selection:bg-[#00c0ef] selection:text-white">

      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (Teal Navy `#0a3b5c` Matching Portal Aesthetic) */}
      {/* ========================================================================= */}
      <header className="h-[52px] bg-[#0b3b5c] text-white flex items-center justify-end px-3 sm:px-5 shrink-0 z-30 shadow-md">
        
        {/* Right: User Profile Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* User Profile Dropdown (Contains Full Instructor Profile Card) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 text-xs text-white hover:text-white/90 font-medium transition cursor-pointer bg-white/10 hover:bg-white/15 py-1 px-2.5 rounded-full"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 border border-white/50 flex items-center justify-center text-white">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold">{currentUser.username || 'instructor'}</span>
              <ChevronDown className="w-3 h-3 text-white/70" />
            </button>

            {userDropdownOpen && (
              <>
                {/* Backdrop to close when clicking outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setUserDropdownOpen(false)} 
                />

                <div className="absolute right-0 mt-2 w-[340px] sm:w-[420px] bg-white rounded-md shadow-2xl border border-slate-200/90 text-slate-800 text-xs p-5 sm:p-6 z-50 animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* Card Header matching 1st image */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Instructor Profile</h3>
                    <button 
                      type="button" 
                      onClick={() => setUserDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Profile Header Block matching 1st image */}
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0b3b5c] text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-xs">
                      {currentUser.fullName ? currentUser.fullName.charAt(0) : 'I'}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-tight">
                        {currentUser.fullName ? (currentUser.fullName.startsWith('Instructor') ? currentUser.fullName : `Instructor ${currentUser.fullName}`) : 'Instructor Ms.Angel Gumantason'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">
                        {currentUser.role || 'Instructor'} · {currentUser.department || 'Department Of SSG'}
                      </p>
                      <span className="inline-block mt-1.5 bg-[#d1fae5] text-[#065f46] text-[10px] font-bold px-2 py-0.5 rounded">
                        Authorized Faculty Member
                      </span>
                    </div>
                  </div>

                  {/* 2-column info grid matching 1st image */}
                  <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Username</span>
                      <span className="font-semibold text-slate-900 font-mono text-xs">@{currentUser.username || 'instructor'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Institutional Email</span>
                      <span className="font-semibold text-slate-900 text-xs truncate block">{currentUser.email || 'Angelko@gmail.com.edu'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Academic Title</span>
                      <span className="font-semibold text-slate-900 text-xs">{currentUser.title || 'Visiting Lecturer'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Department</span>
                      <span className="font-semibold text-slate-900 text-xs">{currentUser.department || 'Department of SSG'}</span>
                    </div>
                  </div>

                  {/* Action Buttons matching 1st image */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowConfirmLogout(true); setUserDropdownOpen(false); }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-xs font-semibold cursor-pointer transition shadow-xs"
                    >
                      Sign Out
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowConfirmReset(true); setUserDropdownOpen(false); }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-semibold cursor-pointer border border-slate-200 transition"
                    >
                      Reset Demo Storage
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY LAYOUT: SIDEBAR + MAIN VIEWPORT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar (`#14334f`) - Collapsable */}
        <aside
          className={`bg-[#14334f] text-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out z-20 ${
            sidebarOpen ? 'fixed inset-y-0 left-0 pt-[52px] shadow-2xl md:static md:pt-0 w-60' : 'hidden md:flex'
          } ${isSidebarCollapsed ? 'md:w-[68px]' : 'md:w-60'}`}
        >
          
          {/* Top User Welcome Block with large circle silhouette */}
          <div className={`p-3.5 border-b border-white/10 flex items-center transition-all ${
            isSidebarCollapsed ? 'justify-center' : 'gap-3'
          }`}>
            <button 
              type="button"
              className="w-10 h-10 rounded-full bg-slate-300/20 border-2 border-white/30 hover:border-white hover:bg-white/20 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95"
              title={isSidebarCollapsed ? "Click to expand sidebar" : "Click to collapse sidebar"}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
            >
              <UserIcon className="w-5 h-5 text-white/90" />
            </button>
            {!isSidebarCollapsed && (
              <div 
                className="overflow-hidden cursor-pointer"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <span className="text-[11px] text-slate-400 block leading-tight">Welcome, Instructor!</span>
                <span className="text-sm font-bold text-white truncate block">
                  {currentUser.fullName || currentUser.username}
                </span>
              </div>
            )}
          </div>

          {/* Section Header */}
          {!isSidebarCollapsed ? (
            <div className="px-4 pt-3 pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                General
              </span>
            </div>
          ) : (
            <div className="border-t border-white/10 my-2 mx-3" />
          )}

          {/* Nav Links Menu */}
          <nav className="flex-1 overflow-y-auto px-1.5 py-1 space-y-1 text-xs font-medium">
            
            {/* Dashboard */}
            <button
              type="button"
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              title="Dashboard"
              className={`w-full flex items-center rounded transition cursor-pointer text-left ${
                isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-3 py-2.5'
              } ${
                activeTab === 'dashboard'
                  ? 'bg-[#1e282c] text-white border-l-4 border-[#00c0ef] font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-4 h-4 text-slate-400 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Dashboard</span>}
            </button>

            {/* All Student Information */}
            <button
              type="button"
              onClick={() => { setActiveTab('all_students'); setSidebarOpen(false); }}
              title="All Student Information"
              className={`w-full flex items-center rounded transition cursor-pointer text-left ${
                isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-3 py-2.5'
              } ${
                activeTab === 'all_students'
                  ? 'bg-[#1e282c] text-white border-l-4 border-[#00c0ef] font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">All Student Information</span>}
            </button>

            {/* All Faculty Information */}
            <button
              type="button"
              onClick={() => { setActiveTab('all_teachers'); setSidebarOpen(false); }}
              title="Faculty & Instructor Directory"
              className={`w-full flex items-center rounded transition cursor-pointer text-left ${
                isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-3 py-2.5'
              } ${
                activeTab === 'all_teachers'
                  ? 'bg-[#1e282c] text-white border-l-4 border-[#00c0ef] font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Faculty Directory</span>}
            </button>

            {/* Manage Classes & Sections ▾ */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (isSidebarCollapsed) {
                    setActiveTab('manage_classes');
                  } else {
                    setManageClassesExpanded(!manageClassesExpanded);
                    setActiveTab('manage_classes');
                  }
                }}
                title="Manage Classes & Subjects"
                className={`w-full flex items-center rounded transition cursor-pointer text-left ${
                  isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2.5'
                } ${
                  activeTab === 'manage_classes'
                    ? 'bg-[#1e282c] text-white border-l-4 border-[#00c0ef] font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Manage Classes & Subjects</span>}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${manageClassesExpanded ? 'rotate-180' : ''}`} />
                )}
              </button>
              {!isSidebarCollapsed && manageClassesExpanded && (
                <div className="pl-7 pr-2 py-1 space-y-1 bg-black/15 text-[11px]">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('manage_classes'); setSidebarOpen(false); }}
                    className="w-full text-left py-1 text-slate-300 hover:text-white block cursor-pointer"
                  >
                    • Classes & Sections List
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewClassModal(true); }}
                    className="w-full text-left py-1 text-slate-300 hover:text-white block cursor-pointer"
                  >
                    • + Create New Class
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewSubjectModal(true); }}
                    className="w-full text-left py-1 text-slate-300 hover:text-white block cursor-pointer"
                  >
                    • + Add Subject / Course
                  </button>
                </div>
              )}
            </div>

            {/* Take Attendance ▾ */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (isSidebarCollapsed) {
                    setActiveTab('take_attendance');
                  } else {
                    setTakeAttendanceExpanded(!takeAttendanceExpanded);
                    setActiveTab('take_attendance');
                  }
                }}
                title="Take Attendance Sheet"
                className={`w-full flex items-center rounded transition cursor-pointer text-left ${
                  isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2.5'
                } ${
                  activeTab === 'take_attendance'
                    ? 'bg-[#1e282c] text-white border-l-4 border-[#00c0ef] font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Take Attendance</span>}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${takeAttendanceExpanded ? 'rotate-180' : ''}`} />
                )}
              </button>
              {!isSidebarCollapsed && takeAttendanceExpanded && (
                <div className="pl-7 pr-2 py-1 space-y-1 bg-black/15 text-[11px]">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('take_attendance'); setSidebarOpen(false); }}
                    className="w-full text-left py-1 text-slate-300 hover:text-white block cursor-pointer"
                  >
                    • Record Attendance Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleMarkAll('present'); }}
                    className="w-full text-left py-1 text-emerald-400 hover:text-emerald-300 block cursor-pointer font-medium"
                  >
                    • Quick Mark All Present
                  </button>
                </div>
              )}
            </div>

            {/* Manage Students ▾ */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (isSidebarCollapsed) {
                    setActiveTab('manage_students');
                  } else {
                    setManageStudentsExpanded(!manageStudentsExpanded);
                    setActiveTab('manage_students');
                  }
                }}
                title="Manage Students"
                className={`w-full flex items-center rounded transition cursor-pointer text-left ${
                  isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2.5'
                } ${
                  activeTab === 'manage_students'
                    ? 'bg-[#1e282c] text-white border-l-4 border-[#00c0ef] font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Manage Students</span>}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${manageStudentsExpanded ? 'rotate-180' : ''}`} />
                )}
              </button>
              {!isSidebarCollapsed && manageStudentsExpanded && (
                <div className="pl-7 pr-2 py-1 space-y-1 bg-black/15 text-[11px]">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('all_students'); setSidebarOpen(false); }}
                    className="w-full text-left py-1 text-slate-300 hover:text-white block cursor-pointer"
                  >
                    • Student Masterlist
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewStudentModal(true); }}
                    className="w-full text-left py-1 text-slate-300 hover:text-white block cursor-pointer"
                  >
                    • + Enroll New Student
                  </button>
                </div>
              )}
            </div>

            {/* Attendance Logs & History */}
            <button
              type="button"
              onClick={() => { setActiveTab('attendance_logs'); setSidebarOpen(false); }}
              title="Attendance Logs & History"
              className={`w-full flex items-center rounded transition cursor-pointer text-left ${
                isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-3 py-2.5'
              } ${
                activeTab === 'attendance_logs'
                  ? 'bg-[#1e282c] text-white border-l-4 border-[#00c0ef] font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Attendance Logs & History</span>}
            </button>

            {/* Excuse Requests */}
            <button
              type="button"
              onClick={() => { setActiveTab('excuse_requests'); setSidebarOpen(false); }}
              title="Absence Excuse Slips"
              className={`w-full flex items-center rounded transition cursor-pointer text-left ${
                isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-3 py-2.5'
              } ${
                activeTab === 'excuse_requests'
                  ? 'bg-[#1e282c] text-white border-l-4 border-[#00c0ef] font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Absence Excuse Slips</span>}
            </button>

            {/* Send Notice To Class / Student ▾ */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (isSidebarCollapsed) {
                    setActiveTab('send_announcement');
                  } else {
                    setSendAnnouncementExpanded(!sendAnnouncementExpanded);
                    setActiveTab('send_announcement');
                  }
                }}
                title="Send Class Announcement"
                className={`w-full flex items-center rounded transition cursor-pointer text-left ${
                  isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2.5'
                } ${
                  activeTab === 'send_announcement'
                    ? 'bg-[#1e282c] text-white border-l-4 border-[#00c0ef] font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Send Class Announcement</span>}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sendAnnouncementExpanded ? 'rotate-180' : ''}`} />
                )}
              </button>
              {!isSidebarCollapsed && sendAnnouncementExpanded && (
                <div className="pl-7 pr-2 py-1 space-y-1 bg-black/15 text-[11px]">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('send_announcement'); setSidebarOpen(false); }}
                    className="w-full text-left py-1 text-slate-300 hover:text-white block cursor-pointer"
                  >
                    • Compose Notice & Advisory
                  </button>
                </div>
              )}
            </div>

          </nav>

          {/* Sidebar Footer Info */}
          {!isSidebarCollapsed && (
            <div className="p-2.5 border-t border-white/10 text-[10px] text-slate-400 text-center">
              <span>Christy Jean Academy Attendance v2.4</span>
            </div>
          )}

        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-10 md:hidden"
          />
        )}

        {/* ========================================================================= */}
        {/* 3. MAIN CONTENT VIEWPORT */}
        {/* ========================================================================= */}
        <main className="flex-1 overflow-y-auto flex flex-col justify-between relative p-4 sm:p-6 lg:p-7">
          
          <div>
            {/* Top Breadcrumb & Section Heading (Omitted on Dashboard to remove Homepage / Control panel) */}
            {activeTab !== 'dashboard' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {activeTab === 'profile' && 'Instructor Profile'}
                    {activeTab === 'all_students' && 'All Student Information'}
                    {activeTab === 'all_teachers' && 'Faculty Directory'}
                    {activeTab === 'manage_classes' && 'Manage Classes & Subjects'}
                    {activeTab === 'take_attendance' && 'Take Attendance Sheet'}
                    {activeTab === 'manage_students' && 'Manage Students'}
                    {activeTab === 'attendance_logs' && 'Attendance Logs & Session History'}
                    {activeTab === 'excuse_requests' && 'Absence Excuse Requests'}
                    {activeTab === 'send_announcement' && 'Send Class Advisory & Notice'}
                  </h2>
                </div>

                {/* Breadcrumb Trail */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </button>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-700 font-medium capitalize">
                    {activeTab.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}

            {/* Notification Toast */}
            {saveToast && (
              <div className="mb-4 p-3 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveToast}</span>
                </div>
                <button type="button" onClick={() => setSaveToast(null)} className="cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 4. THE 8 HIGH-CONTRAST COLORED CARDS GRID (ATTENDANCE SPECIFIC) */}
            {/* VISIBLE ONLY ON HOMEPAGE / DASHBOARD */}
            {/* ========================================================================= */}
            {activeTab === 'dashboard' && (
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              
              {/* Card 1: Enrolled Students (Cyan `#00c0ef` / `#00b0e9`) */}
              <div 
                onClick={() => setActiveTab('all_students')}
                className="bg-[#00c0ef] hover:bg-[#00b0e9] text-white p-4 sm:p-5 rounded-sm shadow-xs transition cursor-pointer flex items-center justify-between min-h-[92px] group"
              >
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">
                    {students.length > 0 ? students.length : '38'}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold mt-1 opacity-95 tracking-wide">
                    Enrolled Students
                  </div>
                </div>
                <Users className="w-10 h-10 text-white/70 group-hover:scale-105 transition-transform shrink-0" />
              </div>

              {/* Card 2: Recorded Sessions (Green `#00a65a`) */}
              <div 
                onClick={() => setActiveTab('attendance_logs')}
                className="bg-[#00a65a] hover:bg-[#009551] text-white p-4 sm:p-5 rounded-sm shadow-xs transition cursor-pointer flex items-center justify-between min-h-[92px] group"
              >
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">
                    {attendanceRecords.length > 0 ? attendanceRecords.length : '14'}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold mt-1 opacity-95 tracking-wide">
                    Recorded Sessions
                  </div>
                </div>
                <UserCheck className="w-10 h-10 text-white/70 group-hover:scale-105 transition-transform shrink-0" />
              </div>

              {/* Card 3: Classes & Subjects (Red `#dd4b39`) */}
              <div 
                onClick={() => setActiveTab('manage_classes')}
                className="bg-[#dd4b39] hover:bg-[#d73925] text-white p-4 sm:p-5 rounded-sm shadow-xs transition cursor-pointer flex items-center justify-between min-h-[92px] group"
              >
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">
                    {classes.length + subjects.length}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold mt-1 opacity-95 tracking-wide">
                    Classes & Subjects
                  </div>
                </div>
                <GraduationCap className="w-10 h-10 text-white/70 group-hover:scale-105 transition-transform shrink-0" />
              </div>

              {/* Card 4: Attendance Rate (Amber / Orange `#f39c12`) */}
              <div 
                onClick={() => setShowSummaryModal(true)}
                className="bg-[#f39c12] hover:bg-[#e08e0b] text-white p-4 sm:p-5 rounded-sm shadow-xs transition cursor-pointer flex items-center justify-between min-h-[92px] group"
              >
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">
                    {overallAttendanceRate}%
                  </div>
                  <div className="text-xs sm:text-sm font-semibold mt-1 opacity-95 tracking-wide">
                    Attendance Rate
                  </div>
                </div>
                <Percent className="w-10 h-10 text-white/70 group-hover:scale-105 transition-transform shrink-0" />
              </div>

              {/* Card 5: Manage Classes (Red `#dd4b39`) */}
              <div 
                onClick={() => setActiveTab('manage_classes')}
                className="bg-[#dd4b39] hover:bg-[#d73925] text-white p-4 sm:p-5 rounded-sm shadow-xs transition cursor-pointer flex items-center justify-between min-h-[72px] group"
              >
                <div className="text-sm sm:text-base font-bold tracking-wide">
                  Manage Classes
                </div>
                <GraduationCap className="w-7 h-7 text-white/80 group-hover:scale-105 transition-transform shrink-0" />
              </div>

              {/* Card 6: Manage Students (Amber / Orange `#f39c12`) */}
              <div 
                onClick={() => setActiveTab('manage_students')}
                className="bg-[#f39c12] hover:bg-[#e08e0b] text-white p-4 sm:p-5 rounded-sm shadow-xs transition cursor-pointer flex items-center justify-between min-h-[72px] group"
              >
                <div className="text-sm sm:text-base font-bold tracking-wide">
                  Manage Students
                </div>
                <Users className="w-7 h-7 text-white/80 group-hover:scale-105 transition-transform shrink-0" />
              </div>

              {/* Card 7: Attendance Status (Cyan `#00c0ef`) */}
              <div 
                onClick={() => setShowStatusModal(true)}
                className="bg-[#00c0ef] hover:bg-[#00b0e9] text-white p-4 sm:p-5 rounded-sm shadow-xs transition cursor-pointer flex items-center justify-between min-h-[72px] group"
              >
                <div className="text-sm sm:text-base font-bold tracking-wide">
                  Attendance Status
                </div>
                <Layers className="w-7 h-7 text-white/80 group-hover:scale-105 transition-transform shrink-0" />
              </div>

              {/* Card 8: Excuse Slips (Green `#00a65a`) */}
              <div 
                onClick={() => setActiveTab('excuse_requests')}
                className="bg-[#00a65a] hover:bg-[#009551] text-white p-4 sm:p-5 rounded-sm shadow-xs transition cursor-pointer flex items-center justify-between min-h-[72px] group"
              >
                <div className="text-sm sm:text-base font-bold tracking-wide">
                  Absence Excuses
                </div>
                <FileText className="w-7 h-7 text-white/80 group-hover:scale-105 transition-transform shrink-0" />
              </div>

            </section>
            )}

            {/* ========================================================================= */}
            {/* 5. TAB VIEW CONTENTS (FUNCTIONAL MODULES) */}
            {/* ========================================================================= */}

            {/* A. DASHBOARD VIEW: OVERVIEW + QUICK ATTENDANCE SHEET */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Quick Session Attendance Trigger Banner */}
                <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs p-4 sm:p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Quick Attendance Recorder
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select a class section & subject to start recording attendance.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('take_attendance')}
                        className="py-2 px-4 rounded-sm bg-[#00a65a] hover:bg-[#009551] text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Open Attendance Sheet</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="py-2 px-3 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center gap-1 border border-slate-200"
                        title="Export CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Logs (CSV)</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter selects */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Class / Section</label>
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-sm focus:bg-white focus:outline-none focus:border-[#00c0ef]"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.gradeLevel} - {c.academicYear})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Course / Subject</label>
                      <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-sm focus:bg-white focus:outline-none focus:border-[#00c0ef]"
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Session Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-sm focus:bg-white focus:outline-none focus:border-[#00c0ef]"
                      />
                    </div>
                  </div>
                </div>

                {/* Recent Recorded Sessions Table */}
                <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Recent Attendance Records & Logs
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Showing {attendanceRecords.length} recorded sessions
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">#</th>
                          <th className="py-2.5 px-4">Class</th>
                          <th className="py-2.5 px-4">Subject</th>
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Attendance Stats</th>
                          <th className="py-2.5 px-4">Recorded By</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {attendanceRecords.slice(0, 8).map((record, index) => {
                          const cls = classes.find((c) => c.id === record.classId)?.name || record.classId;
                          const sub = subjects.find((s) => s.id === record.subjectId)?.name || record.subjectId;
                          const presentCount = record.entries.filter((e) => e.status === 'present').length;
                          const lateCount = record.entries.filter((e) => e.status === 'late').length;
                          const absentCount = record.entries.filter((e) => e.status === 'absent').length;

                          return (
                            <tr 
                              key={record.id} 
                              onClick={() => {
                                setSelectedClassId(record.classId);
                                setSelectedSubjectId(record.subjectId);
                                setSelectedDate(record.date);
                                setActiveTab('take_attendance');
                              }}
                              title="Click to open and edit this attendance session sheet"
                              className="hover:bg-sky-50/80 transition-colors cursor-pointer group"
                            >
                              <td className="py-2.5 px-4 font-mono text-slate-500">{index + 1}</td>
                              <td className="py-2.5 px-4 font-semibold text-slate-900 group-hover:text-[#00c0ef] transition-colors">{cls}</td>
                              <td className="py-2.5 px-4">{sub}</td>
                              <td className="py-2.5 px-4 font-mono">{record.date}</td>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                  <span className="text-emerald-700 font-semibold">{presentCount} Present</span>
                                  <span>·</span>
                                  <span className="text-amber-700">{lateCount} Late</span>
                                  <span>·</span>
                                  <span className="text-rose-700">{absentCount} Absent</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-slate-600">{record.recordedByName}</td>
                              <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedClassId(record.classId);
                                    setSelectedSubjectId(record.subjectId);
                                    setSelectedDate(record.date);
                                    setActiveTab('take_attendance');
                                  }}
                                  className="text-[11px] font-bold text-[#00c0ef] hover:underline cursor-pointer flex items-center justify-end gap-1 ml-auto"
                                >
                                  <span>View / Update</span>
                                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* B. TAKE ATTENDANCE VIEW */}
            {activeTab === 'take_attendance' && (
              <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-5">
                
                {/* Header and selector bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Take Attendance Sheet
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mark students as Present, Late, or Absent, write notes, and save.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarkAll('present')}
                      className="py-1.5 px-3 rounded-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mark All Present</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAttendance}
                      className="py-1.5 px-4 rounded-sm bg-[#00a65a] hover:bg-[#009551] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Attendance</span>
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded border border-slate-200">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Class Section</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-sm focus:outline-none focus:border-[#00c0ef]"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.gradeLevel})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Course / Subject</label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-sm focus:outline-none focus:border-[#00c0ef]"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Date of Session</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-sm focus:outline-none focus:border-[#00c0ef]"
                    />
                  </div>
                </div>

                {/* Session Summary Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700">Roster Status:</span>
                  <span className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-semibold">Total: {sheetStats.total}</span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold">Present: {sheetStats.present}</span>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded font-semibold">Late: {sheetStats.late}</span>
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded font-semibold">Absent: {sheetStats.absent}</span>
                  {existingRecord && (
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded font-semibold ml-auto">
                      ✓ Existing Record (Saved)
                    </span>
                  )}
                </div>

                {/* Student Attendance Sheet Table */}
                <div className="border border-slate-200 rounded-sm overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b3b5c] text-white font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Student ID</th>
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3 text-center">Attendance Status</th>
                        <th className="py-2.5 px-3">Remarks / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No active students found in this class section.
                          </td>
                        </tr>
                      ) : (
                        classStudents.map((student, idx) => {
                          const currentStatus = attendanceMap[student.id]?.status || 'present';
                          const remarks = attendanceMap[student.id]?.remarks || '';

                          return (
                            <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-3 font-mono font-semibold text-slate-800">{student.studentNumber}</td>
                              <td className="py-2 px-3 font-medium text-slate-900">{student.firstName} {student.lastName}</td>
                              
                              {/* Status selection toggle buttons */}
                              <td className="py-2 px-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(student.id, 'present')}
                                    className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                                      currentStatus === 'present'
                                        ? 'bg-[#00a65a] text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(student.id, 'late')}
                                    className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                                      currentStatus === 'late'
                                        ? 'bg-[#f39c12] text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    Late
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(student.id, 'absent')}
                                    className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                                      currentStatus === 'absent'
                                        ? 'bg-[#dd4b39] text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    Absent
                                  </button>
                                </div>
                              </td>

                              {/* Remarks input */}
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={remarks}
                                  onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                  placeholder="e.g. excused clinic pass, 10m late"
                                  className="w-full text-xs px-2.5 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-[#00c0ef]"
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Session Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Session General Notes</label>
                  <textarea
                    rows={2}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Optional notes regarding topics covered, exam day, class disruptions, etc..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-[#00c0ef]"
                  />
                </div>

                {/* Save Footer button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    className="py-2.5 px-6 rounded-sm bg-[#00a65a] hover:bg-[#009551] text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Attendance Record</span>
                  </button>
                </div>

              </div>
            )}

            {/* C. ALL STUDENTS INFORMATION VIEW */}
            {activeTab === 'all_students' && (
              <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      All Student Information
                    </h3>
                    <p className="text-xs text-slate-500">
                      Roster of enrolled students with contact details and class assignments.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewStudentModal(true)}
                      className="py-1.5 px-3 bg-[#00a65a] hover:bg-[#009551] text-white text-xs font-bold rounded-sm shadow-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Student</span>
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search student by name or student number..."
                      className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-[#00c0ef]"
                    />
                  </div>

                  <div className="w-full sm:w-60">
                    <select
                      value={selectedClassFilter}
                      onChange={(e) => setSelectedClassFilter(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-[#00c0ef]"
                    >
                      <option value="ALL">All Classes & Sections</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Students Table */}
                <div className="border border-slate-200 rounded-sm overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b3b5c] text-white font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Student ID</th>
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3">Class Section</th>
                        <th className="py-2.5 px-3">Gender</th>
                        <th className="py-2.5 px-3">Guardian Contact</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students
                        .filter((s) => {
                          const fullName = `${s.firstName} ${s.lastName}`;
                          const matchesQuery = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
                          const matchesClass = selectedClassFilter === 'ALL' || s.classId === selectedClassFilter;
                          return matchesQuery && matchesClass;
                        })
                        .map((student, idx) => {
                          const clsName = classes.find((c) => c.id === student.classId)?.name || 'General';
                          return (
                            <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-3 font-mono font-semibold text-slate-800">{student.studentNumber}</td>
                              <td className="py-2 px-3 font-medium text-slate-900">{student.firstName} {student.lastName}</td>
                              <td className="py-2 px-3">{clsName}</td>
                              <td className="py-2 px-3 text-slate-500">{student.gender}</td>
                              <td className="py-2 px-3 text-slate-500">{student.email || student.guardianPhone}</td>
                              <td className="py-2 px-3">
                                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                  {student.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* D. FACULTY DIRECTORY VIEW */}
            {activeTab === 'all_teachers' && (
              <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    Faculty & Instructor Directory
                  </h3>
                  <p className="text-xs text-slate-500">
                    Directory of registered instructors, subject heads, and school faculty.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facultyList.map((teacher) => (
                    <div key={teacher.id} className="p-4 rounded-sm border border-slate-200 bg-slate-50/50 flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-[#0b3b5c] text-white flex items-center justify-center font-bold text-base shrink-0">
                        {teacher.name.charAt(0)}
                      </div>
                      <div className="flex-1 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm">{teacher.name}</h4>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded">
                            {teacher.role}
                          </span>
                        </div>
                        <p className="text-slate-500">{teacher.department}</p>
                        <p className="text-slate-600 font-mono text-[11px]">{teacher.email} · {teacher.phone}</p>
                        <p className="text-slate-700 font-medium pt-1">Subjects Handled: <span className="text-slate-500">{teacher.subjects}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* E. MANAGE CLASSES & SUBJECTS VIEW */}
            {activeTab === 'manage_classes' && (
              <div className="space-y-6">
                
                {/* Classes Table */}
                <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Classes & Sections</h3>
                      <p className="text-[11px] text-slate-500">Class sections assigned for student attendance taking.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewClassModal(true)}
                      className="py-1 px-2.5 bg-[#00a65a] hover:bg-[#009551] text-white text-xs font-bold rounded-sm shadow-xs transition cursor-pointer"
                    >
                      + Add Class
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-sm overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0b3b5c] text-white font-semibold">
                        <tr>
                          <th className="py-2 px-3">Class Name</th>
                          <th className="py-2 px-3">Grade Level</th>
                          <th className="py-2 px-3">Academic Year</th>
                          <th className="py-2 px-3">Section Adviser</th>
                          <th className="py-2 px-3">Enrolled Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classes.map((c) => {
                          const count = students.filter((s) => s.classId === c.id).length;
                          return (
                            <tr key={c.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-800">{c.name}</td>
                              <td className="py-2 px-3">{c.gradeLevel}</td>
                              <td className="py-2 px-3 font-mono">{c.academicYear}</td>
                              <td className="py-2 px-3 text-slate-600">{c.adviser || currentUser.fullName}</td>
                              <td className="py-2 px-3 font-bold text-[#00c0ef]">{count} Students</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subjects Table */}
                <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Curriculum Subjects & Courses</h3>
                      <p className="text-[11px] text-slate-500">Subjects tracked for daily attendance.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewSubjectModal(true)}
                      className="py-1 px-2.5 bg-[#00c0ef] hover:bg-[#00b0e9] text-white text-xs font-bold rounded-sm shadow-xs transition cursor-pointer"
                    >
                      + Add Subject
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-sm overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0b3b5c] text-white font-semibold">
                        <tr>
                          <th className="py-2 px-3">Subject Name</th>
                          <th className="py-2 px-3">Subject Code</th>
                          <th className="py-2 px-3">Department</th>
                          <th className="py-2 px-3">Units</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subjects.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{s.name}</td>
                            <td className="py-2 px-3 font-mono text-indigo-700 font-bold">{s.code}</td>
                            <td className="py-2 px-3 text-slate-500">{s.department || 'Academics'}</td>
                            <td className="py-2 px-3 font-mono">{s.units || 3} Units</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* F. ATTENDANCE LOGS & HISTORY VIEW */}
            {activeTab === 'attendance_logs' && (
              <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Attendance Logs & Session History
                    </h3>
                    <p className="text-xs text-slate-500">
                      Historical log of all recorded attendance sessions across all sections.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="py-1.5 px-3 bg-[#00a65a] hover:bg-[#009551] text-white text-xs font-bold rounded-sm shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Report</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-sm overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b3b5c] text-white font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Instructor</th>
                        <th className="py-2.5 px-3">Present</th>
                        <th className="py-2.5 px-3">Late</th>
                        <th className="py-2.5 px-3">Absent</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceRecords.map((r, idx) => {
                        const cls = classes.find((c) => c.id === r.classId)?.name || r.classId;
                        const sub = subjects.find((s) => s.id === r.subjectId)?.name || r.subjectId;
                        const present = r.entries.filter((e) => e.status === 'present').length;
                        const late = r.entries.filter((e) => e.status === 'late').length;
                        const absent = r.entries.filter((e) => e.status === 'absent').length;

                        return (
                          <tr key={`${r.id}-${idx}`} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-semibold">{r.date}</td>
                            <td className="py-2 px-3 font-medium text-slate-900">{cls}</td>
                            <td className="py-2 px-3">{sub}</td>
                            <td className="py-2 px-3 text-slate-600">{r.recordedByName}</td>
                            <td className="py-2 px-3 font-bold text-emerald-700">{present}</td>
                            <td className="py-2 px-3 font-bold text-amber-600">{late}</td>
                            <td className="py-2 px-3 font-bold text-rose-600">{absent}</td>
                            <td className="py-2 px-3 text-slate-500 italic">{r.notes || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* G. PROFILE VIEW */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs p-6 max-w-xl space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-[#0b3b5c] text-white flex items-center justify-center text-xl font-bold">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{currentUser.fullName}</h3>
                    <p className="text-xs text-slate-500 capitalize">{currentUser.role} · {currentUser.department}</p>
                    <span className="inline-block mt-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      Authorized Faculty Member
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Username</span>
                    <span className="font-semibold text-slate-800 font-mono">@{currentUser.username}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Institutional Email</span>
                    <span className="font-semibold text-slate-800">{currentUser.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Academic Title</span>
                    <span className="font-semibold text-slate-800">{currentUser.title || 'Visiting Lecturer'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Department</span>
                    <span className="font-semibold text-slate-800">{currentUser.department || 'Department of SSG'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmLogout(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-xs font-semibold cursor-pointer transition"
                  >
                    Sign Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-semibold cursor-pointer border border-slate-200 transition"
                  >
                    Reset Demo Storage
                  </button>
                </div>
              </div>
            )}

            {/* H. ABSENCE EXCUSE REQUESTS VIEW */}
            {activeTab === 'excuse_requests' && (
              <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Absence Excuse Slips & Requests</h3>
                    <p className="text-xs text-slate-500">Student submitted excuse notes pending instructor endorsement.</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {excuseList.map((req) => (
                    <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm">{req.studentName}</p>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono text-slate-500">{req.studentNumber}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-medium text-slate-700">{req.className}</span>
                        </div>
                        <p className="text-slate-600 mt-1">
                          Reason: <span className="text-slate-900 font-medium">{req.reason}</span>
                          {req.doctorNote && (
                            <span className="ml-2 inline-block bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                              + Medical Certificate Attached
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Date of Absence: {req.date}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {req.status === 'Pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setExcuseList((prev) => prev.map((e) => e.id === req.id ? { ...e, status: 'Approved' } : e));
                                setSaveToast(`Excuse slip approved for ${req.studentName}`);
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs cursor-pointer transition shadow-xs"
                            >
                              Approve Excuse
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setExcuseList((prev) => prev.map((e) => e.id === req.id ? { ...e, status: 'Rejected' } : e));
                                setSaveToast(`Excuse slip rejected for ${req.studentName}`);
                              }}
                              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded font-bold text-xs cursor-pointer transition"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className={`px-2.5 py-1 rounded font-bold text-[11px] ${
                            req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {req.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* I. SEND CLASS ANNOUNCEMENT VIEW */}
            {activeTab === 'send_announcement' && (
              <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs p-5 max-w-lg space-y-4">
                <h3 className="text-base font-bold text-slate-900">Send Class Attendance Advisory</h3>
                <p className="text-xs text-slate-500">Broadcast notification to classes, specific sections, or guardians.</p>

                <form onSubmit={(e) => { e.preventDefault(); setSaveToast('Announcement broadcasted to class roster!'); setActiveTab('dashboard'); }} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">Recipient Section</label>
                    <select className="w-full p-2 border border-slate-200 rounded-sm bg-slate-50">
                      <option>All Enrolled Classes</option>
                      {classes.map((c) => (
                        <option key={c.id}>{c.name}</option>
                      ))}
                      <option>Flagged Students with 3+ Absences Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">Announcement Subject</label>
                    <input type="text" placeholder="e.g. Midterm Period Attendance Requirements" required className="w-full p-2 border border-slate-200 rounded-sm bg-slate-50" />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">Message Content</label>
                    <textarea rows={4} placeholder="Type official advisory message..." required className="w-full p-2 border border-slate-200 rounded-sm bg-slate-50" />
                  </div>

                  <button
                    type="submit"
                    className="py-2 px-5 bg-[#00c0ef] hover:bg-[#00b0e9] text-white font-bold rounded-sm shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Class Notice</span>
                  </button>
                </form>
              </div>
            )}

            {/* J. MANAGE STUDENTS DIRECTORY VIEW */}
            {activeTab === 'manage_students' && (
              <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Manage Students Directory</h3>
                    <p className="text-xs text-slate-500">Configure student records and section enrollments.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewStudentModal(true)}
                    className="py-1.5 px-3 bg-[#00a65a] hover:bg-[#009551] text-white text-xs font-bold rounded-sm shadow-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enroll Student</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm">
                    <span className="text-xs text-slate-500">Active Students</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{students.length}</p>
                    <button type="button" onClick={() => setActiveTab('all_students')} className="text-xs text-[#00c0ef] font-semibold mt-2 hover:underline block cursor-pointer">
                      View Masterlist →
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm">
                    <span className="text-xs text-slate-500">Class Sections</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{classes.length}</p>
                    <button type="button" onClick={() => setActiveTab('manage_classes')} className="text-xs text-[#00c0ef] font-semibold mt-2 hover:underline block cursor-pointer">
                      View Classes →
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm">
                    <span className="text-xs text-slate-500">Attendance Records</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{attendanceRecords.length}</p>
                    <button type="button" onClick={() => setActiveTab('attendance_logs')} className="text-xs text-[#00c0ef] font-semibold mt-2 hover:underline block cursor-pointer">
                      View Logged Sessions →
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ========================================================================= */}
          {/* 6. BOTTOM FOOTER */}
          {/* ========================================================================= */}
          <footer className="mt-8 pt-4 pb-2 border-t border-slate-200/80 text-center text-xs text-slate-500">
            <span>© Christy Jean Academy · Student Attendance Management System · Instructor Portal</span>
          </footer>

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 7. FLOATING ACTION BUTTONS (BOTTOM RIGHT) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-3 z-40">
        
        {/* Fullscreen Expand / Compress Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="w-12 h-12 rounded-2xl bg-white shadow-xl border border-slate-200 text-slate-700 hover:text-slate-900 hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        {/* Quick Search Palette Trigger */}
        <button
          type="button"
          onClick={() => setShowQuickSearchModal(true)}
          className="w-12 h-12 rounded-2xl bg-white shadow-xl border border-slate-200 text-slate-700 hover:text-slate-900 hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          title="Quick Search Student or Class"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 8. MODALS (ATTENDANCE SUMMARY, STATUS, ADD STUDENT, LOGOUT CONFIRMATION) */}
      {/* ========================================================================= */}

      {/* Attendance Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Attendance Summary & Analytics</h3>
              </div>
              <button type="button" onClick={() => setShowSummaryModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              Institutional semester attendance threshold and compliance statistics.
            </p>

            <div className="p-3 bg-amber-50 rounded border border-amber-200 flex items-center justify-between">
              <span className="font-bold text-amber-900">Overall Attendance Compliance</span>
              <span className="font-mono text-base font-extrabold text-amber-800">{overallAttendanceRate}%</span>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Total Recorded Student Check-ins</span>
                <span className="font-mono font-semibold">
                  {attendanceRecords.reduce((acc, r) => acc + r.entries.length, 0)} entries
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Pending Absence Excuse Slips</span>
                <span className="font-mono font-semibold text-amber-600">
                  {excuseList.filter((e) => e.status === 'Pending').length} pending
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Students with 3+ Absences (At Risk)</span>
                <span className="font-mono font-semibold text-rose-600">2 students</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSummaryModal(false)}
              className="w-full py-2 bg-[#f39c12] hover:bg-[#e08e0b] text-white font-bold rounded cursor-pointer transition"
            >
              Close Summary
            </button>
          </div>
        </div>
      )}

      {/* Attendance Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#00c0ef]" />
                <h3 className="font-bold text-slate-900 text-sm">Attendance System Status</h3>
              </div>
              <button type="button" onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Attendance Database Sync</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online & Operational
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Active School Term</span>
                <span className="font-semibold text-slate-800">Academic Year 2026-2027</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Active Class Sections</span>
                <span className="font-semibold text-slate-800">{classes.length} Sections</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Total Enrolled Students</span>
                <span className="font-semibold text-slate-800">{students.length} Students</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span>System Role</span>
                <span className="font-bold text-indigo-700">INSTRUCTOR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowStatusModal(false)}
              className="w-full py-2 bg-[#00c0ef] hover:bg-[#00b0e9] text-white font-bold rounded cursor-pointer transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Quick Search Palette Modal */}
      {showQuickSearchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#00c0ef]" />
                <h3 className="font-bold text-slate-900 text-sm">Quick Attendance Search</h3>
              </div>
              <button type="button" onClick={() => setShowQuickSearchModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Type student name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:outline-none focus:border-[#00c0ef]"
            />

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {students
                .filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentNumber.includes(searchQuery))
                .slice(0, 5)
                .map((s) => (
                  <div 
                    key={s.id} 
                    onClick={() => {
                      setSelectedClassId(s.classId);
                      setActiveTab('take_attendance');
                      setShowQuickSearchModal(false);
                    }}
                    className="py-2 px-2 hover:bg-slate-50 cursor-pointer rounded flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{s.firstName} {s.lastName}</p>
                      <p className="text-[10px] text-slate-400">{s.studentNumber} · {classes.find((c) => c.id === s.classId)?.name}</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                      Open Class Attendance →
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showNewStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Enroll New Student</h3>
              <button type="button" onClick={() => setShowNewStudentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Christian Dela Cruz"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-[#00c0ef]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Student ID Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-0099"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-[#00c0ef]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Gender</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as 'Male' | 'Female')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Class Section</label>
                  <select
                    value={newStudentClass}
                    onChange={(e) => setNewStudentClass(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Student / Guardian Email</label>
                <input
                  type="email"
                  placeholder="student@school.edu"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-[#00c0ef]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewStudentModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00a65a] hover:bg-[#009551] text-white font-bold rounded cursor-pointer"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showNewClassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full border border-slate-200 p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add Class Section</h3>
              <button type="button" onClick={() => setShowNewClassModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = (form.elements.namedItem('className') as HTMLInputElement).value;
                const grade = (form.elements.namedItem('gradeLevel') as HTMLInputElement).value;
                const newCls: ClassItem = {
                  id: `cls-${Date.now()}`,
                  name,
                  gradeLevel: grade || 'Grade 10',
                  section: name.split('-')[1]?.trim() || 'A',
                  academicYear: '2026-2027',
                  room: 'Room 201',
                  adviser: currentUser.fullName,
                };
                saveClass(newCls);
                setClasses(getClasses());
                setShowNewClassModal(false);
                setSaveToast(`Class ${name} created successfully!`);
              }}
              className="space-y-3"
            >
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Class Name</label>
                <input name="className" required placeholder="e.g. Grade 12 - STEM Alpha" className="w-full p-2 bg-slate-50 border border-slate-200 rounded" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Grade Level</label>
                <input name="gradeLevel" required placeholder="e.g. Grade 12" className="w-full p-2 bg-slate-50 border border-slate-200 rounded" />
              </div>
              <button type="submit" className="w-full py-2 bg-[#00a65a] hover:bg-[#009551] text-white font-bold rounded cursor-pointer">
                Create Class
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showNewSubjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full border border-slate-200 p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add Course Subject</h3>
              <button type="button" onClick={() => setShowNewSubjectModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = (form.elements.namedItem('subName') as HTMLInputElement).value;
                const code = (form.elements.namedItem('subCode') as HTMLInputElement).value;
                const newSub: SubjectItem = {
                  id: `sub-${Date.now()}`,
                  name,
                  code,
                  department: 'Academics',
                  units: 3,
                };
                saveSubject(newSub);
                setSubjects(getSubjects());
                setShowNewSubjectModal(false);
                setSaveToast(`Subject ${name} added!`);
              }}
              className="space-y-3"
            >
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Subject Name</label>
                <input name="subName" required placeholder="e.g. Earth & Life Science" className="w-full p-2 bg-slate-50 border border-slate-200 rounded" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Subject Code</label>
                <input name="subCode" required placeholder="e.g. ELS-102" className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono" />
              </div>
              <button type="submit" className="w-full py-2 bg-[#00c0ef] hover:bg-[#00b0e9] text-white font-bold rounded cursor-pointer">
                Add Subject
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full border border-slate-200 p-5 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Reset Attendance Demo Data?</h3>
            <p className="text-slate-600">
              This will restore all student attendance logs, rosters, and class schedules back to initial school demo records.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onResetData) {
                    onResetData();
                  } else {
                    resetToDemoData();
                    window.location.reload();
                  }
                  setShowConfirmReset(false);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showConfirmLogout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full border border-slate-200 p-5 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Confirm Sign Out</h3>
            <p className="text-slate-600">
              Are you sure you want to end your instructor session and return to the login screen?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmLogout(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmLogout(false);
                  if (onLogout) onLogout();
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NOTIFICATION CONCERN RESOLUTION & ACTION MODAL */}
      {/* ========================================================================= */}
      {activeConcernNotification && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden text-xs animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                {activeConcernNotification.type === 'medical_slip' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
                {activeConcernNotification.type === 'attendance_review' && (
                  <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                {activeConcernNotification.type === 'absence_alert' && (
                  <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {activeConcernNotification.type === 'medical_slip' && 'Medical Excuse Slip Concern'}
                    {activeConcernNotification.type === 'attendance_review' && 'Session Attendance Verification'}
                    {activeConcernNotification.type === 'absence_alert' && 'High Absence Intervention Concern'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Logged {activeConcernNotification.timestamp} · Student Attendance Portal
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveConcernNotification(null)}
                className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">

              {/* CONCERN TYPE 1: Medical Slip */}
              {activeConcernNotification.type === 'medical_slip' && (
                <div className="space-y-4">
                  
                  {/* Student & Submission Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Student</span>
                        <h4 className="text-sm font-bold text-slate-900">{activeConcernNotification.studentName}</h4>
                        <span className="text-slate-500 font-mono text-[11px]">{activeConcernNotification.studentNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Class & Section</span>
                        <span className="font-bold text-slate-800 text-xs">{activeConcernNotification.className}</span>
                        <span className="text-slate-400 text-[10px] block">Absence Date: {activeConcernNotification.date}</span>
                      </div>
                    </div>

                    <div className="pt-3 space-y-2">
                      <div>
                        <span className="text-slate-500 font-semibold block text-[11px]">Reported Medical Diagnosis & Reason:</span>
                        <p className="text-slate-800 font-medium bg-white p-2.5 rounded border border-slate-200 mt-1">
                          "{activeConcernNotification.reason}"
                        </p>
                      </div>

                      {activeConcernNotification.doctorNote && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold">Medical Certificate Attached & Authenticated</span>
                            <p className="text-[10px] text-emerald-700">Issued by St. Jude Medical Clinic · Dr. M. Santos, MD</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600">
                        <span><strong>Guardian:</strong> {activeConcernNotification.guardianName}</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono">{activeConcernNotification.guardianPhone}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Instructor Response to Guardian */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Quick Advisory Message to Parent/Guardian:
                    </label>
                    <textarea
                      rows={2}
                      value={concernMessageText}
                      onChange={(e) => setConcernMessageText(e.target.value)}
                      placeholder="Type response to guardian..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00c0ef]"
                    />
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSaveToast(`Advisory message dispatched to ${activeConcernNotification.guardianPhone}!`);
                        }}
                        className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] cursor-pointer border border-slate-200 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3 text-slate-500" />
                        <span>Send SMS to Guardian</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Decision Actions */}
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('excuse_requests');
                        setActiveConcernNotification(null);
                      }}
                      className="py-2 px-3 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      Open Full Excuse Masterlist →
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setExcuseList((prev) =>
                            prev.map((e) =>
                              e.studentName === activeConcernNotification.studentName
                                ? { ...e, status: 'Rejected' }
                                : e
                            )
                          );
                          setSaveToast(`Excuse slip declined for ${activeConcernNotification.studentName}. Marked Unexcused.`);
                          setActiveConcernNotification(null);
                        }}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-bold cursor-pointer transition border border-rose-200"
                      >
                        ✗ Decline Slip
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setExcuseList((prev) =>
                            prev.map((e) =>
                              e.studentName === activeConcernNotification.studentName
                                ? { ...e, status: 'Approved' }
                                : e
                            )
                          );
                          setSaveToast(`✓ Medical excuse approved! Absence record for ${activeConcernNotification.studentName} updated to Excused.`);
                          setActiveConcernNotification(null);
                        }}
                        className="py-2 px-4 bg-[#00a65a] hover:bg-[#009551] text-white rounded font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Excuse Absence</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* CONCERN TYPE 2: Attendance Review */}
              {activeConcernNotification.type === 'attendance_review' && (
                <div className="space-y-4">
                  <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider block">Class Roster</span>
                        <h4 className="text-sm font-bold text-slate-900">{activeConcernNotification.className}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider block">Subject</span>
                        <span className="font-bold text-slate-800 text-xs">{activeConcernNotification.subjectName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded border border-emerald-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Present</span>
                        <span className="text-lg font-extrabold text-emerald-600">28</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-amber-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Late</span>
                        <span className="text-lg font-extrabold text-amber-600">0</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-rose-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Absent</span>
                        <span className="text-lg font-extrabold text-rose-600">1</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                      <strong>Pending Notice:</strong> Joshua Reyes was marked absent due to family bereavement. Session submitted for instructor clearance.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('attendance_logs');
                        setActiveConcernNotification(null);
                      }}
                      className="py-2 px-3 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      View All Attendance Logs →
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeConcernNotification.classId) {
                            setSelectedClassId(activeConcernNotification.classId);
                          }
                          if (activeConcernNotification.subjectId) {
                            setSelectedSubjectId(activeConcernNotification.subjectId);
                          }
                          setActiveTab('take_attendance');
                          setActiveConcernNotification(null);
                          setSaveToast(`Loaded attendance sheet for ${activeConcernNotification.className} (${activeConcernNotification.subjectName}).`);
                        }}
                        className="py-2 px-3 bg-[#00c0ef] hover:bg-[#00b0e9] text-white rounded font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Open & Edit Session Sheet</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSaveToast(`Attendance sheet for ${activeConcernNotification.className} verified & confirmed.`);
                          setActiveConcernNotification(null);
                        }}
                        className="py-2 px-4 bg-[#00a65a] hover:bg-[#009551] text-white rounded font-bold cursor-pointer transition shadow-xs flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark Verified</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CONCERN TYPE 3: Absence Alert */}
              {activeConcernNotification.type === 'absence_alert' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-rose-800 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Truancy Warning: {activeConcernNotification.consecutiveAbsences || 3} Consecutive Unexcused Absences</span>
                    </div>
                    <p className="text-[11px] text-slate-700">
                      Student <strong>{activeConcernNotification.studentName}</strong> ({activeConcernNotification.studentNumber}) from <strong>{activeConcernNotification.className}</strong> has missed 3 consecutive class sessions without submitting an excuse letter.
                    </p>
                    <div className="p-2 bg-white rounded border border-rose-200 text-[11px] text-slate-700 flex items-center justify-between">
                      <span><strong>Parent/Guardian:</strong> {activeConcernNotification.guardianName}</span>
                      <span className="font-mono text-slate-900 font-semibold">{activeConcernNotification.guardianPhone}</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Urgent Advisory SMS to Parent:
                    </label>
                    <textarea
                      rows={2}
                      value={concernMessageText}
                      onChange={(e) => setConcernMessageText(e.target.value)}
                      placeholder="Type urgent note to parent..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSaveToast(`Urgent absence warning dispatched to ${activeConcernNotification.guardianPhone}!`);
                        }}
                        className="py-1 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px] cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Dispatch SMS Advisory</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(activeConcernNotification.studentName || '');
                        setActiveTab('all_students');
                        setActiveConcernNotification(null);
                      }}
                      className="py-2 px-3 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      View Student Profile in Masterlist →
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSaveToast(`Intervention referral submitted to Guidance Office for ${activeConcernNotification.studentName}.`);
                        setActiveConcernNotification(null);
                      }}
                      className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Log Guidance Intervention Referral</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveConcernNotification(null)}
                className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-xs cursor-pointer transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Supabase Cloud Database Management Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onDataRefreshed={() => {
          setClasses(getClasses());
          setSubjects(getSubjects());
          setStudents(getStudents());
          setAttendanceRecords(getAttendanceRecords());
        }}
      />

    </div>
  );
}
