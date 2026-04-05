export interface DNDSchedule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'time-based' | 'calendar-based' | 'focus-mode';
  timeRange?: {
    start: string; // HH:mm format
    end: string;
  };
  daysOfWeek: string[];
  allowFrom: ContactCategory[];
  allowUrgent: boolean;
  message: string;
}

export interface FocusMode {
  enabled: boolean;
  duration: number; // minutes
  allowBreakthrough: boolean;
  endTime?: Date;
}

export type ContactCategory = 'family' | 'friends' | 'work' | 'vip' | 'blocked' | 'unknown';

class DNDService {
  private schedules: DNDSchedule[] = [
    {
      id: 'dnd-night',
      name: 'Night Mode',
      enabled: true,
      type: 'time-based',
      timeRange: { start: '22:00', end: '07:00' },
      daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      allowFrom: ['family', 'vip'],
      allowUrgent: true,
      message: 'I\'m currently in night mode. I\'ll respond in the morning.'
    },
    {
      id: 'dnd-work',
      name: 'Work Hours Focus',
      enabled: false,
      type: 'time-based',
      timeRange: { start: '09:00', end: '17:00' },
      daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      allowFrom: ['work', 'vip'],
      allowUrgent: true,
      message: 'I\'m in focused work mode. I\'ll check messages later.'
    }
  ];

  private focusMode: FocusMode = {
    enabled: false,
    duration: 60,
    allowBreakthrough: true
  };

  private calendarSync: boolean = false;

  // Check if DND is currently active
  isDNDActive(): boolean {
    const now = new Date();
    
    // Check focus mode first
    if (this.focusMode.enabled && this.focusMode.endTime) {
      if (now < this.focusMode.endTime) {
        return true;
      } else {
        // Auto-disable expired focus mode
        this.focusMode.enabled = false;
      }
    }

    // Check schedules
    return this.schedules.some(schedule => {
      if (!schedule.enabled) return false;
      return this.isScheduleActive(schedule, now);
    });
  }

  // Check if a specific schedule is active
  private isScheduleActive(schedule: DNDSchedule, now: Date = new Date()): boolean {
    if (schedule.type === 'calendar-based') {
      // Would check calendar integration
      return false;
    }

    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    if (!schedule.daysOfWeek.includes(currentDay)) {
      return false;
    }

    if (schedule.timeRange) {
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const { start, end } = schedule.timeRange;

      // Handle overnight schedules (e.g., 22:00 - 07:00)
      if (start > end) {
        return currentTime >= start || currentTime <= end;
      }
      
      return currentTime >= start && currentTime <= end;
    }

    return false;
  }

  // Check if caller is allowed through DND
  isCallerAllowed(category: ContactCategory, isUrgent: boolean = false): boolean {
    if (!this.isDNDActive()) return true;

    const activeSchedule = this.getActiveSchedule();
    if (!activeSchedule) return true;

    // Check if category is in allow list
    if (activeSchedule.allowFrom.includes(category)) {
      return true;
    }

    // Check urgent override
    if (activeSchedule.allowUrgent && isUrgent) {
      return true;
    }

    return false;
  }

  // Get active schedule
  getActiveSchedule(): DNDSchedule | null {
    const now = new Date();
    
    // Check focus mode
    if (this.focusMode.enabled && this.focusMode.endTime && now < this.focusMode.endTime) {
      return {
        id: 'focus-mode',
        name: 'Focus Mode',
        enabled: true,
        type: 'focus-mode',
        daysOfWeek: [],
        allowFrom: ['vip'],
        allowUrgent: this.focusMode.allowBreakthrough,
        message: 'I\'m in focus mode. I\'ll respond after my session ends.'
      };
    }

    // Find active schedule
    return this.schedules.find(s => s.enabled && this.isScheduleActive(s, now)) || null;
  }

  // Get DND message for auto-response
  getDNDMessage(): string | null {
    const schedule = this.getActiveSchedule();
    return schedule?.message || null;
  }

  // Get all schedules
  getSchedules(): DNDSchedule[] {
    return [...this.schedules];
  }

  // Add schedule
  addSchedule(schedule: Omit<DNDSchedule, 'id'>): DNDSchedule {
    const newSchedule: DNDSchedule = {
      ...schedule,
      id: `dnd_${Date.now()}`
    };
    this.schedules.push(newSchedule);
    return newSchedule;
  }

  // Update schedule
  updateSchedule(id: string, updates: Partial<DNDSchedule>): DNDSchedule | null {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) return null;

    this.schedules[index] = { ...this.schedules[index], ...updates };
    return this.schedules[index];
  }

  // Delete schedule
  deleteSchedule(id: string): boolean {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.schedules.splice(index, 1);
    return true;
  }

  // Enable focus mode
  enableFocusMode(duration: number = 60, allowBreakthrough: boolean = true): void {
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + duration);

    this.focusMode = {
      enabled: true,
      duration,
      allowBreakthrough,
      endTime
    };
  }

  // Disable focus mode
  disableFocusMode(): void {
    this.focusMode.enabled = false;
    this.focusMode.endTime = undefined;
  }

  // Get focus mode status
  getFocusMode(): FocusMode {
    // Check if expired
    if (this.focusMode.enabled && this.focusMode.endTime) {
      if (new Date() >= this.focusMode.endTime) {
        this.focusMode.enabled = false;
        this.focusMode.endTime = undefined;
      }
    }
    return { ...this.focusMode };
  }

  // Enable calendar sync
  enableCalendarSync(): void {
    this.calendarSync = true;
    // Would integrate with calendar service
  }

  // Disable calendar sync
  disableCalendarSync(): void {
    this.calendarSync = false;
  }

  // Get remaining focus time in minutes
  getRemainingFocusTime(): number {
    if (!this.focusMode.enabled || !this.focusMode.endTime) return 0;
    
    const remaining = this.focusMode.endTime.getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 60000));
  }
}

export const dndService = new DNDService();
