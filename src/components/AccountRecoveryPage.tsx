import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Mail, 
  Phone, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  Lock,
  Smartphone
} from 'lucide-react';
import { User } from '../types';
import { 
  verifyAccountByEmailAndMobile, 
  resetUserPasswordById, 
  validatePasswordStrength 
} from '../storage';

interface AccountRecoveryPageProps {
  onBackToLogin: (prefillUsername?: string, prefillPassword?: string) => void;
  initialEmail?: string;
}

export function AccountRecoveryPage({ onBackToLogin, initialEmail = '' }: AccountRecoveryPageProps) {
  // Steps: 1 = Account Verification, 2 = Verification Code, 3 = Create New Password, 4 = Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 State: Email & Mobile
  const [email, setEmail] = useState(initialEmail || '');
  const [mobileNumber, setMobileNumber] = useState('');
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);

  // Step 2 State: Verification Code / OTP
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('849201');
  const [otpSentNotification, setOtpSentNotification] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);

  // Step 3 State: New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // General States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Timer for OTP resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === 2 && resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [currentStep, resendCooldown]);

  // Generate a realistic 6-digit OTP
  const generateNewOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    return code;
  };

  // Masking helpers for display
  const maskEmail = (val: string) => {
    if (!val.includes('@')) return val;
    const [name, domain] = val.split('@');
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
  };

  const maskPhone = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length < 7) return val;
    return `${clean.slice(0, 4)} **** ${clean.slice(-3)}`;
  };

  // STEP 1 HANDLER: Verify Account
  const handleVerifyAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !mobileNumber.trim()) {
      setErrorMessage('Please enter both your registered email address and mobile number.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const result = verifyAccountByEmailAndMobile(email, mobileNumber);
      setIsProcessing(false);

      if (!result.success || !result.user) {
        // Exact message requested in user prompt
        setErrorMessage('The email or mobile number you entered does not match our records. Please try again.');
        return;
      }

      // Success: Proceed to Step 2
      const newCode = generateNewOtp();
      setVerifiedUser(result.user);
      setOtpCode('');
      setOtpSentNotification(`Verification code sent! For this demo session, your code is: ${newCode}`);
      setResendCooldown(30);
      setCurrentStep(2);
    }, 400);
  };

  // STEP 2 HANDLER: Verify Code / OTP
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = otpCode.trim();
    if (!cleanInput) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      // Valid if it matches the generated OTP
      if (cleanInput !== generatedOtp) {
        setErrorMessage('Invalid verification code. Please check your messages and try again.');
        return;
      }

      // Success: Proceed to Step 3
      setErrorMessage(null);
      setCurrentStep(3);
    }, 350);
  };

  // Resend OTP Code
  const handleResendCode = () => {
    if (resendCooldown > 0) return;
    const newCode = generateNewOtp();
    setOtpSentNotification(`New verification code generated and sent: ${newCode}`);
    setResendCooldown(30);
    setErrorMessage(null);
  };

  // STEP 3 HANDLER: Reset Password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!verifiedUser) return;

    // Validation 1: At least 8 characters
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    // Validation 2: Include letters and numbers
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setErrorMessage('Password must contain both letters and numbers.');
      return;
    }

    // Validation 3: New password and confirm password must match
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const resetResult = resetUserPasswordById(verifiedUser.id, newPassword);
      setIsProcessing(false);

      if (!resetResult.success) {
        setErrorMessage(resetResult.error || 'Failed to update password. Please try again.');
        return;
      }

      // Success: Proceed to Step 4
      setCurrentStep(4);
    }, 450);
  };

  // Demo auto-fill helper for convenience
  const handleQuickDemoFill = (type: 'instructor' | 'registrar') => {
    if (type === 'instructor') {
      setEmail('Angelko@gmail.com.edu');
      setMobileNumber('09171234567');
    } else {
      setEmail('registrar@oakridge.edu');
      setMobileNumber('09189876543');
    }
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Top Ambient Blue Spotlight Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[340px] pointer-events-none opacity-60 z-0"
        style={{
          background: 'radial-gradient(ellipse 65% 100% at 50% 0%, rgba(37, 99, 235, 0.45), rgba(15, 23, 42, 0.05) 70%, transparent 100%)',
        }}
      />

      {/* Decorative ambient subtle ring */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[260px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Emblem & Title */}
      <div className="relative z-10 flex flex-col items-center text-center mb-6">
        <div className="relative mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 flex items-center justify-center shadow-[0_0_28px_rgba(37,99,235,0.6)] border border-blue-400/40">
            <GraduationCap className="w-8 h-8 text-white stroke-[2.2]" />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-blue-500/20 blur-md -z-10 animate-pulse" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
          Account Recovery Portal
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Christy Jean Academy • Student Attendance Management System
        </p>

        {/* Step Progress Tracker */}
        <div className="flex items-center gap-2 mt-4">
          {[
            { num: 1, label: 'Verify' },
            { num: 2, label: 'Code' },
            { num: 3, label: 'Password' },
            { num: 4, label: 'Success' },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-1.5">
                <div 
                  className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-all ${
                    currentStep === s.num
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-[#030712] shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                      : currentStep > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                  }`}
                >
                  {currentStep > s.num ? '✓' : s.num}
                </div>
                <span className={`text-[11px] hidden sm:inline font-medium ${currentStep === s.num ? 'text-blue-300' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div className={`w-5 h-[1.5px] rounded ${currentStep > idx + 1 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Glassmorphic Recovery Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-[#0b1220]/90 backdrop-blur-xl border border-blue-500/25 rounded-[26px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(37,99,235,0.15)]">
        
        {/* ========================================================================= */}
        {/* STEP 1: ACCOUNT VERIFICATION */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Forgot Your Password?
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed px-1">
                Don't worry! Enter your registered email address and mobile number to verify your account.
              </p>
            </div>

            <form onSubmit={handleVerifyAccount} className="space-y-4">
              {/* Email Address Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. Angelko@gmail.com.edu"
                    style={{ color: '#ffffff' }}
                    className="login-input block w-full pl-10 pr-4 py-3 text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    autoFocus
                  />
                </div>
              </div>

              {/* Mobile Number Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 tracking-wide">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. 09171234567 or +63 917 123 4567"
                    style={{ color: '#ffffff' }}
                    className="login-input block w-full pl-10 pr-4 py-3 text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                  />
                </div>
              </div>

              {/* Demo Account Quick Selector / Help */}
              <div className="p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-300 font-semibold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Registered Faculty &amp; Staff Demo Records</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('instructor')}
                    className="text-left px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-blue-500/40 transition cursor-pointer"
                  >
                    <span className="text-blue-400 font-bold block">Instructor</span>
                    <span className="text-[10px] text-slate-400 truncate block">09171234567</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('registrar')}
                    className="text-left px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-blue-500/40 transition cursor-pointer"
                  >
                    <span className="text-blue-400 font-bold block">Registrar</span>
                    <span className="text-[10px] text-slate-400 truncate block">09189876543</span>
                  </button>
                </div>
              </div>

              {/* Verify Account Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-[0.99] transition shadow-[0_0_20px_rgba(37,99,235,0.4)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Information...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => onBackToLogin()}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Return to Login</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: VERIFICATION CODE / OTP */}
        {/* ========================================================================= */}
        {currentStep === 2 && verifiedUser && (
          <div>
            <div className="text-center mb-5">
              <div className="w-11 h-11 mx-auto mb-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Verify Your Account
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                A 6-digit verification code has been sent to:
              </p>
              <div className="mt-2 inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-blue-300">
                <span className="font-mono">{maskEmail(email)}</span>
                <span className="font-mono text-slate-400">{maskPhone(mobileNumber)}</span>
              </div>
            </div>

            {/* Simulated Notification Box */}
            {otpSentNotification && (
              <div className="mb-4 p-3 bg-blue-950/70 border border-blue-500/40 rounded-xl flex items-start gap-2.5 text-xs text-blue-200 animate-in fade-in duration-300">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-white">Institutional Dispatch Notice</div>
                  <div className="mt-0.5 text-blue-300/90 leading-normal">
                    OTP Code: <span className="font-mono font-bold text-white tracking-widest text-sm bg-blue-600/40 px-2 py-0.5 rounded border border-blue-400/40 ml-1">{generatedOtp}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(generatedOtp)}
                    className="mt-1 text-[11px] text-blue-400 hover:text-blue-300 hover:underline cursor-pointer block"
                  >
                    Click to auto-fill code →
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 tracking-wide text-center">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ''));
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="• • • • • •"
                  style={{ color: '#ffffff' }}
                  className="login-input block w-full py-3.5 text-center text-xl tracking-[0.5em] font-mono bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  autoFocus
                />
              </div>

              {/* Resend Code Option */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400">Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  className="inline-flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300 disabled:text-slate-500 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform'}`} />
                  <span>{resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}</span>
                </button>
              </div>

              {/* Verify Code Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-[0.99] transition shadow-[0_0_20px_rgba(37,99,235,0.4)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setCurrentStep(1);
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change email/number</span>
              </button>

              <button
                type="button"
                onClick={() => onBackToLogin()}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CREATE NEW PASSWORD */}
        {/* ========================================================================= */}
        {currentStep === 3 && verifiedUser && (
          <div>
            <div className="text-center mb-5">
              <div className="w-11 h-11 mx-auto mb-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Reset Password
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Account: <span className="font-semibold text-white">@{verifiedUser.username}</span> ({verifiedUser.fullName})
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter new password"
                    style={{ color: '#ffffff' }}
                    className="login-input block w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 tracking-wide">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Confirm new password"
                    style={{ color: '#ffffff' }}
                    className="login-input block w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#080e1a] border border-slate-800 rounded-xl text-white !text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                <div className="font-semibold text-slate-300">Password Requirements:</div>
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    newPassword.length >= 8 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {newPassword.length >= 8 ? '✓' : '•'}
                  </div>
                  <span className={newPassword.length >= 8 ? 'text-emerald-300' : 'text-slate-400'}>
                    At least 8 characters
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {/[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? '✓' : '•'}
                  </div>
                  <span className={/[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'text-emerald-300' : 'text-slate-400'}>
                    Include letters and numbers
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    newPassword && newPassword === confirmPassword
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {newPassword && newPassword === confirmPassword ? '✓' : '•'}
                  </div>
                  <span className={newPassword && newPassword === confirmPassword ? 'text-emerald-300' : 'text-slate-400'}>
                    New password and confirm password must match
                  </span>
                </div>
              </div>

              {/* Reset Password Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-[0.99] transition shadow-[0_0_20px_rgba(37,99,235,0.4)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SUCCESS MESSAGE */}
        {/* ========================================================================= */}
        {currentStep === 4 && verifiedUser && (
          <div className="text-center py-2 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Password Reset Successful!
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed px-2">
                Your password has been successfully changed. You can now log in using your new password.
              </p>
            </div>

            {/* Account Credential Recap */}
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-left text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Account Username:</span>
                <span className="font-mono text-white font-bold">@{verifiedUser.username}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Account Name:</span>
                <span className="text-white font-medium">{verifiedUser.fullName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="text-emerald-400 font-semibold">Active &amp; Verified</span>
              </div>
            </div>

            {/* Back to Login Button */}
            <button
              type="button"
              onClick={() => onBackToLogin(verifiedUser.username, newPassword)}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition shadow-[0_0_25px_rgba(37,99,235,0.4)] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Back to Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Error Banner at bottom of card */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-400 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
}
