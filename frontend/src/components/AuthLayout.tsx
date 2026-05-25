'use client';

import React, { useState, useEffect } from 'react';
import { GraduationCap, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth, login } = useAuthStore();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState<boolean>(true); // Default to login

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isLogin) {
      if (!email || !password) {
        setError('Email and password are required.');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Invalid credentials');
        }
        
        login(data.token, data.user);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Server connection failed. Try again.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!name || !email || !password || !confirmPassword || !schoolName || !schoolCity) {
        setError('All fields are required.');
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
            name,
            email,
            password,
            schoolName,
            schoolCity,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to register account.');
        }

        login(data.token, data.user);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Server connection failed. Try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setSchoolName('');
    setSchoolCity('');
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-screen bg-gray-50 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-gray-500 font-medium">Checking secure session...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  // ACCOUNT CREATION / REGISTER PAGE
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 font-sans p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-200/20 blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-red-200/10 blur-3xl"></div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl w-full max-w-md p-8 md:p-10 flex flex-col space-y-6 relative z-10">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
            <span className="text-white font-extrabold text-2xl">V</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight mt-2">
            {isLogin ? 'Login to VedaAI' : 'Create VedaAI Account'}
          </h2>
          <p className="text-xs text-gray-400 max-w-xs">
            {isLogin ? 'Welcome back! Login to continue securely.' : 'Start designing AI question papers and assessment metrics for your classes.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          
          {!isLogin && (
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tirth"
                className="w-full px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 rounded-xl text-sm"
              />
            </div>
          )}

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. tirth@school.edu"
              className="w-full px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 rounded-xl text-sm"
            />
          </div>

          <div className="flex flex-col space-y-1.5 relative">
            <label className="text-xs font-bold text-gray-500">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 rounded-xl text-sm"
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

          {!isLogin && (
            <>
              <div className="flex flex-col space-y-1.5 relative">
                <label className="text-xs font-bold text-gray-500">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 rounded-xl text-sm"
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
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Delhi Public School"
                  className="w-full px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 rounded-xl text-sm"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-gray-500">School City</label>
                <input
                  type="text"
                  required
                  value={schoolCity}
                  onChange={(e) => setSchoolCity(e.target.value)}
                  placeholder="e.g. Bokaro Steel City"
                  className="w-full px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 rounded-xl text-sm"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gray-900 text-white hover:bg-gray-800 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Login' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </>
            )}
          </button>

        </form>
        
        <div className="text-center mt-4">
          <button 
            type="button" 
            onClick={toggleMode} 
            className="text-xs text-orange-500 hover:text-orange-600 font-bold"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-semibold border-t border-gray-50 pt-4 text-center">
          <GraduationCap className="w-4 h-4 text-orange-500" />
          <span>VedaAI Secure Assessment System v1.1</span>
        </div>

      </div>
    </div>
  );
}
