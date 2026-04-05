import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, AlertTriangle, Ban, Check, X, Plus, Trash2,
  Globe, Bot, Users
} from 'lucide-react';
import { spamFilterService, SpamPattern, SpamSettings } from '../services/spamFilterService';

interface SpamFilterSettingsProps {
  isDark: boolean;
}

export function SpamFilterSettings({ isDark }: SpamFilterSettingsProps) {
  const [settings, setSettings] = useState<SpamSettings>(spamFilterService.getSettings());
  const [patterns, setPatterns] = useState<SpamPattern[]>(spamFilterService.getPatterns());
  const [stats] = useState(spamFilterService.getStats());
  const [showAddPattern, setShowAddPattern] = useState(false);
  const [newPattern, setNewPattern] = useState('');
  const [newType, setNewType] = useState<SpamPattern['type']>('keyword');
  const [newAction, setNewAction] = useState<SpamPattern['action']>('flag');

  const handleToggle = (key: keyof SpamSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    spamFilterService.updateSettings(newSettings);
  };

  const handleAddPattern = () => {
    if (!newPattern) return;
    spamFilterService.addPattern({
      pattern: newPattern,
      type: newType,
      action: newAction,
      confidence: 0.8,
      enabled: true
    });
    setPatterns(spamFilterService.getPatterns());
    setShowAddPattern(false);
    setNewPattern('');
  };

  const handleDeletePattern = (id: string) => {
    spamFilterService.removePattern(id);
    setPatterns(spamFilterService.getPatterns());
  };

  const handleTogglePattern = (id: string) => {
    const pattern = patterns.find(p => p.id === id);
    if (pattern) {
      spamFilterService.updatePattern(id, { enabled: !pattern.enabled });
      setPatterns(spamFilterService.getPatterns());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Spam Filter
        </h3>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-500" />
          <span className="text-xs text-green-500">{stats.activePatterns} active</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className="text-lg font-bold">{stats.blockedToday}</p>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Blocked Today</p>
        </div>
        <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className="text-lg font-bold">{stats.totalPatterns}</p>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Patterns</p>
        </div>
        <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className="text-lg font-bold">{stats.communityReports}</p>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Reports</p>
        </div>
      </div>

      {/* Main Settings */}
      <div className="space-y-2">
        {[
          { key: 'autoBlock', label: 'Auto-block high confidence spam', icon: Ban },
          { key: 'aiDetection', label: 'AI-powered spam detection', icon: Bot },
          { key: 'communityBlocklist', label: 'Community blocklist', icon: Users },
          { key: 'blockUnknownInternational', label: 'Block unknown international', icon: Globe }
        ].map(({ key, label, icon: Icon }) => (
          <div key={key} className={`p-3 rounded-xl flex items-center justify-between ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                settings[key as keyof SpamSettings] ? 'bg-green-500/20' : 'bg-gray-500/20'
              }`}>
                <Icon className={`w-4 h-4 ${settings[key as keyof SpamSettings] ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <span className="text-sm">{label}</span>
            </div>
            <button
              onClick={() => handleToggle(key as keyof SpamSettings)}
              className={`w-10 h-5 rounded-full transition-colors ${
                settings[key as keyof SpamSettings] ? 'bg-green-500' : 'bg-gray-400'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings[key as keyof SpamSettings] ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        ))}
      </div>

      {/* Patterns */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Filter Patterns</span>
          <button
            onClick={() => setShowAddPattern(true)}
            className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1 max-h-40 overflow-y-auto">
          {patterns.map(pattern => (
            <div key={pattern.id} className={`p-2 rounded-lg flex items-center justify-between ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            } ${!pattern.enabled && 'opacity-50'}`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePattern(pattern.id)}
                  className={`w-6 h-6 rounded flex items-center justify-center ${
                    pattern.enabled ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                  }`}
                >
                  {pattern.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                </button>
                <div>
                  <p className="text-xs font-medium">{pattern.pattern}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {pattern.type} • {pattern.action} • {(pattern.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeletePattern(pattern.id)}
                className="p-1 rounded hover:bg-red-500/20 text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showAddPattern && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        >
          <input
            type="text"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            placeholder="Pattern (keyword, number, or regex)"
            className={`w-full p-2 rounded-lg text-sm mb-2 outline-none ${
              isDark ? 'bg-gray-600 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-500'
            }`}
          />
          <div className="flex gap-2 mb-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as SpamPattern['type'])}
              className={`flex-1 p-2 rounded-lg text-sm outline-none ${
                isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
              }`}
            >
              <option value="keyword">Keyword</option>
              <option value="number">Number</option>
              <option value="regex">Regex</option>
            </select>
            <select
              value={newAction}
              onChange={(e) => setNewAction(e.target.value as SpamPattern['action'])}
              className={`flex-1 p-2 rounded-lg text-sm outline-none ${
                isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
              }`}
            >
              <option value="flag">Flag</option>
              <option value="block">Block</option>
              <option value="challenge">Challenge</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddPattern(false)}
              className={`flex-1 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleAddPattern}
              disabled={!newPattern}
              className="flex-1 py-2 rounded-lg text-sm bg-blue-500 text-white disabled:opacity-50"
            >
              Add Pattern
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
