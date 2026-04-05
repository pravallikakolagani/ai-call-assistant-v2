import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, X, Clock } from 'lucide-react';
import { calendarService, CalendarEvent } from '../services/calendarService';

interface ScheduleCallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  callerName: string;
  callerNumber: string;
  onScheduled: (event: CalendarEvent) => void;
  isDark: boolean;
}

export function ScheduleCallbackModal({
  isOpen,
  onClose,
  callerName,
  callerNumber,
  onScheduled,
  isDark
}: ScheduleCallbackModalProps) {
  const [step, setStep] = useState<'slots' | 'confirm' | 'success'>('slots');
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      loadAvailableSlots();
    }
  }, [isOpen]);

  const loadAvailableSlots = async () => {
    setIsLoading(true);
    try {
      const slots = await calendarService.findAvailableSlots(30);
      setAvailableSlots(slots);
    } catch (err: any) {
      setError('Failed to load available slots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedSlot) return;

    setIsLoading(true);
    try {
      const event = await calendarService.scheduleCallback(
        callerName,
        callerNumber,
        selectedSlot,
        30
      );
      if (event) {
        onScheduled(event);
        setStep('success');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to schedule callback');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSlot = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
    
    let dayLabel = '';
    if (isToday) dayLabel = 'Today';
    else if (isTomorrow) dayLabel = 'Tomorrow';
    else dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    return {
      day: dayLabel,
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      full: date
    };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full max-w-md rounded-2xl p-6 ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Schedule Callback</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {callerName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {step === 'slots' && (
            <>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Select a time slot for your callback:
              </p>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableSlots.map((slot, index) => {
                    const formatted = formatSlot(slot);
                    const isSelected = selectedSlot?.getTime() === slot.getTime();

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : isDark
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4" />
                          <div className="text-left">
                            <p className="font-medium">{formatted.time}</p>
                            <p className={`text-sm ${isSelected ? 'text-blue-100' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {formatted.day}
                            </p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-5 h-5" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => selectedSlot && setStep('confirm')}
                disabled={!selectedSlot || isLoading}
                className={`w-full mt-6 py-3 rounded-xl font-medium transition-all ${
                  selectedSlot
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </>
          )}

          {step === 'confirm' && selectedSlot && (
            <>
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  You're scheduling a callback to:
                </p>
                <p className="font-semibold">{callerName}</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {callerNumber}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-600/20">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Scheduled for:
                  </p>
                  <p className="font-medium">
                    {formatSlot(selectedSlot).day} at {formatSlot(selectedSlot).time}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Duration: 30 minutes
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('slots')}
                  className={`flex-1 py-3 rounded-xl font-medium ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? 'Scheduling...' : 'Confirm'}
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center"
              >
                <Check className="w-8 h-8 text-white" />
              </motion.div>
              <h4 className="font-semibold text-lg mb-2">Callback Scheduled!</h4>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                You'll receive a notification when it's time to call back.
              </p>
              <button
                onClick={onClose}
                className="py-3 px-6 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Calendar Integration Settings Component
interface CalendarIntegrationProps {
  isDark: boolean;
}

export function CalendarIntegration({ isDark }: CalendarIntegrationProps) {
  const [connected, setConnected] = useState<Record<string, boolean>>({
    google: false,
    outlook: false,
    apple: false
  });
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnect = async (provider: 'google' | 'outlook' | 'apple') => {
    setIsConnecting(provider);
    try {
      const success = await calendarService.connectCalendar(provider);
      if (success) {
        setConnected(prev => ({ ...prev, [provider]: true }));
      }
    } catch (error) {
      console.error('Failed to connect calendar:', error);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = (provider: 'google' | 'outlook' | 'apple') => {
    calendarService.disconnectCalendar(provider);
    setConnected(prev => ({ ...prev, [provider]: false }));
  };

  const providers = [
    {
      id: 'google',
      name: 'Google Calendar',
      icon: '📅',
      description: 'Connect your Google Calendar to schedule callbacks'
    },
    {
      id: 'outlook',
      name: 'Outlook Calendar',
      icon: '📆',
      description: 'Connect your Microsoft Outlook calendar'
    },
    {
      id: 'apple',
      name: 'Apple Calendar',
      icon: '🍎',
      description: 'Connect your Apple iCloud calendar'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Calendar Integration
      </h3>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Connect your calendar to automatically schedule callbacks for missed important calls.
      </p>

      <div className="space-y-3">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`p-4 rounded-xl flex items-center justify-between ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{provider.icon}</span>
              <div>
                <p className="font-medium">{provider.name}</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {provider.description}
                </p>
              </div>
            </div>

            {connected[provider.id] ? (
              <div className="flex items-center gap-2">
                <span className="text-green-500 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Connected
                </span>
                <button
                  onClick={() => handleDisconnect(provider.id as any)}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleConnect(provider.id as any)}
                disabled={isConnecting === provider.id}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isConnecting === provider.id
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isConnecting === provider.id ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Connecting...
                  </span>
                ) : (
                  'Connect'
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
