export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isAudio?: boolean;
}

export interface Memory {
  id: string;
  text: string;
  timestamp: Date;
  category: 'preference' | 'fact' | 'history' | 'other';
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
}

export enum RecorderStatus {
  Idle = 'idle',
  Recording = 'recording',
  Processing = 'processing',
}

export interface BackupData {
  version: number;
  exportedAt: string;
  memories: Memory[];
  messages: Message[];
}