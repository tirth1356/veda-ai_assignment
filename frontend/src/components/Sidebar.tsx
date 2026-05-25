'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutGrid, 
  Users, 
  FileText, 
  BookOpen, 
  Clock, 
  Settings, 
  Sparkles,
  X
} from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';

interface SidebarProps {
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export default function Sidebar({ isMobileDrawer = false, onCloseMobileDrawer }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const assignments = useAssignmentStore((state) => state.assignments);

  const [schoolName, setSchoolName] = React.useState('Delhi Public School');
  const [schoolCity, setSchoolCity] = React.useState('Bokaro Steel City');
  const [schoolInitials, setSchoolInitials] = React.useState('DPS');
  const [avatar, setAvatar] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedSchool = localStorage.getItem('veda_school_name');
    const storedCity = localStorage.getItem('veda_school_city');
    const storedAvatar = localStorage.getItem('veda_user_avatar');
    if (storedSchool) {
      setSchoolName(storedSchool);
      const initials = storedSchool
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 3);
      setSchoolInitials(initials);
    }
    if (storedCity) {
      setSchoolCity(storedCity);
    }
    if (storedAvatar) {
      setAvatar(storedAvatar);
    }
  }, []);

  const menuItems = [
    { name: 'Home', icon: LayoutGrid, href: '/dashboard' },
    { name: 'My Groups', icon: Users, href: '/groups' },
    { name: 'Assignments', icon: FileText, href: '/assignments', badge: assignments.length || undefined },
    { name: 'AI Teacher\'s Toolkit', icon: BookOpen, href: '/toolkit' },
    { name: 'My Library', icon: Clock, href: '/library' },
  ];

  const handleLinkClick = () => {
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const containerClass = isMobileDrawer
    ? "w-72 bg-white border-r border-gray-100 flex flex-col h-full p-6 shadow-xl relative"
    : "hidden lg:flex w-72 bg-white border border-gray-100 rounded-3xl p-6 flex-col h-[calc(100vh-2rem)] my-4 ml-4 shadow-sm select-none shrink-0 transition-colors duration-300";

  return (
    <aside className={containerClass}>
      {/* Mobile Drawer Close Button */}
      {isMobileDrawer && onCloseMobileDrawer && (
        <button 
          onClick={onCloseMobileDrawer}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-50 border border-gray-150 rounded-xl text-gray-400 hover:text-gray-650"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
          <span className="text-white font-extrabold text-xl font-sans">V</span>
        </div>
        <span className="text-2xl font-black text-gray-900 tracking-tight font-sans">
          VedaAI
        </span>
      </div>

      {/* Action Button: Create Assignment */}
      <Link 
        href="/create"
        onClick={handleLinkClick}
        className="group relative w-full mb-8 flex items-center justify-center gap-2 py-3 px-4 bg-[#18181b] text-white border border-orange-500/80 rounded-full font-bold text-xs transition-all duration-300 shadow-[0_0_12px_rgba(249,115,22,0.25)] hover:shadow-[0_0_15px_rgba(249,115,22,0.35)] overflow-hidden"
      >
        <Sparkles className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
        <span>Create Assignment</span>
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.name === 'Assignments' && pathname.startsWith('/assignments'));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                isActive 
                  ? 'bg-gray-100 text-gray-800 shadow-sm font-bold font-sans' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings at Bottom */}
      <div className="border-t border-gray-100 pt-4 mt-auto space-y-4">
        <Link
          href="/settings"
          onClick={(e) => {
            if (pathname === '/settings') {
              e.preventDefault();
              router.back();
            } else {
              handleLinkClick();
            }
          }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            pathname === '/settings'
              ? 'bg-gray-100 text-gray-800 shadow-sm font-bold font-sans'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Settings className={`w-5 h-5 ${pathname === '/settings' ? 'text-orange-500' : 'text-gray-400'}`} />
          <span>Settings</span>
        </Link>

        <div className="flex items-center gap-3 p-3 bg-gray-100/70 hover:bg-gray-100/90 border border-transparent transition-all rounded-2xl">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-orange-100 border border-orange-200 shadow-sm">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" fill="currentColor" />
                <path d="M12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-gray-900 truncate">{schoolName}</h4>
            <p className="text-[10px] text-gray-400 truncate">{schoolCity}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
