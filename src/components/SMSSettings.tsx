import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Trash2, Plus, Check, AlertCircle } from 'lucide-react';
import { smsService, SMSTemplate, DEFAULT_TEMPLATES } from '../services/smsService';

interface SMSSettingsProps {
  isDark: boolean;
}

export function SMSSettings({ isDark }: SMSSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<'twilio' | 'nexmo' | 'messagebird' | null>(null);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('missed_default');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    setEnabled(smsService.isEnabled());
    setProvider(smsService.getProvider() as any);
    setTemplates(smsService.getTemplates());
  }, []);

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    smsService.setEnabled(newEnabled);
  };

  const handleProviderChange = (p: 'twilio' | 'nexmo' | 'messagebird') => {
    setProvider(p);
    smsService.setProvider(p);
  };

  const handleEditTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      setEditContent(template.content);
      setIsEditing(true);
    }
  };

  const handleSaveTemplate = () => {
    smsService.updateTemplate(selectedTemplate, { content: editContent });
    setTemplates(smsService.getTemplates());
    setIsEditing(false);
  };

  const handleDeleteTemplate = () => {
    if (smsService.deleteTemplate(selectedTemplate)) {
      setTemplates(smsService.getTemplates());
      setSelectedTemplate('missed_default');
    }
  };

  const handleAddTemplate = () => {
    if (newTemplateName && newTemplateContent) {
      smsService.addTemplate({
        name: newTemplateName,
        content: newTemplateContent,
        category: 'custom'
      });
      setTemplates(smsService.getTemplates());
      setShowAddNew(false);
      setNewTemplateName('');
      setNewTemplateContent('');
    }
  };

  const handleSendTest = async () => {
    if (!testPhone) return;
    setSendingTest(true);
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        const message = smsService.formatTemplate(selectedTemplate, {
          caller: 'Test Caller',
          name: 'You',
          time: new Date().toLocaleTimeString()
        });
        await smsService.sendSMS(testPhone, message);
        setTestSuccess(true);
        setTimeout(() => setTestSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to send test:', error);
    } finally {
      setSendingTest(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  const smsInfo = selectedTemplateData ? 
    smsService.getSMSInfo(smsService.formatTemplate(selectedTemplate, { 
      caller: 'John', 
      name: 'You', 
      time: '3:00 PM' 
    })) : 
    { characters: 0, segments: 0 };

  return (
    <div className="space-y-6">
      {/* Enable SMS Toggle */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">SMS Follow-up</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Automatically send SMS for missed calls
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`w-14 h-8 rounded-full transition-colors ${
              enabled ? 'bg-green-500' : 'bg-gray-400'
            }`}
          >
            <motion.div
              animate={{ x: enabled ? 24 : 4 }}
              className="w-6 h-6 rounded-full bg-white shadow-md"
            />
          </button>
        </div>
      </div>

      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-6"
        >
          {/* SMS Provider Selection */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              SMS Provider
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['twilio', 'nexmo', 'messagebird'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    provider === p
                      ? 'bg-blue-500 text-white'
                      : isDark
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <p className="font-medium capitalize">{p}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Message Template
              </label>
              <button
                onClick={() => setShowAddNew(true)}
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
              >
                <Plus className="w-4 h-4" />
                Add Custom
              </button>
            </div>

            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className={`w-full p-3 rounded-xl outline-none ${
                isDark
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-gray-100 text-gray-900 border-gray-200'
              } border`}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>

            {/* Template Preview/Edit */}
            {selectedTemplateData && (
              <div className={`mt-3 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Preview
                  </p>
                  <div className="flex items-center gap-2">
                    {selectedTemplateData.category === 'custom' && (
                      <button
                        onClick={handleDeleteTemplate}
                        className="p-1 rounded hover:bg-red-500/20 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={isEditing ? handleSaveTemplate : handleEditTemplate}
                      className="p-1 rounded hover:bg-blue-500/20 text-blue-500"
                    >
                      {isEditing ? <Check className="w-4 h-4" /> : <span className="text-sm">Edit</span>}
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className={`w-full p-3 rounded-lg outline-none ${
                      isDark
                        ? 'bg-gray-600 text-white'
                        : 'bg-white text-gray-900'
                    }`}
                    rows={3}
                  />
                ) : (
                  <p className="text-sm">
                    {smsService.formatTemplate(selectedTemplate, {
                      caller: 'John Doe',
                      name: 'You',
                      time: '3:00 PM'
                    })}
                  </p>
                )}

                <div className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {smsInfo.characters} characters • {smsInfo.segments} SMS segment{smsInfo.segments !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>

          {/* Test SMS */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Test SMS
            </label>
            <div className="flex gap-3">
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+1234567890"
                className={`flex-1 p-3 rounded-xl outline-none ${
                  isDark
                    ? 'bg-gray-700 text-white placeholder-gray-500'
                    : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                onClick={handleSendTest}
                disabled={!testPhone || sendingTest}
                className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 ${
                  testPhone
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
              >
                {sendingTest ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : testSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {testSuccess ? 'Sent!' : 'Send Test'}
              </button>
            </div>
          </div>

          {/* Add New Template Modal */}
          {showAddNew && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <h4 className="font-medium mb-3">Add Custom Template</h4>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template name"
                className={`w-full p-3 rounded-lg mb-3 outline-none ${
                  isDark
                    ? 'bg-gray-600 text-white placeholder-gray-500'
                    : 'bg-white text-gray-900 placeholder-gray-500'
                }`}
              />
              <textarea
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                placeholder="Message content (use {{caller}}, {{name}}, {{time}} for variables)"
                className={`w-full p-3 rounded-lg mb-3 outline-none ${
                  isDark
                    ? 'bg-gray-600 text-white placeholder-gray-500'
                    : 'bg-white text-gray-900 placeholder-gray-500'
                }`}
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddNew(false)}
                  className={`flex-1 py-2 rounded-lg ${
                    isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTemplate}
                  disabled={!newTemplateName || !newTemplateContent}
                  className="flex-1 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  Add Template
                </button>
              </div>
            </motion.div>
          )}

          {/* Variables Help */}
          <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-medium text-blue-500">Template Variables</p>
            </div>
            <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li><code>{'{{caller}}'}</code> - Caller's name</li>
              <li><code>{'{{name}}'}</code> - Your name</li>
              <li><code>{'{{time}}'}</code> - Current time</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}
