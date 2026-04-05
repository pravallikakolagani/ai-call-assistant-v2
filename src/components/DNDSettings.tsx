import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Clock, Focus, Plus, Trash2 } from 'lucide-react';
import { dndService, DNDSchedule, FocusMode } from '../services/dndService';
import { ContactCategory } from '../services/contactRoutingService';

interface DNDSettingsProps {
  isDark: boolean;
}

export function DNDSettings({ isDark }: DNDSettingsProps) {
  const [schedules, setSchedules] = useState<DNDSchedule[]>([]);
  const [focusMode, setFocusMode] = useState<FocusMode>(dndService.getFocusMode());
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [isDNDActive, setIsDNDActive] = useState(dndService.isDNDActive());
  
  // Form states
  const [newScheduleName, setNewScheduleName] = useState('');
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('07:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [allowUrgent, setAllowUrgent] = useState(true);
  const [allowCategories, setAllowCategories] = useState<ContactCategory[]>(['family', 'vip']);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const categories: ContactCategory[] = ['family', 'friends', 'work', 'vip', 'blocked'];

  useEffect(() => {
    setSchedules(dndService.getSchedules());
    const interval = setInterval(() => {
      setIsDNDActive(dndService.isDNDActive());
      setFocusMode(dndService.getFocusMode());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddSchedule = () => {
    dndService.addSchedule({
      name: newScheduleName || 'New Schedule',
      enabled: true,
      type: 'time-based',
      timeRange: { start: startTime, end: endTime },
      daysOfWeek: selectedDays,
      allowFrom: allowCategories,
      allowUrgent,
      message: `I'm currently unavailable. I'll respond later.`
    });
    setSchedules(dndService.getSchedules());
    setShowAddSchedule(false);
    resetForm();
  };

  const resetForm = () => {
    setNewScheduleName('');
    setStartTime('22:00');
    setEndTime('07:00');
    setSelectedDays(['Monday']);
    setAllowUrgent(true);
    setAllowCategories(['family']);
  };

  const handleToggleSchedule = (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
      dndService.updateSchedule(id, { enabled: !schedule.enabled });
      setSchedules(dndService.getSchedules());
    }
  };

  const handleDeleteSchedule = (id: string) => {
    dndService.deleteSchedule(id);
    setSchedules(dndService.getSchedules());
  };

  const handleEnableFocus = () => {
    dndService.enableFocusMode(60, true);
    setFocusMode(dndService.getFocusMode());
    setIsDNDActive(true);
  };

  const handleDisableFocus = () => {
    dndService.disableFocusMode();
    setFocusMode(dndService.getFocusMode());
    setIsDNDActive(dndService.isDNDActive());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Do Not Disturb
        </h3>
        {isDNDActive && (
          <span className="px-2 py-1 rounded-lg text-xs bg-red-500/20 text-red-500 flex items-center gap-1">
            <Moon className="w-3 h-3" />
            Active
          </span>
        )}
      </div>

      {/* Focus Mode Quick Toggle */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Focus className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium">Focus Mode</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {focusMode.enabled 
                  ? `${dndService.getRemainingFocusTime()} minutes remaining`
                  : 'Enable for uninterrupted work'
                }
              </p>
            </div>
          </div>
          <button
            onClick={focusMode.enabled ? handleDisableFocus : handleEnableFocus}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              focusMode.enabled
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            {focusMode.enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-2">
        {schedules.map(schedule => (
          <div
            key={schedule.id}
            className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${
              schedule.enabled && dndService.isDNDActive() ? 'border border-red-500/30' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">{schedule.name}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {schedule.timeRange?.start} - {schedule.timeRange?.end}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Allows: {schedule.allowFrom.join(', ')}
                    {schedule.allowUrgent && ' • Urgent calls'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleSchedule(schedule.id)}
                  className={`w-10 h-6 rounded-full transition-colors ${
                    schedule.enabled ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    schedule.enabled ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
                <button
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Schedule */}
      {!showAddSchedule ? (
        <button
          onClick={() => setShowAddSchedule(true)}
          className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
            isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Schedule
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        >
          <h4 className="font-medium mb-3">Add DND Schedule</h4>
          
          <input
            type="text"
            value={newScheduleName}
            onChange={(e) => setNewScheduleName(e.target.value)}
            placeholder="Schedule name (e.g., Work Hours)"
            className={`w-full p-2.5 rounded-lg text-sm mb-3 outline-none ${
              isDark ? 'bg-gray-600 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-500'
            }`}
          />

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full p-2 rounded-lg text-sm outline-none ${
                  isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
                }`}
              />
            </div>
            <div className="flex-1">
              <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full p-2 rounded-lg text-sm outline-none ${
                  isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
                }`}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Days</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {days.map(day => (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDays(prev => 
                      prev.includes(day) 
                        ? prev.filter(d => d !== day)
                        : [...prev, day]
                    );
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    selectedDays.includes(day)
                      ? 'bg-blue-500 text-white'
                      : isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Allow calls from</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setAllowCategories(prev => 
                      prev.includes(cat)
                        ? prev.filter(c => c !== cat)
                        : [...prev, cat]
                    );
                  }}
                  className={`px-2 py-1 rounded text-xs capitalize transition-colors ${
                    allowCategories.includes(cat)
                      ? 'bg-green-500 text-white'
                      : isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={allowUrgent}
              onChange={(e) => setAllowUrgent(e.target.checked)}
              className="rounded"
            />
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Allow urgent calls
            </span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowAddSchedule(false);
                resetForm();
              }}
              className={`flex-1 py-2 rounded-lg ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleAddSchedule}
              className="flex-1 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            >
              Add Schedule
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
