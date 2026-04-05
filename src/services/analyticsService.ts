export interface CallMetrics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  aiHandledCalls: number;
  averageDuration: number;
  averageResponseTime: number;
  peakHour: number;
  busiestDay: string;
}

export interface TimeSeriesData {
  date: string;
  calls: number;
  answered: number;
  missed: number;
  aiHandled: number;
}

export interface CallerStats {
  phoneNumber: string;
  name: string;
  totalCalls: number;
  lastCall: Date;
  category: string;
}

export interface InsightsData {
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  recommendation: string;
  topPerformer: string;
  needsAttention: string;
}

class AnalyticsService {
  // Get comprehensive call metrics
  getCallMetrics(calls: any[]): CallMetrics {
    const total = calls.length;
    const answered = calls.filter(c => c.status === 'answered').length;
    const missed = calls.filter(c => c.status === 'missed').length;
    const aiHandled = calls.filter(c => c.status === 'auto-answered' || c.status === 'message-sent').length;
    
    const avgDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0) / (total || 1);
    
    // Calculate peak hour
    const hourCounts = new Array(24).fill(0);
    calls.forEach(c => {
      const hour = new Date(c.timestamp).getHours();
      hourCounts[hour]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    
    // Calculate busiest day
    const dayCounts: Record<string, number> = {};
    calls.forEach(c => {
      const day = new Date(c.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const busiestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    return {
      totalCalls: total,
      answeredCalls: answered,
      missedCalls: missed,
      aiHandledCalls: aiHandled,
      averageDuration: Math.round(avgDuration),
      averageResponseTime: Math.round(avgDuration * 0.8),
      peakHour,
      busiestDay
    };
  }

  // Get time series data for charts
  getTimeSeriesData(calls: any[], days: number = 7): TimeSeriesData[] {
    const data: TimeSeriesData[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCalls = calls.filter(c => 
        new Date(c.timestamp).toISOString().split('T')[0] === dateStr
      );
      
      data.push({
        date: dateStr,
        calls: dayCalls.length,
        answered: dayCalls.filter(c => c.status === 'answered').length,
        missed: dayCalls.filter(c => c.status === 'missed').length,
        aiHandled: dayCalls.filter(c => 
          c.status === 'auto-answered' || c.status === 'message-sent'
        ).length
      });
    }
    
    return data;
  }

  // Get top callers
  getTopCallers(calls: any[], limit: number = 10): CallerStats[] {
    const callerMap = new Map<string, { 
      phoneNumber: string; 
      name: string; 
      count: number; 
      lastCall: Date;
      category: string;
    }>();
    
    calls.forEach(c => {
      const existing = callerMap.get(c.phoneNumber);
      if (existing) {
        existing.count++;
        if (new Date(c.timestamp) > existing.lastCall) {
          existing.lastCall = new Date(c.timestamp);
        }
      } else {
        callerMap.set(c.phoneNumber, {
          phoneNumber: c.phoneNumber,
          name: c.caller,
          count: 1,
          lastCall: new Date(c.timestamp),
          category: c.category
        });
      }
    });
    
    return Array.from(callerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(c => ({
        phoneNumber: c.phoneNumber,
        name: c.name,
        totalCalls: c.count,
        lastCall: c.lastCall,
        category: c.category
      }));
  }

  // Get AI insights
  getInsights(calls: any[]): InsightsData {
    const metrics = this.getCallMetrics(calls);
    const timeSeries = this.getTimeSeriesData(calls, 14);
    
    // Calculate trend
    const firstWeek = timeSeries.slice(0, 7).reduce((sum, d) => sum + d.calls, 0);
    const secondWeek = timeSeries.slice(7).reduce((sum, d) => sum + d.calls, 0);
    const trendPercentage = firstWeek > 0 
      ? Math.round(((secondWeek - firstWeek) / firstWeek) * 100)
      : 0;
    
    const trend = trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable';
    
    // Generate recommendation
    let recommendation = '';
    if (metrics.missedCalls / metrics.totalCalls > 0.3) {
      recommendation = 'High missed call rate. Consider enabling AI auto-answer.';
    } else if (metrics.aiHandledCalls / metrics.totalCalls < 0.2) {
      recommendation = 'Low AI usage. Enable auto-AI for better efficiency.';
    } else if (metrics.peakHour >= 9 && metrics.peakHour <= 17) {
      recommendation = 'Peak calls during work hours. Ensure AI is active.';
    } else {
      recommendation = 'Call patterns look healthy. Keep up the good work!';
    }
    
    return {
      trend,
      trendPercentage,
      recommendation,
      topPerformer: metrics.busiestDay,
      needsAttention: metrics.missedCalls > metrics.answeredCalls ? 'Missed calls' : 'None'
    };
  }

  // Get category breakdown
  getCategoryBreakdown(calls: any[]): { category: string; count: number; percentage: number }[] {
    const categoryCounts: Record<string, number> = {};
    calls.forEach(c => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });
    
    const total = calls.length;
    return Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Get hourly distribution
  getHourlyDistribution(calls: any[]): number[] {
    const distribution = new Array(24).fill(0);
    calls.forEach(c => {
      const hour = new Date(c.timestamp).getHours();
      distribution[hour]++;
    });
    return distribution;
  }
}

export const analyticsService = new AnalyticsService();
