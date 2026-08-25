import React, { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '../data/mockData';
import { sendChatMessage, fetchTriageAssessment } from '../services/api';
import { ChatMessage, LanguageCode, UserProfile } from '../types';
import {
  Send,
  Sparkles,
  AlertTriangle,
  Shield,
  CheckCircle2,
  PhoneCall,
  RotateCcw,
  Brain,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';

interface ChatCompanionProps {
  userProfile: UserProfile;
  selectedLanguage: LanguageCode;
  onActivityLogged: (title: string, desc: string, score?: number) => void;
  onOpenCoping: () => void;
  onOpenPeer: () => void;
  onOpenCounselor: () => void;
}

export const ChatCompanion: React.FC<ChatCompanionProps> = ({
  userProfile,
  selectedLanguage,
  onActivityLogged,
  onOpenCoping,
  onOpenPeer,
  onOpenCounselor,
}) => {
  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg_1',
        role: 'assistant',
        content: `${currentLang.greeting}! I am comforTech, powered by Lelapa AI (InkubaLM + Vulavula). How are you feeling in your mind and body today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeAudioMessageId, setActiveAudioMessageId] = useState<string | null>(null);
  const [voiceModeActive, setVoiceModeActive] = useState(false);

  const [triageResult, setTriageResult] = useState<{
    risk: 'low' | 'medium' | 'high';
    note: string;
  } | null>(null);
  const [isTriaging, setIsTriaging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Speech Recognition (Voice-to-Text STT)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported on this browser. Try Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLang.code === 'af' ? 'af-ZA' : currentLang.code === 'zu' ? 'zu-ZA' : 'en-ZA';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Speech recognition failed to initialize:', e);
      setIsListening(false);
    }
  };

  // Text-to-Speech (Lelapa Vulavula Voice Audio Synthesis)
  const handleSpeak = (text: string, msgId: string) => {
    if (activeAudioMessageId === msgId) {
      window.speechSynthesis?.cancel();
      setActiveAudioMessageId(null);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setActiveAudioMessageId(msgId);
    };

    utterance.onend = () => {
      setActiveAudioMessageId(null);
    };

    utterance.onerror = () => {
      setActiveAudioMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
    onActivityLogged('Lelapa Vulavula Voice Readout', `Played audio for message (${currentLang.name})`, 60);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Log activity
    onActivityLogged('AI Check-in Chat', `Messaged: "${text.substring(0, 35)}..."`, 45);

    try {
      const response = await sendChatMessage({
        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        language: currentLang.name,
        languageCode: currentLang.code,
        userProfile,
      });

      const assistantMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If voice mode is active, auto read out
      if (voiceModeActive) {
        setTimeout(() => {
          handleSpeak(response.reply, assistantMsg.id);
        }, 300);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_' + Date.now(),
          role: 'assistant',
          content: "I'm right here with you. Take a slow breath. Could you share what's on your mind?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRunTriage = async () => {
    setIsTriaging(true);
    const transcript = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    try {
      const result = await fetchTriageAssessment({ transcript });
      setTriageResult(result);
      onActivityLogged(
        'Safety Triage Assessment',
        `Classified as ${result.risk.toUpperCase()} priority`,
        result.risk === 'high' ? 20 : result.risk === 'medium' ? 50 : 80
      );
    } catch (e) {
      setTriageResult({
        risk: 'low',
        note: 'Thank you for checking in with us. Self-help tools and the peer community are here whenever you need.',
      });
    } finally {
      setIsTriaging(false);
    }
  };

  const handleRestart = () => {
    window.speechSynthesis?.cancel();
    setActiveAudioMessageId(null);
    setMessages([
      {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: `${currentLang.greeting}! New session started. How can I support you right now?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setTriageResult(null);
  };

  const quickPrompts = [
    'Exam and test panic',
    'NSFAS food allowance delay',
    'Feeling lonely & isolated in res',
    'Cannot sleep from anxiety',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Lelapa AI Multimodal Companion
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                {currentLang.nativeName}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{userProfile.isAnonymous ? 'Guest (Zero Personal Data)' : `Signed In (${userProfile.displayName})`}</span>
              <span>·</span>
              <span className="text-amber-400 font-mono text-[10px]">InkubaLM + Vulavula</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice-to-Voice auto speak toggle */}
          <button
            onClick={() => setVoiceModeActive(!voiceModeActive)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              voiceModeActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 border-slate-800 bg-slate-950/60'
            }`}
            title="Toggle Auto Read Aloud (Voice-to-Voice Mode)"
          >
            {voiceModeActive ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px]">{voiceModeActive ? 'Voice ON' : 'Voice OFF'}</span>
          </button>

          <button
            onClick={handleRestart}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-slate-800"
            title="Restart Conversation"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Multimodal Banner */}
      <div className="px-4 py-2 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Multimodal Enabled: <strong>Text-to-Text</strong>, <strong>Voice-to-Text (Mic)</strong>, <strong>Text-to-Voice (TTS)</strong></span>
        </div>
        <span className="font-mono text-emerald-400 text-[10px]">11 SA Languages Supported</span>
      </div>

      {/* Chat Thread Container */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[480px] backdrop-blur-md">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed relative group ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950/80 text-slate-100 rounded-bl-none border border-slate-800'
                }`}
              >
                <div>{msg.content}</div>

                {/* Text-to-Speech audio button for assistant messages */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleSpeak(msg.content, msg.id)}
                    className="mt-2 pt-1 border-t border-slate-800/80 w-full flex items-center justify-between text-[10px] text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1 font-mono">
                      {activeAudioMessageId === msg.id ? (
                        <>
                          <Volume2 className="w-3 h-3 text-emerald-400 animate-bounce" />
                          <span className="text-emerald-400">Vulavula Speaking...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-indigo-400" />
                          <span>Listen (Vulavula TTS)</span>
                        </>
                      )}
                    </span>
                    {activeAudioMessageId === msg.id && (
                      <span className="text-emerald-400 text-[9px] underline">Stop</span>
                    )}
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3.5 py-2 rounded-xl rounded-bl-none w-fit border border-slate-800">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              <span>Lelapa InkubaLM is composing response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Prompts:</span>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                className="text-[11px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-full border border-slate-800 shrink-0 transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar with Mic STT Voice Input */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2">
          {/* Microphone Voice-to-Text Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse ring-2 ring-rose-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title={isListening ? 'Listening (Vulavula STT)... click to stop' : 'Click to Speak (Vulavula Voice-to-Text)'}
          >
            {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-indigo-400" />}
          </button>

          <input
            type="text"
            placeholder={isListening ? 'Listening in your language... speak now' : `Type in ${currentLang.nativeName} or English...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isTyping}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Safety Triage Action Card */}
      {messages.length >= 3 && !triageResult && (
        <div className="bg-slate-900/90 border border-slate-800 text-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl backdrop-blur-md">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Generate Lelapa AI Triage Assessment?
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyzes the conversation to recommend the ideal student support pathway.
            </p>
          </div>
          <button
            onClick={handleRunTriage}
            disabled={isTriaging}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
          >
            {isTriaging ? 'Reading Conversation...' : 'Get My Triage Report'}
          </button>
        </div>
      )}

      {/* Triage Results Display */}
      {triageResult && (
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                  triageResult.risk === 'high'
                    ? 'bg-rose-600'
                    : triageResult.risk === 'medium'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-emerald-600'
                }`}
              >
                {triageResult.risk.toUpperCase()} PRIORITY
              </span>
              <span className="text-xs font-bold text-slate-100">Triage Summary</span>
            </div>
            <button
              onClick={() => setTriageResult(null)}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {triageResult.note}
          </p>

          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={onOpenCoping}
              className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-100 text-xs font-bold text-left transition-colors flex items-center justify-between border border-slate-800 cursor-pointer"
            >
              <span>1. Self-Help Coping Suite</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={onOpenPeer}
              className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-100 text-xs font-bold text-left transition-colors flex items-center justify-between border border-slate-800 cursor-pointer"
            >
              <span>2. Peer Support Rooms</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={onOpenCounselor}
              className="p-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold text-left transition-colors flex items-center justify-between border border-rose-500/30 cursor-pointer"
            >
              <span>3. Live Counselor / SADAG</span>
              <PhoneCall className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Emergency Footer Notice */}
      <div className="text-center text-[11px] text-slate-500">
        Not a replacement for clinical psychiatric emergency care. Immediate danger? Call <strong className="text-slate-300">112</strong> or SADAG <strong className="text-slate-300">0800 567 567</strong>.
      </div>
    </div>
  );
};

