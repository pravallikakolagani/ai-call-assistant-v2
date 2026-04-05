import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Check, AlertCircle, Bell, Calendar, Clock } from 'lucide-react';
import { emailService } from '../services/emailService';

interface EmailSettingsProps {
  isDark: boolean;
}

export function EmailSettings({ isDark }: EmailSettingsProps) {
  const [settings, setSettings] = useState(emailService.getSettings());
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [isEditing, setIsEditing] = useState(false);
  const [tempEmail, setTempEmail] = useState(settings.emailAddress);

  const handleToggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      const newSettings = { ...settings, [key]: !settings[key] };
      setSettings(newSettings);
      emailService.configure(newSettings);
    }
  };

  const handleSaveEmail = () => {
    const newSettings = { ...settings, emailAddress: tempEmail, enabled: true };
    setSettings(newSettings);
    emailService.configure(newSettings);
    setIsEditing(false);
  };

  const handleTestEmail = async () => {
    setTestStatus('sending');
    const success = await emailService.testConfiguration();
    setTestStatus(success ? 'sent' : 'error');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const notificationTypes = [
    { key: 'notifyMissedCalls', label: 'Missed Calls', icon: Bell, desc: 'Get notified when you miss a call' },
    { key: 'notifyDailySummary', label: 'Daily Summary', icon: Calendar, desc: 'Daily recap of all calls' },
    { key: 'notifyWeeklyReport', label: 'Weekly Report', icon: Clock, desc: 'Weekly analytics report' },
    { key: 'notifyUrgent', label: 'Urgent Calls', icon: AlertCircle, desc: 'Immediate alerts for urgent calls' },
    { key: 'notifyVoicemail', label: 'New Voicemails', icon: Mail, desc: 'When someone leaves a voicemail' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Email Notifications
        </h3>
        {settings.enabled && settings.emailAddress && (
          <span className="px-2 py-1 rounded-lg text-xs bg-green-500/20 text-green-500 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Active
          </span>
        )}
      </div>

      {/* Email Configuration */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex items-center gap-3 mb-3">
          <Mail className="w-5 h-5 text-blue-500" />
          <span className="font-medium">Email Address</span>
        </div>
        
        {isEditing ? (
          <div className="flex gap-2">
            <input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              placeholder="your@email.com"
              className={`flex-1 p-2.5 rounded-lg text-sm outline-none ${
                isDark ? 'bg-gray-600 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
            <button
              onClick={handleSaveEmail}
              className="px-3 py-2 rounded-lg bg-green-500 text-white"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className={`text-sm ${settings.emailAddress ? 'text-gray-300' : 'text-gray-500'}`}>
              {settings.emailAddress || 'No email configured'}
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {settings.emailAddress ? 'Change' : 'Add'}
            </button>
          </div>
        )}

        {settings.emailAddress && (
          <button
            onClick={handleTestEmail}
            disabled={testStatus === 'sending'}
            className={`mt-3 w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
              testStatus === 'sent' ? 'bg-green-500 text-white' :
              testStatus === 'error' ? 'bg-red-500 text-white' :
              isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {testStatus === 'sending' ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                Sending...
              </>
            ) : testStatus === 'sent' ? (
              <>
                <Check className="w-4 h-4" />
                Test email sent!
              </>
            ) : testStatus === 'error' ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Failed to send
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Test Email
              </>
            )}
          </button>
        )}
      </div>

      {/* Notification Types */}
      <div className="space-y-2">
        {notificationTypes.map(({ key, label, icon: Icon, desc }) => (
          <div
            key={key}
            className={`p-3 rounded-xl flex items-center justify-between ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                settings[key as keyof typeof settings] ? 'bg-blue-500/20' : 'bg-gray-500/20'
              }`}>
                <Icon className={`w-5 h-5 ${
                  settings[key as keyof typeof settings] ? 'text-blue-500' : 'text-gray-500'
                }`} />
              </div>
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {desc}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle(key as keyof typeof settings)}
              disabled={!settings.enabled}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                settings[key as keyof typeof settings] ? 'bg-blue-500' : 'bg-gray-400'
              } ${!settings.enabled && 'opacity-50'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${
                settings[key as keyof typeof settings] ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>
        ))}
      </div>

      {/* Summary Time */}
      {settings.notifyDailySummary && (
        <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Daily Summary Time
          </label>
          <input
            type="time"
            value={settings.summaryTime}
            onChange={(e) => {
              const newSettings = { ...settings, summaryTime: e.target.value };
              setSettings(newSettings);
              emailService.configure(newSettings);
            }}
            className={`mt-2 w-full p-2 rounded-lg text-sm outline-none ${
              isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
            }`}
          />
        </div>
      )}
    </div>
  );
}
