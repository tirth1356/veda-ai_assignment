'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Save, User, School, Cpu, CheckCircle2, Loader2 } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');
  
  // Teacher defaults and notifications settings states
  const [defaultSubject, setDefaultSubject] = useState('Science');
  const [defaultGrade, setDefaultGrade] = useState('Grade 8');
  const [autoAnswerKey, setAutoAnswerKey] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Avatar state
  const [avatar, setAvatar] = useState<string | null>(null);

  const showToast = useToastStore((state) => state.showToast);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Avatar image size must be less than 2MB.', 'error');
        setError('Avatar image size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    // Load current settings from localStorage
    setName(localStorage.getItem('veda_user_name') || '');
    setEmail(localStorage.getItem('veda_user_email') || '');
    setSchoolName(localStorage.getItem('veda_school_name') || '');
    setSchoolCity(localStorage.getItem('veda_school_city') || '');
    
    // Load Teacher Defaults
    setDefaultSubject(localStorage.getItem('veda_default_subject') || 'Science');
    setDefaultGrade(localStorage.getItem('veda_default_grade') || 'Grade 8');
    
    const storedAutoAnswer = localStorage.getItem('veda_auto_answer_key');
    if (storedAutoAnswer !== null) {
      setAutoAnswerKey(storedAutoAnswer === 'true');
    }
    const storedEmailNotif = localStorage.getItem('veda_email_notifications');
    if (storedEmailNotif !== null) {
      setEmailNotifications(storedEmailNotif === 'true');
    }

    // Load Avatar
    setAvatar(localStorage.getItem('veda_user_avatar') || null);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      // 1. Save locally
      localStorage.setItem('veda_user_name', name);
      localStorage.setItem('veda_school_name', schoolName);
      localStorage.setItem('veda_school_city', schoolCity);
      localStorage.setItem('veda_default_subject', defaultSubject);
      localStorage.setItem('veda_default_grade', defaultGrade);
      localStorage.setItem('veda_auto_answer_key', String(autoAnswerKey));
      localStorage.setItem('veda_email_notifications', String(emailNotifications));
      if (avatar) {
        localStorage.setItem('veda_user_avatar', avatar);
      } else {
        localStorage.removeItem('veda_user_avatar');
      }

      // 2. Call backend to update MongoDB (Sync)
      if (email) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/${email}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name,
              schoolName,
              schoolCity,
            }),
          });

          if (!response.ok) {
            console.warn('Failed to update server record.');
          }
        } catch (e) {
          console.warn('Backend sync failed (network error), but local settings saved:', e);
        }
      }

      showToast('Settings saved successfully! Reloading to apply changes...', 'success');
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to save settings.', 'error');
      setError(err.message || 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col space-y-6">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Account Settings</h1>
        </div>
        <p className="text-xs text-gray-400">Configure profile, school contexts, and LLM providers</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-3 rounded-2xl font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Settings saved successfully! School updates will reflect on sidebar after reload.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col space-y-6 pb-12">
        
        {/* Card 1: User Profile */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <User className="w-4 h-4 text-orange-500" />
            <h3 className="font-extrabold text-sm text-gray-800">Profile Information</h3>
          </div>

          {/* Avatar Upload Container */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-gray-50">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-orange-100 flex items-center justify-center bg-orange-50 shrink-0 shadow-sm">
              {avatar ? (
                <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-orange-400" />
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <label className="block text-xs font-bold text-gray-700">Upload Profile Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-655 hover:file:bg-orange-100 cursor-pointer"
              />
              <p className="text-[10px] text-gray-400">Supports PNG, JPG, or GIF up to 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Teacher Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-transparent border border-gray-200 text-gray-800 rounded-xl text-xs"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-4 py-2.5 bg-gray-55 border border-gray-200 text-gray-400 rounded-xl text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Card 2: School Settings */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <School className="w-4 h-4 text-orange-500" />
            <h3 className="font-extrabold text-sm text-gray-800">School Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-500">School Name</label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-4 py-2.5 bg-transparent border border-gray-200 text-gray-800 rounded-xl text-xs"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-500">City / Location</label>
              <input
                type="text"
                required
                value={schoolCity}
                onChange={(e) => setSchoolCity(e.target.value)}
                className="w-full px-4 py-2.5 bg-transparent border border-gray-200 text-gray-800 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Teacher Settings & Defaults */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <Cpu className="w-4 h-4 text-orange-500" />
            <h3 className="font-extrabold text-sm text-gray-800">Teacher Settings & Defaults</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Default Subject</label>
              <input
                type="text"
                required
                value={defaultSubject}
                onChange={(e) => setDefaultSubject(e.target.value)}
                className="w-full px-4 py-2.5 bg-transparent border border-gray-200 text-gray-800 rounded-xl text-xs"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Default Grade Level</label>
              <select
                value={defaultGrade}
                onChange={(e) => setDefaultGrade(e.target.value)}
                className="w-full px-4 py-2.5 bg-transparent border border-gray-200 text-gray-800 rounded-xl text-xs bg-white text-gray-700"
              >
                <option value="LKG">LKG</option>
                <option value="UKG">UKG</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={`Grade ${g}`}>Grade {g}</option>
                ))}
                <option value="University">University</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col space-y-3 pt-3 border-t border-gray-50">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAnswerKey}
                onChange={(e) => setAutoAnswerKey(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-xs font-semibold text-gray-600">Enable Automated Answer Key Generation</span>
            </label>


          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 border border-transparent text-white hover:bg-gray-800 rounded-full font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
            ) : (
              <Save className="w-4 h-4 text-orange-400" />
            )}
            <span>Save Configurations</span>
          </button>
        </div>

      </form>

    </div>
  );
}
