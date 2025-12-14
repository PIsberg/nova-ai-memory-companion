import React, { useState, useEffect } from 'react';
import MemoryPanel from './components/MemoryPanel';
import ChatInterface from './components/ChatInterface';
import { Message, Memory, BackupData } from './types';
import { extractFact, generateReply, transcribeAudio, generateWelcomeMessage, generateProactiveQuestion } from './services/geminiService';
import { useTTS } from './hooks/useTTS';

export default function App() {
  // Initialize state with lazy initializers to check localStorage first
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('nova_messages');
    if (saved) {
      // Need to revive Date objects from JSON strings
      return JSON.parse(saved, (key, value) =>
        key === 'timestamp' ? new Date(value) : value
      );
    }
    return []; // Empty initially, we'll add greeting in useEffect if empty
  });

  const [memories, setMemories] = useState<Memory[]>(() => {
    const saved = localStorage.getItem('nova_memories');
    if (saved) {
      return JSON.parse(saved, (key, value) =>
        key === 'timestamp' ? new Date(value) : value
      );
    }
    return [];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [processingFact, setProcessingFact] = useState(false);
  const [lastExtractedFact, setLastExtractedFact] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { speak, cancel, isSupported } = useTTS();

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('nova_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('nova_memories', JSON.stringify(memories));
  }, [memories]);

  // Initial greeting (only if no messages exist)
  useEffect(() => {
    const init = async () => {
      if (messages.length === 0) {
        // First Run Ever
        setMessages([
          {
            id: 'init-1',
            role: 'model',
            text: "Hi! I'm Nova. I have a long-term memory, so if you tell me things about yourself (like allergies, hobbies, or plans), I'll remember them for next time. What's on your mind?",
            timestamp: new Date()
          }
        ]);
      } else {
        // Welcome Back Logic
        const lastMsg = messages[messages.length - 1];
        const lastTime = new Date(lastMsg.timestamp).getTime();
        const now = new Date().getTime();
        const hoursDiff = (now - lastTime) / (1000 * 60 * 60);

        if (hoursDiff > 1) { // 1 hour threshold
          try {
            const welcomeText = await generateWelcomeMessage(memories, new Date(lastMsg.timestamp));
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: welcomeText,
              timestamp: new Date()
            }]);
            if (!isMuted) speak(welcomeText); // Auto-speak welcome
          } catch (e) {
            console.error("Welcome message failed", e);
          }
        }
      }
    };
    init();
  }, []); // Run once on mount

  // Idle Nudge Logic
  useEffect(() => {
    // Only run if we have messages and sidebar isn't blocking view
    if (messages.length > 0 && !isTyping) {
      const timer = setTimeout(async () => {
        // Random chance to nudge (avoid being too annoying, only 1 nudge per session load logic implies simple timeout here)
        // For now, deterministic: if idle for 2 mins, trigger ONCE.
        // We need a ref to track if we already nudged this session to avoid loop? 
        // Let's just do it. If user ignores, we won't nudge again until simple re-render? 
        // Actually, let's keep it simple: 2 mins of silence -> Nudge.

        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'model') return; // Don't nudge if AI spoke last (waiting for user)

        try {
          const question = await generateProactiveQuestion(memories);
          const nudgeMsg: Message = {
            id: Date.now().toString(),
            role: 'model',
            text: question,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, nudgeMsg]);
          if (!isMuted) speak(question);
        } catch (e) {
          console.error("Proactive nudge failed", e);
        }

      }, 120000); // 2 minutes

      return () => clearTimeout(timer); // Cleanup on any render (message change)
    }
  }, [messages, isTyping, memories, isMuted, speak]);

  const processUserMessage = async (text: string, isAudio: boolean = false) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
      isAudio
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // 1. Parallel Process: Extract Facts
    setProcessingFact(true);
    extractFact(text).then(result => {
      setProcessingFact(false);
      if (result) {
        const newMemory: Memory = {
          id: Date.now().toString() + '-mem',
          text: result.fact,
          category: result.category as any,
          timestamp: new Date()
        };
        setMemories(prev => [newMemory, ...prev]);
        setLastExtractedFact(result.fact);
        setTimeout(() => setLastExtractedFact(null), 5000);
      }
    });

    // 2. Generate Reply
    try {
      const replyText = await generateReply(messages, text, memories);

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: replyText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMsg]);

      if (!isMuted) {
        speak(replyText);
      }
    } catch (error) {
      console.error("Error generating reply:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `I'm having a little trouble connecting to my brain right now. Can you say that again? (Error: ${(error as Error).message})`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (text: string) => {
    cancel(); // Stop speaking when user sends a new message
    processUserMessage(text, false);
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    try {
      const text = await transcribeAudio(audioBlob);
      if (text.trim()) {
        cancel(); // Stop speaking when user sends a new message
        processUserMessage(text, true);
      }
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Sorry, I couldn't hear that clearly.");
    }
  };

  // --- Export / Import Logic ---

  const handleExportData = () => {
    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      memories,
      messages
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova-memory-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    if (!file) {
      console.error("No file provided for import");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        if (!json) throw new Error("Empty file content");

        const backup: BackupData = JSON.parse(json, (key, value) => {
          // Revive dates
          if (key === 'timestamp' || key === 'exportedAt') return new Date(value);
          return value;
        });

        if (!backup.memories || !backup.messages) {
          throw new Error("Invalid backup file format: missing memories or messages");
        }

        if (backup.version !== 1) {
          throw new Error(`Unsupported backup version: ${backup.version || 'unknown'}`);
        }

        // Use a timeout to ensure UI renders before alert/confirm blocks (rare issue but possible)
        setTimeout(() => {
          if (window.confirm(`Found ${backup.memories.length} memories and ${backup.messages.length} messages. Overwrite current brain?`)) {
            setMemories(backup.memories);
            setMessages(backup.messages);
            setIsSidebarOpen(false); // Close sidebar on mobile after import
            alert("Brain restored successfully!");
          }
        }, 10);

      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to import file. It might be corrupted or the wrong format.\nCheck console for details.");
      }
    };

    reader.onerror = (e) => {
      console.error("FileReader error:", e);
      alert("Error reading file.");
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container - Responsive */}
      <div className={`
        fixed inset-y-0 left-0 z-40 h-full w-80 transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:block
      `}>
        <MemoryPanel
          memories={memories}
          processingFact={processingFact}
          lastExtractedFact={lastExtractedFact}
          onExport={handleExportData}
          onImport={handleImportData}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 h-full flex flex-col relative w-full">
        <ChatInterface
          messages={messages}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
          onSendAudio={handleSendAudio}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isMuted={isMuted}
          onToggleMute={() => {
            if (!isMuted) cancel();
            setIsMuted(!isMuted);
          }}
        />

        {/* Mobile Processing Indicator (Floating) */}
        <div className="md:hidden absolute top-4 right-4 z-50 pointer-events-none">
          {processingFact && (
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}