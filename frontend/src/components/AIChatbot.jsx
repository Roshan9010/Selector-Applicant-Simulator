import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import api from '../lib/axios';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I am the Selector Assistant. How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/bot/chat', { message: userMsg });
      setMessages(prev => [...prev, { text: res.data.reply, isBot: true }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Sorry, I am facing an issue right now.", isBot: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center group z-50 animate-bounce"
        >
          <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 glass-card shadow-2xl rounded-2xl overflow-hidden z-50 animate-slide-up flex flex-col border border-indigo-100 h-[500px]">
          
          <header className="bg-indigo-600 text-white p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-300" />
              <h3 className="font-semibold tracking-tight">AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.isBot ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-none p-3 text-sm flex gap-1 items-center shadow-sm">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              className="flex-1 p-2 rounded-xl bg-slate-100 outline-none text-sm focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-700"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim() || loading} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>
          
        </div>
      )}
    </>
  );
}
