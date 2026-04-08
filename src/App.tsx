import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneIncoming, PhoneMissed, PhoneOff, MessageSquare,
  Bot, AlertTriangle, CheckCircle, Clock, Moon, Sun, Zap,
  Shield, Mic, User, Search, MapPin, Users,
  TrendingUp, Flag, Star
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import './App.css';
import { truecallerService, TruecallerProfile, CallAnalytics } from './services/truecallerService';
import { LoginPage } from './components/LoginPage';
import { apiService } from './services/api';
import { CalendarIntegration } from './components/CalendarIntegration';
import { SMSSettings } from './components/SMSSettings';
import { ContactManager } from './components/ContactManager';
import { RecordingManager } from './components/RecordingManager';
import { DNDSettings } from './components/DNDSettings';
import { EmailSettings } from './components/EmailSettings';
import { LanguageSelector } from './components/LanguageSelector';
import { WebhookSettings } from './components/WebhookSettings';
import { SpamFilterSettings } from './components/SpamFilterSettings';

// Types
interface Call {
  id: string;
  caller: string;
  phoneNumber: string;
  timestamp: Date;
  duration: number;
  status: 'incoming' | 'answered' | 'missed' | 'auto-answered' | 'message-sent';
  importance: 'high' | 'medium' | 'low';
  transcript?: string;
  aiResponse?: string;
  reason?: string;
  category: 'work' | 'personal' | 'spam' | 'unknown';
  truecallerData?: TruecallerProfile;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

const MESSAGE_TEMPLATES = [
  { id: '1', name: 'Busy Working', content: 'Hi, I am currently busy working. Please leave a message or call back later.', category: 'Professional' },
  { id: '2', name: 'In Meeting', content: 'I am in a meeting right now. I will get back to you as soon as possible.', category: 'Professional' },
  { id: '3', name: 'Driving', content: 'I am driving and cannot take calls. I will call you back when I reach my destination.', category: 'Personal' },
  { id: '4', name: 'Family Time', content: 'Spending quality time with family. Will respond to urgent matters only.', category: 'Personal' }
];

// AI Importance Detection Logic
const analyzeImportance = (caller: string, category: string, transcript?: string): 'high' | 'medium' | 'low' => {
  const urgentKeywords = ['urgent', 'emergency', 'important', 'asap', 'immediately', 'critical'];
  const text = (transcript || caller).toLowerCase();
  
  if (category === 'spam' || caller.includes('Unknown')) return 'low';
  if (category === 'work' && urgentKeywords.some(k => text.includes(k))) return 'high';
  if (category === 'personal' && urgentKeywords.some(k => text.includes(k))) return 'high';
  if (category === 'work') return 'medium';
  return 'low';
};

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings' | 'analytics'>('dashboard');
  const [calls, setCalls] = useState<Call[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [autoAnswerHighPriority, setAutoAnswerHighPriority] = useState(true);
  const [sendMessageForLow, setSendMessageForLow] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(MESSAGE_TEMPLATES[0].id);
  const [isTruecallerConnected, setIsTruecallerConnected] = useState(false);
  const [callAnalytics, setCallAnalytics] = useState<CallAnalytics | null>(null);
  const [callerProfiles, setCallerProfiles] = useState<Map<string, TruecallerProfile>>(new Map());
  const [ringDuration, setRingDuration] = useState(0);
  const [autoAIThreshold] = useState(8); // Auto-AI after 8 seconds of ringing
  const [isAutoAIActive, setIsAutoAIActive] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userTruecallerId, setUserTruecallerId] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Load calls from backend on mount
  useEffect(() => {
    const loadCalls = async () => {
      if (isAuthenticated) {
        try {
          const data = await apiService.getCalls();
          setCalls(data.map((call: any) => ({
            ...call,
            timestamp: new Date(call.timestamp)
          })));
        } catch (error) {
          console.error('Failed to load calls:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadCalls();
  }, [isAuthenticated]);
  useEffect(() => {
    const loadCallerProfiles = async () => {
      const profiles = new Map<string, TruecallerProfile>();
      for (const call of calls) {
        if (!profiles.has(call.phoneNumber)) {
          const profile = await truecallerService.getCallerInfo(call.phoneNumber);
          if (profile) {
            profiles.set(call.phoneNumber, profile);
          }
        }
      }
      setCallerProfiles(profiles);
    };
    loadCallerProfiles();
  }, [calls]);

  // Calculate analytics when calls or profiles change
  useEffect(() => {
    const calculateAnalytics = async () => {
      const analytics = await truecallerService.getCallAnalytics(calls);
      setCallAnalytics(analytics);
    };
    if (isTruecallerConnected) {
      calculateAnalytics();
    }
  }, [calls, isTruecallerConnected]);

  // Connect to Truecaller
  const handleConnectTruecaller = async () => {
    const connected = await truecallerService.connect();
    setIsTruecallerConnected(connected);
  };

  // Ring timer - tracks how long incoming call is ringing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (incomingCall) {
      interval = setInterval(() => {
        setRingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRingDuration(0);
    }
    
    return () => clearInterval(interval);
  }, [incomingCall]);

  // Auto-AI trigger when user can't reach phone (rings too long)
  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    if (incomingCall && isAIEnabled && isAutoAIActive && ringDuration >= autoAIThreshold) {
      // Check caller history to determine action
      const callerHistory = calls.filter(c => c.phoneNumber === incomingCall.phoneNumber);
      const previousCalls = callerHistory.length;
      const answeredCalls = callerHistory.filter(c => c.status === 'answered').length;
      const isFrequentCaller = previousCalls > 3 && (answeredCalls / previousCalls) > 0.5;
      
      // Auto-trigger AI response
      console.log(`Auto-AI triggered: ${incomingCall.caller} has been ringing for ${ringDuration}s`);
      console.log(`Caller history: ${previousCalls} calls, ${answeredCalls} answered, frequent: ${isFrequentCaller}`);
      
      handleAIResponse(incomingCall);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ringDuration, incomingCall, isAIEnabled, isAutoAIActive, autoAIThreshold, calls]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const newCall: Call = {
        id: Date.now().toString(),
        caller: 'Michael Brown',
        phoneNumber: '+1 (555) 777-8888',
        timestamp: new Date(),
        duration: 0,
        status: 'incoming',
        importance: 'high',
        category: 'work',
        reason: 'Client emergency - server down'
      };
      setIncomingCall(newCall);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleAcceptCall = (callId: string) => {
    setCalls(prev => prev.map(c => 
      c.id === callId ? { ...c, status: 'answered', duration: 0 } : c
    ));
    setIncomingCall(null);
  };

  const handleRejectCall = (callId: string) => {
    setCalls(prev => prev.map(c => 
      c.id === callId ? { ...c, status: 'missed' } : c
    ));
    setIncomingCall(null);
  };

  const handleAIResponse = async (call: Call) => {
    const template = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate);
    const importance = analyzeImportance(call.caller, call.category, call.reason);
    
    let updatedCall = { ...call };
    
    if (importance === 'high' && autoAnswerHighPriority) {
      updatedCall = { 
        ...call, 
        status: 'auto-answered' as const, 
        transcript: `AI: ${template?.content}\nCaller: ${call.reason}\nAI: Transferring to user...`,
        aiResponse: 'High priority call auto-answered and connected'
      };
    } else if (importance === 'low' && sendMessageForLow) {
      updatedCall = { 
        ...call, 
        status: 'message-sent' as const,
        aiResponse: template?.content
      };
    }
    
    // Save to backend
    try {
      await apiService.createCall(updatedCall);
      setCalls(prev => [...prev, updatedCall]);
    } catch (error) {
      console.error('Failed to save call:', error);
    }
    
    setIncomingCall(null);
  };

  // Handle login with Truecaller ID
  const handleLogin = async (truecallerId: string, password: string, isRegistering: boolean) => {
    setLoginError('');
    setIsLoading(true);
    
    try {
      let data;
      if (isRegistering) {
        data = await apiService.register(truecallerId, password);
      } else {
        data = await apiService.login(truecallerId, password);
      }
      
      setUserTruecallerId(data.user.truecallerId);
      setIsAuthenticated(true);
      setIsTruecallerConnected(true);
      
      // Load user settings
      if (data.user.settings) {
        setIsAIEnabled(data.user.settings.isAIEnabled);
        setAutoAnswerHighPriority(data.user.settings.autoAnswerHighPriority);
        setSendMessageForLow(data.user.settings.sendMessageForLow);
        setIsAutoAIActive(data.user.settings.isAutoAIActive);
        setIsDark(data.user.settings.theme === 'dark');
      }
    } catch (error: any) {
      setLoginError(error.message || (isRegistering ? 'Registration failed' : 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    apiService.clearToken();
    setIsAuthenticated(false);
    setUserTruecallerId('');
    setIsTruecallerConnected(false);
    setCalls([]);
  };

  const stats = {
    total: calls.length,
    answered: calls.filter(c => c.status === 'answered').length,
    autoAnswered: calls.filter(c => c.status === 'auto-answered').length,
    messagesSent: calls.filter(c => c.status === 'message-sent').length,
    missed: calls.filter(c => c.status === 'missed').length,
    highPriority: calls.filter(c => c.importance === 'high').length
  };

  const chartData = [
    { name: 'Answered', value: stats.answered, color: '#10B981' },
    { name: 'Auto-Answered', value: stats.autoAnswered, color: '#3B82F6' },
    { name: 'Message Sent', value: stats.messagesSent, color: '#8B5CF6' },
    { name: 'Missed', value: stats.missed, color: '#EF4444' }
  ];

  const importanceData = [
    { name: 'High', count: calls.filter(c => c.importance === 'high').length, color: '#EF4444' },
    { name: 'Medium', count: calls.filter(c => c.importance === 'medium').length, color: '#F59E0B' },
    { name: 'Low', count: calls.filter(c => c.importance === 'low').length, color: '#10B981' }
  ];

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <LoginPage 
        isDark={isDark} 
        onLogin={handleLogin} 
        error={loginError} 
      />
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className={`w-full max-w-md p-8 rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <PhoneIncoming className="w-12 h-12 text-white" />
                </motion.div>
                
                <h2 className="text-2xl font-bold mb-2">{incomingCall.caller}</h2>
                <p className={`text-lg mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {incomingCall.phoneNumber}
                </p>
                
                {incomingCall.reason && (
                  <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className="text-sm font-medium text-red-500">AI Detected: {incomingCall.reason}</p>
                    <p className="text-xs mt-1">Importance: {incomingCall.importance.toUpperCase()}</p>
                  </div>
                )}
                
                {/* Ring Duration & Auto-AI Countdown */}
                {isAIEnabled && isAutoAIActive && (
                  <div className={`mt-4 p-3 rounded-lg ${ringDuration >= autoAIThreshold - 3 ? 'bg-red-500/20 animate-pulse' : isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${ringDuration >= autoAIThreshold - 3 ? 'text-red-500' : 'text-purple-600'}`}>
                        {ringDuration >= autoAIThreshold 
                          ? 'Auto-AI triggered! Checking caller history...'
                          : `Auto-AI in ${autoAIThreshold - ringDuration}s if not answered`
                        }
                      </span>
                      <span className="text-xs text-gray-500">Ringing: {ringDuration}s</span>
                    </div>
                    {ringDuration >= autoAIThreshold - 3 && (
                      <p className="text-xs mt-1 text-red-500">
                        Checking call history for {incomingCall.caller}...
                      </p>
                    )}
                  </div>
                )}
                
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => handleRejectCall(incomingCall.id)}
                    className="flex-1 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <PhoneOff className="w-5 h-5" /> Decline
                  </button>
                  <button
                    onClick={() => handleAcceptCall(incomingCall.id)}
                    className="flex-1 py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Phone className="w-5 h-5" /> Accept
                  </button>
                </div>
                
                {isAIEnabled && (
                  <button
                    onClick={() => handleAIResponse(incomingCall)}
                    className={`w-full mt-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                      isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                  >
                    <Bot className="w-5 h-5" /> Let AI Handle It
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 ${isDark ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">AI Call Assistant</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* User Info */}
              <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">{userTruecallerId}</span>
              </div>
              
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg text-red-500 hover:bg-red-500/10`}
                title="Logout"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
              
              <div className={`flex rounded-lg p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {(['dashboard', 'history', 'analytics', 'settings'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardView 
            stats={stats} 
            chartData={chartData} 
            importanceData={importanceData}
            recentCalls={calls.slice(0, 5)}
            isDark={isDark}
            isAIEnabled={isAIEnabled}
            onToggleAI={() => setIsAIEnabled(!isAIEnabled)}
          />
        )}
        
        {activeTab === 'history' && (
          <HistoryView 
            calls={calls} 
            isDark={isDark}
            templates={MESSAGE_TEMPLATES}
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsView
            isDark={isDark}
            isTruecallerConnected={isTruecallerConnected}
            onConnectTruecaller={handleConnectTruecaller}
            callAnalytics={callAnalytics}
            callerProfiles={callerProfiles}
          />
        )}
        
        {activeTab === 'settings' && (
          <SettingsView
            isDark={isDark}
            isAIEnabled={isAIEnabled}
            autoAnswerHighPriority={autoAnswerHighPriority}
            sendMessageForLow={sendMessageForLow}
            isAutoAIActive={isAutoAIActive}
            autoAIThreshold={autoAIThreshold}
            selectedTemplate={selectedTemplate}
            templates={MESSAGE_TEMPLATES}
            onToggleAI={() => setIsAIEnabled(!isAIEnabled)}
            onToggleAutoAnswer={() => setAutoAnswerHighPriority(!autoAnswerHighPriority)}
            onToggleSendMessage={() => setSendMessageForLow(!sendMessageForLow)}
            onToggleAutoAI={() => setIsAutoAIActive(!isAutoAIActive)}
            onChangeTemplate={setSelectedTemplate}
          />
        )}
      </main>
    </div>
  );
}

// Dashboard View
function DashboardView({ 
  stats, 
  chartData, 
  importanceData, 
  recentCalls, 
  isDark, 
  isAIEnabled,
  onToggleAI 
}: any) {
  return (
    <div className="space-y-6">
      {/* AI Status Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50' : 'bg-gradient-to-r from-purple-100 to-blue-100'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              isAIEnabled ? 'bg-green-500' : 'bg-gray-500'
            }`}>
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Assistant {isAIEnabled ? 'Active' : 'Paused'}</h2>
              <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {isAIEnabled 
                  ? 'Automatically screening and responding to calls'
                  : 'AI responses are currently disabled'}
              </p>
            </div>
          </div>
          <button
            onClick={onToggleAI}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              isAIEnabled 
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isAIEnabled ? 'Pause AI' : 'Activate AI'}
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Calls', value: stats.total, icon: Phone, color: 'blue' },
          { label: 'Answered', value: stats.answered, icon: PhoneIncoming, color: 'green' },
          { label: 'Auto-Answered', value: stats.autoAnswered, icon: Bot, color: 'purple' },
          { label: 'Messages Sent', value: stats.messagesSent, icon: MessageSquare, color: 'indigo' },
          { label: 'Missed', value: stats.missed, icon: PhoneMissed, color: 'red' },
          { label: 'High Priority', value: stats.highPriority, icon: AlertTriangle, color: 'orange' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
        >
          <h3 className="text-lg font-semibold mb-4">Call Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-4">
            {chartData.map((item: any) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
        >
          <h3 className="text-lg font-semibold mb-4">Importance Analysis</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={importanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
              <XAxis dataKey="name" stroke={isDark ? '#9CA3AF' : '#6B7280'} />
              <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {importanceData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Calls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg overflow-hidden`}
      >
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {recentCalls.map((call: Call) => (
            <div key={call.id} className={`p-4 flex items-center justify-between hover:${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  call.status === 'answered' ? 'bg-green-500/20' :
                  call.status === 'missed' ? 'bg-red-500/20' :
                  call.status === 'auto-answered' ? 'bg-purple-500/20' :
                  call.status === 'message-sent' ? 'bg-blue-500/20' :
                  'bg-yellow-500/20'
                }`}>
                  {call.status === 'answered' ? <PhoneIncoming className="w-5 h-5 text-green-500" /> :
                   call.status === 'missed' ? <PhoneMissed className="w-5 h-5 text-red-500" /> :
                   call.status === 'auto-answered' ? <Bot className="w-5 h-5 text-purple-500" /> :
                   call.status === 'message-sent' ? <MessageSquare className="w-5 h-5 text-blue-500" /> :
                   <Phone className="w-5 h-5 text-yellow-500" />}
                </div>
                <div>
                  <p className="font-medium">{call.caller}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{call.phoneNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  call.importance === 'high' ? 'bg-red-500/20 text-red-500' :
                  call.importance === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-green-500/20 text-green-500'
                }`}>
                  {call.importance}
                </span>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// History View
function HistoryView({ calls, isDark, templates }: any) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [search, setSearch] = useState('');

  const filteredCalls = calls.filter((call: Call) => {
    const matchesFilter = filter === 'all' || call.importance === filter;
    const matchesSearch = call.caller.toLowerCase().includes(search.toLowerCase()) ||
                         call.phoneNumber.includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search calls..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none ${
                isDark ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'high', 'medium', 'low'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
                  filter === f
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Call List */}
      <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg overflow-hidden`}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold">Call History ({filteredCalls.length})</h3>
        </div>
        <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {filteredCalls.map((call: Call, index: number) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-6 hover:${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    call.status === 'answered' ? 'bg-green-500/20' :
                    call.status === 'missed' ? 'bg-red-500/20' :
                    call.status === 'auto-answered' ? 'bg-purple-500/20' :
                    call.status === 'message-sent' ? 'bg-blue-500/20' :
                    'bg-yellow-500/20'
                  }`}>
                    {call.status === 'answered' ? <PhoneIncoming className="w-6 h-6 text-green-500" /> :
                     call.status === 'missed' ? <PhoneMissed className="w-6 h-6 text-red-500" /> :
                     call.status === 'auto-answered' ? <Bot className="w-6 h-6 text-purple-500" /> :
                     call.status === 'message-sent' ? <MessageSquare className="w-6 h-6 text-blue-500" /> :
                     <Phone className="w-6 h-6 text-yellow-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-lg">{call.caller}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        call.importance === 'high' ? 'bg-red-500/20 text-red-500' :
                        call.importance === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {call.importance}
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{call.phoneNumber}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                        <Clock className="w-4 h-4 inline mr-1" />
                        {new Date(call.timestamp).toLocaleString()}
                      </span>
                      {call.duration > 0 && (
                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                          Duration: {Math.floor(call.duration / 60)}m {call.duration % 60}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  call.status === 'answered' ? 'bg-green-500/20 text-green-500' :
                  call.status === 'missed' ? 'bg-red-500/20 text-red-500' :
                  call.status === 'auto-answered' ? 'bg-purple-500/20 text-purple-500' :
                  call.status === 'message-sent' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {call.status.replace('-', ' ')}
                </span>
              </div>
              
              {call.transcript && (
                <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Mic className="w-4 h-4" /> Transcript
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{call.transcript}</p>
                </div>
              )}
              
              {call.aiResponse && (
                <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2 text-purple-500">
                    <Bot className="w-4 h-4" /> AI Response
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{call.aiResponse}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Analytics View with Truecaller Integration
function AnalyticsView({
  isDark,
  isTruecallerConnected,
  onConnectTruecaller,
  callAnalytics,
  callerProfiles
}: any) {
  return (
    <div className="space-y-6">
      {/* Truecaller Connection Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-r from-blue-900/50 to-cyan-900/50' : 'bg-gradient-to-r from-blue-100 to-cyan-100'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              isTruecallerConnected ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Truecaller {isTruecallerConnected ? 'Connected' : 'Not Connected'}</h2>
              <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {isTruecallerConnected
                  ? 'Caller identification and spam detection active'
                  : 'Connect Truecaller to identify unknown callers and view analytics'}
              </p>
            </div>
          </div>
          {!isTruecallerConnected && (
            <button
              onClick={onConnectTruecaller}
              className="px-6 py-3 rounded-xl font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-all"
            >
              Connect Truecaller
            </button>
          )}
        </div>
      </motion.div>

      {isTruecallerConnected && callAnalytics && (
        <>
          {/* Analytics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Calls', value: callAnalytics.totalCalls, icon: Phone, color: 'blue' },
              { label: 'Unique Callers', value: callAnalytics.uniqueCallers, icon: Users, color: 'green' },
              { label: 'Spam Calls', value: callAnalytics.spamCalls, icon: Flag, color: 'red' },
              { label: 'Unknown Numbers', value: callAnalytics.unknownNumbers, icon: User, color: 'orange' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
              >
                <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Frequent Contacts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg overflow-hidden`}
          >
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Frequent Contacts ({callAnalytics.frequentContacts.length})</h3>
              </div>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                People you talk to regularly
              </p>
            </div>
            <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {callAnalytics.frequentContacts.map((contact: TruecallerProfile, index: number) => (
                <motion.div
                  key={contact.phoneNumber}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 flex items-center justify-between hover:${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{contact.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{contact.name}</p>
                        {contact.isVerified && <Shield className="w-4 h-4 text-blue-500" />}
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{contact.phoneNumber}</p>
                      {contact.location && (
                        <p className={`text-xs flex items-center gap-1 mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <MapPin className="w-3 h-3" /> {contact.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{contact.callHistory.totalCalls} calls</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {contact.callHistory.answeredCalls} answered
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Top Callers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg overflow-hidden`}
          >
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold">Top Callers by Volume</h3>
              </div>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={callAnalytics.topCallers.map((c: TruecallerProfile) => ({ name: c.name, calls: c.callHistory.totalCalls }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey="name" stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                  <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderRadius: '8px' }} />
                  <Bar dataKey="calls" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Caller Profiles with Spam Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg overflow-hidden`}
          >
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-semibold">Caller Details</h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Truecaller verified information
              </p>
            </div>
            <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {Array.from(callerProfiles.values() as Iterable<TruecallerProfile>).map((profile, index) => (
                <motion.div
                  key={profile.phoneNumber}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`p-4 ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        profile.spamScore > 50 ? 'bg-red-500/20' : profile.isVerified ? 'bg-green-500/20' : 'bg-gray-500/20'
                      }`}>
                        {profile.spamScore > 50 ? <Flag className="w-5 h-5 text-red-500" /> :
                         profile.isVerified ? <Shield className="w-5 h-5 text-green-500" /> :
                         <User className="w-5 h-5 text-gray-500" />}
                      </div>
                      <div>
                        <p className="font-medium">{profile.name}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {profile.phoneNumber} • {profile.carrier || 'Unknown carrier'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        profile.spamScore > 50 ? 'bg-red-500/20 text-red-500' :
                        profile.spamScore > 30 ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        Spam Score: {profile.spamScore}
                      </span>
                    </div>
                  </div>
                  {profile.location && (
                    <p className={`text-xs mt-2 flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <MapPin className="w-3 h-3" /> {profile.location}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

// Settings View
function SettingsView({
  isDark,
  isAIEnabled,
  autoAnswerHighPriority,
  sendMessageForLow,
  isAutoAIActive,
  autoAIThreshold,
  selectedTemplate,
  templates,
  onToggleAI,
  onToggleAutoAnswer,
  onToggleSendMessage,
  onToggleAutoAI,
  onChangeTemplate
}: any) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* AI Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">AI Assistant Settings</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Configure how the AI handles your calls
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${isAIEnabled ? 'bg-green-500/20' : 'bg-gray-500/20'} flex items-center justify-center`}>
                <Zap className={`w-5 h-5 ${isAIEnabled ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="font-medium">Enable AI Assistant</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Automatically screen and respond to calls
                </p>
              </div>
            </div>
            <button
              onClick={onToggleAI}
              className={`w-14 h-8 rounded-full transition-all relative ${
                isAIEnabled ? 'bg-green-500' : 'bg-gray-400'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${
                isAIEnabled ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${isAutoAIActive ? 'bg-orange-500/20' : 'bg-gray-500/20'} flex items-center justify-center`}>
                <Clock className={`w-5 h-5 ${isAutoAIActive ? 'text-orange-500' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="font-medium">Auto-AI When Unavailable</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  AI answers if you don't pick up after {autoAIThreshold}s (checks call history)
                </p>
              </div>
            </div>
            <button
              onClick={onToggleAutoAI}
              disabled={!isAIEnabled}
              className={`w-14 h-8 rounded-full transition-all relative ${
                isAutoAIActive ? 'bg-orange-500' : 'bg-gray-400'
              } ${!isAIEnabled && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${
                isAutoAIActive ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${autoAnswerHighPriority ? 'bg-purple-500/20' : 'bg-gray-500/20'} flex items-center justify-center`}>
                <PhoneIncoming className={`w-5 h-5 ${autoAnswerHighPriority ? 'text-purple-500' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="font-medium">Auto-Answer High Priority</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Automatically connect urgent calls
                </p>
              </div>
            </div>
            <button
              onClick={onToggleAutoAnswer}
              disabled={!isAIEnabled}
              className={`w-14 h-8 rounded-full transition-all relative ${
                autoAnswerHighPriority ? 'bg-purple-500' : 'bg-gray-400'
              } ${!isAIEnabled && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${
                autoAnswerHighPriority ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${sendMessageForLow ? 'bg-blue-500/20' : 'bg-gray-500/20'} flex items-center justify-center`}>
                <MessageSquare className={`w-5 h-5 ${sendMessageForLow ? 'text-blue-500' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="font-medium">Auto-Respond Low Priority</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Send message for unimportant calls
                </p>
              </div>
            </div>
            <button
              onClick={onToggleSendMessage}
              disabled={!isAIEnabled}
              className={`w-14 h-8 rounded-full transition-all relative ${
                sendMessageForLow ? 'bg-blue-500' : 'bg-gray-400'
              } ${!isAIEnabled && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${
                sendMessageForLow ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Message Templates */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Response Templates</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Choose default message for auto-responses
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {templates.map((template: MessageTemplate) => (
            <div
              key={template.id}
              onClick={() => onChangeTemplate(template.id)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? isDark ? 'bg-purple-500/20 border-2 border-purple-500' : 'bg-purple-50 border-2 border-purple-500'
                  : isDark ? 'bg-gray-700/50 border-2 border-transparent hover:border-gray-600' : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  selectedTemplate === template.id ? 'border-purple-500 bg-purple-500' : 'border-gray-400'
                }`}>
                  {selectedTemplate === template.id && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{template.content}</p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                    isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {template.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Calendar Integration */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <CalendarIntegration isDark={isDark} />
      </motion.div>

      {/* SMS Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <SMSSettings isDark={isDark} />
      </motion.div>

      {/* Contact Routing */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <ContactManager isDark={isDark} />
      </motion.div>

      {/* Recording Manager */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <RecordingManager isDark={isDark} />
      </motion.div>

      {/* DND Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <DNDSettings isDark={isDark} />
      </motion.div>

      {/* Email Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <EmailSettings isDark={isDark} />
      </motion.div>

      {/* Language Selector */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <LanguageSelector isDark={isDark} />
      </motion.div>

      {/* Webhook Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <WebhookSettings isDark={isDark} />
      </motion.div>

      {/* Spam Filter Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <SpamFilterSettings isDark={isDark} />
      </motion.div>

      {/* About */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <h3 className="text-lg font-semibold mb-4">About AI Call Assistant</h3>
        <div className={`space-y-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>
            This intelligent call management system uses AI to screen your calls and determine importance based on:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Caller identity and history</li>
            <li>Keywords in the call reason (urgent, emergency, important)</li>
            <li>Time of day and your availability</li>
            <li>Call category (work, personal, spam)</li>
          </ul>
          <p className="mt-4">
            The AI can auto-answer high-priority calls, send custom messages for low-priority calls, 
            and provide transcripts for all handled calls.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default App;
