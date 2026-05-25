'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { useGroupStore } from '../store/useGroupStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth, login } = useAuthStore();
  const { resetStore: resetAssignmentStore, fetchAssignments } = useAssignmentStore();
  const { resetStore: resetGroupStore, fetchGroups } = useGroupStore();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');

  // Check existing session on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleSuccess = (token: string, user: any) => {
    // 1. Clear the old account's data from the stores
    resetAssignmentStore();
    resetGroupStore();
    // 2. Store new session data in localStorage + Zustand
    login(token, user);
    // 3. Fetch this user's data fresh
    fetchAssignments();
    fetchGroups();
    // 4. Navigate to dashboard
    router.push('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isLoginMode) {
      if (!email.trim() || !password) {
        setError('Email and password are required.');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Invalid email or password.');
        }

        handleSuccess(data.token, data.user);
      } catch (err: any) {
        setError(err.message || 'Server connection failed. Try again.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!name.trim() || !email.trim() || !password || !confirmPassword || !schoolName.trim() || !schoolCity.trim()) {
        setError('All fields are required.');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            schoolName: schoolName.trim(),
            schoolCity: schoolCity.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create account.');
        }

        handleSuccess(data.token, data.user);
      } catch (err: any) {
        setError(err.message || 'Server connection failed. Try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsLoginMode((prev) => !prev);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setSchoolName('');
    setSchoolCity('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError(null);
  };

  // Show spinner while verifying existing session
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-screen bg-gray-50 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-gray-500 font-medium text-sm">Checking secure session...</p>
      </div>
    );
  }

  // Already authenticated — render the protected page
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated — show login/register form
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 font-sans p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-200/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-red-200/10 blur-3xl pointer-events-none" />

      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl w-full max-w-md p-8 md:p-10 flex flex-col space-y-6 relative z-10">

        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
            <span className="text-white font-extrabold text-2xl">V</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight mt-2">
            {isLoginMode ? 'Login to VedaAI' : 'Create VedaAI Account'}
          </h2>
          <p className="text-xs text-gray-400 max-w-xs">
            {isLoginMode
              ? 'Welcome back! Login to continue securely.'
              : 'Start designing AI question papers for your classes.'}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4" noValidate>

          {/* Full Name — signup only */}
          {!isLoginMode && (
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tirth Patel"
                autoComplete="name"
                className="w-full px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 rounded-xl text-sm"
              />
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. tirth@school.edu"
              autoComplete="email"
              className="w-full px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 rounded-xl text-sm"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 rounded-xl text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Signup-only fields */}
          {!isLoginMode && (
            <>
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-gray-500">School Name</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Delhi Public School"
                  className="w-full px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 rounded-xl text-sm"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-gray-500">School City</label>
                <input
                  type="text"
                  value={schoolCity}
                  onChange={(e) => setSchoolCity(e.target.value)}
                  placeholder="e.g. Bokaro Steel City"
                  className="w-full px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 rounded-xl text-sm"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isLoginMode ? 'Login' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </>
            )}
          </button>

        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-xs text-orange-500 hover:text-orange-600 font-bold transition-colors"
          >
            {isLoginMode ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-semibold border-t border-gray-100 pt-4 text-center">
          <GraduationCap className="w-4 h-4 text-orange-500" />
          <span>VedaAI Secure Assessment System v1.1</span>
        </div>

      </div>
    </div>
  );
}
