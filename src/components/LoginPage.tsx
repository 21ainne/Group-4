import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft,
  Eye, 
  EyeOff, 
  ScreenShare, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Database
} from 'lucide-react';
import { SupabaseModal } from './SupabaseModal';
import { User, UserRole } from '../types';
import { validateCredentials, registerUser, RegisterUserData, getAcademyInfo } from '../storage';
import { AccountRecoveryPage } from './AccountRecoveryPage';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  // Screen views:
  // 'welcome' (Screen 1: Welcome )
  // 'signin' (Screen 2: Welcome Back)
  // 'signup' (Screen 3: Create Account)
  const [activeScreen, setActiveScreen] = useState<'welcome' | 'signin' | 'signup'>('welcome');
  const [currentView, setCurrentView] = useState<'auth' | 'account_recovery'>('auth');
  
  // Role selection for school attendance system (Instructor vs Registrar)
  const [role, setRole] = useState<UserRole>('instructor');

  // Sign In (Screen 2) State
  const [loginEmail, setLoginEmail] = useState('instructor');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up (Screen 3) State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Automatic screen switch helper
  const switchScreen = (screen: 'welcome' | 'signin' | 'signup') => {
    setActiveScreen(screen);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Quick Demo Autofill Helper
  const handleQuickRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (selectedRole === 'instructor') {
      setLoginEmail('instructor');
      setLoginPassword('password123');
      if (!signupName) setSignupName('Prof. Angel Gumantason');
      if (!signupEmail) setSignupEmail('Angelko@gmail.com.edu');
    } else {
      setLoginEmail('registrar');
      setLoginPassword('password123');
      if (!signupName) setSignupName('Dr. Evelyn Reed');
      if (!signupEmail) setSignupEmail('registrar@oakridge.edu');
    }
  };



  // Sign In Submission
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter both your email/username and password.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = validateCredentials(loginEmail, loginPassword);
      setIsSubmitting(false);

      if (!result.success || !result.user) {
        setErrorMessage(result.error || 'Invalid credentials. Please verify your details.');
        return;
      }

      onLoginSuccess(result.user);
    }, 280);
  };

  // Sign Up Submission
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signupName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!signupPassword || signupPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    const baseUsername = signupEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '') || `user.${Date.now().toString().slice(-4)}`;
    const newUserData: RegisterUserData = {
      role,
      fullName: signupName.trim(),
      email: signupEmail.trim().toLowerCase(),
      password: signupPassword,
      username: baseUsername,
      mobileNumber: '09170000000',
      title: role === 'instructor' ? 'Visiting Lecturer' : 'Records Officer',
      department: role === 'instructor' ? 'Department of SSG' : 'Office of the Registrar',
    };

    setTimeout(() => {
      const result = registerUser(newUserData);
      setIsSubmitting(false);

      if (!result.success || !result.user) {
        setErrorMessage(result.error || 'Failed to create account.');
        return;
      }

      onLoginSuccess(result.user);
    }, 350);
  };

  // Recovery Page transition
  if (currentView === 'account_recovery') {
    return (
      <AccountRecoveryPage
        initialEmail={role === 'instructor' ? 'Angelko@gmail.com.edu' : 'registrar@oakridge.edu'}
        onBackToLogin={(newUsername, newPass) => {
          setCurrentView('auth');
          setActiveScreen('signin');
          if (newUsername) setLoginEmail(newUsername);
          if (newPass) setLoginPassword(newPass);
          if (newUsername) {
            setSuccessMessage(`Password updated for @${newUsername}! Ready to sign in.`);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f4f6fb] flex flex-col items-center justify-center p-3 sm:p-6 selection:bg-[#5b58f6] selection:text-white">
      
      {/* Top Institutional Header */}
      <header className="w-full max-w-md flex items-center justify-between gap-3 mb-4 sm:mb-6 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#5b58f6] text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight block leading-tight">
              {getAcademyInfo().name.toUpperCase().replace(/\s+/g, '_')}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Student Attendance Management System
            </span>
          </div>
        </div>

        {/* Current Screen Indicator */}
        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs">
          <span 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeScreen === 'welcome' ? 'bg-[#5b58f6] w-4' : 'bg-slate-300'
            }`} 
          />
          <span 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeScreen === 'signin' ? 'bg-[#5b58f6] w-4' : 'bg-slate-300'
            }`} 
          />
          <span 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeScreen === 'signup' ? 'bg-[#5b58f6] w-4' : 'bg-slate-300'
            }`} 
          />
        </div>
      </header>

      {/* Main Single Card: Responsive for both Mobile and Laptop/Computer */}
      <main className="w-full max-w-[390px] sm:max-w-[420px] transition-all duration-300">
        
        {/* ========================================================================= */}
        {/* SCREEN 1: WELCOME SCREEN (Finora Avatar + Get Started + SSO) */}
        {/* ========================================================================= */}
        {activeScreen === 'welcome' && (
          <div 
            className="w-full bg-white rounded-3xl sm:rounded-[36px] shadow-[0_20px_50px_-12px_rgba(91,88,246,0.12),0_10px_25px_-5px_rgba(0,0,0,0.04)] border border-slate-200/90 p-6 sm:p-7 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Top Avatar Illustration (Stylized Waving Avatar in Purple Shirt) */}
            <div className="flex justify-center my-2 sm:my-4">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#f0f2f8] flex items-center justify-center relative overflow-hidden border border-slate-100 shadow-inner">
                <svg className="w-24 h-24 sm:w-28 sm:h-28 mt-2" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="48" fill="#F0F2F8" />
                  {/* Body / Shirt */}
                  <path d="M25 88 C25 68 38 60 50 60 C62 60 75 68 75 88 Z" fill="#5B58F6" />
                  {/* Neck */}
                  <rect x="44" y="46" width="12" height="16" rx="4" fill="#F8B195" />
                  {/* Head */}
                  <circle cx="50" cy="38" r="16" fill="#F8B195" />
                  {/* Hair */}
                  <path d="M34 34 C34 22 45 18 56 22 C64 25 66 35 66 38 C60 30 52 28 42 32 Z" fill="#1E293B" />
                  {/* Waving Arm */}
                  <path d="M70 72 C78 62 82 48 80 40 C75 39 72 45 68 55 Z" fill="#F8B195" />
                  <circle cx="81" cy="38" r="6" fill="#F8B195" />
                </svg>
              </div>
            </div>

            {/* Typography */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
                Welcome
              </h1>
            </div>

            {/* Primary Action Button: Get Started -> Automatically switches to Sign In */}
            <button
              type="button"
              onClick={() => switchScreen('signin')}
              className="w-full py-3.5 px-6 rounded-full bg-[#5b58f6] hover:bg-[#4f46e5] active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-md shadow-indigo-500/25 transition cursor-pointer flex items-center justify-center gap-2 mb-4"
            >
              <span>Get Started</span>
            </button>


          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: WELCOME BACK / SIGN IN */}
        {/* ========================================================================= */}
        {activeScreen === 'signin' && (
          <div 
            className="w-full bg-white rounded-3xl sm:rounded-[36px] shadow-[0_20px_50px_-12px_rgba(91,88,246,0.12),0_10px_25px_-5px_rgba(0,0,0,0.04)] border border-slate-200/90 p-6 sm:p-7 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Top Navigation Bar: Back arrow button to Welcome */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => switchScreen('welcome')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                title="Back to Welcome"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Step 2 / Sign In
              </span>

              <button
                type="button"
                onClick={() => switchScreen('signup')}
                className="text-xs font-semibold text-[#5b58f6] hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </div>

            {/* Top Shield Icon Badge */}
            <div className="flex flex-col items-center justify-center mb-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-xs">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-[#4f46e5] to-[#6366f1] flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                  <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>
              <div className="w-3.5 h-1 bg-[#5b58f6] rounded-full mt-2 opacity-90" />
            </div>

            {/* Typography */}
            <div className="text-center mb-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                Welcome Back
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Log in to your account to continue.
              </p>
            </div>

            {/* Role Selector Pill */}
            <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-full mb-4 max-w-[240px] mx-auto border border-slate-200/60">
              <button
                type="button"
                onClick={() => handleQuickRoleSelect('instructor')}
                className={`flex-1 py-1 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                  role === 'instructor'
                    ? 'bg-white text-[#5b58f6] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ScreenShare className="w-3 h-3" />
                <span>Instructor</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleSelect('registrar')}
                className={`flex-1 py-1 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                  role === 'registrar'
                    ? 'bg-white text-[#5b58f6] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Registrar</span>
              </button>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSignInSubmit} className="space-y-3">
              
              {/* Field 1: Email / Username */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Email
                </label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#5b58f6] focus:ring-2 focus:ring-[#5b58f6]/20 bg-white text-slate-900 text-sm transition outline-none"
                />
              </div>

              {/* Field 2: Password */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:border-[#5b58f6] focus:ring-2 focus:ring-[#5b58f6]/20 bg-white text-slate-900 text-sm transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Controls: Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#5b58f6] focus:ring-[#5b58f6] cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setCurrentView('account_recovery')}
                  className="text-slate-700 hover:text-[#5b58f6] font-medium transition cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Primary Action Button: Sign In */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 rounded-full bg-[#5b58f6] hover:bg-[#4f46e5] active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-indigo-500/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Signing In...</span>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </div>


              {/* Bottom Link: Don't have an account? Sign Up -> Automatically changes to Sign Up */}
              <div className="pt-2 text-center">
                <span className="text-xs text-slate-500">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => switchScreen('signup')}
                  className="text-xs font-semibold text-[#5b58f6] hover:underline cursor-pointer ml-0.5"
                >
                  Sign Up
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: CREATE ACCOUNT */}
        {/* ========================================================================= */}
        {activeScreen === 'signup' && (
          <div 
            className="w-full bg-white rounded-3xl sm:rounded-[36px] shadow-[0_20px_50px_-12px_rgba(91,88,246,0.12),0_10px_25px_-5px_rgba(0,0,0,0.04)] border border-slate-200/90 p-6 sm:p-7 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Top Navigation Bar: Back arrow button to Sign In */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => switchScreen('signin')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                title="Back to Sign In"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Step 3 / Create Account
              </span>

              <button
                type="button"
                onClick={() => switchScreen('signin')}
                className="text-xs font-semibold text-[#5b58f6] hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>

            {/* Top Avatar Illustration with small plus badge */}
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#f0f2f8] flex items-center justify-center overflow-hidden border border-slate-100">
                  <svg className="w-12 h-12 sm:w-14 sm:h-14 mt-1" viewBox="0 0 100 100" fill="none">
                    <path d="M25 88 C25 68 38 60 50 60 C62 60 75 68 75 88 Z" fill="#5B58F6" />
                    <rect x="44" y="46" width="12" height="16" rx="4" fill="#F8B195" />
                    <circle cx="50" cy="38" r="16" fill="#F8B195" />
                    <path d="M34 34 C34 22 45 18 56 22 C64 25 66 35 66 38 C60 30 52 28 42 32 Z" fill="#1E293B" />
                  </svg>
                </div>
                {/* Plus Badge */}
                <div className="w-5 h-5 rounded-full bg-[#5b58f6] text-white flex items-center justify-center text-xs font-bold absolute -top-0.5 -right-0.5 border-2 border-white shadow-xs">
                  +
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="text-center mb-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                Create Account
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Sign up to get started with your dashboard.
              </p>
            </div>

            {/* Role Selector Pill */}
            <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-full mb-4 max-w-[240px] mx-auto border border-slate-200/60">
              <button
                type="button"
                onClick={() => handleQuickRoleSelect('instructor')}
                className={`flex-1 py-1 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                  role === 'instructor'
                    ? 'bg-white text-[#5b58f6] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ScreenShare className="w-3 h-3" />
                <span>Instructor</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleSelect('registrar')}
                className={`flex-1 py-1 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                  role === 'registrar'
                    ? 'bg-white text-[#5b58f6] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Registrar</span>
              </button>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              
              {/* Field 1: Full Name */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => {
                    setSignupName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#5b58f6] focus:ring-2 focus:ring-[#5b58f6]/20 bg-white text-slate-900 text-sm transition outline-none"
                />
              </div>

              {/* Field 2: Email */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => {
                    setSignupEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#5b58f6] focus:ring-2 focus:ring-[#5b58f6]/20 bg-white text-slate-900 text-sm transition outline-none"
                />
              </div>

              {/* Field 3: Password */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Create a password (min 8 chars)"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:border-[#5b58f6] focus:ring-2 focus:ring-[#5b58f6]/20 bg-white text-slate-900 text-sm transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Primary Action Button: Create Account */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 rounded-full bg-[#5b58f6] hover:bg-[#4f46e5] active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-indigo-500/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Creating Account...</span>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>


              {/* Bottom Link: Already have an account? Sign In -> Automatically changes to Sign In */}
              <div className="pt-2 text-center">
                <span className="text-xs text-slate-500">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => switchScreen('signin')}
                  className="text-xs font-semibold text-[#5b58f6] hover:underline cursor-pointer ml-0.5"
                >
                  Sign In
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* Demo Credentials Quick-Autofill Bar at Footer */}
      <footer className="mt-5 text-center text-xs text-slate-600 bg-white/95 py-2 px-4 rounded-full border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-center gap-2 max-w-md">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-[#5b58f6]" />
          <span>Quick Autofill:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              handleQuickRoleSelect('instructor');
              if (activeScreen === 'welcome') switchScreen('signin');
            }}
            className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-[#5b58f6] text-slate-700 font-semibold transition cursor-pointer border border-slate-200/60"
          >
            Instructor
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => {
              handleQuickRoleSelect('registrar');
              if (activeScreen === 'welcome') switchScreen('signin');
            }}
            className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-[#5b58f6] text-slate-700 font-semibold transition cursor-pointer border border-slate-200/60"
          >
            Registrar
          </button>
        </div>
      </footer>

    </div>
  );
}
