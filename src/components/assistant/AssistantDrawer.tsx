import React, { useState } from 'react';
import { 
  X, 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  ShieldAlert, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { VoiceService } from '../../services/voiceService';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onOpenEmergency: () => void;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenEmergency
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(VoiceService.getInitialMessages());
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');

    // Process assistant NLP response
    setTimeout(() => {
      const botResponse = VoiceService.processUserInput(query);
      setMessages([...updated, botResponse]);
      VoiceService.speakText(botResponse.text);
    }, 500);
  };

  const handleMicToggle = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Speech recognition is supported in Chrome, Edge, and Safari browser environments.");
      return;
    }

    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    }
  };

  const handleActionClick = (action: string) => {
    if (action === 'emergency') {
      onClose();
      onOpenEmergency();
    } else if (action === 'view_medicines' || action === 'medicine' || action === 'mark_taken') {
      onClose();
      onNavigate('medicines');
    } else if (action === 'view_appointments' || action === 'appointment') {
      onClose();
      onNavigate('appointments');
    } else if (action === 'view_insurance' || action === 'insurance') {
      onClose();
      onNavigate('insurance');
    } else if (action === 'view_bills' || action === 'bills') {
      onClose();
      onNavigate('bills');
    } else if (action === 'records') {
      onClose();
      onNavigate('records');
    } else if (action === 'hospitals') {
      onClose();
      onNavigate('hospitals');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="bg-[#FAF7F0] w-full max-w-lg h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250 border-l border-slate-200">
        
        {/* Header */}
        <div className="bg-[#0057B8] text-white p-4 sm:p-5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg flex items-center gap-1.5">
                SASHTYA Assistant
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">Multilingual</span>
              </h3>
              <p className="text-xs text-white/80 font-medium">Healthcare Navigation & Information</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Banner */}
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-[11px] font-semibold text-amber-900 flex items-center gap-2 shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Assistant provides navigation & organized records. Does NOT provide medical diagnosis.</span>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-[#0057B8] text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                {msg.text}

                {/* Suggested Action Chips */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {msg.suggestedActions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(act.action)}
                        className="px-2.5 py-1 rounded-xl bg-[#EAF3FF] text-[#0057B8] hover:bg-blue-100 font-extrabold text-xs flex items-center gap-1 transition-colors border border-blue-200"
                      >
                        <span>{act.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}
        </div>

        {/* Input Controls */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-2">
          
          {/* Quick Speak Button */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Voice commands supported (English, Hindi, Odia, Bengali)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Mic Toggle Button */}
            <button
              onClick={handleMicToggle}
              title="Voice Input"
              className={`p-3 rounded-2xl font-bold transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-[#0057B8]" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type or speak e.g., 'Meri agli dawa kab hai?'..."
              className="flex-1 bg-slate-100 border border-slate-300 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0057B8] focus:bg-white transition-all font-medium"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              className="p-3 rounded-2xl bg-[#0057B8] hover:bg-blue-800 text-white transition-colors shadow-md active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
