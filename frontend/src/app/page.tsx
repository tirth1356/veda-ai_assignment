'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileSpreadsheet, 
  ChevronRight,
  BookOpen
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col selection:bg-orange-500 selection:text-white relative overflow-hidden">
      
      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-300px] left-[-200px] w-[800px] h-[800px] rounded-full bg-orange-200/20 blur-3xl -z-10"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[800px] h-[800px] rounded-full bg-orange-100/10 blur-3xl -z-10"></div>

      {/* 1. Header Navigation */}
      <header className="max-w-7xl mx-auto w-full px-6 md:px-12 py-6 flex justify-between items-center z-10 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
            <span className="text-white font-extrabold text-xl">V</span>
          </div>
          <span className="text-2xl font-extrabold text-gray-800 tracking-tight">
            Veda<span className="text-orange-500">AI</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
          <a href="#features" className="hover:text-orange-500 transition-colors">Features</a>
          <a href="#purpose" className="hover:text-orange-500 transition-colors">Purpose</a>
          <a href="#audience" className="hover:text-orange-500 transition-colors">Target Audience</a>
        </nav>

        {/* Portal Login Button */}
        <Link 
          href="/dashboard"
          className="flex items-center gap-1.5 py-2.5 px-5 bg-gray-900 text-white rounded-full font-bold text-xs hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
        >
          <span>Enter Portal</span>
          <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
        </Link>
      </header>

      {/* 2. Hero Section */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 pt-16 md:pt-24 text-center flex flex-col items-center space-y-6 z-10">
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-[10px] font-black text-orange-600 tracking-widest uppercase">
          <Sparkles className="w-3 h-3 text-orange-500" />
          <span>Supporting Teachers. Strengthening Together.</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight max-w-4xl">
          At VedaAI, we believe great outcomes start with <span className="text-orange-500 underline decoration-wavy decoration-orange-200">empowered teachers</span>.
        </h1>

        <p className="text-sm md:text-base text-gray-500 max-w-2xl leading-relaxed">
          VedaAI is designed to support you across assessment, planning, and classroom execution so you can focus on teaching, mentoring, and student growth.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 py-3.5 px-8 bg-gray-900 text-white hover:bg-gray-800 rounded-full font-extrabold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <span>Enter Teacher Portal</span>
            <ArrowRight className="w-4 h-4 text-orange-400" />
          </Link>
          
          <a
            href="#features"
            className="flex items-center justify-center gap-1 py-3.5 px-8 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full font-bold text-sm shadow-sm transition-all"
          >
            <span>Learn More</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </a>
        </div>

      </section>

      {/* 3. Core Statement */}
      <section id="purpose" className="max-w-4xl mx-auto px-6 md:px-12 py-20 text-center z-10">
        <div className="bg-white border border-gray-150 rounded-3xl p-8 md:p-12 shadow-sm border-l-8 border-l-orange-500 flex flex-col space-y-4">
          <GraduationCap className="w-10 h-10 text-orange-500 mx-auto" />
          <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight leading-relaxed max-w-3xl mx-auto">
            An AI academic system for assessment, teaching, and personalised learning – designed to improve academic outcomes, reduce cost & time, and strengthen institutional credibility.
          </h2>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="max-w-6xl mx-auto w-full px-6 md:px-12 py-12 z-10">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">Built to Save Time & Elevate Quality</h2>
          <p className="text-xs text-gray-400">Streamline your daily administrative workload in seconds</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-lg text-gray-800 leading-snug">AI Question Generator</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Create structured CBSE exam papers based on customized guidelines, topics, and source materials automatically.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-lg text-gray-800 leading-snug">Time & Cost Savings</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Cut document creation overhead by up to 90%. Focus your time back on interactive class hours and mentoring students.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-lg text-gray-800 leading-snug">Institutional Credibility</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Format test papers professionally with stacked marks and lines. Include automated detailed answer key solutions.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Target Audience Section */}
      <section id="audience" className="max-w-5xl mx-auto w-full px-6 md:px-12 py-16 z-10 text-center">
        <div className="bg-gray-900 border border-gray-800 text-white rounded-3xl p-8 md:p-12 shadow-lg space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Who is VedaAI for?</h2>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Exclusively built for Educators</p>
          </div>

          <p className="text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
            Whether you are a <strong className="font-extrabold text-white">Grade School Teacher</strong>, a <strong className="font-extrabold text-white">Roster Supervisor</strong>, or an <strong className="font-extrabold text-white">Educational Institution</strong>, VedaAI provides the co-pilot tools necessary to create learning rubrics, lesson grids, and high-fidelity testing papers.
          </p>

          <div className="flex justify-center pt-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 py-3 px-6 bg-white hover:bg-gray-50 text-gray-900 rounded-full font-bold text-xs shadow-md transition-all"
            >
              <span>Get Started Now</span>
              <ChevronRight className="w-4 h-4 text-orange-500" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto border-t border-gray-150 py-8 text-center text-xs text-gray-400 font-semibold">
        <p>© {new Date().getFullYear()} VedaAI Assessment Copilot. Empowering teachers, strengthening outcomes.</p>
      </footer>

    </div>
  );
}
