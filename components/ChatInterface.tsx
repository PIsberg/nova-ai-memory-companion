import React, { useEffect, useRef } from 'react';
import { Message, RecorderStatus } from '../types';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface ChatInterfaceProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onSendAudio: (audio: Blob) => void;
  onToggleSidebar: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isTyping,
  onSendMessage,
  onSendAudio,
  onToggleSidebar,
  isMuted,
  onToggleMute
}) => {
  const [inputText, setInputText] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reverted: Remove auto-stop callback
  const { status, startRecording, stopRecording, permissionError } = useAudioRecorder();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Keyboard shortcut for Mic (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Space is pressed AND no input/active element is focused
      if (e.code === 'Space') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
          return;
        }

        e.preventDefault(); // Prevent scrolling
        handleMicClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, startRecording, stopRecording]); // Dependencies for handleMicClick logic

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleMicClick = async () => {
    if (status === RecorderStatus.Idle) {
      startRecording();
    } else if (status === RecorderStatus.Recording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        onSendAudio(audioBlob);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-950 relative w-full">
      {/* Header with Avatar */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-900 via-gray-900/80 to-transparent z-10 flex items-center px-4 md:px-6 pointer-events-none">
        <div className="flex items-center gap-3 md:gap-4 pointer-events-auto w-full">

          {/* Mobile Menu Button */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg active:bg-gray-800"
            aria-label="Open Memory Panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="relative group cursor-pointer flex-shrink-0">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 p-[2px] shadow-[0_0_15px_rgba(219,39,119,0.5)] transition-shadow duration-300 group-hover:shadow-[0_0_25px_rgba(219,39,119,0.7)]">
              <div className="h-full w-full rounded-full overflow-hidden border-2 border-gray-900 bg-gray-800">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nova&backgroundColor=b6e3f4"
                  alt="Nova"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 md:h-3 md:w-3 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg font-bold text-white leading-none truncate">Nova</h1>
            <p className="text-[10px] md:text-xs text-brand-300 mt-1 flex items-center gap-1 truncate font-medium">
              <span className="w-1 h-1 rounded-full bg-brand-500 flex-shrink-0"></span>
              Memory Active
            </p>
          </div>

          <button
            onClick={onToggleMute}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg active:bg-gray-800"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-24 pb-4 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Say "I'm allergic to peanuts" to test my memory.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm
                ${msg.role === 'user'
                  ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-tr-sm'
                  : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
                }
              `}
            >
              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              {msg.isAudio && (
                <div className="mt-2 flex items-center gap-1 text-[10px] opacity-70 border-t border-white/20 pt-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" /></svg>
                  <span>Voice Message</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="bg-gray-800 rounded-2xl rounded-tl-none px-5 py-4 shadow-lg border border-gray-700 flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-[bounce_1s_infinite_0ms]"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-[bounce_1s_infinite_400ms]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900/95 border-t border-gray-800 backdrop-blur relative">
        {/* Permission Error Toast */}
        {permissionError && (
          <div className="absolute top-0 left-0 w-full -translate-y-full px-4 pb-4">
            <div className="mx-auto max-w-lg bg-gray-900 border border-red-500/30 text-gray-300 text-xs rounded-xl p-4 shadow-2xl flex gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-400 mb-1">Microphone Access Denied</h4>
                <p className="mb-2 text-gray-400">{permissionError}</p>
                <div className="bg-gray-800 rounded px-3 py-2 border border-gray-700">
                  <p className="font-medium text-gray-300 mb-1">How to fix in Chrome:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-500">
                    <li>Click the <span className="text-gray-300">Tune/Lock icon </span> (Left of address bar)</li>
                    <li>Toggle <span className="text-gray-300">Microphone</span> to ON</li>
                    <li><span className="text-gray-300">Refresh</span> the page</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-4xl mx-auto">

          <button
            type="button"
            onClick={handleMicClick}
            className={`
              p-3 rounded-full transition-all duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500
              ${status === RecorderStatus.Recording
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse ring-2 ring-red-500/50'
                : permissionError
                  ? 'bg-gray-800 text-red-400 hover:bg-gray-700'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }
            `}
            title={status === RecorderStatus.Recording ? "Stop Recording" : "Start Recording"}
          >
            {status === RecorderStatus.Recording ? (
              <div className="h-6 w-6 flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={status === RecorderStatus.Recording ? "Listening..." : "Message Nova..."}
            className="flex-1 bg-gray-800 text-gray-100 placeholder-gray-500 rounded-full px-6 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/50 border border-transparent focus:border-brand-500/50 transition-all shadow-inner"
            disabled={status === RecorderStatus.Recording || isTyping}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || status !== RecorderStatus.Idle || isTyping}
            className="p-3.5 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-500 hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-brand-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725 1.017l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;