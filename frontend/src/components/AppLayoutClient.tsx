'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutGrid, 
  FileText, 
  Clock, 
  BookOpen, 
  Plus 
} from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import AuthLayout from './AuthLayout';
import ToastContainer from './ToastContainer';

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const hasToken = localStorage.getItem('veda_token');
    if (pathname === '/' && hasToken) {
      // User is logged in, redirect them away from landing page directly to dashboard
      router.push('/dashboard');
    } else {
      setCheckingAuth(false);
    }
  }, [pathname, router]);

  // Handle drawer close on navigation change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // If we are on the landing page, render it directly without sidebar/header/auth
  if (pathname === '/') {
    // Show empty screen or loading if user is authenticated and is being redirected
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('veda_token');
    if (hasToken) {
      return (
        <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-pulse text-xs text-gray-400 font-bold">Redirecting to portal...</div>
        </div>
      );
    }
    return (
      <div className="w-full min-h-screen bg-gray-50 overflow-y-auto relative">
        <ToastContainer />
        {children}
      </div>
    );
  }

  const mobileNavItems = [
    { name: 'Home', icon: LayoutGrid, href: '/dashboard' },
    { name: 'Assignments', icon: FileText, href: '/assignments' },
    { name: 'Library', icon: Clock, href: '/library' },
    { name: 'AI Toolkit', icon: BookOpen, href: '/toolkit' },
  ];

  return (
    <AuthLayout>
      <div className="flex bg-gray-100 text-gray-900 font-sans h-screen w-full overflow-hidden relative">
        <ToastContainer />
        
        {/* Mobile Slide-out Drawer Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black/40 transition-opacity animate-in fade-in duration-200" 
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer side panel */}
            <div className="relative flex-1 flex flex-col max-w-[288px] w-full bg-white shadow-xl animate-in slide-in-from-left duration-250 ease-out z-50">
              <Sidebar isMobileDrawer={true} onCloseMobileDrawer={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Desktop Sidebar (hidden on mobile) */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden pb-[72px] lg:pb-0">
          <Header onToggleMobileMenu={() => setMobileMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 relative flex flex-col">
            <div className="flex-1 min-h-full">
              {children}
            </div>
            {/* Custom Footer */}
            <footer className="mt-12 py-6 border-t border-gray-200 text-center text-xs text-gray-500 font-medium">
              Made with ❤️ by <a href="https://github.com/tirth1356" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 font-bold transition-colors">Tirth</a>. 
              Check out my <a href="https://tirth1356.vercel.app" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 font-bold transition-colors">Portfolio</a> & <a href="https://github.com/tirth1356" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 font-bold transition-colors">GitHub</a>.
            </footer>
          </main>
        </div>

        {/* Mobile Floating White FAB Create Button */}
        <Link 
          href="/create"
          className="lg:hidden fixed bottom-24 right-6 z-40 w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95 transition-transform"
          aria-label="Create Assignment"
        >
          <Plus className="w-6 h-6 text-orange-500 font-black" />
        </Link>

        {/* Mobile Floating Bottom Navigation Bar (Pill capsule) */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40 bg-[#18181b] border border-gray-800 rounded-2xl py-3 px-4 shadow-xl flex justify-around items-center select-none">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || (item.name === 'Assignments' && pathname.startsWith('/assignments'));
            const Icon = item.icon;

            return (
              <Link 
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5"
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span className={`text-[9px] font-bold ${isActive ? 'text-white font-black' : 'text-gray-500'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </AuthLayout>
  );
}
