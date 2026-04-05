export interface Recording {
  id: string;
  callId: string;
  audioUrl: string;
  duration: number;
  createdAt: Date;
  fileSize: number;
}

export interface Transcription {
  id: string;
  callId: string;
  text: string;
  segments: {
    speaker: 'caller' | 'ai' | 'user';
    text: string;
    startTime: number;
    endTime: number;
  }[];
  summary?: string;
  keyPoints?: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: Date;
}

export interface RecordingSettings {
  autoRecord: boolean;
  transcribeAI: boolean;
  transcribeHuman: boolean;
  storeDuration: number; // days
  cloudBackup: boolean;
}

class RecordingService {
  private recordings: Map<string, Recording> = new Map();
  private transcriptions: Map<string, Transcription> = new Map();
  private settings: RecordingSettings = {
    autoRecord: true,
    transcribeAI: true,
    transcribeHuman: true,
    storeDuration: 30,
    cloudBackup: false
  };

  // Start recording a call
  async startRecording(callId: string): Promise<Recording> {
    const recording: Recording = {
      id: `rec_${Date.now()}`,
      callId,
      audioUrl: '', // Would be set by actual recording system
      duration: 0,
      createdAt: new Date(),
      fileSize: 0
    };

    this.recordings.set(recording.id, recording);
    
    // Simulate starting recording
    console.log(`[Recording] Started recording for call ${callId}`);
    
    return recording;
  }

  // Stop recording
  async stopRecording(recordingId: string, duration: number): Promise<Recording | null> {
    const recording = this.recordings.get(recordingId);
    if (!recording) return null;

    recording.duration = duration;
    recording.fileSize = Math.floor(duration * 16); // Rough estimate: 16KB per second for compressed audio
    
    this.recordings.set(recordingId, recording);
    
    console.log(`[Recording] Stopped. Duration: ${duration}s, Size: ${recording.fileSize}KB`);
    
    // Auto-transcribe if enabled
    if (this.settings.transcribeAI || this.settings.transcribeHuman) {
      await this.transcribeRecording(recordingId);
    }
    
    return recording;
  }

  // Transcribe a recording
  async transcribeRecording(recordingId: string): Promise<Transcription | null> {
    const recording = this.recordings.get(recordingId);
    if (!recording) return null;

    // Simulate transcription with AI
    await new Promise(resolve => setTimeout(resolve, 2000));

    const transcription: Transcription = {
      id: `trans_${Date.now()}`,
      callId: recording.callId,
      text: this.generateMockTranscript(recording.duration),
      segments: [
        {
          speaker: 'ai',
          text: "Hello, I'm the AI assistant. The user is currently unavailable.",
          startTime: 0,
          endTime: 5
        },
        {
          speaker: 'caller',
          text: "Hi, this is regarding the project deadline. It's urgent.",
          startTime: 5,
          endTime: 12
        },
        {
          speaker: 'ai',
          text: "I understand. Let me check if this is high priority. Please hold.",
          startTime: 12,
          endTime: 18
        }
      ],
      summary: "Caller inquired about project deadline, marked as urgent.",
      keyPoints: ["Project deadline discussion", "Urgent matter flagged"],
      sentiment: 'positive',
      createdAt: new Date()
    };

    this.transcriptions.set(transcription.id, transcription);
    
    console.log(`[Transcription] Generated for recording ${recordingId}`);
    
    return transcription;
  }

  // Get recording by call ID
  getRecordingByCallId(callId: string): Recording | undefined {
    return Array.from(this.recordings.values()).find(r => r.callId === callId);
  }

  // Get transcription by call ID
  getTranscriptionByCallId(callId: string): Transcription | undefined {
    return Array.from(this.transcriptions.values()).find(t => t.callId === callId);
  }

  // Get all recordings
  getAllRecordings(): Recording[] {
    return Array.from(this.recordings.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // Get settings
  getSettings(): RecordingSettings {
    return { ...this.settings };
  }

  // Update settings
  updateSettings(updates: Partial<RecordingSettings>): void {
    this.settings = { ...this.settings, ...updates };
  }

  // Delete recording
  deleteRecording(recordingId: string): boolean {
    const recording = this.recordings.get(recordingId);
    if (recording) {
      // Also delete associated transcription
      const transcription = this.getTranscriptionByCallId(recording.callId);
      if (transcription) {
        this.transcriptions.delete(transcription.id);
      }
      return this.recordings.delete(recordingId);
    }
    return false;
  }

  // Export recording
  async exportRecording(recordingId: string, format: 'mp3' | 'wav' | 'm4a'): Promise<Blob | null> {
    const recording = this.recordings.get(recordingId);
    if (!recording) return null;

    // Mock export - in real implementation, convert audio file
    const mockBlob = new Blob(['mock audio data'], { type: `audio/${format}` });
    return mockBlob;
  }

  // Search transcripts
  searchTranscripts(query: string): Transcription[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.transcriptions.values()).filter(t =>
      t.text.toLowerCase().includes(lowerQuery) ||
      t.summary?.toLowerCase().includes(lowerQuery) ||
      t.keyPoints?.some(kp => kp.toLowerCase().includes(lowerQuery))
    );
  }

  // Private: Generate mock transcript
  private generateMockTranscript(duration: number): string {
    const parts = [
      "AI: Hello, I'm the AI assistant.",
      "Caller: Hi, I'm calling about...",
      "AI: Let me help you with that.",
      "Caller: Thank you, I appreciate it.",
      "AI: You're welcome. Have a great day!"
    ];
    
    // Scale content based on duration
    const scaledParts = [];
    const partCount = Math.max(2, Math.floor(duration / 10));
    for (let i = 0; i < partCount; i++) {
      scaledParts.push(parts[i % parts.length]);
    }
    
    return scaledParts.join('\n');
  }
}

export const recordingService = new RecordingService();
