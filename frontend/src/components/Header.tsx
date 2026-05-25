'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Bell, 
  ChevronDown, 
  Grid, 
  LogOut, 
  Settings, 
  User, 
  Info,
  Menu
} from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { useAuthStore } from '../store/useAuthStore';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const assignments = useAssignmentStore((state) => state.assignments);
  const logout = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);

  // Derive display values from the auth store's user object (source of truth)
  const userName = authUser?.name || 'User';
  const userEmail = authUser?.email || '';
  const userInitials = userName
    .split(' ')
    .map((w: string) => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Refs for closing dropdowns on outside clicks
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(true);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const storedAvatar = localStorage.getItem('veda_user_avatar');
    if (storedAvatar) setAvatar(storedAvatar);
  }, [authUser]); // re-run when user changes

  // Handle outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Sign Out Handler
  const handleSignOut = () => {
    setShowSignOutConfirm(true);
    setShowProfileMenu(false);
  };

  // Dynamic notifications list
  const getNotificationsList = () => {
    const list = [
      { id: '1', title: '🎉 Account created successfully', desc: 'Welcome to VedaAI Assessment Creator.', time: 'Just now' }
    ];
    if (assignments.length > 0) {
      assignments.slice(0, 2).forEach((a, i) => {
        list.unshift({
          id: `a-${i}`,
          title: `📄 ${a.title} generated`,
          desc: `Ready for PDF export (${a.totalQuestions} questions, ${a.totalMarks} marks).`,
          time: 'Recently'
        });
      });
    }
    return list;
  };

  // Determine back label and destination
  let title = 'Assignment';
  let canGoBack = true;
  let backDestination = '/dashboard';

  if (pathname === '/' || pathname === '/dashboard') {
    title = 'Assignment';
    canGoBack = false;
  } else if (pathname === '/create') {
    title = 'Create Assignment';
    backDestination = '/dashboard';
  } else if (pathname.startsWith('/assignments/')) {
    title = 'Create New';
    backDestination = '/dashboard';
  } else if (pathname === '/groups') {
    title = 'My Classes';
    canGoBack = false;
  } else if (pathname === '/toolkit') {
    title = 'Analytics';
    canGoBack = false;
  } else if (pathname === '/library') {
    title = 'My Library';
    canGoBack = false;
  } else if (pathname === '/settings') {
    title = 'Settings';
    canGoBack = false;
  }

  const handleBack = () => {
    if (canGoBack) {
      router.push(backDestination);
    }
  };

  return (
    <header className="flex items-center justify-between py-4 px-6 md:px-8 bg-transparent shrink-0 relative z-20 select-none">
      
      {/* Navigation Path & Mobile Logo */}
      <div className="flex items-center gap-3">
        {canGoBack ? (
          <button 
            onClick={handleBack}
            className="p-2 bg-white hover:bg-gray-50 border border-gray-150 rounded-full transition-all duration-200 text-gray-500 hover:text-gray-950 flex items-center justify-center shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          /* Mobile Logo (hidden on desktop because sidebar is visible) */
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-sm font-sans">V</span>
            </div>
            <span className="text-lg font-black text-gray-900 tracking-tight font-sans">
              VedaAI
            </span>
          </div>
        )}
        
        {/* Desktop Breadcrumb Path */}
        <div className="hidden lg:flex items-center gap-2 text-gray-405 font-medium">
          <Grid className="w-5 h-5 text-gray-400" />
          <span className="text-sm tracking-wide font-sans">{title}</span>
        </div>
      </div>

      {/* User Actions & Mobile Hamburger Menu */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadNotifications(false);
            }}
            className="relative p-2.5 bg-white border border-gray-100 rounded-full text-gray-500 hover:text-orange-500 hover:shadow-sm transition-all duration-200 cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 border border-white rounded-full"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl py-3 px-4 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              <h4 className="font-extrabold text-xs text-gray-850 uppercase tracking-wider pb-2 border-b border-gray-50">
                Recent Notifications
              </h4>
              <div className="space-y-3 mt-3 max-h-60 overflow-y-auto">
                {getNotificationsList().map((n) => (
                  <div key={n.id} className="text-left space-y-0.5">
                    <p className="text-xs font-bold text-gray-800 leading-tight">
                      {n.title}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {n.desc}
                    </p>
                    <span className="text-[9px] text-orange-500 font-semibold block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-orange-100 shadow-sm bg-orange-50 flex items-center justify-center shrink-0">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-orange-600 font-bold text-xs sm:text-sm">{userInitials}</span>
              )}
            </div>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-0.5 sm:gap-1 group text-left cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors truncate max-w-[80px] sm:max-w-none">
                {userName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-transform duration-200" />
            </button>
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-gray-55 text-left">
                <p className="text-xs font-bold text-gray-800 truncate">{userName}</p>
                <p className="text-[9px] text-gray-400 truncate">{userEmail}</p>
              </div>

              <Link
                href="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-600 hover:bg-orange-55/70 hover:text-orange-500 flex items-center gap-2 transition-all"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span>Account Settings</span>
              </Link>

              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger menu toggle */}
        {onToggleMobileMenu && (
          <button 
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2.5 bg-white border border-gray-100 rounded-full text-gray-500 hover:text-orange-500 hover:shadow-sm transition-all cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

      </div>

      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-150 p-6 rounded-3xl max-w-sm w-full mx-4 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-sm text-gray-800">Sign Out?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Are you sure you want to sign out? You will need to re-register to access the teacher portal again.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 border border-gray-150 hover:bg-gray-50 rounded-full text-xs font-semibold text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSignOutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold transition-all shadow-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
