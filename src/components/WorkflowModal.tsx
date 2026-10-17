import { GitBranch, X, CheckCircle2, XCircle, ShieldAlert, BookOpen, FileSpreadsheet, Lock } from 'lucide-react';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkflowModal({ isOpen, onClose }: WorkflowModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">System Workflow & Decision Process</h2>
              <p className="text-xs text-slate-400">Official Role-Based Access Control Architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Flow Chart */}
        <div className="p-6 md:p-8 space-y-6 max-h-[78vh] overflow-y-auto bg-slate-50/50">
          {/* Top Authentication Block */}
          <div className="flex flex-col items-center">
            <div className="px-4 py-2 bg-slate-800 text-slate-100 rounded-full text-xs font-semibold uppercase tracking-wider shadow-xs">
              System Start
            </div>
            <div className="w-0.5 h-6 bg-slate-300 my-1"></div>
            
            <div className="w-full max-w-md bg-white border-2 border-slate-300 rounded-xl p-4 shadow-sm text-center">
              <div className="font-semibold text-slate-900 text-sm">LOGIN PAGE</div>
              <p className="text-xs text-slate-600 mt-1">User enters Username and Password</p>
            </div>

            <div className="w-0.5 h-6 bg-slate-300 my-1"></div>

            {/* Decision Diamond */}
            <div className="relative bg-amber-50 border-2 border-amber-300 text-amber-900 px-6 py-3 rounded-xl text-center shadow-xs max-w-sm">
              <div className="font-bold text-xs uppercase tracking-wide">Credentials Validation</div>
              <div className="text-xs mt-0.5 font-medium">Are credentials valid in the database?</div>
            </div>
          </div>

          {/* Decision Branches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Invalid Path */}
            <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 relative">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm mb-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>NO (Invalid Credentials)</span>
              </div>
              <div className="space-y-2 text-xs text-rose-700 bg-white/70 p-3 rounded-lg border border-rose-100">
                <p>1. Display prompt error message.</p>
                <p>2. Keep user at Login Page for retry.</p>
                <p>3. Do not initialize session token or role.</p>
              </div>
            </div>

            {/* Valid Path */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 relative">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>YES (Valid Credentials)</span>
              </div>
              <div className="space-y-2 text-xs text-emerald-700 bg-white/70 p-3 rounded-lg border border-emerald-100">
                <p>1. Authenticate user identity.</p>
                <p>2. Inspect User Role: <strong className="text-slate-900">Instructor</strong> vs <strong className="text-slate-900">Registrar</strong>.</p>
                <p>3. Direct to strictly scoped Dashboard.</p>
              </div>
            </div>
          </div>

          {/* Role Comparison Split Cards */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Role Scopes & Boundaries</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Instructor Card */}
              <div className="bg-white border-2 border-indigo-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-50 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">Instructor</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                      Limited Access
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">✓</span>
                      <span>View Instructor Dashboard</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">✓</span>
                      <span>Select assigned Class & Subject</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">✓</span>
                      <span>View Student Roster</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">✓</span>
                      <span>Mark Attendance (Present / Absent / Late)</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">✓</span>
                      <span>Save Attendance Records & View Logs</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-amber-800 bg-amber-50/70 p-2.5 rounded-lg flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>Cannot add/edit/delete students, classes, or subjects.</span>
                </div>
              </div>

              {/* Registrar Card */}
              <div className="bg-white border-2 border-sky-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-sky-50 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-sky-100 text-sky-800 rounded-md">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">Registrar</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-sky-50 text-sky-800 rounded-full text-xs font-semibold">
                      Full Access
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <span className="text-sky-700 font-bold">✓</span>
                      <span>View Registrar Master Dashboard</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-sky-700 font-bold">✓</span>
                      <span>Full Student Management (Add, Update, Delete)</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-sky-700 font-bold">✓</span>
                      <span>Manage Classes & Grade Levels</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-sky-700 font-bold">✓</span>
                      <span>Manage Subjects & Curriculum Units</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-sky-700 font-bold">✓</span>
                      <span>Audit all Attendance Records across departments</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-sky-700 font-bold">✓</span>
                      <span>Generate and Print Official Attendance Reports</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>Full Administrative & Academic Records Authority.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Diagram
          </button>
        </div>
      </div>
    </div>
  );
}
