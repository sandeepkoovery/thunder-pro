import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  X, 
  Send, 
  Database,
  Bot,
  User,
  Radio,
  HelpCircle,
  AlertCircle,
  Settings,
  Key,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export default function AskWorkNestVoiceAssistant({ externalOpen, setExternalOpen }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = setExternalOpen || setInternalOpen;

  // Language selection: 'en' (English by default) or 'ml' (Malayalam)
  const [language, setLanguage] = useState('en');

  // Settings modal visibility
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userGeminiKey, setUserGeminiKey] = useState('');
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [keySource, setKeySource] = useState('system');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState('');

  const englishGreeting = {
    id: 1,
    role: 'assistant',
    text: "Hello! I'm WorkNest AI Assistant. You can ask me anything about company metrics, employee attendance, tasks, projects, or leaves.",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const malayalamGreeting = {
    id: 1,
    role: 'assistant',
    text: 'നമസ്കാരം! വർക്ക്നെസ്റ്റ് എഐ അസിസ്റ്റന്റിലേക്ക് സ്വാഗതം. നിങ്ങൾക്ക് വിവരങ്ങൾ ചോദിക്കാം.',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const [messages, setMessages] = useState([englishGreeting]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [speechStatusText, setSpeechStatusText] = useState('Click mic to speak');

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const chatEndRef = useRef(null);

  // Suggested Prompts by Language
  const promptsByLang = {
    en: [
      "How many employees punched in today?",
      "Is anyone on leave today?",
      "Who came late yesterday?",
      "Who was late the most last month?"
    ],
    ml: [
      "ഇന്ന് എത്ര പേർ പഞ്ച് ഇൻ ചെയ്തു?",
      "ഇന്ന് ആരെങ്കിലും ലീവിലുണ്ടോ?",
      "ഇന്നലെ ആരൊക്കെയാണ് വൈകി വന്നത്?",
      "കഴിഞ്ഞ മാസം ഏറ്റവും കൂടുതൽ ലേറ്റ് ആയത് ആര്?"
    ]
  };

  // Fetch User's Gemini API Key Settings
  const fetchKeySettings = async () => {
    try {
      const res = await axios.get(route('ai.key.get'));
      setUserGeminiKey(res.data.gemini_api_key || '');
      setHasCustomKey(res.data.has_custom_key || false);
      setKeySource(res.data.active_key_source || 'system');
    } catch (err) {
      console.error('Failed to fetch API key setting:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKeySettings();
    }
  }, [isOpen]);

  // Save User's Gemini API Key
  const handleSaveApiKey = async (e) => {
    e?.preventDefault();
    setIsSavingKey(true);
    setKeySaveMessage('');

    try {
      const res = await axios.post(route('ai.key.save'), {
        gemini_api_key: userGeminiKey
      });

      setKeySaveMessage(res.data.message || 'Saved successfully!');
      setHasCustomKey(res.data.has_custom_key || false);
      setKeySource(res.data.has_custom_key ? 'custom' : 'system');
      
      setTimeout(() => {
        setKeySaveMessage('');
        setShowSettingsModal(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to save API key:', err);
      setKeySaveMessage('Failed to save API key. Please try again.');
    } finally {
      setIsSavingKey(false);
    }
  };

  // Switch Language
  const handleLanguageChange = (newLang) => {
    if (newLang === language) return;
    setLanguage(newLang);
    stopSpeaking();

    if (messages.length === 1) {
      setMessages([newLang === 'en' ? englishGreeting : malayalamGreeting]);
    }

    if (newLang === 'en') {
      setSpeechStatusText('Click mic to speak (English)');
    } else {
      setSpeechStatusText('സംസാരിക്കാൻ മൈക്ക് അമർത്തുക (Malayalam)');
    }
  };

  // Helper to create & configure SpeechRecognition object
  const createRecognition = (selectedLang) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = selectedLang === 'ml' ? 'ml-IN' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setMicPermissionDenied(false);
      setSpeechStatusText(
        selectedLang === 'ml' 
          ? 'കേൾക്കുന്നു... സംസാരിക്കൂ (Listening in Malayalam)' 
          : 'Listening... speak now (English)'
      );
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setInput(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error event:', event);
      setIsListening(false);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicPermissionDenied(true);
        setSpeechStatusText(
          selectedLang === 'ml'
            ? 'മൈക്രോഫോൺ അനുമതി ലഭിച്ചില്ല. Browser-ൽ Mic Allow ചെയ്യുക.'
            : 'Microphone permission denied. Please allow mic access in browser.'
        );
      } else if (event.error === 'no-speech') {
        setSpeechStatusText(
          selectedLang === 'ml'
            ? 'ശബ്ദം കേട്ടില്ല. മൈക്ക് അമർത്തി വീണ്ടും സംസാരിക്കൂ.'
            : 'No speech detected. Please click mic and speak again.'
        );
      } else {
        setSpeechStatusText(
          selectedLang === 'ml'
            ? 'ശബ്ദം തിരിച്ചറിയാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കൂ.'
            : 'Speech not recognized. Please try again.'
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setSpeechStatusText('Voice input is not supported in your browser.');
    }
  }, []);

  // Auto scroll
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Guaranteed Malayalam & English Audio Text-to-Speech
  const speakText = (text, messageId = null) => {
    stopSpeaking();

    setIsSpeaking(true);
    if (messageId) setActiveSpeechId(messageId);
    setSpeechStatusText(language === 'ml' ? 'മറുപടി പറയുന്നു...' : 'Speaking response...');

    try {
      const ttsUrl = route('ai.tts') + '?text=' + encodeURIComponent(text) + '&lang=' + language;
      const audio = new Audio(ttsUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setActiveSpeechId(null);
        setSpeechStatusText(language === 'ml' ? 'സംസാരിക്കാൻ മൈക്ക് അമർത്തുക' : 'Click mic to speak');
      };

      audio.onerror = () => {
        fallbackWebSpeech(text, messageId);
      };

      audio.play().catch(err => {
        fallbackWebSpeech(text, messageId);
      });
    } catch (e) {
      fallbackWebSpeech(text, messageId);
    }
  };

  const fallbackWebSpeech = (text, messageId) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false);
      setActiveSpeechId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ml' ? 'ml-IN' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpeechId(null);
      setSpeechStatusText(language === 'ml' ? 'സംസാരിക്കാൻ മൈക്ക് അമർത്തുക' : 'Click mic to speak');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveSpeechId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setActiveSpeechId(null);
    setSpeechStatusText(language === 'ml' ? 'സംസാരിക്കാൻ മൈക്ക് അമർത്തുക' : 'Click mic to speak');
  };

  // Toggle Microphone Listening
  const toggleListening = async () => {
    if (isSpeaking) {
      stopSpeaking();
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      setSpeechStatusText(language === 'ml' ? 'സംസാരിക്കാൻ മൈക്ക് അമർത്തുക' : 'Click mic to speak');
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.warn('Microphone permission request rejected:', err);
      setMicPermissionDenied(true);
      setSpeechStatusText(
        language === 'ml'
          ? 'മൈക്രോഫോൺ അനുമതി ലഭിച്ചില്ല. Browser settings-ൽ Mic Permission നൽകുക.'
          : 'Microphone permission denied. Please allow mic access in your browser.'
      );
      return;
    }

    const recognition = createRecognition(language);
    if (!recognition) {
      alert('Your browser does not support Speech Recognition. Please type your query.');
      return;
    }

    recognitionRef.current = recognition;
    setInput('');
    
    try {
      recognition.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (customMessage = null) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || isLoading) return;

    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    stopSpeaking();

    const userMsgId = Date.now();
    const userMsg = {
      id: userMsgId,
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setSpeechStatusText(language === 'ml' ? 'വിവരങ്ങൾ ശേഖരിക്കുന്നു...' : 'Querying database...');

    try {
      const response = await axios.post(route('ai.chat'), { 
        message: textToSend,
        language: language
      });
      const aiReplyText = response.data.response || (language === 'ml' ? 'ക്ഷമിക്കണം, മറുപടി ലഭിച്ചില്ല.' : 'Sorry, no response received.');

      const aiMsgId = Date.now() + 1;
      const aiMsg = {
        id: aiMsgId,
        role: 'assistant',
        text: aiReplyText,
        debugSql: response.data.debug_sql,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      speakText(aiReplyText, aiMsgId);

    } catch (error) {
      console.error('AI Request failed:', error);
      const errorMsg = {
        id: Date.now() + 2,
        role: 'assistant',
        text: language === 'ml'
          ? 'ക്ഷമിക്കണം, സെർവറുമായി ബന്ധപ്പെടാൻ സാധിച്ചില്ല. വീണ്ടും ശ്രമിക്കുക.'
          : 'Sorry, unable to connect to the server. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Ask WorkNest Trigger Button (Header Topbar) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 font-bold px-2.5 sm:px-3.5 rounded-full shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 active:scale-95 group border border-white/30 my-auto shrink-0"
          style={{ color: '#ffffff', height: '34px', maxHeight: '34px' }}
          title="Ask WorkNest AI Assistant"
        >
          <div className="relative flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300"></span>
            </span>
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold tracking-wide whitespace-nowrap" style={{ color: '#ffffff' }}>
            Ask WorkNest
          </span>
          <span className="hidden sm:inline-block bg-white/20 text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded font-black ml-0.5" style={{ color: '#fef08a' }}>
            {language === 'en' ? 'EN' : 'ML'}
          </span>
        </button>
      )}

      {/* Voice Assistant Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[90vh] max-h-[670px]">
            
            {/* Header Bar */}
            <div 
              className="bg-blue-600 px-5 py-4 flex items-center justify-between shadow-md"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div 
                    className="font-extrabold text-lg flex items-center gap-2 tracking-wide" 
                    style={{ color: '#ffffff !important', opacity: 1 }}
                  >
                    <span style={{ color: '#ffffff', fontWeight: 800 }}>WorkNest Voice AI</span>
                  </div>
                  <div className="text-xs font-semibold flex items-center gap-1.5 mt-0.5" style={{ color: '#dbeafe' }}>
                    <Database className="w-3.5 h-3.5 text-emerald-300" />
                    <span style={{ color: '#dbeafe' }}>Live Database Assistant</span>
                    {hasCustomKey && (
                      <span className="bg-emerald-400/30 text-emerald-200 text-[10px] px-1.5 py-0.2 rounded font-bold border border-emerald-300/30 ml-1">
                        Personal Key Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Language Switcher Pill */}
                <div className="p-1 rounded-xl flex items-center border border-white/30" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className="px-2.5 py-1 text-xs font-black rounded-lg transition-all"
                    style={
                      language === 'en'
                        ? { color: '#1d4ed8', backgroundColor: '#ffffff' }
                        : { color: '#ffffff', backgroundColor: 'transparent' }
                    }
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleLanguageChange('ml')}
                    className="px-2.5 py-1 text-xs font-black rounded-lg transition-all"
                    style={
                      language === 'ml'
                        ? { color: '#0f172a', backgroundColor: '#fbbf24' }
                        : { color: '#ffffff', backgroundColor: 'transparent' }
                    }
                  >
                    മലയാളം
                  </button>
                </div>

                {/* API Key Settings Gear Button */}
                <button
                  onClick={() => setShowSettingsModal(!showSettingsModal)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors relative"
                  style={{ color: '#ffffff' }}
                  title="Configure Gemini API Key"
                >
                  <Settings className="w-5 h-5 text-white" style={{ color: '#ffffff' }} />
                  {hasCustomKey && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full border border-blue-600"></span>
                  )}
                </button>

                {isSpeaking && (
                  <button 
                    onClick={stopSpeaking} 
                    className="p-2 rounded-xl transition-colors shadow-sm"
                    style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                    title="Stop Audio Response"
                  >
                    <VolumeX className="w-4.5 h-4.5 animate-bounce" style={{ color: '#ffffff' }} />
                  </button>
                )}
                
                <button
                  onClick={() => {
                    stopSpeaking();
                    if (isListening && recognitionRef.current) {
                      try { recognitionRef.current.stop(); } catch (e) {}
                    }
                    setIsOpen(false);
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  style={{ color: '#ffffff' }}
                  title="Close Window"
                >
                  <X className="w-5 h-5" style={{ color: '#ffffff' }} />
                </button>
              </div>
            </div>

            {/* Inline Gemini API Key Setup Drawer / Overlay */}
            {showSettingsModal && (
              <div className="bg-slate-900 text-white p-4 border-b border-slate-700 animate-fadeIn flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Gemini API Key Configuration</span>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Each admin or user can use their own custom Gemini API Key. If left blank, WorkNest uses the default system API key.
                </p>

                <form onSubmit={handleSaveApiKey} className="flex flex-col gap-2.5">
                  <div className="relative">
                    <input
                      type="password"
                      value={userGeminiKey}
                      onChange={(e) => setUserGeminiKey(e.target.value)}
                      placeholder="Paste your Gemini API Key here (e.g. AIzaSy...)"
                      className="w-full text-xs py-2.5 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  {keySaveMessage && (
                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{keySaveMessage}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 font-semibold underline"
                    >
                      <span>Get a free Gemini API Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex items-center gap-2">
                      {hasCustomKey && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserGeminiKey('');
                            handleSaveApiKey();
                          }}
                          className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium"
                        >
                          Use System Key
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={isSavingKey}
                        className="px-3.5 py-1.5 text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-lg shadow-sm transition-all flex items-center gap-1"
                      >
                        {isSavingKey ? 'Saving...' : 'Save API Key'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Light Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4" style={{ backgroundColor: '#f8fafc' }}>
              
              {/* Mic Permission Alert if denied */}
              {micPermissionDenied && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Microphone Access Needed:</strong> Microphone is blocked by your browser. Please click the Lock icon in your browser URL bar and set Microphone to "Allow".
                  </div>
                </div>
              )}

              {/* Chat Message List */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md mt-1"
                      style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    >
                      <Bot className="w-4.5 h-4.5" style={{ color: '#ffffff' }} />
                    </div>
                  )}

                  <div 
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm font-medium ${
                      msg.role === 'user'
                        ? 'rounded-tr-none'
                        : 'rounded-tl-none'
                    }`}
                    style={
                      msg.role === 'user'
                        ? { backgroundColor: '#2563eb', color: '#ffffff' }
                        : { backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' }
                    }
                  >
                    <div className="whitespace-pre-wrap leading-relaxed" style={{ color: msg.role === 'user' ? '#ffffff' : '#0f172a' }}>
                      {msg.text}
                    </div>

                    <div 
                      className="mt-2.5 pt-2 flex items-center justify-between gap-3 border-t text-xs"
                      style={{ borderColor: msg.role === 'user' ? 'rgba(255,255,255,0.3)' : '#f1f5f9' }}
                    >
                      <span className="font-normal" style={{ color: msg.role === 'user' ? '#dbeafe' : '#64748b' }}>
                        {msg.time}
                      </span>
                      
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => {
                            if (activeSpeechId === msg.id && isSpeaking) {
                              stopSpeaking();
                            } else {
                              speakText(msg.text, msg.id);
                            }
                          }}
                          className="flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg transition-colors"
                          style={
                            activeSpeechId === msg.id && isSpeaking
                              ? { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }
                              : { backgroundColor: '#f1f5f9', color: '#4338ca', border: '1px solid #e2e8f0' }
                          }
                          title="Listen to Speech"
                        >
                          {activeSpeechId === msg.id && isSpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" style={{ color: '#92400e' }} />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" style={{ color: '#4338ca' }} />
                              <span>{language === 'ml' ? 'കേൾക്കാം' : 'Listen'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md mt-1"
                      style={{ backgroundColor: '#1e293b', color: '#ffffff' }}
                    >
                      <User className="w-4.5 h-4.5" style={{ color: '#ffffff' }} />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 animate-spin shadow-md"
                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  >
                    <Sparkles className="w-4.5 h-4.5 text-amber-300" />
                  </div>
                  <div 
                    className="bg-white border rounded-2xl rounded-tl-none p-3.5 shadow-sm text-xs font-semibold flex items-center gap-2.5"
                    style={{ backgroundColor: '#ffffff', color: '#334155', borderColor: '#e2e8f0' }}
                  >
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#2563eb' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s]" style={{ backgroundColor: '#4f46e5' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s]" style={{ backgroundColor: '#9333ea' }}></div>
                    </div>
                    <span>{language === 'ml' ? 'വിവരങ്ങൾ ശേഖരിക്കുന്നു...' : 'Querying WorkNest database...'}</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length < 5 && (
              <div className="px-4 py-3 bg-white border-t" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>
                  <HelpCircle className="w-4 h-4" style={{ color: '#2563eb' }} />
                  <span>{language === 'ml' ? 'ചോദിക്കാവുന്ന ചില ചോദ്യങ്ങൾ:' : 'Suggested questions:'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {promptsByLang[language].map((promptText, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(promptText)}
                      disabled={isLoading}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors text-left shadow-2xs"
                      style={{ backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1' }}
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Light Input & Voice Recording Footer */}
            <div className="p-4 bg-white border-t" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              
              {/* Status Text Bar */}
              <div className="flex items-center justify-between mb-2.5 text-xs font-bold">
                <div className="flex items-center gap-2">
                  {isListening ? (
                    <span className="flex items-center gap-1.5 font-extrabold animate-pulse" style={{ color: '#dc2626' }}>
                      <Radio className="w-4 h-4 animate-ping" style={{ color: '#dc2626' }} />
                      {speechStatusText}
                    </span>
                  ) : isSpeaking ? (
                    <span className="flex items-center gap-1.5 font-extrabold" style={{ color: '#4338ca' }}>
                      <Volume2 className="w-4 h-4 animate-bounce" style={{ color: '#4f46e5' }} />
                      {speechStatusText}
                    </span>
                  ) : (
                    <span style={{ color: '#334155' }}>{speechStatusText}</span>
                  )}
                </div>

                {!speechSupported && (
                  <span className="text-xs px-2 py-0.5 rounded border" style={{ backgroundColor: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}>
                    Voice Unsupported
                  </span>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-2.5">
                
                {/* Microphone Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className="p-3.5 rounded-xl font-extrabold shadow-md transition-all duration-300 flex items-center justify-center shrink-0"
                  style={
                    isListening
                      ? { backgroundColor: '#dc2626', color: '#ffffff' }
                      : { backgroundColor: '#2563eb', color: '#ffffff' }
                  }
                  title={isListening ? 'Stop Recording' : 'Start Voice Recording'}
                >
                  {isListening ? (
                    <MicOff className="w-6 h-6" style={{ color: '#ffffff' }} />
                  ) : (
                    <Mic className="w-6 h-6" style={{ color: '#ffffff' }} />
                  )}
                </button>

                {/* Text Input Box */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={language === 'ml' ? "മലയാളത്തിൽ പറയൂ അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യൂ..." : "Ask in English or speak..."}
                    className="w-full text-sm py-3 pl-4 pr-10 rounded-xl font-medium shadow-inner"
                    style={{ backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1' }}
                  />
                  
                  {input && (
                    <button
                      onClick={() => setInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: '#64748b' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="p-3.5 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: (isLoading || !input.trim()) ? '#cbd5e1' : '#2563eb', color: '#ffffff' }}
                  title="Send Question"
                >
                  <Send className="w-5 h-5" style={{ color: '#ffffff' }} />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
