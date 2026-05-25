'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AssignmentPreviewModal from '../../components/AssignmentPreviewModal';
import { IAssignment } from '../../store/useAssignmentStore';
import { 
  Upload, 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Minus, 
  ChevronRight, 
  ArrowLeft, 
  Mic, 
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAssignmentStore } from '../../store/useAssignmentStore';
import { useToastStore } from '../../store/useToastStore';
import { socket } from '../../lib/socket';


interface QuestionRow {
  id: string;
  type: string;
  count: number;
  marks: number;
}

const QUESTION_TYPE_OPTIONS = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
];

export default function CreateAssignment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentIdParam = searchParams.get('id');
  const showToast = useToastStore((state) => state.showToast);

  const { 
    createAssignment, 
    generationProgress, 
    setGenerationProgress, 
    clearGenerationProgress,
    fetchAssignmentDetails,
    regenerateAssignment
  } = useAssignmentStore();

  // Step state: 1 = Form, 2 = Generation Progress
  const [step, setStep] = useState(1);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAssignment, setPreviewAssignment] = useState<IAssignment | null>(null);

  // Sync Fallback Recovery States
  const [showSyncFallback, setShowSyncFallback] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor progress updates; if stuck on PENDING, show fallback button after 4s
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && (!generationProgress || generationProgress.status === 'PENDING')) {
      timer = setTimeout(() => {
        setShowSyncFallback(true);
      }, 4000);
    } else {
      setShowSyncFallback(false);
      setIsSyncing(false);
    }
    return () => clearTimeout(timer);
  }, [step, generationProgress]);

  const handleTriggerSync = async () => {
    if (!assignmentId) return;
    setIsSyncing(true);
    try {
      const response = await fetch(`http://localhost:5001/api/assignments/${assignmentId}/generate-sync`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Sync generation request failed');
    } catch (err) {
      console.error(err);
      showToast('Failed to trigger synchronous fallback. Ensure the server is online.', 'error');
      setIsSyncing(false);
    }
  };


  // Form Fields
  const [title, setTitle] = useState('Quiz on Electricity');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [libraryReferences, setLibraryReferences] = useState<any[]>([]);
  const [selectedLibraryRef, setSelectedLibraryRef] = useState<string>('');
  const [questionRows, setQuestionRows] = useState<QuestionRow[]>(
      QUESTION_TYPE_OPTIONS.map((opt, i) => ({
        id: `${i + 1}`,
        type: opt,
        count: 5,
        marks: 1,
      }))
    );

  // School metadata (optional edits)
  const [schoolName, setSchoolName] = useState('Delhi Public School, Sector-4, Bokaro');
  const [subject, setSubject] = useState('Science');
  const [className, setClassName] = useState('Grade 8');
  const [timeValue, setTimeValue] = useState(45);
  const [timeUnit, setTimeUnit] = useState('minutes');
  
  // Difficulty Selection
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(['Mixed']);

  const toggleDifficulty = (level: string) => {
    if (selectedDifficulties.includes(level)) {
      if (selectedDifficulties.length === 1) return; // Must keep at least one
      setSelectedDifficulties(prev => prev.filter(l => l !== level));
    } else {
      if (level === 'Mixed') {
        setSelectedDifficulties(['Mixed']);
      } else {
        let newSelection = selectedDifficulties.filter(l => l !== 'Mixed');
        if (newSelection.length >= 2) newSelection.shift(); // Keep max 2
        setSelectedDifficulties([...newSelection, level]);
      }
    }
  };

  // Auto Save & Restore Draft
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const draft = localStorage.getItem('veda_draft_assignment');
    const isNew = !window.location.search.includes('id=');
    if (draft && isNew) {
      try {
        const parsed = JSON.parse(draft);
        if (confirm('You have an unsaved draft. Do you want to restore it?')) {
          if (parsed.title) setTitle(parsed.title);
          if (parsed.subject) setSubject(parsed.subject);
          if (parsed.className) setClassName(parsed.className);
          if (parsed.questionRows) setQuestionRows(parsed.questionRows);
          if (parsed.additionalInstructions) setAdditionalInstructions(parsed.additionalInstructions);
          if (parsed.selectedDifficulties) setSelectedDifficulties(parsed.selectedDifficulties);
        } else {
          localStorage.removeItem('veda_draft_assignment');
        }
      } catch (e) {}
    }
  }, []);

  // Save to draft on change
  useEffect(() => {
    if (step === 1 && title) {
      localStorage.setItem('veda_draft_assignment', JSON.stringify({
        title, subject, className, questionRows, additionalInstructions, selectedDifficulties
      }));
    }
  }, [title, subject, className, questionRows, additionalInstructions, selectedDifficulties, step]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load default school settings and teacher preferences
  useEffect(() => {
    const storedSchool = localStorage.getItem('veda_school_name');
    const storedCity = localStorage.getItem('veda_school_city');
    if (storedSchool) {
      setSchoolName(storedSchool + (storedCity ? `, ${storedCity}` : ''));
    }
    
    const defaultSubject = localStorage.getItem('veda_default_subject');
    const defaultGrade = localStorage.getItem('veda_default_grade');
    if (defaultSubject) {
      setSubject(defaultSubject);
    }
    if (defaultGrade) {
      setClassName(defaultGrade);
    }
  }, []);

  // Load references from Library
  useEffect(() => {
    const storedLib = localStorage.getItem('veda_library_items');
    if (storedLib) {
      try {
        const parsed = JSON.parse(storedLib);
        const refs = parsed.filter((item: any) => item.type === 'Reference');
        setLibraryReferences(refs);
        
        // Auto-select if there is a pre-selected reference from the library
        const preSelected = localStorage.getItem('veda_selected_library_reference');
        if (preSelected) {
          try {
            const parsedPre = JSON.parse(preSelected);
            if (refs.some((r: any) => r.id === parsedPre.id || r.name === parsedPre.name)) {
              setSelectedLibraryRef(parsedPre.id || parsedPre.name);
            }
          } catch(e) {}
        }
      } catch(e) {}
    }
  }, []);


  // Load existing assignment if id is in URL (for monitoring or retrying)
  useEffect(() => {
    if (assignmentIdParam) {
      setAssignmentId(assignmentIdParam);
      setStep(2);
      fetchAssignmentDetails(assignmentIdParam).then((data: any) => {
        if (data) {
          setTitle(data.title);
          if (data.subject) setSubject(data.subject);
          if (data.className) setClassName(data.className);
          if (data.timeAllowed) {
            const parts = data.timeAllowed.split(' ');
            if (parts.length >= 2) {
              const val = parseInt(parts[0]);
              const unit = parts[1].toLowerCase();
              if (!isNaN(val)) setTimeValue(val);
              if (unit === 'minutes' || unit === 'hours') setTimeUnit(unit);
            }
          }
          if (data.status === 'COMPLETED') {
            router.push(`/assignments/${data._id}`);
          } else if (data.status === 'FAILED') {
            setGenerationProgress({
              status: 'FAILED',
              progress: 100,
              error: data.error || 'Previous generation failed',
            });
          } else {
            setGenerationProgress({
              status: data.status,
              progress: data.progress,
              message: 'Resuming previous job tracking...',
            });
          }
        }
      });
    }
    return () => clearGenerationProgress();
  }, [assignmentIdParam, fetchAssignmentDetails, setGenerationProgress, clearGenerationProgress, router]);

  // Handle WebSocket Connection
  useEffect(() => {
    if (!assignmentId || step !== 2) return;

    // Connect to server socket
    socket.connect();

    // Join room for this assignment
    socket.emit('join-assignment', assignmentId);

    // Listen to progression events
    socket.on('assignment-progress', (data: any) => {
      console.log('WS Progress Update:', data);
      setGenerationProgress(data);

      if (data.status === 'COMPLETED') {
        // Fetch assignment details for preview
        fetchAssignmentDetails(assignmentId).then((assignment) => {
          if (assignment) {
            setPreviewAssignment(assignment);
            setPreviewOpen(true);
          }
        });
      }
    });


    return () => {
      socket.off('assignment-progress');
      socket.disconnect();
    };
  }, [assignmentId, step, setGenerationProgress, router, fetchAssignmentDetails]);

  // Calculations
  const totalQuestions = questionRows.reduce((acc, row) => acc + row.count, 0);
  const totalMarks = questionRows.reduce((acc, row) => acc + (row.count * row.marks), 0);

  // File Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        setFile(droppedFile);
        setSelectedLibraryRef(''); // Clear library dropdown if local file chosen
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSelectedLibraryRef(''); // Clear library dropdown if local file chosen
    }
  };

  const isValidFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ext === 'txt') return true;
    showToast('Please upload a PDF or TXT file.', 'error');
    return false;
  };

  // Question Rows Manipulations
  const handleAddRow = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setQuestionRows([...questionRows, { 
      id: newId, 
      type: QUESTION_TYPE_OPTIONS[0], 
      count: 5, 
      marks: 1 
    }]);
  };

  const handleRemoveRow = (id: string) => {
    if (questionRows.length > 1) {
      setQuestionRows(questionRows.filter(row => row.id !== id));
    }
  };

  const handleRowTypeChange = (id: string, value: string) => {
    setQuestionRows(questionRows.map(row => 
      row.id === id ? { ...row, type: value } : row
    ));
  };

  const handleCountChange = (id: string, delta: number) => {
    setQuestionRows(questionRows.map(row => {
      if (row.id === id) {
        const newCount = Math.max(1, row.count + delta);
        return { ...row, count: newCount };
      }
      return row;
    }));
  };

  const handleMarksChange = (id: string, delta: number) => {
    setQuestionRows(questionRows.map(row => {
      if (row.id === id) {
        const newMarks = Math.max(1, row.marks + delta);
        return { ...row, marks: newMarks };
      }
      return row;
    }));
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dueDate) {
      showToast('Please select a due date.', 'error');
      return;
    }

    // Validate time allowed (max 6 hours)
    const totalMinutes = timeUnit === 'hours' ? timeValue * 60 : timeValue;
    if (totalMinutes > 360) {
      showToast('Time allowed cannot exceed 6 hours.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('dueDate', dueDate);
    formData.append('additionalInstructions', additionalInstructions);
    formData.append('schoolName', schoolName);
    formData.append('subject', subject);
    formData.append('className', className);
    formData.append('timeAllowed', `${timeValue} ${timeUnit}`);
    formData.append('difficulty', selectedDifficulties.join(', '));
    
    // Map UI structure to backend JSON string
    const typesPayload = questionRows.map(row => ({
      type: row.type,
      count: row.count,
      marks: row.marks
    }));
    formData.append('questionTypes', JSON.stringify(typesPayload));

    if (file) {
      formData.append('file', file);
    } else if (selectedLibraryRef) {
      const selectedItem = libraryReferences.find(r => r.id === selectedLibraryRef || r.name === selectedLibraryRef);
      if (selectedItem) {
        formData.append('libraryFileName', selectedItem.id);
        formData.append('libraryOriginalName', selectedItem.name);
      }
    }

    try {
      setStep(2);
      const resData = await createAssignment(formData);
      setAssignmentId(resData.assignmentId);
      
      // Auto-sync new uploads to Library references
      if (resData.file) {
        const storedLib = localStorage.getItem('veda_library_items');
        let currentLib = [];
        if (storedLib) {
          try { currentLib = JSON.parse(storedLib); } catch (e) {}
        }
        const newLibItem = {
          id: resData.file.filename,
          name: resData.file.originalName,
          type: 'Reference',
          sizeOrDetails: (resData.file.size / (1024 * 1024)).toFixed(2) + ' MB',
          savedOn: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
          starred: false
        };
        if (!currentLib.some((item: any) => item.name === newLibItem.name)) {
          const updatedLib = [newLibItem, ...currentLib];
          localStorage.setItem('veda_library_items', JSON.stringify(updatedLib));
        }
      }

      // Clear the temporary selection
      localStorage.removeItem('veda_selected_library_reference');
      localStorage.removeItem('veda_draft_assignment'); // Clear draft on successful submission
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to submit assignment creation.', 'error');
    }
  };

  const handleRetryRegeneration = async () => {
    if (!assignmentId) return;
    try {
      await regenerateAssignment(assignmentId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col space-y-6">
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Create Assignment</h1>
        <p className="text-xs text-gray-400">Set up a new assignment for your students</p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="w-full bg-white border border-gray-100 rounded-2xl p-3 md:p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-[10px] md:text-xs shrink-0 ${
            step === 1 ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
          }`}>
            1
          </div>
          <span className="text-[10px] md:text-xs font-semibold text-gray-700 leading-tight">
            <span>Upload</span>
          </span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-100 mx-2 md:mx-6">
          <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: step === 1 ? '0%' : '100%' }}></div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-[10px] md:text-xs shrink-0 ${
            step === 2 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            2
          </div>
          <span className="text-[10px] md:text-xs font-semibold text-gray-400 leading-tight">
            <span>Generated</span>
          </span>
        </div>
      </div>

      {/* STEP 1: FORM VIEW */}
      {step === 1 && (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-6 pb-12">
          
          {/* Main Form Details Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col space-y-6">
            
            <div>
              <h3 className="font-extrabold text-base text-gray-800">Assignment Details</h3>
              <p className="text-[11px] text-gray-400">Basic information about your assignment</p>
            </div>

            {/* Title Input */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-gray-600">Assignment Topic / Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Quiz on Electricity"
                required
                className="w-full px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 rounded-xl text-sm"
              />
            </div>

            {/* Library Textbook Selector */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-gray-600">Select Textbook Reference from Library</label>
              {libraryReferences.length > 0 ? (
                <select
                  value={selectedLibraryRef}
                  onChange={(e) => {
                    setSelectedLibraryRef(e.target.value);
                    if (e.target.value) {
                      setFile(null); // Clear file upload if library file selected
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 rounded-xl text-xs bg-white text-gray-700 font-medium"
                >
                  <option value="">None (Upload a new file below)</option>
                  {libraryReferences.map((ref) => (
                    <option key={ref.id} value={ref.id}>
                      📖 {ref.name} ({ref.sizeOrDetails})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-[10px] text-gray-400 italic bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                  No references available in your library yet. Upload a file below and it will automatically sync to "My Library".
                </p>
              )}
            </div>

            {/* Drag & Drop File Container */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-gray-650">Or Upload Reference Document</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                  isDragOver ? 'border-orange-500 bg-orange-50/20' : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt"
                  className="hidden"
                />
                
                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                
                {file ? (
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-800">{file.name}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-800">Choose a file or drag & drop it here</p>
                    <p className="text-[10px] text-gray-400 mt-1">PDF, TXT up to 10MB</p>
                  </div>
                )}

                {file ? (
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setFile(null); 
                      if (fileInputRef.current) fileInputRef.current.value = ''; 
                    }}
                    className="mt-4 px-4 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 rounded-full text-[10px] font-bold text-red-600 transition-colors"
                  >
                    Remove File
                  </button>
                ) : (
                  <button
                    type="button"
                    className="mt-4 px-4 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-full text-[10px] font-bold text-gray-600 transition-colors"
                  >
                    Browse Files
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 text-center">Upload images or documents of your preferred source material</p>
            </div>

            {/* School details / metadata accordion-style (Figma features DPS) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-bold text-gray-600">School Name</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-bold text-gray-600">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-bold text-gray-600">Class / Grade</label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded-xl text-xs bg-white text-gray-700 font-medium"
                >
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                    <option key={g} value={`Grade ${g}`}>Grade {g}</option>
                  ))}
                  <option value="University">University</option>
                </select>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-bold text-gray-600">Time Allowed</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={timeValue}
                    onChange={(e) => setTimeValue(parseInt(e.target.value) || 1)}
                    className="w-2/3 px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded-xl text-xs"
                  />
                  <select
                    value={timeUnit}
                    onChange={(e) => setTimeUnit(e.target.value)}
                    className="w-1/3 px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded-xl text-xs bg-white text-gray-700 font-medium"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-600">AI Difficulty Level</label>
                  <span className="text-[10px] font-medium text-gray-400">Select up to 2 options</span>
                </div>
                <div className="flex items-center gap-2">
                  {['Mixed', 'Easy', 'Medium', 'Difficult'].map((level) => {
                    const isSelected = selectedDifficulties.includes(level);
                    let colorClass = 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50';
                    if (isSelected) {
                      if (level === 'Mixed') colorClass = 'border-purple-500 bg-purple-50 text-purple-700 font-bold';
                      if (level === 'Easy') colorClass = 'border-green-500 bg-green-50 text-green-700 font-bold';
                      if (level === 'Medium') colorClass = 'border-blue-500 bg-blue-50 text-blue-700 font-bold';
                      if (level === 'Difficult') colorClass = 'border-red-500 bg-red-50 text-red-700 font-bold';
                    }
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => toggleDifficulty(level)}
                        className={`flex-1 py-2 px-1 border rounded-xl text-[11px] transition-all shadow-sm ${colorClass}`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Due Date Input */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-gray-600">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded-xl text-sm text-gray-700 bg-white"
                />
              </div>
            </div>

            {/* Question Types List */}
            <div className="flex flex-col space-y-4 pt-4 border-t border-gray-50">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-600">Question Types configuration</label>
                <div className="flex items-center gap-6 text-[10px] font-bold text-gray-400 tracking-wider">
                  <span>NO. OF QUESTIONS</span>
                  <span>MARKS</span>
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-3">
                {questionRows.map((row) => (
                  <div key={row.id} className="flex items-center gap-4">
                    {/* Select Dropdown */}
                    <div className="flex-1">
                      <select
                        value={row.type}
                        onChange={(e) => handleRowTypeChange(row.id, e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 focus:ring-1 focus:ring-orange-500 rounded-xl text-xs bg-white"
                      >
                        {QUESTION_TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Delete Cross */}
                    <button
                      type="button"
                      disabled={questionRows.length === 1}
                      onClick={() => handleRemoveRow(row.id)}
                      className="p-1 hover:bg-red-50 hover:text-red-500 text-gray-300 rounded-lg transition-colors disabled:opacity-20"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* No of Questions Counter */}
                    <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/50 p-1 min-w-[100px] justify-between">
                      <button
                        type="button"
                        onClick={() => handleCountChange(row.id, -1)}
                        className="p-1 hover:bg-white text-gray-500 rounded-lg shadow-sm border border-transparent hover:border-gray-100 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-gray-800 w-6 text-center">{row.count}</span>
                      <button
                        type="button"
                        onClick={() => handleCountChange(row.id, 1)}
                        className="p-1 hover:bg-white text-gray-500 rounded-lg shadow-sm border border-transparent hover:border-gray-100 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Marks Counter */}
                    <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/50 p-1 min-w-[100px] justify-between">
                      <button
                        type="button"
                        onClick={() => handleMarksChange(row.id, -1)}
                        className="p-1 hover:bg-white text-gray-500 rounded-lg shadow-sm border border-transparent hover:border-gray-100 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-gray-800 w-6 text-center">{row.marks}</span>
                      <button
                        type="button"
                        onClick={() => handleMarksChange(row.id, 1)}
                        className="p-1 hover:bg-white text-gray-500 rounded-lg shadow-sm border border-transparent hover:border-gray-100 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Type button */}
              <button
                type="button"
                onClick={handleAddRow}
                className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-[10px] font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question Type</span>
              </button>

              {/* Totals */}
              <div className="flex flex-col items-end pt-4 border-t border-gray-50 text-[11px] font-bold text-gray-500 space-y-1">
                <div>Total Questions : <span className="text-gray-900">{totalQuestions}</span></div>
                <div>Total Marks : <span className="text-gray-900">{totalMarks}</span></div>
              </div>
            </div>

            {/* Additional Information Instructions */}
            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-50">
              <label className="text-xs font-bold text-gray-600">Additional Information (For better output)</label>
              <div className="relative">
                <textarea
                  rows={4}
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="e.g. Generate a question paper for 3 hour exam duration. Include questions on electromagnetism and circuits..."
                  className="w-full pl-4 pr-12 py-3 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded-2xl text-xs placeholder-gray-400 resize-none leading-relaxed"
                />
                {/* Voice button (mock) */}
                <button
                  type="button"
                  className="absolute bottom-4 right-4 p-2 bg-gray-50 border border-gray-100 text-gray-400 hover:text-orange-500 rounded-full transition-colors"
                  title="Voice Input (Mock)"
                  onClick={() => showToast('Speech recognition not configured. Type your instructions.', 'info')}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Stepper Buttons Bottom Bar */}
          <div className="flex justify-between items-center pt-6">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-6 py-2.5 border border-gray-900 text-gray-900 hover:bg-gray-50 rounded-full font-bold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-full font-bold text-xs transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 text-orange-400" />
            </button>
          </div>

        </form>
      )}

      {/* STEP 2: WEBSOCKET PROGRESS VIEW */}
      {step === 2 && (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 shadow-sm flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
          {(!generationProgress || generationProgress.status === 'PENDING' || generationProgress.status === 'PROCESSING') && (
            <>
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Rotating background circular rings */}
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                <span className="text-sm font-black text-gray-700">
                  {generationProgress?.progress || 0}%
                </span>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-gray-800">Generating Questions</h3>
                <p className="text-xs text-orange-500 animate-pulse font-bold tracking-wide uppercase">
                  {generationProgress?.message || 'Queuing task...'}
                </p>
              </div>

              <p className="text-gray-400 text-xs max-w-sm leading-relaxed">
                Our background worker is analyzing your details, reading source material, and prompting the AI to structure a professional question paper.
              </p>

              {showSyncFallback && (
                <div className="mt-6 flex flex-col items-center p-4 bg-orange-50/70 border border-orange-100 rounded-2xl max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-[10px] text-orange-600 font-bold leading-relaxed text-center">
                    Queue taking too long? Click below to bypass the background worker and run generation synchronously.
                  </p>
                  <button
                    type="button"
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="mt-3 w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <span>Generate Synchronously</span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}


          {generationProgress?.status === 'COMPLETED' && (
            <>
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-gray-800">Generation Complete!</h3>
                <p className="text-xs text-green-500 font-bold">Redirecting you to the assessment details sheet...</p>
              </div>
            </>
          )}

          {/* Render preview modal when ready */}
          {previewOpen && previewAssignment && (
            <AssignmentPreviewModal
              open={previewOpen}
              assignment={previewAssignment}
              onClose={() => setPreviewOpen(false)}
              onConfirm={() => {
                setPreviewOpen(false);
                router.push(`/assignments/${previewAssignment._id}`);
              }}
            />
          )}

          {generationProgress?.status === 'FAILED' && (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                <XCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-gray-800">Generation Failed</h3>
                <p className="text-xs text-red-500 font-semibold max-w-md leading-relaxed">
                  {generationProgress.error || 'The LLM failed to parse structure.'}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    clearGenerationProgress();
                    setStep(1);
                  }}
                  className="px-5 py-2 border border-gray-900 rounded-full font-bold text-xs text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Edit Specifications
                </button>
                <button
                  onClick={handleRetryRegeneration}
                  className="px-5 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin hidden" />
                  <span>Retry AI Generation</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
