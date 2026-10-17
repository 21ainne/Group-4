import React, { useState, useEffect } from 'react';
import { User, AcademyInfo } from '../../types';
import { 
  getAcademyInfo, 
  saveAcademyInfo, 
  DEFAULT_ACADEMY_INFO 
} from '../../storage';
import { 
  LogOut, 
  Settings, 
  ShieldCheck, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Lock, 
  Database,
  School,
  Clock,
  ExternalLink,
  Edit3,
  Save,
  X,
  MapPin,
  Award,
  Check
} from 'lucide-react';

interface RegistrarSettingsProps {
  currentUser: User;
  onLogout?: () => void;
  onResetData?: () => void;
  onBackToDashboard?: () => void;
}

export function RegistrarSettings({ 
  currentUser, 
  onLogout, 
  onResetData, 
  onBackToDashboard 
}: RegistrarSettingsProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Academy Information state & edit form
  const [academyInfo, setAcademyInfo] = useState<AcademyInfo>(() => getAcademyInfo());
  const [isEditingAcademy, setIsEditingAcademy] = useState(false);
  const [editForm, setEditForm] = useState<AcademyInfo>(() => getAcademyInfo());
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  // Sync when event dispatched
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

  const handleOpenEditModal = () => {
    setEditForm({ ...academyInfo });
    setIsEditingAcademy(true);
  };

  const handleSaveAcademyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      alert('Institution Name cannot be empty.');
      return;
    }
    saveAcademyInfo(editForm);
    setAcademyInfo(editForm);
    setIsEditingAcademy(false);
    setSaveSuccessToast('Academy Information has been updated successfully!');
    setTimeout(() => {
      setSaveSuccessToast(null);
    }, 3500);
  };

  const handleResetAcademyDefaults = () => {
    if (window.confirm('Restore standard Christy Jean Academy information defaults?')) {
      setEditForm({ ...DEFAULT_ACADEMY_INFO });
    }
  };

  const handleExecuteLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      if (onLogout) {
        onLogout();
      }
    }, 300);
  };

  return (
    <div className="flex-1 p-6 sm:p-8 max-w-5xl w-full mx-auto animate-in fade-in duration-300 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#1cd4bc] font-semibold mb-1 uppercase tracking-wider">
            <Settings className="w-3.5 h-3.5" />
            <span>Academic Portal Configuration</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Settings &amp; Account Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your registrar credentials and institutional system preferences.
          </p>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold bg-[#0b1220] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. ADMINISTRATOR PROFILE & ACTIVE SESSION */}
      {/* ========================================================================= */}
      <section className="bg-[#0b1220]/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#1cd4bc]/15 border border-[#1cd4bc]/30 text-[#1cd4bc] flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Administrator Profile &amp; Session
            </h2>
            <p className="text-xs text-slate-400">
              Authenticated registrar credentials and security status
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#070d18]/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Authenticated Account</span>
            <div className="font-semibold text-white truncate flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-[#1cd4bc]" />
              <span>{currentUser.fullName}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Role: Registrar Administrator</span>
          </div>

          <div className="bg-[#070d18]/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Registered Email</span>
            <div className="font-mono text-slate-200 truncate flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentUser.email}</span>
            </div>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Verified Institutional ID</span>
          </div>

          <div className="bg-[#070d18]/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Office &amp; Department</span>
            <div className="font-medium text-slate-200 truncate flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentUser.department}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Campus Main Registry</span>
          </div>

          <div className="bg-[#070d18]/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Session Security</span>
            <div className="font-medium text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active &amp; Protected</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">S.Y. 2025-2026 Registry</span>
          </div>
        </div>
      </section>

      {/* Success Notification Banner */}
      {saveSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessToast(null)}
            className="text-emerald-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INSTITUTIONAL & SYSTEM PREFERENCES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Institutional Information Card */}
        <section className="bg-[#0b1220]/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1cd4bc]/15 text-[#1cd4bc] flex items-center justify-center shrink-0">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Academy Information</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#1cd4bc]/15 text-[#1cd4bc] border border-[#1cd4bc]/30">
                      {academyInfo.code || 'CJA'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Official institutional registry &amp; campus profile</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenEditModal}
                className="px-3 py-1.5 rounded-xl bg-[#1cd4bc]/15 hover:bg-[#1cd4bc] text-[#1cd4bc] hover:text-[#050c16] border border-[#1cd4bc]/30 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Edit Academy Information"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Info</span>
              </button>
            </div>

            <div className="space-y-3 text-xs divide-y divide-slate-800/60">
              <div className="pt-2 flex justify-between items-start gap-4">
                <span className="text-slate-400 shrink-0">Institution Name</span>
                <span className="text-white font-bold text-right">{academyInfo.name}</span>
              </div>
              {academyInfo.tagline && (
                <div className="pt-2 flex justify-between items-start gap-4">
                  <span className="text-slate-400 shrink-0">Motto / Tagline</span>
                  <span className="text-slate-300 italic text-right">{academyInfo.tagline}</span>
                </div>
              )}
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400">Academic Term</span>
                <span className="text-[#1cd4bc] font-bold">{academyInfo.academicYear} ({academyInfo.semester})</span>
              </div>
              <div className="pt-2 flex justify-between items-start gap-4">
                <span className="text-slate-400 shrink-0">Campus Address</span>
                <span className="text-slate-300 text-right">{academyInfo.address}</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400">Official Contact</span>
                <span className="text-slate-200 font-mono text-[11px]">{academyInfo.contactNumber}</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400">Official Email</span>
                <span className="text-slate-200 font-mono text-[11px]">{academyInfo.email}</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400">School Principal</span>
                <span className="text-white font-medium">{academyInfo.principal}</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400">Accreditation ID</span>
                <span className="text-slate-300 font-mono text-[11px]">{academyInfo.accreditationNumber || 'DEPED-VERIFIED'}</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400">System Timezone</span>
                <span className="text-white">{academyInfo.systemTimezone}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Portal: {academyInfo.platformVersion}</span>
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="text-[#1cd4bc] hover:underline font-semibold cursor-pointer"
            >
              Modify Profile Details →
            </button>
          </div>
        </section>

        {/* Database & Demo Management Card */}
        <section className="bg-[#0b1220]/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Data Synchronization</h3>
                <p className="text-[11px] text-slate-400">Local database &amp; mock storage controller</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              All student profiles, class rosters, and attendance logs are saved locally. You can restore standard demo students, instructors, and classes back to factory defaults at any time.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">Reset System Data</span>
              <span className="text-[10px] text-slate-400 block">Restore sample students &amp; classes</span>
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* 3. LOG OUT / SESSION TERMINATION SECTION */}
      {/* ========================================================================= */}
      <section className="bg-[#0b1220]/90 border border-red-500/30 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Account Sign Out
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                  Session
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                End your active administrative session on this workstation and return to the institutional login portal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmLogout(true)}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500/40 shadow-lg shadow-red-900/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. EDIT ACADEMY INFORMATION MODAL */}
      {/* ========================================================================= */}
      {isEditingAcademy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0b1220] border border-[#1cd4bc]/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1cd4bc]/15 border border-[#1cd4bc]/30 text-[#1cd4bc] flex items-center justify-center shrink-0">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Edit Academy &amp; Institutional Profile
                  </h3>
                  <p className="text-xs text-slate-400">
                    Changes will dynamically update the portal, reports, and attendance records
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingAcademy(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleSaveAcademyInfo} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              
              {/* Row 1: Academy Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Institution Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="e.g. Christy Jean Academy"
                    style={{ color: '#ffffff', backgroundColor: '#060c16' }}
                    className="w-full p-2.5 bg-[#060c16] border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#1cd4bc] transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Institution Acronym / Code
                  </label>
                  <input
                    type="text"
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    placeholder="e.g. CJA"
                    style={{ color: '#ffffff', backgroundColor: '#060c16' }}
                    className="w-full p-2.5 bg-[#060c16] border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#1cd4bc] transition font-mono uppercase"
                  />
                </div>
              </div>

              {/* Row 2: Tagline / Motto */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Motto / Institutional Vision
                </label>
                <input
                  type="text"
                  value={editForm.tagline}
                  onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                  placeholder="e.g. Excellence in Academic Discipline & Character Formation"
                  style={{ color: '#ffffff', backgroundColor: '#060c16' }}
                  className="w-full p-2.5 bg-[#060c16] border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#1cd4bc] transition italic"
                />
              </div>

              {/* Row 3: Academic Year & Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={editForm.academicYear}
                    onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                    placeholder="e.g. 2025 - 2026"
                    style={{ color: '#ffffff', backgroundColor: '#060c16' }}
                    className="w-full p-2.5 bg-[#060c16] border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#1cd4bc] transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Current Term / Semester
                  </label>
                  <select
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                    style={{ color: '#ffffff', backgroundColor: '#060c16' }}
                    className="w-full p-2.5 bg-[#060c16] border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-[#1cd4bc] transition cursor-pointer [&>option]:bg-[#0b1220] [&>option]:text-white"
                  >
                    <option value="First Semester" style={{ color: '#ffffff', backgroundColor: '#0b1220' }}>First Semester</option>
                    <option value="Second Semester" style={{ color: '#ffffff', backgroundColor: '#0b1220' }}>Second Semester</option>
                    <option value="Summer Term" style={{ color: '#ffffff', backgroundColor: '#0b1220' }}>Summer Term</option>
                    <option value="Trimester 1" style={{ color: '#ffffff', backgroundColor: '#0b1220' }}>Trimester 1</option>
                    <option value="Trimester 2" style={{ color: '#ffffff', backgroundColor: '#0b1220' }}>Trimester 2</option>
                    <option value="Trimester 3" style={{ color: '#ffffff', backgroundColor: '#0b1220' }}>Trimester 3</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Campus Address */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Campus Physical Address
                </label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="e.g. Brgy. San Jose, Rodriguez (Montalban), Rizal, Philippines"
                  style={{ color: '#ffffff', backgroundColor: '#060c16' }}
                  className="w-full p-2.5 bg-[#060c16] border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#1cd4bc] transition"
                />
              </div>

              {/* Row 5: Contact Phone & Official Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Official Contact / Hotline
                  </label>
                  <input
                    type="text"
                    value={editForm.contactNumber}
                    onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                    placeholder="e.g. +63 (02) 8921-4820"
                    style={{ color: '#ffffff', backgroundColor: '#060c16' }}
                    className="w-full p-2.5 bg-[#060c16] border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#1cd4bc] transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Official Registrar Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="e.g. registrar@christyjeanacademy.edu.ph"
                    style={{ color: '#ffffff', backgroundColor: '#060c16' }}
                    className="w-full p-2.5 bg-[#060c16] border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#1cd4bc] transition font-mono"
                  />
                </div>
              </div>

              {/* Row 6: Principal & Registrar Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    School Principal / Director
                  </label>
                  <input
                    type="text"
                    value={editForm.principal}
                    onChange={(e) => setEditForm({ ...editForm, principal: e.target.value })}
                    placeholder="e.g. Dr. Maria Elena Santos, Ed.D"
                    style={{ color: '#ffffff', backgroundColor: '#060c16' }}
                    className="w-full p-2.5 bg-[#060c16] border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#1cd4bc] transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Registrar Office Designation
                  </label>
                  <input
                    type="text"
                    value={editForm.registrarName}
                    onChange={(e) => setEditForm({ ...editForm, registrarName: e.target.value })}
                    placeholder="e.g. Office of the University Registrar"
                    style={{ color: '#ffffff', backgroundColor: '#060c16' }}
                    className="w-full p-2.5 bg-[#060c16] border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#1cd4bc] transition"
                  />
                </div>
              </div>

              {/* Row 7: Accreditation & System Timezone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    DepEd Permit / Accreditation ID
                  </label>
                  <input
                    type="text"
                    value={editForm.accreditationNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, accreditationNumber: e.target.value })}
                    placeholder="e.g. DEPED-RO4A-RPO-2024-089"
                    style={{ color: '#ffffff', backgroundColor: '#060c16' }}
                    className="w-full p-2.5 bg-[#060c16] border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#1cd4bc] transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    System Timezone
                  </label>
                  <select
                    value={editForm.systemTimezone}
                    onChange={(e) => setEditForm({ ...editForm, systemTimezone: e.target.value })}
                    style={{ color: '#ffffff', backgroundColor: '#060c16' }}
                    className="w-full p-2.5 bg-[#060c16] border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-[#1cd4bc] transition cursor-pointer [&>option]:bg-[#0b1220] [&>option]:text-white"
                  >
                    <option value="Asia/Manila (GMT+8)" style={{ color: '#ffffff', backgroundColor: '#0b1220' }}>Asia/Manila (GMT+8)</option>
                    <option value="Asia/Singapore (GMT+8)" style={{ color: '#ffffff', backgroundColor: '#0b1220' }}>Asia/Singapore (GMT+8)</option>
                    <option value="Asia/Tokyo (GMT+9)" style={{ color: '#ffffff', backgroundColor: '#0b1220' }}>Asia/Tokyo (GMT+9)</option>
                    <option value="UTC (GMT+0)" style={{ color: '#ffffff', backgroundColor: '#0b1220' }}>UTC (GMT+0)</option>
                    <option value="America/New_York (EST)" style={{ color: '#ffffff', backgroundColor: '#0b1220' }}>America/New_York (EST)</option>
                    <option value="America/Los_Angeles (PST)" style={{ color: '#ffffff', backgroundColor: '#0b1220' }}>America/Los_Angeles (PST)</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleResetAcademyDefaults}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer self-start sm:self-auto"
                >
                  Restore Standard Defaults
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditingAcademy(false)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold text-[#050c16] bg-[#1cd4bc] hover:bg-[#18c0a8] shadow-lg shadow-[#1cd4bc]/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CONFIRMATION RESET DATA MODAL */}
      {/* ========================================================================= */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b1220] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-center">
            
            <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Restore Sample Data?
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              This will re-initialize default students, classes, and subjects. Any newly created test records will be replaced with clean demo records.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirmReset(false);
                  if (onResetData) onResetData();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CONFIRMATION LOG OUT MODAL */}
      {/* ========================================================================= */}
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

    </div>
  );
}
