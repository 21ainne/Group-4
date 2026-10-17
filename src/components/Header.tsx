import { User } from '../types';
import { 
  GraduationCap, 
  LogOut, 
  RotateCcw, 
  UserCheck, 
  ShieldCheck,
  Building2
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onResetData: () => void;
  onDataRefreshed?: () => void;
}

export function Header({ currentUser, onLogout, onResetData }: HeaderProps) {
  const isRegistrar = currentUser.role === 'registrar';

  return (
    <>
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* School Brand & App Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                    CHRISTY_JEAN_ACADEMY
                  </span>
                  <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    S.Y. 2025-2026
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden xs:block">
                  Student Attendance Management System
                </p>
              </div>
            </div>

            {/* Actions & Current User Info */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Reset Data Helper */}
              <button
                type="button"
                onClick={onResetData}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
                title="Reset local sample database back to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>

              <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

              {/* User Profile Info */}
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>{currentUser.department}</span>
                  </div>
                </div>

                {/* Role Pill */}
                <div 
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    isRegistrar
                      ? 'bg-sky-950/80 text-sky-300 border-sky-700/60'
                      : 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
                  }`}
                >
                  {isRegistrar ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span className="capitalize">{currentUser.role}</span>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors ml-1 cursor-pointer"
                  title="Sign Out of the Attendance System"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>
      </header>
    </>
  );
}
