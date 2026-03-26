import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { AlertTriangle, Clock, Camera, Maximize } from 'lucide-react';

export default function ExamRoom() {
  const [examStarted, setExamStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deviceError, setDeviceError] = useState('');
  
  // Monitoring State
  const [warnings, setWarnings] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [examDuration, setExamDuration] = useState(0); // seconds
  const [score, setScore] = useState(0);
  
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Basic device type detection via User Agent
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      setDeviceError("Exams can only be taken on Desktop/Laptop devices. Please switch devices to continue.");
    }
  }, []);

  useEffect(() => {
    if (!examStarted || submitted) return;

    // Timer
    const timer = setInterval(() => setExamDuration(prev => prev + 1), 1000);

    // Tab Switch Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
        setWarnings(prev => prev + 1);
        alert("Warning: Tab switching is prohibited! Activity logged.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Prevent Copy/Paste/Right Click
    const handleContextMenu = (e) => e.preventDefault();
    const handleCopyPaste = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      // Basic block for certain combos (Ctrl+C, Ctrl+V, Alt+Tab is handled by OS but we can block Alt)
      if ((e.ctrlKey && ['c', 'v', 'p'].includes(e.key.toLowerCase())) || e.key === 'Alt') {
        e.preventDefault();
        setWarnings(prev => prev + 1);
        alert("Warning: Keyboard shortcuts are disabled!");
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [examStarted, submitted]);

  const requestPermissions = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(err => console.log(err));
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setExamStarted(true);
    } catch (err) {
      alert("Camera permission is required to start the exam.");
    }
  };

  const submitExam = async (auto = false) => {
    if (auto) alert("Exam auto-submitted due to frequent violations.");
    
    setSubmitted(true);
    // Stop camera
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Mock score based on some random logic or actual answers ideally
    const finalScore = Math.floor(Math.random() * 40) + 60; // 60-100 score mock
    
    try {
      await api.post('/exam/submit', {
        score: finalScore,
        warnings,
        tab_switches: tabSwitches,
        camera_violations: 0, // Mock for now unless face-api.js is added
        exam_duration: examDuration
      });
      setScore(finalScore);
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-submit if too many tab switches
  useEffect(() => {
    if (tabSwitches >= 3 && !submitted) {
      submitExam(true);
    }
  }, [tabSwitches]);

  if (deviceError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <div className="glass-card p-8 bg-red-50 text-red-600 max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Device Not Supported</h2>
          <p>{deviceError}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <div className="glass-card p-12 max-w-md w-full shadow-2xl">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-black">{score}%</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Exam Submitted</h2>
          <p className="text-slate-500 mb-8">Your results and AI monitoring report have been forwarded to the Admin dashboard.</p>
          <button onClick={() => navigate('/candidate')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl w-full">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="glass-card p-10 max-w-xl shadow-xl w-full">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Exam Guidelines</h2>
          <ul className="text-slate-600 space-y-3 mb-8 bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <li className="flex gap-2 items-start"><Camera className="w-5 h-5 text-indigo-500 shrink-0" /> Your camera will be monitored continuously.</li>
            <li className="flex gap-2 items-start"><Maximize className="w-5 h-5 text-indigo-500 shrink-0" /> The exam enforces Fullscreen mode.</li>
            <li className="flex gap-2 items-start"><AlertTriangle className="w-5 h-5 text-indigo-500 shrink-0" /> Switching tabs is strictly prohibited. Exam will auto-submit after 3 warnings.</li>
            <li className="flex gap-2 items-start"><Clock className="w-5 h-5 text-indigo-500 shrink-0" /> Time tracked closely.</li>
          </ul>
          <button onClick={requestPermissions} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg">
            Accept & Start Exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 select-none">
      
      {/* Top Bar */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center fixed top-0 w-full z-10 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Technical Assessment</h1>
          <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded border border-red-200 uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Proctoring Active
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-slate-600 font-mono font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            {Math.floor(examDuration / 60)}:{('0' + (examDuration % 60)).slice(-2)}
          </div>
          <button onClick={() => submitExam()} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 font-semibold rounded-lg shadow">
            Submit Final
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-8 px-8 max-w-6xl mx-auto flex gap-8">
        
        {/* Exam Panel */}
        <div className="flex-1 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Question 1: Python Basics</h2>
          <p className="text-slate-600 text-lg mb-4">Write a function to generate the Fibonacci sequence up to n terms.</p>
          <textarea 
            className="w-full h-64 p-4 border border-slate-300 rounded-xl bg-slate-50 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            placeholder="def fibonacci(n): \n    # Your code here..."
            spellCheck="false"
          ></textarea>
        </div>

        {/* Monitoring Panel */}
        <div className="w-64 space-y-4">
          <div className="bg-slate-800 p-2 rounded-xl overflow-hidden shadow-xl aspect-video relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1] rounded-lg"></video>
            <div className="absolute top-3 right-3 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            </div>
          </div>
          
          <div className="glass-card p-4 border border-rose-100 bg-rose-50/50">
            <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wider mb-2">Proctor Logs</h3>
            <ul className="text-sm text-rose-600 font-medium space-y-1">
              <li>Tab Switches: {tabSwitches}/3</li>
              <li>Warnings: {warnings}</li>
            </ul>
          </div>
        </div>
        
      </main>
    </div>
  );
}
