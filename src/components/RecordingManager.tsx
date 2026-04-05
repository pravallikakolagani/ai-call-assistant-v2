import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, Play, Pause, Download, Trash2, Search, 
  FileText, Clock, Check, X, Settings, Volume2
} from 'lucide-react';
import { recordingService, Recording, Transcription } from '../services/recordingService';

interface RecordingManagerProps {
  isDark: boolean;
}

export function RecordingManager({ isDark }: RecordingManagerProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [transcriptions, setTranscriptions] = useState<Map<string, Transcription>>(new Map());
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState(recordingService.getSettings());
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = () => {
    const recs = recordingService.getAllRecordings();
    setRecordings(recs);
    
    // Load transcriptions
    const transMap = new Map<string, Transcription>();
    recs.forEach(rec => {
      const trans = recordingService.getTranscriptionByCallId(rec.callId);
      if (trans) {
        transMap.set(rec.id, trans);
      }
    });
    setTranscriptions(transMap);
  };

  const handleDelete = (recordingId: string) => {
    recordingService.deleteRecording(recordingId);
    loadRecordings();
    if (selectedRecording?.id === recordingId) {
      setSelectedRecording(null);
    }
  };

  const handleExport = async (recording: Recording, format: 'mp3' | 'wav' | 'm4a') => {
    const blob = await recordingService.exportRecording(recording.id, format);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording_${recording.callId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    recordingService.updateSettings(newSettings);
    setSettings(newSettings);
  };

  const filteredRecordings = recordings.filter(rec => {
    const trans = transcriptions.get(rec.id);
    return trans?.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rec.callId.includes(searchQuery);
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Call Recordings
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts..."
            className={`px-3 py-1.5 rounded-lg text-sm outline-none ${
              isDark ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
      </div>

      {/* Recording Settings */}
      <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Recording Settings</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'autoRecord', label: 'Auto-record calls' },
            { key: 'transcribeAI', label: 'Transcribe AI responses' },
            { key: 'transcribeHuman', label: 'Transcribe human calls' },
            { key: 'cloudBackup', label: 'Cloud backup' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleSetting(key as keyof typeof settings)}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                settings[key as keyof typeof settings]
                  ? 'bg-green-500/20 text-green-500'
                  : isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                settings[key as keyof typeof settings] ? 'bg-green-500' : 'bg-gray-400'
              }`}>
                {settings[key as keyof typeof settings] && <Check className="w-3 h-3 text-white" />}
              </div>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Recordings List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredRecordings.length === 0 ? (
          <div className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Mic className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recordings yet</p>
          </div>
        ) : (
          filteredRecordings.map(recording => {
            const trans = transcriptions.get(recording.id);
            return (
              <motion.div
                key={recording.id}
                layout
                onClick={() => setSelectedRecording(recording)}
                className={`p-3 rounded-xl cursor-pointer transition-colors ${
                  selectedRecording?.id === recording.id
                    ? isDark ? 'bg-blue-500/20 border border-blue-500' : 'bg-blue-50 border border-blue-500'
                    : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Mic className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Call {recording.callId.slice(-6)}</p>
                      <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(recording.duration)}
                        </span>
                        <span>•</span>
                        <span>{formatFileSize(recording.fileSize)}</span>
                        <span>•</span>
                        <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {trans && (
                      <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500">
                        Transcribed
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(recording.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Selected Recording Detail */}
      {selectedRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Recording Details</h4>
            <button
              onClick={() => setSelectedRecording(null)}
              className="p-1 rounded-lg hover:bg-gray-500/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <div className="flex-1">
              <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}>
                <div className="h-full w-1/3 bg-blue-500 rounded-full" />
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {formatDuration(selectedRecording.duration)}
            </span>
          </div>

          {/* Transcription */}
          {(() => {
            const trans = transcriptions.get(selectedRecording.id);
            if (trans) {
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Transcription</span>
                  </div>
                  <div className={`p-3 rounded-lg text-sm ${isDark ? 'bg-gray-600' : 'bg-white'} max-h-40 overflow-y-auto`}>
                    {trans.segments.map((seg, idx) => (
                      <div key={idx} className="mb-2">
                        <span className={`text-xs font-medium ${
                          seg.speaker === 'ai' ? 'text-purple-500' : 
                          seg.speaker === 'caller' ? 'text-blue-500' : 'text-green-500'
                        }`}>
                          {seg.speaker.toUpperCase()}:
                        </span>
                        <p className="ml-4">{seg.text}</p>
                      </div>
                    ))}
                  </div>
                  {trans.summary && (
                    <div className={`p-2 rounded-lg text-xs ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                      <span className="font-medium">Summary:</span> {trans.summary}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Export Options */}
          <div className="flex gap-2 mt-3">
            {(['mp3', 'wav', 'm4a'] as const).map(format => (
              <button
                key={format}
                onClick={() => handleExport(selectedRecording, format)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                  isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <Download className="w-3 h-3 inline mr-1" />
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
