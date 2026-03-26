import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, CheckCircle, Clock, Send, ShieldAlert, Bot } from 'lucide-react';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';

export default function CandidateDashboard() {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Registration Form State
  const [formData, setFormData] = useState({
    skills: '', graduation_year: 2024, percentage: 80, organization_details: '', current_salary: 0, technologies_worked_on: '',
    college_name: '', college_location: '', degree: '', course: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const degreeCourses = {
    'B.Tech': ['CSE', 'IT', 'ECE', 'ME', 'CE', 'EEE'],
    'B.E': ['CSE', 'IT', 'ECE', 'ME', 'CE', 'EEE'],
    'B.Sc': ['Physics', 'Mathematics', 'Computer Science', 'Chemistry'],
    'BCA': ['Computer Applications', 'Information Technology'],
    'MCA': ['Computer Applications', 'Information Technology'],
    'M.Tech': ['CSE', 'IT', 'ECE', 'ME', 'CE', 'Data Science', 'AI/ML']
  };


  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileStatus();
  }, []);

  const fetchProfileStatus = async () => {
    try {
      const res = await api.get('/candidate/dashboard');
      setProfileData(res.data);
    } catch(err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterProfile = async (e) => {
    e.preventDefault();
    if (!resumeFile) return alert("Please upload a resume");
    setUploading(true);
    
    const form = new FormData();
    form.append('skills', formData.skills);
    form.append('graduation_year', formData.graduation_year);
    form.append('percentage', formData.percentage);
    form.append('college_name', formData.college_name);
    form.append('college_location', formData.college_location);
    form.append('degree', formData.degree);
    form.append('course', formData.course);
    if (formData.organization_details) form.append('organization_details', formData.organization_details);
    if (formData.current_salary) form.append('current_salary', formData.current_salary);
    if (formData.technologies_worked_on) form.append('technologies_worked_on', formData.technologies_worked_on);
    form.append('resume', resumeFile);

    try {
      await api.post('/candidate/register-profile', form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchProfileStatus();
    } catch(err) {
      const errorDetail = err.response?.data?.detail;
      const errorMsg = Array.isArray(errorDetail) 
        ? errorDetail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ') 
        : (errorDetail || "Error uploading profile.");
      alert(`Error uploading profile:\n${errorMsg}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const startExam = () => {
    navigate('/exam');
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-8 px-4 pb-20">
      
      {/* Navbar Minimal */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Candidate Portal</h1>
        <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-2 text-slate-500 hover:text-red-500 font-medium transition-colors">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>

      <div className="w-full max-w-5xl animate-slide-up">
        
        {profileData?.profile_completed ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Status Card */}
            <div className="glass-card p-8 border border-green-100 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full translate-x-10 -translate-y-10"></div>
              <div className="relative z-10 flex items-center gap-4 mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <h2 className="text-2xl font-bold text-slate-800">Profile Complete</h2>
              </div>
              <p className="text-slate-600 mb-6 relative z-10">Your resume has been parsed and evaluated against our current job requirements.</p>
              
              <div className="flex gap-2 relative z-10">
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-sm font-semibold">Under Review</span>
              </div>
            </div>

            {/* Exam Card */}
            <div className={`glass-card p-8 border ${profileData?.eligible_for_exam ? 'border-indigo-200 shadow-lg' : 'border-slate-200'} relative overflow-hidden`}>
              <div className="flex items-center gap-4 mb-4">
                <ShieldAlert className={`w-10 h-10 ${profileData?.eligible_for_exam ? 'text-indigo-500' : 'text-slate-300'}`} />
                <h2 className="text-2xl font-bold text-slate-800">Online Proctored Exam</h2>
              </div>
              
              {profileData?.eligible_for_exam ? (
                <>
                  <p className="text-slate-600 mb-6">Congratulations! You have been shortlisted. Start your exam when you are ready.</p>
                  <button onClick={startExam} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all flex items-center gap-2">
                    Start Exam <Send className="w-4 h-4 ml-1" />
                  </button>
                </>
              ) : (
                <p className="text-slate-500 mt-2">You will be notified once you meet the eligibility criteria for an upcoming exam.</p>
              )}
            </div>

            {/* Mock Interview Card */}
            <div className={`glass-card p-8 border ${profileData?.profile_completed ? 'border-purple-200 shadow-lg' : 'border-slate-200'} relative overflow-hidden md:col-span-2`}>
              <div className="flex items-center gap-4 mb-4">
                <Bot className={`w-10 h-10 ${profileData?.profile_completed ? 'text-purple-500' : 'text-slate-300'}`} />
                <h2 className="text-2xl font-bold text-slate-800">AI Mock Interview</h2>
              </div>
              
              <p className="text-slate-600 mb-6">Practice your interview skills with an interactive AI. The AI will ask you technical and HR questions based on your profile.</p>
              <button disabled={!profileData?.profile_completed} onClick={() => navigate('/mock-interview')} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold shadow-md shadow-purple-200 transition-all flex items-center gap-2 w-max">
                Start 10-Min Practice <Bot className="w-5 h-5 ml-1" />
              </button>
            </div>
            
          </div>
        ) : (
          /* Profile Registration Form */
          <div className="glass-card p-8 border border-slate-200 shadow-xl max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Complete Your Profile</h2>
            <p className="text-slate-500 mb-8">Please provide your details and upload your resume to be evaluated.</p>
            
            <form onSubmit={handleRegisterProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Top Skills</label>
                  <input type="text" required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Python, React, ML" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Graduation Year</label>
                  <input type="number" required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.graduation_year} onChange={e => setFormData({...formData, graduation_year: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Academic Percentage (%)</label>
                  <input type="number" required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.percentage} onChange={e => setFormData({...formData, percentage: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">College/University Name</label>
                  <input type="text" required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., MIT, Stanford" value={formData.college_name} onChange={e => setFormData({...formData, college_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">College Location</label>
                  <input type="text" required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Boston, CA" value={formData.college_location} onChange={e => setFormData({...formData, college_location: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Degree</label>
                  <select required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value, course: ''})}>
                    <option value="" disabled>Select Degree</option>
                    {Object.keys(degreeCourses).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Course/Branch</label>
                  <select required disabled={!formData.degree} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:opacity-50" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})}>
                    <option value="" disabled>{formData.degree ? "Select Course" : "Select Degree First"}</option>
                    {formData.degree && degreeCourses[formData.degree]?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Resume (PDF/DOC)</label>
                  <input type="file" required accept=".pdf,.doc,.docx" onChange={e => setResumeFile(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                </div>
                
                <div className="md:col-span-2 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider text-opacity-60">Experience Details (Optional)</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organization Details</label>
                  <input type="text" className="w-full p-3 border rounded-xl outline-none" placeholder="Company Name" value={formData.organization_details} onChange={e => setFormData({...formData, organization_details: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Salary (LPA)</label>
                  <input type="number" step="0.1" className="w-full p-3 border rounded-xl outline-none" placeholder="10.0" value={formData.current_salary} onChange={e => setFormData({...formData, current_salary: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Technologies Worked On</label>
                  <input type="text" className="w-full p-3 border rounded-xl outline-none" placeholder="AWS, Docker, FastAPI" value={formData.technologies_worked_on} onChange={e => setFormData({...formData, technologies_worked_on: e.target.value})} />
                </div>
              </div>
              
              <button disabled={uploading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl shadow-md transition-all mt-6">
                {uploading ? 'Parsing Resume & Creating Profile...' : 'Submit Profile & Upload Resume'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
