'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'signup';
type SignupStep = 'email' | 'code' | 'password';

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('login');

  // login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // signup state
  const [signupStep, setSignupStep] = useState<SignupStep>('email');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
    });
  }, [router]);

  useEffect(() => {
    if (signupStep === 'code') codeRef.current?.focus();
  }, [signupStep]);

  function switchMode(m: Mode) {
    setMode(m);
    setError('');
    setSignupStep('email');
    setSignupCode('');
    setSignupPassword('');
    setSignupConfirm('');
  }

  // ── Login ────────────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) setError(error.message);
    else router.replace('/');
    setLoading(false);
  }

  // ── Sign-up step 1: send OTP ─────────────────────────────────────────────

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: signupEmail,
      options: { shouldCreateUser: true },
    });
    if (error) setError(error.message);
    else setSignupStep('code');
    setLoading(false);
  }

  // ── Sign-up step 2: verify OTP ───────────────────────────────────────────

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: signupEmail,
      token: signupCode,
      type: 'email',
    });
    if (error) setError(error.message);
    else setSignupStep('password');
    setLoading(false);
  }

  // ── Sign-up step 3: set password ─────────────────────────────────────────

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: signupPassword });
    if (error) setError(error.message);
    else router.replace('/');
    setLoading(false);
  }

  // ── Google ───────────────────────────────────────────────────────────────

  async function handleGoogle() {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  // ── Step label ───────────────────────────────────────────────────────────

  const stepLabel: Record<SignupStep, string> = {
    email: 'Enter your email',
    code: 'Check your inbox',
    password: 'Set your password',
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="text-5xl">🍊</div>
          <p className="text-xl font-semibold text-gray-800">Mandarines</p>
          <p className="text-sm text-gray-500">Track your progress across devices</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* ── Login form ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="Email"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
              <input
                type="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}

          {/* ── Sign-up flow ── */}
          {mode === 'signup' && (
            <div className="space-y-4">
              {/* step indicator */}
              <div className="flex items-center gap-2">
                {(['email', 'code', 'password'] as SignupStep[]).map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      signupStep === s
                        ? 'bg-red-600 text-white'
                        : ['email', 'code', 'password'].indexOf(signupStep) > i
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {['email', 'code', 'password'].indexOf(signupStep) > i ? '✓' : i + 1}
                    </div>
                    {i < 2 && <div className="flex-1 h-px bg-gray-200 w-6" />}
                  </div>
                ))}
                <span className="text-xs text-gray-500 ml-1">{stepLabel[signupStep]}</span>
              </div>

              {/* Step 1: email */}
              {signupStep === 'email' && (
                <form onSubmit={handleSendCode} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  />
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Sending…' : 'Send code'}
                  </button>
                </form>
              )}

              {/* Step 2: OTP code */}
              {signupStep === 'code' && (
                <form onSubmit={handleVerifyCode} className="space-y-3">
                  <p className="text-sm text-gray-500">
                    We sent a 6-digit code to <span className="font-medium text-gray-700">{signupEmail}</span>.
                  </p>
                  <input
                    ref={codeRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={signupCode}
                    onChange={e => setSignupCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  />
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading || signupCode.length !== 6}
                    className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Verifying…' : 'Verify code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupStep('email')}
                    className="w-full text-xs text-gray-400 hover:text-gray-600"
                  >
                    Wrong email? Go back
                  </button>
                </form>
              )}

              {/* Step 3: set password */}
              {signupStep === 'password' && (
                <form onSubmit={handleSetPassword} className="space-y-3">
                  <p className="text-sm text-gray-500">Email verified! Now set a password for your account.</p>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    placeholder="Password (min 6 characters)"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  />
                  <input
                    type="password"
                    required
                    value={signupConfirm}
                    onChange={e => setSignupConfirm(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  />
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Creating account…' : 'Create account'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          Your progress is saved to your account and syncs across devices.
        </p>
      </div>
    </div>
  );
}
