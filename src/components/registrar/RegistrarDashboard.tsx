import React, { useState, useMemo, useEffect } from 'react';
import { User, Student, ClassItem, SubjectItem, AttendanceRecord } from '../../types';
import { 
  getStudents, 
  getClasses, 
  getSubjects, 
  getAttendanceRecords,
  saveStudent,
  deleteStudent,
  getAcademyInfo
} from '../../storage';
import { 
  LayoutDashboard, 
  Users, 
  School, 
  FileCheck2, 
  FileText, 
  TrendingUp, 
  UploadCloud, 
  Settings, 
  LogOut, 
  Search, 
  MoreHorizontal, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Menu, 
  X, 
  ChevronRight,
  ChevronLeft,
  Plus,
  Filter,
  UserCheck,
  Building2,
  Calendar,
  Layers,
  Award,
  BookOpen,
  Mail,
  Phone,
  IdCard,
  Database,
  ArrowRight
} from 'lucide-react';
import { getUsers } from '../../storage';
import { StudentManagement } from './StudentManagement';
import { ClassSubjectManagement } from './ClassSubjectManagement';
import { AttendanceLogs } from './AttendanceLogs';
import { AttendanceReports } from './AttendanceReports';
import { RegistrarSettings } from './RegistrarSettings';
import { InstructorManagement } from './InstructorManagement';
import { SupabaseModal } from '../SupabaseModal';

interface RegistrarDashboardProps {
  currentUser: User;
  onLogout?: () => void;
  onResetData?: () => void;
}

type SidebarTab = 'dashboard' | 'students' | 'classes' | 'instructors' | 'attendance' | 'reports' | 'uploads' | 'settings';

export function RegistrarDashboard({ currentUser, onLogout, onResetData }: RegistrarDashboardProps) {
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Pending' | 'Inactive'>('ALL');
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [academyInfo, setAcademyInfo] = useState(() => getAcademyInfo());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setAcademyInfo(e.detail);
      } else {
        setAcademyInfo(getAcademyInfo());
      }
    };
    window.addEventListener('academy-info-updated', handleUpdate);
    return () => window.removeEventListener('academy-info-updated', handleUpdate);
  }, []);

  const handleExecuteLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      if (onLogout) {
        onLogout();
      }
    }, 300);
  };

  // Storage refresh trigger
  const [dataVersion, setDataVersion] = useState(0);
  const handleDataChanged = () => setDataVersion((v) => v + 1);

  // Active student action menu
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);

  // Quick batch upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  // Load live data from storage
  const students = useMemo(() => getStudents(), [dataVersion]);
  const classes = useMemo(() => getClasses(), [dataVersion]);
  const subjects = useMemo(() => getSubjects(), [dataVersion]);
  const records = useMemo(() => getAttendanceRecords(), [dataVersion]);
  const users = useMemo(() => getUsers(), [dataVersion]);

  // Executive summary calculations
  const summaryMetrics = useMemo(() => {
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    let totalEntries = 0;

    records.forEach((rec) => {
      rec.entries.forEach((entry) => {
        totalEntries++;
        if (entry.status === 'present') totalPresent++;
        else if (entry.status === 'late') totalLate++;
        else if (entry.status === 'absent') totalAbsent++;
      });
    });

    const averageRate = totalEntries > 0 
      ? Math.round(((totalPresent + totalLate * 0.5) / totalEntries) * 100) 
      : 96;

    return {
      totalStudents: students.length,
      totalClasses: classes.length,
      totalSubjects: subjects.length,
      totalRecords: records.length,
      averageRate,
      activeStudentsCount: students.filter((s) => s.status === 'Active').length,
    };
  }, [students, classes, subjects, records]);

  // Filtered students for bottom data table
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ? true : student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  // Toggle student status directly
  const handleToggleStatus = (student: Student, newStatus: 'Active' | 'Inactive' | 'Transferred') => {
    const updated: Student = {
      ...student,
      status: newStatus,
    };
    saveStudent(updated);
    handleDataChanged();
    setActiveActionMenuId(null);
  };

  // Quick batch upload simulator
  const handleSimulateBatchUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadText.trim()) {
      setUploadFeedback('Please enter or paste student names or records.');
      return;
    }

    const lines = uploadText.split('\n').filter((l) => l.trim().length > 0);
    const targetClassId = classes[0]?.id || 'cls-1';

    let addedCount = 0;
    lines.forEach((line, index) => {
      const parts = line.split(',').map((p) => p.trim());
      const first = parts[0] || `Student_${Date.now()}`;
      const last = parts[1] || `Batch_${index + 1}`;
      const num = `STD-2026-${Math.floor(100 + Math.random() * 900)}`;

      saveStudent({
        id: `std-batch-${Date.now()}-${index}`,
        studentNumber: num,
        firstName: first,
        lastName: last,
        gender: 'Female',
        classId: targetClassId,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@student.oakridge.edu`,
        guardianName: 'Guardian Records',
        guardianPhone: '09170001122',
        status: 'Active',
        enrollmentDate: new Date().toISOString().split('T')[0],
      });
      addedCount++;
    });

    handleDataChanged();
    setUploadFeedback(`Successfully imported ${addedCount} student record(s)!`);
    setTimeout(() => {
      setIsUploadModalOpen(false);
      setUploadFeedback(null);
      setUploadText('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050a12] text-slate-100 flex flex-col md:flex-row relative selection:bg-[#1cd4bc] selection:text-black">
      
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (Inspired by Affiliate Partnership Sidebar, Collapsible) */}
      {/* ========================================================================= */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-40 h-screen bg-[#060c16] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 w-64 p-5' : '-translate-x-full md:translate-x-0'
        } ${
          isSidebarCollapsed ? 'md:w-20 md:p-3' : 'md:w-64 md:p-5'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className={`flex items-center mb-8 ${isSidebarCollapsed ? 'justify-center flex-col gap-2 px-1' : 'justify-between px-2'}`}>
            <div className="flex items-center gap-3 min-w-0">
              {/* Cyan Geometric Shape Logo */}
              <div 
                onClick={() => {
                  if (isSidebarCollapsed) {
                    setIsSidebarCollapsed(false);
                  } else {
                    setActiveSidebarTab('settings');
                  }
                }}
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1cd4bc] via-[#0ea5e9] to-[#38bdf8] flex items-center justify-center text-[#050a12] shadow-[0_0_20px_rgba(28,212,188,0.4)] cursor-pointer shrink-0 transition hover:scale-105"
                title={isSidebarCollapsed ? "Click to expand sidebar" : "Academic Registrar Portal - Click to view Academy Settings"}
              >
                <School className="w-5 h-5 stroke-[2.4]" />
              </div>
              
              {!isSidebarCollapsed && (
                <div 
                  onClick={() => setActiveSidebarTab('settings')}
                  className="overflow-hidden transition-all duration-200 min-w-0 cursor-pointer group"
                  title="Click to view & edit Academy Information"
                >
                  <span className="font-bold text-sm tracking-wider text-white block uppercase leading-tight truncate group-hover:text-[#1cd4bc] transition-colors">
                    {academyInfo.code ? `${academyInfo.code} REGISTRY` : 'ACADEMIC REGISTRY'}
                  </span>
                  <span className="text-[10px] tracking-[0.1em] text-[#1cd4bc] font-semibold block uppercase truncate">
                    {academyInfo.name}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse / Expand Toggle Button on Sidebar Header */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-[#1cd4bc]" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu Links */}
          <nav className="space-y-1.5 text-xs font-medium">
            
            {/* Dashboard Link (Active Teal Pill in inspo) */}
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('dashboard');
                setMobileMenuOpen(false);
              }}
              title="Dashboard"
              className={`w-full flex items-center rounded-2xl transition cursor-pointer text-left font-semibold ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } ${
                activeSidebarTab === 'dashboard'
                  ? 'bg-[#1cd4bc] text-[#050c16] shadow-[0_0_20px_rgba(28,212,188,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm">Dashboard</span>}
            </button>

            {/* Students Link */}
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('students');
                setMobileMenuOpen(false);
              }}
              title={`Students (${students.length})`}
              className={`w-full flex items-center rounded-2xl transition cursor-pointer text-left ${
                isSidebarCollapsed ? 'justify-center p-3 relative' : 'gap-3 px-4 py-3'
              } ${
                activeSidebarTab === 'students'
                  ? 'bg-[#1cd4bc] text-[#050c16] font-semibold shadow-[0_0_20px_rgba(28,212,188,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span>Students</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {students.length}
                  </span>
                </>
              )}
              {isSidebarCollapsed && (
                <span className="w-2 h-2 rounded-full bg-[#1cd4bc] absolute top-2 right-2 ring-1 ring-[#050a12]" />
              )}
            </button>

            {/* Classes Link */}
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('classes');
                setMobileMenuOpen(false);
              }}
              title={`Classes (${classes.length})`}
              className={`w-full flex items-center rounded-2xl transition cursor-pointer text-left ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } ${
                activeSidebarTab === 'classes'
                  ? 'bg-[#1cd4bc] text-[#050c16] font-semibold shadow-[0_0_20px_rgba(28,212,188,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span>Classes</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {classes.length}
                  </span>
                </>
              )}
            </button>

            {/* Instructors & Faculty Link */}
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('instructors');
                setMobileMenuOpen(false);
              }}
              title={`Instructors & Faculty (${users.length})`}
              className={`w-full flex items-center rounded-2xl transition cursor-pointer text-left ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } ${
                activeSidebarTab === 'instructors'
                  ? 'bg-[#1cd4bc] text-[#050c16] font-semibold shadow-[0_0_20px_rgba(28,212,188,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <School className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span>Instructors</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {users.length}
                  </span>
                </>
              )}
            </button>

            {/* Attendance Link */}
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('attendance');
                setMobileMenuOpen(false);
              }}
              title="Attendance Audit"
              className={`w-full flex items-center rounded-2xl transition cursor-pointer text-left ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } ${
                activeSidebarTab === 'attendance'
                  ? 'bg-[#1cd4bc] text-[#050c16] font-semibold shadow-[0_0_20px_rgba(28,212,188,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <FileCheck2 className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Attendance</span>}
            </button>

            {/* Performance / Reports */}
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('reports');
                setMobileMenuOpen(false);
              }}
              title="Performance & Reports"
              className={`w-full flex items-center rounded-2xl transition cursor-pointer text-left ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } ${
                activeSidebarTab === 'reports'
                  ? 'bg-[#1cd4bc] text-[#050c16] font-semibold shadow-[0_0_20px_rgba(28,212,188,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Performance</span>}
            </button>

            {/* Uploads (Batch CSV Importer) */}
            <button
              type="button"
              onClick={() => {
                setIsUploadModalOpen(true);
                setMobileMenuOpen(false);
              }}
              title="Batch CSV Uploads"
              className={`w-full flex items-center rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900/60 transition cursor-pointer text-left ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              }`}
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Uploads</span>}
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('settings');
                setMobileMenuOpen(false);
              }}
              title="System & Account Settings"
              className={`w-full flex items-center rounded-2xl transition cursor-pointer text-left ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } ${
                activeSidebarTab === 'settings'
                  ? 'bg-[#1cd4bc] text-[#050c16] font-semibold shadow-[0_0_20px_rgba(28,212,188,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Settings</span>}
            </button>
          </nav>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050a12]">
        
        {/* TOP BAR: Search & Profile Matching Inspo */}
        <header className="h-20 px-6 sm:px-8 flex items-center justify-between border-b border-slate-800/60 bg-[#050a12]/80 backdrop-blur-md sticky top-0 z-20">
          
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-2 rounded-xl bg-[#0b1220] border border-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Pill Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students, student ID, email..."
                className="w-48 sm:w-80 pl-10 pr-8 py-2.5 text-xs bg-[#0b1220] border border-slate-800/90 rounded-full text-white placeholder:text-slate-500 focus:outline-none focus:border-[#1cd4bc] focus:ring-1 focus:ring-[#1cd4bc] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white p-0.5 rounded-full cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Header Controls: User Pill */}
          <div className="flex items-center gap-3">
            {/* Admin User Profile Pill (Displays user information modal on tap, independent of settings) */}
            <button
              type="button"
              onClick={() => setShowUserInfoModal(true)}
              title="View User Information"
              className="flex items-center gap-3 bg-[#0b1220] border border-slate-800 hover:border-[#1cd4bc]/50 transition rounded-full py-1 pl-1.5 pr-4 shadow-sm cursor-pointer group text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1cd4bc] to-blue-600 flex items-center justify-center text-[#050a12] font-bold text-xs shadow-inner group-hover:scale-105 transition-transform">
                {currentUser.fullName[0] || 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-white leading-tight group-hover:text-[#1cd4bc] transition-colors">
                  {currentUser.fullName.split(' ')[0] || 'Admin'} Users
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  {currentUser.email || 'admin@affstarter.com'}
                </div>
              </div>
            </button>
          </div>

        </header>

        {/* VIEW 1: THE INSPIRATION ADMIN DASHBOARD VIEW */}
        {activeSidebarTab === 'dashboard' && (
          <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            
            {/* ========================================================================= */}
            {/* 3. THE 4 GRADIENT TOP METRIC CARDS (Fully Clickable & Functional) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Teal / Cyan Gradient (Total Students) */}
              <div 
                role="button"
                tabIndex={0}
                onClick={() => setActiveSidebarTab('students')}
                title="Click to view full student directory"
                className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#17c2b5] via-[#14b2a6] to-[#0ea5e9] text-white shadow-[0_10px_25px_rgba(20,178,166,0.3)] hover:shadow-[0_15px_30px_rgba(20,178,166,0.45)] overflow-hidden flex flex-col justify-between min-h-[140px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/90">
                      Total Students
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-white/30 flex items-center justify-center transition">
                    <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div>
                  <div className="flex items-end justify-between mt-4">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {summaryMetrics.totalStudents}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-bold block">+2.0%</span>
                      <span className="text-[10px] text-white/80 block">Last month</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/90 font-medium block mt-1.5 opacity-90 group-hover:opacity-100">
                    Open Student Directory →
                  </span>
                </div>
              </div>

              {/* Card 2: Purple / Indigo Gradient (Active Classes) */}
              <div 
                role="button"
                tabIndex={0}
                onClick={() => setActiveSidebarTab('classes')}
                title="Click to manage classes and subjects"
                className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#6b46c1] via-[#5b21b6] to-[#4c1d95] text-white shadow-[0_10px_25px_rgba(107,70,193,0.3)] hover:shadow-[0_15px_30px_rgba(107,70,193,0.45)] overflow-hidden flex flex-col justify-between min-h-[140px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/90">
                      Active Classes
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-white/30 flex items-center justify-center transition">
                    <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div>
                  <div className="flex items-end justify-between mt-4">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {summaryMetrics.totalClasses}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-bold block">+1.0%</span>
                      <span className="text-[10px] text-white/80 block">Last month</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/90 font-medium block mt-1.5 opacity-90 group-hover:opacity-100">
                    Manage Class Sections →
                  </span>
                </div>
              </div>

              {/* Card 3: Orange / Coral Gradient (Attendance Sessions) */}
              <div 
                role="button"
                tabIndex={0}
                onClick={() => setActiveSidebarTab('attendance')}
                title="Click to inspect daily attendance logs"
                className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#f59e0b] text-white shadow-[0_10px_25px_rgba(234,88,12,0.3)] hover:shadow-[0_15px_30px_rgba(234,88,12,0.45)] overflow-hidden flex flex-col justify-between min-h-[140px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <FileCheck2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/90">
                      Attendance Sessions
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-white/30 flex items-center justify-center transition">
                    <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div>
                  <div className="flex items-end justify-between mt-4">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {summaryMetrics.totalRecords}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-bold block">+4.0%</span>
                      <span className="text-[10px] text-white/80 block">Last month</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/90 font-medium block mt-1.5 opacity-90 group-hover:opacity-100">
                    Audit Attendance Logs →
                  </span>
                </div>
              </div>

              {/* Card 4: Magenta / Rose Gradient (Average Attendance Rate) */}
              <div 
                role="button"
                tabIndex={0}
                onClick={() => setActiveSidebarTab('reports')}
                title="Click to view attendance reports and analytics"
                className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#db2777] via-[#e11d48] to-[#be185d] text-white shadow-[0_10px_25px_rgba(219,39,119,0.3)] hover:shadow-[0_15px_30px_rgba(219,39,119,0.45)] overflow-hidden flex flex-col justify-between min-h-[140px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/90">
                      Attendance Rate
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-white/30 flex items-center justify-center transition">
                    <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div>
                  <div className="flex items-end justify-between mt-4">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {summaryMetrics.averageRate}%
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-bold block">+12%</span>
                      <span className="text-[10px] text-white/80 block">Last month</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/90 font-medium block mt-1.5 opacity-90 group-hover:opacity-100">
                    Generate Reports →
                  </span>
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* 4. THE 3 BENTO SUMMARY CARDS (Interactive rows & links) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Card 1: Recent Students */}
              <div className="bg-[#0b1220]/90 border border-slate-800/80 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">
                      Recent Students
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveSidebarTab('students')}
                      className="text-xs text-[#1cd4bc] hover:underline font-semibold cursor-pointer"
                    >
                      View All ({students.length}) →
                    </button>
                  </div>

                  <div className="space-y-2">
                    {students.slice(0, 4).map((student) => (
                      <div 
                        key={student.id} 
                        onClick={() => setSelectedStudentDetail(student)}
                        title="Click to view student details"
                        className="flex items-center justify-between text-xs p-2 rounded-2xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/60 transition cursor-pointer group"
                      >
                        <div>
                          <span className="font-semibold text-slate-200 group-hover:text-white block">
                            {student.lastName}, {student.firstName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {student.studentNumber}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1.5 bg-[#063327] text-[#34d399] border border-[#059669]/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                          <span>{student.status}</span>
                        </span>
                      </div>
                    ))}
                    {students.length === 0 && (
                      <div className="text-slate-500 text-xs py-3 text-center">No students registered yet.</div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSidebarTab('students')}
                  className="w-full mt-4 py-2 rounded-2xl bg-slate-800/70 hover:bg-[#1cd4bc] hover:text-[#050c16] text-slate-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700/60 hover:border-transparent"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enroll New Student</span>
                </button>
              </div>

              {/* Card 2: Recent Classes */}
              <div className="bg-[#0b1220]/90 border border-slate-800/80 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">
                      Active Classes
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveSidebarTab('classes')}
                      className="text-xs text-[#1cd4bc] hover:underline font-semibold cursor-pointer"
                    >
                      Manage All ({classes.length}) →
                    </button>
                  </div>

                  <div className="space-y-2">
                    {classes.slice(0, 4).map((cls) => (
                      <div 
                        key={cls.id} 
                        onClick={() => setActiveSidebarTab('classes')}
                        title="Click to manage this class"
                        className="flex items-center justify-between text-xs p-2 rounded-2xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/60 transition cursor-pointer group"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-semibold text-slate-200 group-hover:text-white truncate block">
                            {cls.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            Adviser: {cls.adviser}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1.5 bg-[#063327] text-[#34d399] border border-[#059669]/40 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                          <span>Active</span>
                        </span>
                      </div>
                    ))}
                    {classes.length === 0 && (
                      <div className="text-slate-500 text-xs py-3 text-center">No classes created yet.</div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSidebarTab('classes')}
                  className="w-full mt-4 py-2 rounded-2xl bg-slate-800/70 hover:bg-[#1cd4bc] hover:text-[#050c16] text-slate-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700/60 hover:border-transparent"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>View All Class Rosters</span>
                </button>
              </div>

              {/* Card 3: Recent Uploads */}
              <div className="bg-[#0b1220]/90 border border-slate-800/80 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">
                      Recent Uploads
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="text-xs text-[#1cd4bc] hover:underline font-semibold cursor-pointer"
                    >
                      + New Upload
                    </button>
                  </div>

                  <div className="space-y-2">
                    {records.slice(0, 4).map((rec, idx) => {
                      const isValidated = idx % 2 === 0;
                      return (
                        <div 
                          key={`${rec.id}-${idx}`} 
                          onClick={() => setActiveSidebarTab('attendance')}
                          title="Click to view attendance record"
                          className="flex items-center justify-between text-xs p-2 rounded-2xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/60 transition cursor-pointer group"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-slate-200 group-hover:text-white truncate block">
                              {rec.subjectName} Log
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              Date: {rec.date}
                            </span>
                          </div>
                          {isValidated ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1.5 bg-[#063327] text-[#34d399] border border-[#059669]/40 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                              <span>Validated</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1.5 bg-[#3a2807] text-[#fbbf24] border border-[#d97706]/40 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
                              <span>Pending</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {records.length === 0 && (
                      <div className="text-slate-500 text-xs py-3 text-center">No audit records uploaded.</div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="w-full mt-4 py-2 rounded-2xl bg-slate-800/70 hover:bg-[#1cd4bc] hover:text-[#050c16] text-slate-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700/60 hover:border-transparent"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Batch CSV Importer</span>
                </button>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* 5. MAIN DATA TABLE (Exact Match to Bottom of Inspo) */}
            {/* ========================================================================= */}
            <div className="bg-[#0b1220]/90 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative">
              
              {/* Table Toolbar: Filter by status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Institutional Student Records
                  </h3>
                  <p className="text-xs text-slate-400">
                    Showing {filteredStudents.length} of {students.length} enrolled student records · Click any row to view profile
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Filter:</span>
                  {(['ALL', 'Active', 'Pending', 'Inactive'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1 rounded-full text-xs transition cursor-pointer ${
                        statusFilter === filter
                          ? 'bg-[#1cd4bc] text-[#050c16] font-bold shadow-[0_0_12px_rgba(28,212,188,0.3)]'
                          : 'bg-[#060c16] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800/90 text-[11px] tracking-wider">
                      <th className="py-3 px-3 font-medium">Student Name</th>
                      <th className="py-3 px-3 font-medium">Adviser</th>
                      <th className="py-3 px-3 font-medium">Email</th>
                      <th className="py-3 px-3 font-medium">Class Section</th>
                      <th className="py-3 px-3 font-medium">Status</th>
                      <th className="py-3 px-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredStudents.map((student) => {
                      const cls = classes.find((c) => c.id === student.classId);

                      return (
                        <tr 
                          key={student.id}
                          onClick={() => setSelectedStudentDetail(student)}
                          title="Click to inspect student profile details"
                          className="hover:bg-slate-800/50 transition text-slate-300 group cursor-pointer"
                        >
                          {/* Student Name */}
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-white group-hover:text-[#1cd4bc] transition-colors">
                              {student.lastName}, {student.firstName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {student.studentNumber}
                            </div>
                          </td>

                          {/* Adviser */}
                          <td className="py-3.5 px-3 text-slate-300">
                            {cls?.adviser || 'Prof. Faculty'}
                          </td>

                          {/* Email */}
                          <td className="py-3.5 px-3 text-slate-400 font-mono">
                            {student.email}
                          </td>

                          {/* Class / Section */}
                          <td className="py-3.5 px-3 text-slate-300">
                            {cls?.name || 'Unassigned'}
                          </td>

                          {/* Status Pill matching the inspo pills */}
                          <td className="py-3.5 px-3">
                            {student.status === 'Active' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#063327] text-[#34d399] border border-[#059669]/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                                <span>Active</span>
                              </span>
                            )}
                            {student.status === 'Inactive' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#1e293b] text-slate-400 border border-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                <span>In Active</span>
                              </span>
                            )}
                            {student.status === 'Transferred' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#3a2807] text-[#fbbf24] border border-[#d97706]/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>

                          {/* Actions: `•••` matching inspo */}
                          <td 
                            className="py-3.5 px-3 text-right relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenuId(activeActionMenuId === student.id ? null : student.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                              title="More options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeActionMenuId === student.id && (
                              <div 
                                className="absolute right-3 top-10 z-30 w-44 bg-[#070e1b] border border-slate-700 rounded-2xl p-1.5 shadow-2xl text-left text-xs animate-in fade-in duration-150"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentDetail(student);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                                >
                                  View Full Info
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(student, student.status === 'Active' ? 'Inactive' : 'Active')}
                                  className="w-full text-left px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                                >
                                  Mark as {student.status === 'Active' ? 'Inactive' : 'Active'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSidebarTab('students');
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-xl text-[#1cd4bc] hover:bg-slate-800 transition cursor-pointer"
                                >
                                  Open in Manager →
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          No students found matching current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </main>
        )}

        {/* VIEW 2: FULL STUDENT MANAGEMENT (Dark Styled Container) */}
        {activeSidebarTab === 'students' && (
          <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Student Enrollment Registry</h2>
                <p className="text-xs text-slate-400">Complete registrar editing and roster controls</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSidebarTab('dashboard')}
                className="px-3.5 py-1.5 rounded-xl text-xs bg-[#0b1220] border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="bg-[#0b1220]/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <StudentManagement classes={classes} onDataChanged={handleDataChanged} />
            </div>
          </div>
        )}

        {/* VIEW 3: FULL CLASS & SUBJECT MANAGEMENT */}
        {activeSidebarTab === 'classes' && (
          <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Classes, Sections &amp; Subjects</h2>
                <p className="text-xs text-slate-400">Manage curriculum units and classroom advisories</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSidebarTab('dashboard')}
                className="px-3.5 py-1.5 rounded-xl text-xs bg-[#0b1220] border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="bg-[#0b1220]/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <ClassSubjectManagement onDataChanged={handleDataChanged} />
            </div>
          </div>
        )}

        {/* VIEW 3.5: INSTRUCTOR & FACULTY MANAGEMENT */}
        {activeSidebarTab === 'instructors' && (
          <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Faculty &amp; Teaching Staff</h2>
                <p className="text-xs text-slate-400">Complete administrator management for instructor accounts and credentials</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSidebarTab('dashboard')}
                className="px-3.5 py-1.5 rounded-xl text-xs bg-[#0b1220] border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="bg-[#0b1220]/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <InstructorManagement onDataChanged={handleDataChanged} />
            </div>
          </div>
        )}

        {/* VIEW 4: ATTENDANCE LOGS */}
        {activeSidebarTab === 'attendance' && (
          <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Attendance Audit Logs</h2>
                <p className="text-xs text-slate-400">Review and audit daily submitted attendance records</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSidebarTab('dashboard')}
                className="px-3.5 py-1.5 rounded-xl text-xs bg-[#0b1220] border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="bg-[#0b1220]/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <AttendanceLogs />
            </div>
          </div>
        )}

        {/* VIEW 5: REPORTS */}
        {activeSidebarTab === 'reports' && (
          <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Official Reports &amp; Analytics</h2>
                <p className="text-xs text-slate-400">Generate, audit, and print institutional attendance sheets</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSidebarTab('dashboard')}
                className="px-3.5 py-1.5 rounded-xl text-xs bg-[#0b1220] border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="bg-[#0b1220]/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <AttendanceReports currentUser={currentUser} />
            </div>
          </div>
        )}

        {/* VIEW 6: SETTINGS & ACCOUNT MANAGEMENT (WITH DEDICATED LOGOUT SECTION) */}
        {activeSidebarTab === 'settings' && (
          <RegistrarSettings 
            currentUser={currentUser}
            onLogout={onLogout}
            onResetData={onResetData}
            onBackToDashboard={() => setActiveSidebarTab('dashboard')}
          />
        )}

      </div>

      {/* ========================================================================= */}
      {/* 6. STUDENT DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b1220] border border-slate-700 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedStudentDetail(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1cd4bc]/20 text-[#1cd4bc] flex items-center justify-center font-bold text-base border border-[#1cd4bc]/30">
                {selectedStudentDetail.firstName[0]}{selectedStudentDetail.lastName[0]}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedStudentDetail.firstName} {selectedStudentDetail.lastName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{selectedStudentDetail.studentNumber}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-800/60">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-white font-mono">{selectedStudentDetail.email}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Class:</span>
                <span className="text-white">
                  {classes.find((c) => c.id === selectedStudentDetail.classId)?.name || 'N/A'}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Guardian Contact:</span>
                <span className="text-white">{selectedStudentDetail.guardianName} ({selectedStudentDetail.guardianPhone})</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Enrollment Date:</span>
                <span className="text-white">{selectedStudentDetail.enrollmentDate}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-[#34d399] font-bold">{selectedStudentDetail.status}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. UPLOAD BATCH MODAL (Uploads tab in Inspo) */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0b1220] border border-[#1cd4bc]/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#1cd4bc]/20 text-[#1cd4bc] flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Batch Student Importer</h3>
                <p className="text-xs text-slate-400">Paste student names (FirstName, LastName per line)</p>
              </div>
            </div>

            <form onSubmit={handleSimulateBatchUpload} className="space-y-4">
              <textarea
                rows={5}
                required
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                placeholder={"Sophia, Cruz\nMateo, Garcia\nIsabella, Reyes"}
                className="w-full p-3 bg-[#060c16] border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#1cd4bc] font-mono"
              />

              {uploadFeedback && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300">
                  {uploadFeedback}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-[#050c16] bg-[#1cd4bc] hover:bg-[#14b2a6] shadow-lg shadow-[#1cd4bc]/20 transition cursor-pointer"
                >
                  Import Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DEDICATED USER INFORMATION MODAL (Independent of settings) */}
      {/* ========================================================================= */}
      {showUserInfoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowUserInfoModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-[#0b1220] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setShowUserInfoModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
              title="Close User Info"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1cd4bc] to-blue-600 flex items-center justify-center text-[#050a12] font-black text-2xl shadow-lg shadow-[#1cd4bc]/20">
                  {currentUser.fullName[0] || 'A'}
                </div>
                <div 
                  className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0b1220] absolute -bottom-1 -right-1" 
                  title="Active Session"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-white tracking-tight truncate">
                    {currentUser.fullName}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1cd4bc]/10 text-[#1cd4bc] border border-[#1cd4bc]/30">
                    Registrar Admin
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-0.5">
                  {currentUser.title || 'Head Registrar & Academic Officer'}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-1">
                  <span>@{currentUser.username}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Authorized Administrator
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed User Information Grid */}
            <div className="py-5 space-y-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                User Details &amp; Institutional Credentials
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Email Address */}
                <div className="p-3.5 rounded-2xl bg-[#060c16] border border-slate-800 flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#1cd4bc] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Email Address
                    </span>
                    <span className="font-semibold text-white break-all">
                      {currentUser.email}
                    </span>
                  </div>
                </div>

                {/* Mobile Contact Number */}
                <div className="p-3.5 rounded-2xl bg-[#060c16] border border-slate-800 flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#1cd4bc] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Mobile Number
                    </span>
                    <span className="font-semibold text-white">
                      {currentUser.mobileNumber || '0917-888-2940'}
                    </span>
                  </div>
                </div>

                {/* Office / Department */}
                <div className="p-3.5 rounded-2xl bg-[#060c16] border border-slate-800 flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-[#1cd4bc] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Office / Department
                    </span>
                    <span className="font-semibold text-white">
                      {currentUser.department || "Registrar's Office"}
                    </span>
                  </div>
                </div>

                {/* Staff / Admin ID */}
                <div className="p-3.5 rounded-2xl bg-[#060c16] border border-slate-800 flex items-start gap-3">
                  <IdCard className="w-4 h-4 text-[#1cd4bc] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Employee ID
                    </span>
                    <span className="font-mono font-bold text-white">
                      REG-2025-001
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Security Verification Status */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px]">
                  Highest Tier Security Clearance • Full Academic Enrollment &amp; Attendance Records Control
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowUserInfoModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-[#050c16] bg-[#1cd4bc] hover:bg-[#14b2a6] shadow-sm transition cursor-pointer shrink-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Logout Modal (Triggered by Sidebar Log Out) */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b1220] border border-red-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-center">
            
            <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
              <LogOut className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Sign Out of Academic Registrar?
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to log out? Your session will end and you will be returned directly to the institutional Login Page.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowConfirmLogout(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleExecuteLogout}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-900/40 border border-red-500/50 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Yes, Log Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SUPABASE CLOUD MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onDataRefreshed={handleDataChanged}
      />

    </div>
  );
}
