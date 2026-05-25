'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useLibraryStore } from '../../store/useLibraryStore';
import { BookOpen, Star, Trash2, FileText, Upload, Plus } from 'lucide-react';
import ToastContainer from '../../components/ToastContainer';
import { useToastStore } from '../../store/useToastStore';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'questions' | 'documents'>('questions');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    savedQuestions, documents, isLoading, 
    fetchSavedQuestions, removeQuestion, 
    fetchDocuments, uploadDocuments, removeDocument 
  } = useLibraryStore();
  const showToast = useToastStore(state => state.showToast);

  useEffect(() => {
    fetchSavedQuestions();
    fetchDocuments();
  }, [fetchSavedQuestions, fetchDocuments]);

  const handleRemove = async (id: string) => {
    try {
      await removeQuestion(id);
      showToast('Removed from Question Bank', 'success');
    } catch (e) {
      showToast('Failed to remove question', 'error');
    }
  };

  const handleRemoveDoc = async (id: string) => {
    try {
      await removeDocument(id);
      showToast('Document removed', 'success');
    } catch (e) {
      showToast('Failed to remove document', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const files = Array.from(e.target.files);
        await uploadDocuments(files);
        showToast('Documents uploaded successfully', 'success');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        showToast('Upload failed', 'error');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-8 select-none relative pb-16 min-h-[calc(100vh-100px)]">
      <ToastContainer />
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-orange-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Library</h1>
        </div>
        <p className="text-xs text-gray-400 mt-2 max-w-xl leading-relaxed">
          Your personal vault for starred questions and reference documents. Use these when crafting custom assessments.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-100">
        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'questions' ? 'text-orange-500 border-orange-500' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
          Saved Questions
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'documents' ? 'text-orange-500 border-orange-500' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
          My Documents
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse flex flex-col space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white rounded-3xl border border-gray-100 w-full" />
          ))}
        </div>
      ) : activeTab === 'questions' ? (
        savedQuestions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <Star className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-lg font-black text-gray-800">Your Bank is Empty</h3>
            <p className="text-xs text-gray-400 mt-2">
              Click the star icon next to any generated question to save it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedQuestions.map(q => (
              <div key={q._id} className="bg-white border border-gray-100 hover:border-orange-200 hover:shadow-md rounded-3xl p-6 transition-all group flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    q.difficulty === 'Challenging' ? 'bg-red-50 text-red-600' :
                    q.difficulty === 'Moderate' ? 'bg-orange-50 text-orange-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {q.difficulty}
                  </span>
                  <button 
                    onClick={() => handleRemove(q._id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100"
                    title="Remove from Bank"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                    {q.questionText}
                  </p>
                  {q.svgDiagram && (
                    <div 
                      className="my-3 p-4 bg-gray-50 rounded-2xl flex justify-center border border-gray-100"
                      dangerouslySetInnerHTML={{ __html: q.svgDiagram }} 
                    />
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">
                    {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                  {q.answerText && (
                    <div className="text-[10px] text-gray-500 font-medium truncate max-w-[200px]" title={q.answerText}>
                      Ans: {q.answerText}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-700">Reference Documents</h2>
            <div>
              <input 
                type="file" 
                multiple 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".pdf,.txt"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors text-xs font-bold"
              >
                <Upload className="w-4 h-4" />
                Upload Documents
              </button>
            </div>
          </div>
          
          {documents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
              <FileText className="w-12 h-12 text-gray-200 mb-4" />
              <h3 className="text-lg font-black text-gray-800">No Documents Uploaded</h3>
              <p className="text-xs text-gray-400 mt-2">
                Upload PDFs or text files to use as reference material for your assignments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map(doc => (
                <div key={doc._id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 group hover:border-orange-200 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate" title={doc.originalFileName}>
                      {doc.originalFileName}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleRemoveDoc(doc._id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
