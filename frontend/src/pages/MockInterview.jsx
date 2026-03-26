import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Clock, StopCircle, ArrowLeft, Mic, Bot, CheckCircle, AlertCircle, BarChart3, Trophy, Target, Lightbulb, TrendingUp } from 'lucide-react';

export default function MockInterview() {
  const [messages, setMessages] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [performanceReport, setPerformanceReport] = useState(null);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  
  // Speech & Media States
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [mediaStream, setMediaStream] = useState(null);
  const [cameraError, setCameraError] = useState("");

  const navigate = useNavigate();
  const userVideoRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Draggable PIP State
  const [pipPos, setPipPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        let finalTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          }
        }
        if (finalTrans) {
          setTranscript(prev => prev + " " + finalTrans);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Timer
  useEffect(() => {
    let timer;
    if (interviewStarted && !interviewEnded && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !interviewEnded) {
      endInterview("Time is up. Thank you for your interview. The session is now officially concluded.");
    }
    return () => clearInterval(timer);
  }, [interviewStarted, interviewEnded, timeLeft]);

  // Handle Camera Access
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      return true;
    } catch (err) {
      setCameraError("Camera and Microphone access denied. Please allow permissions in your browser to continue the interview.");
      return false;
    }
  };

  // Bind video stream to the Video Element once the element exists in DOM
  useEffect(() => {
    if (mediaStream && userVideoRef.current && !userVideoRef.current.srcObject) {
      userVideoRef.current.srcObject = mediaStream;
      userVideoRef.current.onloadedmetadata = () => {
        userVideoRef.current.play().catch(e => console.error("Auto-play blocked:", e));
      };
    }
  }, [mediaStream, interviewStarted]);

  const stopCamera = () => {
    if (mediaStream) {
       mediaStream.getTracks().forEach(track => track.stop());
    }
  };

  // Auto-Submit Silence Detector
  useEffect(() => {
    if (transcript.trim() && isListening && !aiSpeaking && !loading) {
      const silenceTimer = setTimeout(() => {
        submitAnswer();
      }, 3500); // 3.5 seconds of silence => auto trigger submit
      return () => clearTimeout(silenceTimer);
    }
  }, [transcript, isListening, aiSpeaking, loading]);

  // AI Speech execution
  const speakText = (text) => {
    if (synthRef.current) {
      synthRef.current.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly slower pacing
      
      const voices = synthRef.current.getVoices();
      const backupVoice = voices.find(v => v.name.includes("Google") && v.lang.includes('en-GB')) || voices.find(v => v.lang.includes('en-US')) || voices.find(v => v.lang.includes('en')) || voices[0];
      if (backupVoice) utterance.voice = backupVoice;

      utterance.onstart = () => {
        setAiSpeaking(true);
      };
      
      utterance.onend = () => {
        setAiSpeaking(false);
        // Automatically start listening to user after AI finishes asking
        if (!interviewEnded && recognitionRef.current) {
          setTranscript("");
          setIsListening(true);
          try {
            recognitionRef.current.start();
          } catch(e) {} // ignore already started errors
        }
      };
      
      synthRef.current.speak(utterance);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const toggleTopic = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const addCustomTopic = () => {
    if (customTopic.trim() && !selectedTopics.includes(customTopic.trim())) {
      setSelectedTopics(prev => [...prev, customTopic.trim()]);
      setCustomTopic('');
    }
  };

  const startInterview = async () => {
    const camSuccess = await startCamera();
    if (!camSuccess) return;

    setInterviewStarted(true);
    
    // Build initial message with selected topics
    const topicsStr = selectedTopics.length > 0 ? selectedTopics.join(', ') : 'General Technical';
    const firstMessage = `Hi! I am the candidate. I am ready for the interview. Please focus on these topics: ${topicsStr}. Start by greeting me and asking your first question.`;
    
    sendMessage(firstMessage);
  };

  const endInterview = async (overrideMessage = null) => {
    setInterviewEnded(true);
    stopCamera();
    if (recognitionRef.current) recognitionRef.current.stop();
    if (synthRef.current) synthRef.current.cancel();
    
    // Generate performance report
    setGeneratingReport(true);
    try {
      // Convert messages to Gemini format
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const interviewDuration = 600 - timeLeft; // Calculate actual duration
      
      const res = await api.post('/candidate/mock-interview-report', {
        history,
        duration: interviewDuration
      });
      
      setPerformanceReport(res.data);
      console.log('Performance Report:', res.data);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const submitAnswer = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    const finalTranscript = transcript.trim() || "(Candidate listened but provided a silent response)";
    sendMessage(finalTranscript);
    setTranscript("");
  };

  const sendMessage = async (textToSend) => {
    if ((!textToSend && !transcript) || loading || interviewEnded) return;

    // Convert current messages to Gemini format
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));
    
    history.push({ role: 'user', parts: [{ text: textToSend }] });
    
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);
    setIsListening(false);
    
    // Immediate Filler Response for Zero Latency Feel
    if (messages.length > 0 && synthRef.current) {
      const fillers = ["Hmm, okay.", "Interesting.", "Alright.", "I see, let me continue."];
      const fillerUtterance = new SpeechSynthesisUtterance(fillers[Math.floor(Math.random() * fillers.length)]);
      const voices = synthRef.current.getVoices();
      const backupVoice = voices.find(v => v.name.includes("Google") && v.lang.includes('en-GB')) || voices.find(v => v.lang.includes('en-US')) || voices.find(v => v.lang.includes('en')) || voices[0];
      if (backupVoice) fillerUtterance.voice = backupVoice;
      fillerUtterance.onstart = () => setAiSpeaking(true);
      fillerUtterance.onend = () => setAiSpeaking(false);
      synthRef.current.speak(fillerUtterance);
    }
    
    try {
      let reply = "";
      let isRateLimited = false;
      try {
        const res = await api.post('/candidate/mock-interview', { history });
        reply = res.data.reply;
      } catch (geminiErr) {
        if (geminiErr.response?.status === 429) {
           isRateLimited = true;
           setRateLimited(true);
           reply = "I apologize, but I've reached my API usage limit for this minute. This is a limitation of the free Gemini API tier. Please wait about 10-15 seconds before continuing - our conversation will resume right where we left off!";
           // Auto-retry after delay
           setTimeout(() => setRateLimited(false), 15000);
        } else if (geminiErr.response?.status === 503) {
           reply = "I apologize, my connection briefly dropped. Could you repeat that or continue?";
        } else {
           reply = "I encountered a minor error due to server load. Let's move on to the next question.";
        }
      }
      
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
      speakText(reply);

    } catch (err) {
      console.error(err);
      speakText("Oops, something went wrong connecting to the setup.");
    } finally {
      setLoading(false);
    }
  };

  // Draggable Window Event Listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isDragging) return;
      setPipPos({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    };
    
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col h-screen overflow-hidden relative">
      
      {/* Dynamic Keyframes for AI Animation glowing effect */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes orbPulse {
          0% { box-shadow: 0 0 40px rgba(99,102,241,0.3); transform: scale(1); }
          50% { box-shadow: 0 0 100px rgba(139,92,246,0.8); transform: scale(1.05); }
          100% { box-shadow: 0 0 40px rgba(99,102,241,0.3); transform: scale(1); }
        }
        @keyframes orbitSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 z-50">
        <button onClick={() => { stopCamera(); navigate('/candidate'); }} className="flex items-center text-slate-400 hover:text-white transition-colors bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
          <ArrowLeft className="w-5 h-5 mr-2" /> End & Exit
        </button>
        <div className="flex items-center gap-3 text-xl font-mono bg-slate-900 px-6 py-2 rounded-lg border border-slate-800">
          <Clock className={`w-5 h-5 ${timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`} /> 
          <span className={timeLeft <= 60 ? 'text-red-400 font-bold' : 'text-slate-200'}>{formatTime(timeLeft)}</span>
        </div>
        {interviewStarted && !interviewEnded ? (
          <button onClick={() => endInterview()} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-red-900/50">
            <StopCircle className="w-5 h-5"/> End Call
          </button>
        ) : <div className="w-[124px]"></div>}
      </div>
      
      {/* Rate Limit Warning Banner */}
      {rateLimited && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-amber-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full border-2 border-amber-300 shadow-lg shadow-amber-500/30 z-50 animate-pulse flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">API Rate Limit - Please wait ~10 seconds before continuing</span>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex-1 relative bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-center items-center">
        
        {/* Pre-Interview Landing / Post-Interview */}
        {!interviewStarted && !interviewEnded ? (
          <div className="text-center max-w-4xl p-8 z-10">
            <Bot className="w-20 h-20 mx-auto text-indigo-500 mb-6" />
            <h2 className="text-3xl font-bold mb-4">Live AI Mock Interview</h2>
            <p className="text-slate-400 mb-8">Ensure your microphone and camera are connected. The automated AI Interviewer will evaluate your domain knowledge. Your answers are submitted automatically when you finish speaking.</p>
            
            {/* Topic Selection Section */}
            <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 border border-slate-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 justify-center">
                <Target className="w-6 h-6 text-indigo-400" />
                Select Interview Topics
              </h3>
              
              {/* Predefined Topics */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {[
                  { name: 'Java', icon: '☕' },
                  { name: 'Python', icon: '🐍' },
                  { name: 'JavaScript', icon: '📜' },
                  { name: 'React', icon: '⚛️' },
                  { name: 'Node.js', icon: '🟢' },
                  { name: 'Frontend', icon: '🎨' },
                  { name: 'Backend', icon: '🔧' },
                  { name: 'Full Stack', icon: '🌐' },
                  { name: 'SQL', icon: '🗄️' },
                  { name: 'NoSQL', icon: '📊' },
                  { name: 'DevOps', icon: '🚀' },
                  { name: 'Cloud', icon: '☁️' },
                  { name: 'Data Science', icon: '📈' },
                  { name: 'Machine Learning', icon: '🤖' },
                  { name: 'Cybersecurity', icon: '🔒' },
                  { name: 'Mobile Dev', icon: '📱' }
                ].map((topic) => (
                  <button
                    key={topic.name}
                    onClick={() => toggleTopic(topic.name)}
                    className={`p-3 rounded-xl border-2 transition-all transform hover:scale-105 ${
                      selectedTopics.includes(topic.name)
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/50'
                        : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-indigo-500'
                    }`}
                  >
                    <div className="text-2xl mb-1">{topic.icon}</div>
                    <div className="text-sm font-medium">{topic.name}</div>
                  </button>
                ))}
              </div>
              
              {/* Custom Topic Input */}
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomTopic()}
                  placeholder="Add custom topic (e.g., System Design, Microservices)"
                  className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  onClick={addCustomTopic}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
                >
                  Add
                </button>
              </div>
              
              {/* Selected Topics Display */}
              {selectedTopics.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="text-sm text-slate-400 mb-2">Selected Topics ({selectedTopics.length}):</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {selectedTopics.map((topic) => (
                      <span
                        key={topic}
                        className="bg-indigo-600/30 border border-indigo-400 text-indigo-300 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                      >
                        {topic}
                        <button
                          onClick={() => toggleTopic(topic)}
                          className="hover:text-white transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {cameraError && <p className="text-red-400 mb-4 bg-red-400/10 p-4 rounded-xl items-center flex gap-2"><AlertCircle className="w-5 h-5"/> {cameraError}</p>}
            <button onClick={startInterview} className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold py-4 px-12 rounded-full transition-transform active:scale-95 shadow-lg shadow-indigo-600/30 w-full md:w-auto">
              Ready & Join Call 
            </button>
          </div>
        ) : interviewEnded ? (
          <div className="z-10 bg-slate-900/80 p-8 md:p-12 rounded-3xl backdrop-blur-md border border-slate-700 overflow-y-auto max-h-full">
            {generatingReport ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <h2 className="text-2xl font-bold mb-4">Generating Your Performance Report</h2>
                <p className="text-slate-400 text-lg">AI is analyzing your interview performance...</p>
              </div>
            ) : performanceReport ? (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-2">Interview Performance Report</h2>
                  <p className="text-slate-400">Detailed AI-powered analysis of your performance</p>
                </div>

                {/* Overall Score */}
                <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl p-6 mb-6 border border-indigo-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-indigo-400" />
                      Overall Performance
                    </h3>
                    <div className="text-5xl font-bold text-indigo-400">{performanceReport.overall_score || 0}/100</div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                      style={{ width: `${performanceReport.overall_score || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      <h4 className="font-semibold text-sm">Communication</h4>
                    </div>
                    <div className="text-3xl font-bold text-blue-400">{performanceReport.communication_score || 0}/100</div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                      <h4 className="font-semibold text-sm">Technical Knowledge</h4>
                    </div>
                    <div className="text-3xl font-bold text-yellow-400">{performanceReport.technical_score || 0}/100</div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <h4 className="font-semibold text-sm">Problem Solving</h4>
                    </div>
                    <div className="text-3xl font-bold text-green-400">{performanceReport.problem_solving_score || 0}/100</div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-purple-400" />
                      <h4 className="font-semibold text-sm">Behavioral</h4>
                    </div>
                    <div className="text-3xl font-bold text-purple-400">{performanceReport.behavioral_score || 0}/100</div>
                  </div>
                </div>

                {/* Detailed Feedback */}
                <div className="space-y-6 mb-8">
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-indigo-400" />
                      Overall Assessment
                    </h3>
                    <p className="text-slate-300 leading-relaxed">{performanceReport.detailed_feedback || "No detailed feedback available."}</p>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <Mic className="w-6 h-6 text-blue-400" />
                      Communication Skills
                    </h3>
                    <p className="text-slate-300 leading-relaxed">{performanceReport.communication_feedback || "No communication feedback available."}</p>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <Lightbulb className="w-6 h-6 text-yellow-400" />
                      Technical Knowledge
                    </h3>
                    <p className="text-slate-300 leading-relaxed">{performanceReport.technical_feedback || "No technical feedback available."}</p>
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-green-900/20 rounded-xl p-6 mb-6 border border-green-500/30">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-6 h-6" />
                    Your Strengths
                  </h3>
                  <ul className="space-y-2">
                    {performanceReport.strengths?.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-300">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    )) || <li className="text-slate-400">No strengths identified.</li>}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-amber-900/20 rounded-xl p-6 mb-6 border border-amber-500/30">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-400">
                    <AlertCircle className="w-6 h-6" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {performanceReport.areas_for_improvement?.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-300">
                        <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{area}</span>
                      </li>
                    )) || <li className="text-slate-400">No areas for improvement identified.</li>}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="bg-indigo-900/20 rounded-xl p-6 mb-8 border border-indigo-500/30">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-400">
                    <Target className="w-6 h-6" />
                    Recommended Next Steps
                  </h3>
                  <ul className="space-y-2">
                    {performanceReport.recommendations?.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-300">
                        <TrendingUp className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    )) || <li className="text-slate-400">No recommendations available.</li>}
                  </ul>
                </div>

                <button 
                  onClick={() => { stopCamera(); navigate('/candidate'); }} 
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-8 rounded-full transition-colors border border-slate-600"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="text-center z-10 bg-slate-900/80 p-12 rounded-3xl backdrop-blur-md border border-slate-700">
                <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">Interview Concluded</h2>
                <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">Your mock interview has officially ended.</p>
                <button onClick={() => { stopCamera(); navigate('/candidate'); }} className="mt-8 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-full transition-colors border border-slate-600">
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            
            {/* AI Graphical Identity (NOT a real person) */}
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div 
                className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-indigo-950 w-64 h-64 border-2 border-indigo-500/30 z-10 transition-all duration-300"
                style={{
                   animation: aiSpeaking ? 'orbPulse 1.5s infinite ease-in-out' : 'none',
                   boxShadow: aiSpeaking ? '0 0 80px rgba(99,102,241,0.6)' : '0 0 20px rgba(0,0,0,0.5)'
                }}
              >
                 <Bot className={`w-24 h-24 ${aiSpeaking ? 'text-indigo-400' : 'text-slate-500'} transition-colors duration-500`} />
                 
                 {/* Orbiting rings */}
                 <div className="absolute inset-[-20px] rounded-full border border-dashed border-indigo-400/40" style={{ animation: 'orbitSpin 20s linear infinite' }}></div>
                 <div className="absolute inset-[-40px] rounded-full border border-slate-600/40" style={{ animation: 'orbitSpin 35s linear infinite reverse' }}></div>
              </div>
              <h3 className="text-2xl font-bold mt-12 text-slate-300 tracking-wider">AI INTERVIEWER</h3>
              <p className={`mt-2 font-mono ${loading ? 'text-indigo-400 animate-pulse' : (aiSpeaking ? 'text-purple-400' : 'text-slate-500')}`}>
                 {loading ? 'PROCESSING...' : (aiSpeaking ? 'SPEAKING...' : 'LISTENING...')}
              </p>
            </div>
            
            {/* Background Aesthetics */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-900/80 to-slate-950 -z-10"></div>
            
            {/* Candidate PIP Camera - Now Draggable! */}
            <div 
              className="absolute w-48 md:w-72 aspect-video bg-slate-950 rounded-2xl border-2 border-slate-700 overflow-hidden shadow-2xl z-30 transition-shadow hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-grab active:cursor-grabbing"
              style={{
                top: '24px',
                right: '24px',
                transform: `translate(${pipPos.x}px, ${pipPos.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.05s linear'
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDragging(true);
                dragStart.current = {
                  x: e.clientX - pipPos.x,
                  y: e.clientY - pipPos.y
                };
              }}
            >
              <video ref={userVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100"></video>
              <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-2 backdrop-blur-md pointer-events-none">
                <div className={`w-2 h-2 rounded-full ${isListening && !aiSpeaking ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                You (Drag to Move)
              </div>
            </div>

            {/* Candidate Voice Recognition Active Indicator & Transcriber (No Submit Button!) */}
            <div className={`absolute bottom-0 left-0 right-0 transform transition-transform duration-500 ${isListening && !aiSpeaking ? 'translate-y-0' : 'translate-y-full'}`}>
               <div className="bg-slate-900/90 backdrop-blur-xl border-t border-slate-700 p-6 md:p-8 flex flex-col items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                 
                 <div className="flex items-center gap-6 w-full max-w-4xl mx-auto">
                    <div className="bg-green-500/20 p-4 rounded-full border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-pulse hidden md:block">
                      <Mic className="w-8 h-8 text-green-400" />
                    </div>
                    
                    <div className="flex-1">
                      {transcript ? (
                        <>
                          <p className="text-emerald-300 text-lg sm:text-xl font-medium leading-relaxed">"{transcript}"</p>
                          <p className="text-xs text-slate-400 mt-2 font-mono ml-2">Submitting automatically on pause...</p>
                        </>
                      ) : (
                        <p className="text-slate-500 italic text-lg truncate flex items-center gap-3">
                           <span className="flex gap-1">
                             <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                             <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                             <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                           </span>
                           Listening to your response... speak into your microphone.
                        </p>
                      )}
                    </div>
                 </div>
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
