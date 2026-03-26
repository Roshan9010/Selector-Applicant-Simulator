import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, Users, FileBarChart, PlusCircle, CheckCircle, Search, FileSearch, Upload, Loader2, Check, Mail, Send, X, Briefcase, GraduationCap, DollarSign, MapPin, Award, BookOpen, FileText, Download } from 'lucide-react';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('applicants'); // 'applicants' | 'jobs'
  const [candidates, setCandidates] = useState([]);
  const [jobReqs, setJobReqs] = useState([]);
  
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '', required_skills: '', min_experience: 0, graduation_year: 2024, min_percentage: 60, company_details: ''
  });

  // Resume Filtering State
  const [filterForm, setFilterForm] = useState({
    skills: '', experience: 0
  });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [filtering, setFiltering] = useState(false);
  const [shortlisted, setShortlisted] = useState([]);

  // Invitation state
  const [sendingInvites, setSendingInvites] = useState(false);
  const [inviteStatus, setInviteStatus] = useState(null);

  // Candidate details modal state
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCandidates();
    fetchJobs();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/admin/applicants');
      setCandidates(res.data);
    } catch(err) { console.error(err); }
  };

  const fetchJobs = async () => {
    try {
      const res = await api.get('/admin/job-requirements');
      setJobReqs(res.data);
    } catch(err) { console.error(err); }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/job-requirements', jobForm);
      setShowJobForm(false);
      fetchJobs();
    } catch(err) { console.error(err); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSendSingleInvite = async (candidate) => {
    try {
      setSendingInvites(true);
      await api.post('/admin/send-interview-invite', {
        candidate_email: candidate.email,
        candidate_name: candidate.name
      });
      setInviteStatus({ type: 'success', message: `Invite sent to ${candidate.name}` });
      setTimeout(() => setInviteStatus(null), 3000);
    } catch (error) {
      console.error('Error sending invite:', error);
      setInviteStatus({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Failed to send invite' 
      });
      setTimeout(() => setInviteStatus(null), 3000);
    } finally {
      setSendingInvites(false);
    }
  };

  const handleSendBulkInvites = async () => {
    if (!window.confirm(`Send interview invites to all ${shortlisted.length} shortlisted candidates?`)) {
      return;
    }

    try {
      setSendingInvites(true);
      const candidatesToSend = shortlisted.map(c => ({
        email: c.email,
        name: c.name
      }));
      
      const response = await api.post('/admin/send-bulk-interview-invites', candidatesToSend);
      
      setInviteStatus({ 
        type: 'success', 
        message: `${response.data.details.success_count} invites sent successfully! ${response.data.details.failed_count > 0 ? response.data.details.failed_count + ' failed.' : ''}` 
      });
      setTimeout(() => setInviteStatus(null), 5000);
    } catch (error) {
      console.error('Error sending bulk invites:', error);
      setInviteStatus({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Failed to send invites' 
      });
      setTimeout(() => setInviteStatus(null), 5000);
    } finally {
      setSendingInvites(false);
    }
  };

  const handleViewDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedCandidate(null), 300);
  };

  const handleViewResume = async (candidate) => {
    try {
      // Get resume from backend
      const response = await api.get(`/admin/resume/${candidate.id}`, {
        responseType: 'blob' // Important for file download
      });
      
      // Create blob and URL
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${candidate.name.replace(/\s+/g, '_')}_Resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading resume:', error);
      if (error.response?.status === 404) {
        alert('Resume not found for this candidate.');
      } else {
        alert('Failed to download resume. Please try again.');
      }
    }
  };

  const handleBulkFilter = async (e) => {
    e.preventDefault();
    console.log('Starting bulk filter with:', { 
      skills: filterForm.skills, 
      experience: filterForm.experience, 
      files: Array.isArray(uploadFiles) ? uploadFiles.map(f => f.name) : 'Not an array',
      filesCount: uploadFiles?.length || 0
    });
    
    // Ensure uploadFiles is an array
    const filesArray = Array.isArray(uploadFiles) ? uploadFiles : [];
    
    if (filesArray.length === 0) {
      alert("Please upload at least one resume.");
      setFiltering(false);
      return;
    }
    
    setFiltering(true);
    setShortlisted([]);
    const formData = new FormData();
    formData.append('skills', filterForm.skills);
    formData.append('experience', filterForm.experience);
    for (let i = 0; i < filesArray.length; i++) {
       formData.append('resumes', filesArray[i]);
    }

    try {
      console.log('Sending request to /admin/bulk-filter-resumes...');
      const res = await api.post('/admin/bulk-filter-resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('✅ Success! Received response:', res.data);
      setShortlisted(res.data);
      if (res.data.length === 0) {
        alert("No resumes matched your criteria.");
      } else {
        console.log(`✅ Displaying ${res.data.length} shortlisted candidates`);
      }
    } catch(err) {
      console.error('❌ Error filtering resumes:', err);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMsg = "Please try again.";
      if (err.response?.status === 401) {
        errorMsg = "Session expired. Please logout and login again to continue.";
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      alert("Error filtering resumes: " + errorMsg);
      setShortlisted([]);
    } finally {
      setFiltering(false);
      console.log('Filtering complete.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 glass-dark p-6 md:min-h-screen flex flex-col justify-between shadow-2xl z-10">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Users className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Applicant Selector<br/><span className="text-indigo-400">Simulator</span></h1>
          </div>
          
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('applicants')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'applicants' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Users className="w-5 h-5" /> Applicants
            </button>
            <button 
              onClick={() => setActiveTab('jobs')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'jobs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <FileBarChart className="w-5 h-5" /> Job Requirements
            </button>
            <button 
              onClick={() => setActiveTab('resume_filter')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'resume_filter' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <FileSearch className="w-5 h-5" /> Resume Filtering
            </button>
          </nav>
        </div>
        
        <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-400 px-4 py-3 transition-colors mt-8">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 animate-slide-up bg-slate-50">
        
        <header className="mb-10 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-slate-800">
            {activeTab === 'applicants' ? 'Ranked Applicants' : activeTab === 'jobs' ? 'Job Requirements' : 'Smart Resume Filtering'}
          </h2>
          {activeTab === 'jobs' && (
            <button onClick={() => setShowJobForm(!showJobForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium shadow-md shadow-indigo-200 transition-all flex items-center gap-2">
              <PlusCircle className="w-5 h-5" /> New Job
            </button>
          )}
        </header>

        {activeTab === 'applicants' && (
          <div className="glass-card shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 text-slate-500 text-sm font-semibold border-b border-slate-200">
                  <th className="py-4 px-6">Candidate</th>
                  <th className="py-4 px-6">Skills</th>
                  <th className="py-4 px-6">Academic %</th>
                  <th className="py-4 px-6">Rank Score (AI)</th>
                  <th className="py-4 px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map(candidate => (
                  <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-800">{candidate.name}</div>
                      <div className="text-sm text-slate-500">{candidate.email}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 max-w-xs truncate" title={candidate.skills || 'N/A'}>
                      {candidate.skills || <span className="text-slate-400 italic">Profile Incomplete</span>}
                    </td>
                    <td className="py-4 px-6">{candidate.percentage ? `${candidate.percentage}%` : '-'}</td>
                    <td className="py-4 px-6">
                      {candidate.rank_score > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                          {candidate.rank_score}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">Not Scored</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => handleViewDetails(candidate)}
                        className="text-indigo-600 font-medium hover:text-indigo-800 text-sm disabled:opacity-50 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {candidates.length === 0 && (
                  <tr><td colSpan="5" className="py-8 text-center text-slate-500">No applicants found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Job Req Form */}
        {activeTab === 'jobs' && showJobForm && (
          <form onSubmit={handleCreateJob} className="glass-card p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
              <input type="text" required className="w-full p-2 border rounded-lg outline-none" placeholder="e.g. Senior Frontend Eng" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills (Comma separated)</label>
              <input type="text" required className="w-full p-2 border rounded-lg outline-none" placeholder="React, Node, etc." value={jobForm.required_skills} onChange={e => setJobForm({...jobForm, required_skills: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Experience (Years)</label>
              <input type="number" required className="w-full p-2 border rounded-lg outline-none" value={jobForm.min_experience} onChange={e => setJobForm({...jobForm, min_experience: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Percentage</label>
              <input type="number" required className="w-full p-2 border rounded-lg outline-none" value={jobForm.min_percentage} onChange={e => setJobForm({...jobForm, min_percentage: parseFloat(e.target.value)})} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium shadow-md transition-all">Save Requirement</button>
            </div>
          </form>
        )}

        {/* Resume Filtering Tab */}
        {activeTab === 'resume_filter' && (
          <div className="space-y-8 animate-fade-in text-slate-800">
            <div className="glass-card p-8 border border-slate-200 shadow-xl bg-white/80">
               <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                 <Search className="text-indigo-500 w-6 h-6" /> Filter Criteria
               </h3>
               <form onSubmit={handleBulkFilter} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-slate-600 mb-2">Required Skills (Comma separated)</label>
                   <input 
                     type="text" 
                     required 
                     className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                     placeholder="e.g. React, Node, Python" 
                     value={filterForm.skills} 
                     onChange={e => setFilterForm({...filterForm, skills: e.target.value})} 
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-600 mb-2">Min Experience (Years)</label>
                   <input 
                     type="number" 
                     required 
                     className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                     value={filterForm.experience} 
                     onChange={e => setFilterForm({...filterForm, experience: parseInt(e.target.value)})} 
                   />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-600 mb-2">Upload Resumes (Multiple PDFs)</label>
                   <div className="border-2 border-dashed border-indigo-100 rounded-2xl p-8 text-center bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        multiple 
                        accept=".pdf,.doc,.docx,.csv,.xlsx,.xls,.txt" 
                        onChange={(e) => setUploadFiles(Array.from(e.target.files))} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">{uploadFiles.length > 0 ? `${uploadFiles.length} files selected` : "Upload Resumes (PDF, Word, CSV, Excel, TXT)"}</p>
                      <p className="text-xs text-slate-400 mt-1">Multi-resume CSV/Excel files are fully supported!</p>
                   </div>
                 </div>
                 <div className="md:col-span-3">
                   <button 
                     disabled={filtering} 
                     type="submit" 
                     className="w-full md:w-max bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 py-4 rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                   >
                     {filtering ? (
                       <><Loader2 className="w-5 h-5 animate-spin" /> Shortlisting with AI...</>
                     ) : (
                       <><FileSearch className="w-5 h-5" /> Start Filtering & Shortlist</>
                     )}
                   </button>
                 </div>
               </form>
            </div>

            {shortlisted.length > 0 && (
              <div className="animate-slide-up">
                <h3 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-3">
                  <CheckCircle className="text-green-500 w-8 h-8" /> Shortlisted Candidates ({shortlisted.length})
                </h3>
                <div className="glass-card shadow-2xl border border-slate-200 overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-sm font-semibold border-b border-slate-200">
                        <th className="py-4 px-6">Candidate Details</th>
                        <th className="py-4 px-6">Expertise & Reason</th>
                        <th className="py-4 px-6">Match Score</th>
                        <th className="py-4 px-6">Exp (Years)</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shortlisted.map((item, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="text-sm text-slate-500">{item.email}</div>
                          </td>
                          <td className="py-4 px-6 max-w-sm">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.skills?.map((s, i) => (
                                <span key={i} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
                                  <Check className="w-2 h-2" /> {s}
                                </span>
                              ))}
                              {item.missing_skills?.map((s, i) => (
                                <span key={i} className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200 line-through">
                                  {s}
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-slate-500 italic leading-snug border-l-2 border-indigo-300 pl-2 py-1 bg-slate-50/50 rounded-r">
                              "{item.match_reason}"
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1">
                                <span className={`text-xs font-bold ${item.match_score > 70 ? 'text-emerald-600' : item.match_score > 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                                    {item.match_score}% Match
                                </span>
                                <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${item.match_score > 70 ? 'bg-emerald-500' : item.match_score > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                        style={{ width: `${item.match_score}%` }}
                                    ></div>
                                </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-700">{item.experience}y</td>
                          <td className="py-4 px-6">
                             <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center w-max gap-1 ${item.match_score >= 50 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                               {item.match_score >= 50 ? <CheckCircle className="w-3 h-3" /> : null}
                               {item.match_score >= 50 ? 'Shortlisted' : 'Potential Match'}
                             </span>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              type="button"
                              onClick={() => handleSendSingleInvite(item)}
                              disabled={sendingInvites}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                              <Mail className="w-4 h-4" />
                              Send Invite
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Invitation Section */}
                <div className="mt-8 glass-card p-6 border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      <Mail className="text-indigo-600 w-6 h-6" />
                      Send Interview Invitations
                    </h3>
                    {inviteStatus && (
                      <div className={`px-4 py-2 rounded-lg text-sm font-medium animate-slide-up ${
                        inviteStatus.type === 'success' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {inviteStatus.message}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-xl p-5 border border-indigo-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-slate-700 font-medium mb-1">
                          Ready to send interview invites to {shortlisted.length} candidate{shortlisted.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-slate-500">
                          Each candidate will receive an email with the interview link and instructions
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-indigo-600 mb-1">{shortlisted.length}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Candidates</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleSendBulkInvites}
                        disabled={sendingInvites || shortlisted.length === 0}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                      >
                        {sendingInvites ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Sending Invites...</>
                        ) : (
                          <><Send className="w-5 h-5" /> Send All Invites</>
                        )}
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-start gap-2 text-xs text-slate-500">
                        <div className="min-w-fit">ℹ️</div>
                        <p>
                          Candidates will receive an email containing:
                          <br />
                          • Personalized interview invitation
                          <br />
                          • Direct link to the AI mock interview platform
                          <br />
                          • Instructions for accessing the interview
                          <br />
                          • Contact information for support
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {filtering && shortlisted.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                <p className="font-medium">AI is reading and evaluating resumes against your criteria...</p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Candidate Details Modal */}
      {showModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 md:p-8 animate-fade-in">
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white rounded-t-2xl">
              <div>
                <h3 className="text-2xl font-bold">Candidate Details</h3>
                <p className="text-indigo-100 text-sm mt-1">Complete profile information</p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <section className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                    <p className="text-slate-800 font-medium">{selectedCandidate.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email Address</label>
                    <p className="text-slate-800 font-medium">{selectedCandidate.email || 'N/A'}</p>
                  </div>
                </div>
              </section>

              {/* Academic Information */}
              <section className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Academic Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">College Name</label>
                    <p className="text-slate-800">{selectedCandidate.college_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">College Location</label>
                    <p className="text-slate-800">{selectedCandidate.college_location || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Degree</label>
                    <p className="text-slate-800">{selectedCandidate.degree || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Course</label>
                    <p className="text-slate-800">{selectedCandidate.course || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Graduation Year</label>
                    <p className="text-slate-800">{selectedCandidate.graduation_year || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Academic Percentage</label>
                    <p className="text-slate-800 font-semibold">{selectedCandidate.percentage ? `${selectedCandidate.percentage}%` : 'Not provided'}</p>
                  </div>
                </div>
              </section>

              {/* Skills & Technologies */}
              <section className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Skills & Expertise
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Primary Skills</label>
                    {selectedCandidate.skills ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills.split(',').map((skill, index) => (
                          <span 
                            key={index} 
                            className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-200"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No skills listed</p>
                    )}
                  </div>
                  {selectedCandidate.technologies_worked_on && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Technologies Worked On</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.technologies_worked_on.split(',').map((tech, index) => (
                          <span 
                            key={index} 
                            className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-emerald-200"
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Professional Information */}
              <section className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Professional Experience
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Current Salary</label>
                    <p className="text-slate-800 font-semibold">
                      {selectedCandidate.current_salary ? `₹${selectedCandidate.current_salary.toLocaleString()}` : 'Not disclosed'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Organization Details</label>
                    <p className="text-slate-800">{selectedCandidate.organization_details || 'Not provided'}</p>
                  </div>
                </div>
                
                {/* Resume Section */}
                {selectedCandidate.resume_path && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Resume Document</label>
                    <button
                      onClick={() => handleViewResume(selectedCandidate)}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                    >
                      <FileText className="w-5 h-5" />
                      View / Download Resume
                    </button>
                    <p className="text-xs text-slate-500 mt-2">
                      Click to view or download the candidate's resume (PDF/DOCX)
                    </p>
                  </div>
                )}
              </section>

              {/* Ranking Score */}
              <section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  AI Ranking Score
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-green-600">
                      {selectedCandidate.rank_score || 0}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 font-medium">
                      {selectedCandidate.rank_score > 75 ? 'Excellent candidate with strong qualifications!' : 
                       selectedCandidate.rank_score > 50 ? 'Good candidate with relevant skills.' :
                       selectedCandidate.rank_score > 0 ? 'Average candidate - review recommended.' :
                       'Not yet scored by AI system.'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-all"
                >
                  Close
                </button>
                {selectedCandidate.email && (
                  <button
                    onClick={() => {
                      closeModal();
                      handleSendSingleInvite(selectedCandidate);
                    }}
                    disabled={sendingInvites}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    Send Interview Invite
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
