import { useState, useRef, useCallback } from 'react';
import { RecorderStatus } from '../types';

export const useAudioRecorder = () => {
  const [status, setStatus] = useState<RecorderStatus>(RecorderStatus.Idle);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = useCallback(async () => {
    setPermissionError(null);
    
    // Check API support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError("Audio recording is not supported in this browser environment.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setStatus(RecorderStatus.Recording);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDismissedError') {
        setPermissionError("Microphone permission was denied. Please allow access.");
      } else if (err.name === 'NotFoundError') {
        setPermissionError("No microphone found on this device.");
      } else {
        setPermissionError(`Microphone error: ${err.message || 'Unknown error'}`);
      }
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        setStatus(RecorderStatus.Idle);
        
        // Important: Stop all tracks to release the microphone
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, []);

  return {
    status,
    startRecording,
    stopRecording,
    permissionError
  };
};