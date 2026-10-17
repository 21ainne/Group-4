import React, { useState } from 'react';
import { 
  GraduationCap, 
  User as UserIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Briefcase, 
  Mail, 
  Phone, 
  BadgeCheck, 
  ScreenShare, 
  Users, 
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { User, UserRole } from '../types';
import { registerUser, RegisterUserData, validatePasswordStrength } from '../storage';

interface RegisterAccountPageProps {
  initialRole?: UserRole;
  onBackToLogin: (prefillUsername?: string, prefillPassword?: string, role?: UserRole) => void;
  onRegisterSuccessDirectLogin: (user: User) => void;
}

export function RegisterAccountPage({
  initialRole = 'instructor',
  onBackToLogin,
  onRegisterSuccessDirectLogin,
}: RegisterAccountPageProps) {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUser, setCreatedUser] = useState<User | null>(null);

  // Pre-set department suggestions based on role
  const instructorDepartments = [
    'Department of Natural Sciences',
    'Department of Mathematics',
    'Department of Information Technology',
    'Department of Humanities & Literature',
    'Department of SSG / Social Sciences',
    'Department of Business & Accountancy',
    'Department of Physical Education',
  ];

  const registrarDepartments = [
    'Office of the University Registrar',
    'Student Records & Credentials Division',
    'Admissions & Enrollment Office',
    'Academic Affairs & Curriculum Office',
    'Institutional Data & Evaluation Section',
  ];

  const instructorTitles = [
    'Visiting Lecturer',
    'Assistant Professor',
    'Instructor I',
    'Associate Professor',
    'Senior Lecturer',
    'Faculty Department Head',
  ];

  const registrarTitles = [
    'Head Registrar & Records Officer',
    'Assistant Registrar',
    'Admissions & Enrollment Officer',
    'Senior Records Evaluator',
    'Academic Information Officer',
  ];

  // Quick Demo Autofill Helper for convenience
  const handleQuickDemoFill = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setErrorMessage(null);
    const randomSuffix = Math.floor(100 + Math.random() * 900);

    if (selectedRole === 'instructor') {
      setFullName(`Prof. Jonathan Cruz`);
      setEmployeeId(`FAC-2026-${randomSuffix}`);
      setDepartment('Department of Natural Sciences');
      setTitle('Assistant Professor');
      setEmail(`jonathan.cruz${randomSuffix}@oakridge.edu`);
      setMobileNumber('0917' + Math.floor(1000000 + Math.random() * 9000000));
      setUsername(`prof.cruz${randomSuffix}`);
      setPassword('password123');
      setConfirmPassword('password123');
      setAgreedToTerms(true);
    } else {
      setFullName(`Dr. Samantha Reyes`);
      setEmployeeId(`REG-2026-${randomSuffix}`);
      setDepartment('Office of the University Registrar');
      setTitle('Head Registrar & Records Officer');
      setEmail(`samantha.reyes${randomSuffix}@oakridge.edu`);
      setMobileNumber('0918' + Math.floor(1000000 + Math.random() * 9000000));
      setUsername(`reg.reyes${randomSuffix}`);
      setPassword('password123');
      setConfirmPassword('password123');
      setAgreedToTerms(true);
    }
  };

  const handleGenerateEmployeeId = () => {
    const prefix = role === 'instructor' ? 'FAC' : 'REG';
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setEmployeeId(`${prefix}-${year}-${randomNum}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validation
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid institutional email address (e.g. yourname@oakridge.edu).');
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMessage('Please enter a mobile contact number for account recovery & SMS verification.');
      return;
    }
    if (!department.trim()) {
      setErrorMessage('Please select or specify your department/office.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please specify your academic title or institutional position.');
      return;
    }
    if (!username.trim()) {
      setErrorMessage('Please choose a username for logging in.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      setErrorMessage(strength.error || 'Password must be at least 8 characters long and contain both letters and numbers.');
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage('Please check the confirmation box acknowledging institutional student privacy & compliance.');
      return;
    }

    setIsSubmitting(true);

    const payload: RegisterUserData = {
      role,
      fullName: fullName.trim(),
      employeeId: employeeId.trim() || undefined,
      department: department.trim(),
      title: title.trim(),
      email: email.trim(),
      mobileNumber: mobileNumber.trim(),
      username: username.trim().toLowerCase(),
      password,
    };

    setTimeout(() => {
      const result = registerUser(payload);
      setIsSubmitting(false);

      if (!result.success || !result.user) {
        setErrorMessage(result.error || 'Failed to create account. Please review the details and try again.');
        return;
      }

      setCreatedUser(result.user);
    }, 450);
  };

  // SUCCESS VIEW: Account created with full details
  if (createdUser) {
    return (
      <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-blue-600 selection:text-white">
        {/* Ambient Glows */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[550px] bg-blue-600/25 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[380px] h-[340px] bg-emerald-500/20 blur-[90px] rounded-full pointer-events-none" />

        <div className="w-full max-w-[520px] flex flex-col items-center relative z-10 py-6 sm:py-8">
          <div className="w-full bg-[#0b1220]/90 backdrop-blur-2xl border border-emerald-500/30 rounded-[28px] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_35px_rgba(16,185,129,0.2)]">
            
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(16,185,129,0.35)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-bold text-white text-center tracking-tight">
              Account Created Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 text-center mt-2">
              Your official <span className="font-semibold text-emerald-400 uppercase tracking-wide">{createdUser.role}</span> credentials have been registered in the system.
            </p>

            {/* Official Credential Summary Card */}
            <div className="mt-6 p-4.5 rounded-2xl bg-[#080e1a] border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Account Type:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  createdUser.role === 'registrar' 
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' 
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {createdUser.role}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Full Name:</span>
                  <span className="font-semibold text-white">{createdUser.fullName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Employee ID:</span>
                  <span className="font-mono text-blue-300">{createdUser.employeeId || 'Assigned'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Username:</span>
                  <span className="font-mono font-bold text-emerald-300">@{createdUser.username}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Title / Position:</span>
                  <span className="text-slate-200">{createdUser.title}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-slate-400 block">Department:</span>
                  <span className="text-slate-200">{createdUser.department}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-slate-400 block">Institutional Email:</span>
                  <span className="font-mono text-slate-300">{createdUser.email}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => onRegisterSuccessDirectLogin(createdUser)}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] shadow-lg shadow-emerald-600/35 transition cursor-pointer"
              >
                <span>Enter Dashboard Immediately</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onBackToLogin(createdUser.username, password, createdUser.role)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
              >
                Go to Sign In Screen (Credentials Ready)
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Top Spotlight Glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] sm:w-[940px] h-[550px] bg-blue-600/25 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[340px] sm:w-[460px] h-[320px] bg-indigo-500/20 blur-[90px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[560px] flex flex-col items-center relative z-10 py-6 sm:py-10">
        
        {/* Top Header Branding */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2.5">
            <div className="relative">
              <GraduationCap className="w-11 h-11 sm:w-12 sm:h-12 text-blue-400 drop-shadow-[0_0_16px_rgba(96,165,250,0.65)]" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
            Create System Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Student Attendance Management System · Oakridge Academy
          </p>
        </div>

        {/* Central Registration Glass Card */}
        <div className="w-full bg-[#0b1220]/90 backdrop-blur-2xl border border-blue-500/25 rounded-[26px] p-5 sm:p-8 shadow-[0_0_50px_-10px_rgba(0,0,0,0.85),0_0_35px_-5px_rgba(37,99,235,0.2)]">
          
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Faculty &amp; Staff Registration
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your designated role and fill in exact institutional details.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => onBackToLogin()}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </div>

          {/* Quick Demo Pre-fill helper chips */}
          <div className="mb-5 p-2.5 bg-blue-950/40 border border-blue-500/20 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-blue-300 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Quick Test Autofill:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoFill('instructor')}
                className="px-2 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-[11px] font-medium border border-blue-700/50 transition cursor-pointer flex items-center gap-1"
              >
                <span>Instructor Sample</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('registrar')}
                className="px-2 py-1 rounded-lg bg-sky-900/60 hover:bg-sky-800 text-sky-200 text-[11px] font-medium border border-sky-700/50 transition cursor-pointer flex items-center gap-1"
              >
                <span>Registrar Sample</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. ROLE SELECTION */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                1. Select Institutional Role <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Instructor Role Tab */}
                <button
                  type="button"
                  onClick={() => {
                    setRole('instructor');
                    setDepartment('');
                    setTitle('');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    role === 'instructor'
                      ? 'border-blue-500 bg-[#12203e] ring-1 ring-blue-500/60 shadow-[0_0_18px_rgba(59,130,246,0.3)]'
                      : 'border-slate-800 bg-[#080e1a] hover:border-slate-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${role === 'instructor' ? 'text-blue-400' : 'text-slate-400'}`}>
                    <ScreenShare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-white block">
                      Instructor
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Class &amp; Attendance
                    </span>
                  </div>
                </button>

                {/* Registrar Role Tab */}
                <button
                  type="button"
                  onClick={() => {
                    setRole('registrar');
                    setDepartment('');
                    setTitle('');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    role === 'registrar'
                      ? 'border-blue-500 bg-[#12203e] ring-1 ring-blue-500/60 shadow-[0_0_18px_rgba(59,130,246,0.3)]'
                      : 'border-slate-800 bg-[#080e1a] hover:border-slate-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${role === 'registrar' ? 'text-blue-400' : 'text-slate-400'}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-white block">
                      Registrar
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Full Admin Access
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. PERSONAL IDENTITY & OFFICIAL ID */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-200 block mb-2.5">
                2. Personal &amp; Institutional Identification
              </span>

              <div className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Full Legal Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={role === 'instructor' ? 'e.g. Prof. Angel Gumantason' : 'e.g. Dr. Evelyn Reed'}
                      style={{ color: '#ffffff' }}
                      className="login-input block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Employee / Faculty ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-slate-300">
                      {role === 'instructor' ? 'Faculty ID Number' : 'Employee / Admin ID'}
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateEmployeeId}
                      className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                    >
                      Generate Auto ID
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <BadgeCheck className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                      placeholder={role === 'instructor' ? 'e.g. FAC-2026-1049' : 'e.g. REG-2026-0882'}
                      style={{ color: '#ffffff' }}
                      className="login-input block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                    />
                  </div>
                </div>

                {/* Email and Mobile Number in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Institutional Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@oakridge.edu"
                        style={{ color: '#ffffff' }}
                        className="login-input block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Mobile Number <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="09171234567"
                        style={{ color: '#ffffff' }}
                        className="login-input block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ACADEMIC ASSIGNMENT & TITLE */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-200 block mb-2.5">
                3. Academic Assignment &amp; Title
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Department Selection */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {role === 'instructor' ? 'Academic Department' : 'Administrative Office'} <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      list="department-suggestions"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder={role === 'instructor' ? 'Department of Sciences' : 'Office of the Registrar'}
                      style={{ color: '#ffffff' }}
                      className="login-input block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                    <datalist id="department-suggestions">
                      {(role === 'instructor' ? instructorDepartments : registrarDepartments).map((dept) => (
                        <option key={dept} value={dept} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Title / Position */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Professional Title / Rank <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      list="title-suggestions"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={role === 'instructor' ? 'Assistant Professor' : 'Head Registrar'}
                      style={{ color: '#ffffff' }}
                      className="login-input block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                    <datalist id="title-suggestions">
                      {(role === 'instructor' ? instructorTitles : registrarTitles).map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. LOGIN CREDENTIALS */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-200 block mb-2.5">
                4. System Login Credentials
              </span>

              <div className="space-y-3">
                {/* Username */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Login Username <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                      @
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                      placeholder={role === 'instructor' ? 'instructor.name' : 'registrar.name'}
                      style={{ color: '#ffffff' }}
                      className="login-input block w-full pl-8 pr-3 py-2.5 text-xs sm:text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Use lowercase letters, numbers, dots or dashes (min 3 chars).
                  </span>
                </div>

                {/* Password and Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ color: '#ffffff' }}
                        className="login-input block w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ color: '#ffffff' }}
                        className="login-input block w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password helper status */}
                <div className="flex items-center justify-between text-[11px] px-1">
                  <span className={`${password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password) ? 'text-emerald-400' : 'text-slate-400'}`}>
                    • Min 8 characters (letters &amp; numbers)
                  </span>
                  {password && confirmPassword && (
                    <span className={password === confirmPassword ? 'text-emerald-400 flex items-center gap-1 font-medium' : 'text-rose-400'}>
                      {password === confirmPassword ? <><Check className="w-3 h-3" /> Passwords match</> : 'Passwords do not match'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 5. INSTITUTIONAL DATA PRIVACY AGREEMENT */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="leading-snug">
                  I certify that I am an authorized <strong className="text-white capitalize">{role}</strong> personnel of Christy Jean Academy and agree to uphold student attendance data privacy standards.
                </span>
              </label>
            </div>

            {/* ERROR DISPLAY */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] shadow-lg shadow-blue-600/35 transition cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Registering Account in Database...</span>
                ) : (
                  <>
                    <span>Create {role === 'instructor' ? 'Instructor' : 'Registrar'} Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Already have an account link */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center text-xs">
            <span className="text-slate-400">Already registered in the system? </span>
            <button
              type="button"
              onClick={() => onBackToLogin()}
              className="text-blue-400 hover:text-blue-300 font-semibold hover:underline cursor-pointer ml-1"
            >
              Sign In to Your Account →
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
