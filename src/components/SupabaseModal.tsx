import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  Key,
  X,
  Sparkles,
  Layers,
  Settings2
} from 'lucide-react';
import { 
  getSupabaseProjectId, 
  getSupabaseUrl, 
  getSupabaseAnonKey,
  saveSupabaseConfig,
  resetSupabaseConfig,
  checkSupabaseConnection, 
  SupabaseConnectionStatus 
} from '../lib/supabase';
import { 
  pushLocalDataToSupabase, 
  pullDataFromSupabase, 
  SyncResult 
} from '../services/supabaseService';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRefreshed?: () => void;
}

export function SupabaseModal({ isOpen, onClose, onDataRefreshed }: SupabaseModalProps) {
  const [status, setStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState<'push' | 'pull' | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'credentials' | 'schema' | 'instructions'>('overview');

  // Credentials form state
  const [editProjectId, setEditProjectId] = useState(() => getSupabaseProjectId());
  const [editAnonKey, setEditAnonKey] = useState(() => getSupabaseAnonKey());
  const [editUrl, setEditUrl] = useState(() => getSupabaseUrl());
  const [credSaved, setCredSaved] = useState(false);

  const runCheck = async () => {
    setChecking(true);
    const result = await checkSupabaseConnection();
    setStatus(result);
    setChecking(false);
  };

  useEffect(() => {
    if (isOpen) {
      setEditProjectId(getSupabaseProjectId());
      setEditAnonKey(getSupabaseAnonKey());
      setEditUrl(getSupabaseUrl());
      runCheck();
      setSyncMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentProjectId = getSupabaseProjectId();
  const currentUrl = getSupabaseUrl();

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(editProjectId, editAnonKey, editUrl);
    setCredSaved(true);
    setTimeout(() => setCredSaved(false), 3000);
    runCheck();
  };

  const handleResetCredentials = () => {
    resetSupabaseConfig();
    setEditProjectId(getSupabaseProjectId());
    setEditAnonKey(getSupabaseAnonKey());
    setEditUrl(getSupabaseUrl());
    setCredSaved(true);
    setTimeout(() => setCredSaved(false), 3000);
    runCheck();
  };

  const handlePush = async () => {
    setSyncing('push');
    setSyncMessage(null);
    const res: SyncResult = await pushLocalDataToSupabase();
    setSyncing(null);
    if (res.success) {
      setSyncMessage({ text: res.message, type: 'success' });
      runCheck();
      if (onDataRefreshed) onDataRefreshed();
    } else {
      setSyncMessage({ text: res.message, type: 'error' });
    }
  };

  const handlePull = async () => {
    setSyncing('pull');
    setSyncMessage(null);
    const res: SyncResult = await pullDataFromSupabase();
    setSyncing(null);
    if (res.success) {
      setSyncMessage({ text: res.message, type: 'success' });
      runCheck();
      if (onDataRefreshed) onDataRefreshed();
    } else {
      setSyncMessage({ text: res.message, type: 'error' });
    }
  };

  const handleCopySql = async () => {
    try {
      const sqlText = `-- Student Attendance Management System Schema for Supabase
-- Target Project ID: ${currentProjectId}

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('instructor', 'registrar')),
    title VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(120) UNIQUE NOT NULL,
    mobile_number VARCHAR(50),
    employee_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    section VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    room VARCHAR(50),
    adviser VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    units INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(64) PRIMARY KEY,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    middle_name VARCHAR(80),
    gender VARCHAR(20) NOT NULL,
    class_id VARCHAR(64) NOT NULL,
    email VARCHAR(120),
    guardian_name VARCHAR(120),
    guardian_phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    class_id VARCHAR(64) NOT NULL,
    subject_id VARCHAR(64) NOT NULL,
    attendance_date DATE NOT NULL,
    time_slot VARCHAR(50),
    recorded_by_user_id VARCHAR(64) NOT NULL,
    recorded_by_name VARCHAR(120) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_entries (
    id BIGSERIAL PRIMARY KEY,
    attendance_record_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- ==========================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_entries ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public access for app demo" ON users;
    DROP POLICY IF EXISTS "Allow public access for app demo" ON classes;
    DROP POLICY IF EXISTS "Allow public access for app demo" ON subjects;
    DROP POLICY IF EXISTS "Allow public access for app demo" ON students;
    DROP POLICY IF EXISTS "Allow public access for app demo" ON attendance_records;
    DROP POLICY IF EXISTS "Allow public access for app demo" ON attendance_entries;
END $$;

CREATE POLICY "Allow public access for app demo" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for app demo" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for app demo" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for app demo" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for app demo" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for app demo" ON attendance_entries FOR ALL USING (true) WITH CHECK (true);
`;

      await navigator.clipboard.writeText(sqlText);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      alert('Could not copy to clipboard automatically. You can copy schema.sql from the project files.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Supabase Cloud Database</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Connected Project: <strong className="text-white font-mono">{currentProjectId}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-4 text-xs font-semibold text-slate-600 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 border-b-2 cursor-pointer transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Connection &amp; Sync
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`pb-2.5 border-b-2 cursor-pointer transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tables'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tables ({status?.tableDetails?.filter((t) => t.exists).length ?? 0}/6)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`pb-2.5 border-b-2 cursor-pointer transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API &amp; Project Keys</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 border-b-2 cursor-pointer transition whitespace-nowrap ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            SQL Setup &amp; Migration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instructions')}
            className={`pb-2.5 border-b-2 cursor-pointer transition whitespace-nowrap ${
              activeTab === 'instructions'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Setup Guide
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {syncMessage && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                syncMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              {syncMessage.type === 'success' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{syncMessage.text}</span>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        status?.hasTables
                          ? 'bg-emerald-500 animate-pulse'
                          : status?.isConnected
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    Live Endpoint Status
                  </span>

                  <button
                    type="button"
                    onClick={runCheck}
                    disabled={checking}
                    className="flex items-center gap-1 text-[11px] text-sky-700 font-semibold hover:text-sky-900 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
                    <span>{checking ? 'Checking...' : 'Re-check Connection'}</span>
                  </button>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                    <span>Project ID:</span>
                    <span className="font-bold text-slate-900">{currentProjectId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                    <span>API Endpoint URL:</span>
                    <span className="text-slate-800 truncate max-w-[280px]">{currentUrl}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Database State:</span>
                    <span className={`font-semibold ${status?.hasTables ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {status ? status.message : 'Testing connectivity...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sync Controls */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Cloud Synchronization Actions</h4>
                <p className="text-slate-500 mb-3">
                  Upload all current student records, classes, faculty accounts, subjects, and attendance sheets directly into your Supabase database.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handlePush}
                    disabled={syncing !== null}
                    className="p-3.5 rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 shadow-xs"
                  >
                    <UploadCloud className={`w-4 h-4 ${syncing === 'push' ? 'animate-bounce' : ''}`} />
                    <span>{syncing === 'push' ? 'Uploading...' : 'Push Local Data to Supabase'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePull}
                    disabled={syncing !== null}
                    className="p-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 shadow-xs"
                  >
                    <DownloadCloud className={`w-4 h-4 ${syncing === 'pull' ? 'animate-bounce' : ''}`} />
                    <span>{syncing === 'pull' ? 'Downloading...' : 'Pull Data from Supabase'}</span>
                  </button>
                </div>
              </div>

              {/* Direct Dashboard Link */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={`https://supabase.com/dashboard/project/${currentProjectId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span className="truncate">Supabase Dashboard</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                </a>

                <a
                  href={`https://supabase.com/dashboard/project/${currentProjectId}/sql`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-400" />
                    <span className="truncate">SQL Editor ({currentProjectId})</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* TABLES BREAKDOWN TAB */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900">Database Tables Status</h4>
                <p className="text-slate-500">Live inspection of all 6 required tables on project {currentProjectId}</p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {status?.tableDetails && status.tableDetails.length > 0 ? (
                  status.tableDetails.map((t) => (
                    <div key={t.name} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${t.exists ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="font-mono font-bold text-slate-900">{t.name}</span>
                      </div>
                      <div>
                        {t.exists ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Online {t.count !== undefined ? `(${t.count} records)` : ''}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            {t.error || 'Missing'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400">Run a check to view table breakdown</div>
                )}
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 flex items-center justify-between">
                <span>Need to create or update missing tables?</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('schema')}
                  className="font-bold underline hover:text-sky-950 cursor-pointer"
                >
                  View SQL Script →
                </button>
              </div>
            </div>
          )}

          {/* CREDENTIALS TAB */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900">Supabase API Configuration</h4>
                <p className="text-slate-500">Verify or update the connection credentials for your Supabase project.</p>
              </div>

              {credSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Credentials updated and client re-connected!</span>
                </div>
              )}

              <form onSubmit={handleSaveCredentials} className="space-y-3 font-mono">
                <div>
                  <label className="font-sans font-semibold text-slate-700 block mb-1">
                    Supabase Project ID
                  </label>
                  <input
                    type="text"
                    required
                    value={editProjectId}
                    onChange={(e) => {
                      setEditProjectId(e.target.value);
                      setEditUrl(`https://${e.target.value.trim()}.supabase.co`);
                    }}
                    placeholder="e.g. tedohrisefskbgpuadvp"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-sans font-semibold text-slate-700 block mb-1">
                    Supabase API URL
                  </label>
                  <input
                    type="url"
                    required
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="https://tedohrisefskbgpuadvp.supabase.co"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-sans font-semibold text-slate-700 block">
                      Anon Public API Key
                    </label>
                    <a
                      href={`https://supabase.com/dashboard/project/${currentProjectId}/settings/api`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-sans text-sky-700 hover:underline flex items-center gap-0.5"
                    >
                      Find Key in Supabase Settings <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={editAnonKey}
                    onChange={(e) => setEditAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-[11px] focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetCredentials}
                    className="font-sans px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    Reset to Defaults
                  </button>

                  <button
                    type="submit"
                    className="font-sans px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    Save &amp; Test Connection
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Run Migration in Supabase SQL Editor</h4>
                  <p className="text-slate-500">
                    Execute this script in project <strong className="font-mono">{currentProjectId}</strong> to create tables and grant RLS policies.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition cursor-pointer shrink-0"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <div className="bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800 leading-relaxed">
                <p className="text-emerald-400">-- Target Supabase Project: {currentProjectId}</p>
                <p className="text-emerald-400">-- Tables: users, classes, subjects, students, attendance_records, attendance_entries</p>
                <p className="text-slate-400">-- Click "Copy SQL Schema" above and paste into Supabase &gt; SQL Editor</p>
                <br />
                <pre>{`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('instructor', 'registrar')),
    title VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(120) UNIQUE NOT NULL,
    mobile_number VARCHAR(50),
    employee_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    section VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    room VARCHAR(50),
    adviser VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    units INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(64) PRIMARY KEY,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    middle_name VARCHAR(80),
    gender VARCHAR(20) NOT NULL,
    class_id VARCHAR(64) NOT NULL,
    email VARCHAR(120),
    guardian_name VARCHAR(120),
    guardian_phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    class_id VARCHAR(64) NOT NULL,
    subject_id VARCHAR(64) NOT NULL,
    attendance_date DATE NOT NULL,
    time_slot VARCHAR(50),
    recorded_by_user_id VARCHAR(64) NOT NULL,
    recorded_by_name VARCHAR(120) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_entries (
    id BIGSERIAL PRIMARY KEY,
    attendance_record_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-3 text-slate-700">
              <h4 className="font-bold text-slate-900">How to Complete Setup for {currentProjectId}:</h4>
              
              <ol className="list-decimal list-inside space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <li className="leading-relaxed">
                  <strong>Open your Supabase SQL Editor:</strong> Navigate to{' '}
                  <a
                    href={`https://supabase.com/dashboard/project/${currentProjectId}/sql`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    Supabase SQL Editor ({currentProjectId}) <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </li>
                <li className="leading-relaxed">
                  <strong>Paste &amp; Run Schema:</strong> Switch to the <em>"SQL Setup &amp; Migration"</em> tab above, click <strong>"Copy SQL Schema"</strong>, paste it into the editor, and click <strong>"Run"</strong>.
                </li>
                <li className="leading-relaxed">
                  <strong>Populate Data:</strong> Return to the <em>"Connection &amp; Sync"</em> tab here and click <strong>"Push Local Data to Supabase"</strong>.
                </li>
                <li className="leading-relaxed">
                  <strong>Done!</strong> All student enrollments, class assignments, and instructor attendance sheets will now persist in real-time in your Supabase PostgreSQL database.
                </li>
              </ol>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Connected: {currentProjectId}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
