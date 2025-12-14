import React, { useRef } from 'react';
import { Memory } from '../types';

interface MemoryPanelProps {
  memories: Memory[];
  processingFact: boolean;
  lastExtractedFact: string | null;
  onExport: () => void;
  onImport: (file: File) => void;
  onClose?: () => void;
}

const MemoryPanel: React.FC<MemoryPanelProps> = ({
  memories,
  processingFact,
  lastExtractedFact,
  onExport,
  onImport,
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }

    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-800 w-full md:w-80 md:max-w-[320px] relative z-10 transition-all duration-300">
      <div className="p-5 border-b border-gray-800 bg-gray-900/95 backdrop-blur flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-brand-400 uppercase tracking-widest flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Nova's Core
            </h2>
            <p className="text-xs text-gray-500 mt-1">Simulated Long-Term Memory (RAG)</p>
          </div>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Data Controls (Moved to Top) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExport}
            className="flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 px-3 rounded transition-colors border border-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 px-3 rounded transition-colors border border-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20"> {/* pb-20 for extra scroll space */}

        {/* Processing Indicator */}
        <div className={`transition-all duration-500 ${processingFact ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 h-0 overflow-hidden'}`}>
          <div className="bg-indigo-900/30 border border-indigo-500/30 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-xs font-semibold text-indigo-300">Analyzing Conversation...</span>
            </div>
            <p className="text-xs text-indigo-200/70">Extracting semantic facts for long-term storage.</p>
          </div>
        </div>

        {/* New Fact Notification */}
        {lastExtractedFact && !processingFact && (
          <div className="animate-fade-in-up bg-green-900/20 border border-green-500/30 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold text-green-300">Memory Updated</span>
            </div>
            <p className="text-xs text-green-200">"{lastExtractedFact}"</p>
          </div>
        )}

        {/* Memory List */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Stored Facts ({memories.length})
          </h3>

          {memories.length === 0 ? (
            <div className="text-center py-10 opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="text-sm">Core empty. Tell me something about yourself.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {memories.map((mem) => (
                <div key={mem.id} className="group bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 p-3 rounded-md transition-colors cursor-default">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-brand-300 bg-brand-900/30 px-1.5 py-0.5 rounded capitalize mb-1 inline-block">
                      {mem.category}
                    </span>
                    <span className="text-[10px] text-gray-600 group-hover:text-gray-500">
                      {new Date(mem.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-snug">{mem.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default MemoryPanel;