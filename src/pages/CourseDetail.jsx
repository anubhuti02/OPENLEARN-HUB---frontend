import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import DashboardLayout from "../components/DashboardLayout";

const BACKEND_URL = "http://localhost:5001";

export default function CourseDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/data/courses/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setCourse(data);
      if (user.role === 'student') {
        fetch(`${BACKEND_URL}/api/data/student`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.json())
          .then(studentData => {
            const enrolled = studentData.enrolled.some(c => (c.id || c._id) === id);
            setIsEnrolled(enrolled);
          });
      }
    });

    fetch(`${BACKEND_URL}/api/quizzes/course/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setQuizzes);

    fetch(`${BACKEND_URL}/api/assignments/course/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (res.ok) return res.json();
      return [];
    })
    .then(setAssignments);

    if (user.role === 'student') {
      fetch(`${BACKEND_URL}/api/assignments/student/my-submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(setSubmissions);
    }
  }, [id, token, user]);

  const handleEnroll = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/data/courses/${id}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsEnrolled(true);
        alert("Enrolled successfully!");
      } else {
        alert(data.message || "Failed to enroll");
      }
    } catch (err) {
      alert("Error connecting to server");
      console.error(err);
    }
  };

  const deleteQuiz = async (quizId) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          setQuizzes(prev => prev.filter(q => q._id !== quizId));
          alert("Quiz deleted successfully");
        } else {
          const data = await res.json();
          alert(data.message || "Failed to delete quiz");
        }
      } catch (err) {
        alert("Error connecting to server");
      }
    }
  };

  const trackNoteViewed = async (noteId) => {
    if (user.role !== 'student') return;
    try {
      await fetch(`${BACKEND_URL}/api/progress/note/${id}/${noteId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error tracking note view:', err);
    }
  };

  const trackQuizCompleted = async (quizId) => {
    if (user.role !== 'student') return;
    try {
      await fetch(`${BACKEND_URL}/api/progress/quiz/${id}/${quizId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error tracking quiz completion:', err);
    }
  };

  const trackAssignmentSubmitted = async (assignmentId) => {
    if (user.role !== 'student') return;
    try {
      await fetch(`${BACKEND_URL}/api/progress/assignment/${id}/${assignmentId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error tracking assignment submission:', err);
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please select a file");
    
    const formData = new FormData();
    formData.append('submissionFile', selectedFile);

    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments/${selectedAssignment._id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const newSubmission = await res.json();
        setSubmissions(prev => [...prev, newSubmission]);
        await trackAssignmentSubmitted(selectedAssignment._id);
        setShowSubmitModal(false);
        setSelectedFile(null);
        alert("Assignment submitted successfully!");
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (err) { alert(err.message); }
  };

  const getSubmissionForAssignment = (assignmentId) => {
    return submissions.find(s => (s.assignmentId?._id || s.assignmentId) === assignmentId);
  };

  if (!course) return <div>Loading...</div>;

  return (
    <DashboardLayout title={course.title}>
      <div className="p-8 bg-[#0f172a] min-h-screen text-white">
        <div className="p-8 rounded-3xl bg-[#1e293b] border border-[#334155] shadow-xl mb-12">
          <p className="text-lg text-gray-300 mb-6 leading-relaxed">{course.desc}</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="p-2 rounded-lg bg-[#0f172a] text-indigo-400 font-black uppercase tracking-widest text-[10px]">Instructor</span>
            <span className="font-bold text-white">{course.instructor?.name}</span>
          </div>
          
          {course.kaggleDataset && (
            <div className="mt-8 p-6 rounded-2xl bg-indigo-900/20 border border-indigo-500/30 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h4 className="text-xl font-black text-indigo-400 mb-1 flex items-center gap-2"><span>📊</span> Practice Dataset</h4>
                <p className="text-sm text-gray-400">This course includes a hands-on dataset for practice.</p>
              </div>
              <a 
                href={course.kaggleDataset} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                View on Kaggle
              </a>
            </div>
          )}

          {user.role === 'student' && !isEnrolled && (
            <button 
              className="mt-8 w-full md:w-auto px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 active:scale-95" 
              onClick={handleEnroll}
            >
              Enroll in Course
            </button>
          )}
        </div>

        {course.notes && course.notes.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-2"><span>📚</span> Study Material</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.notes.map(n => (
                <div key={n._id} className="p-6 rounded-2xl bg-[#1e293b] border border-[#334155] shadow-lg flex flex-col justify-between">
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-1 text-white">{n.title}</h4>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{new Date(n.uploadDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href={`${BACKEND_URL}${n.path}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      onClick={() => trackNoteViewed(n._id)}
                      className="flex-1 py-3 rounded-xl bg-blue-500 text-white text-center font-bold text-sm hover:bg-blue-600 transition-all"
                    >
                      View
                    </a>
                    <a 
                      href={`${BACKEND_URL}${n.path}`} 
                      download={n.filename} 
                      onClick={() => trackNoteViewed(n._id)}
                      className="flex-1 py-3 rounded-xl bg-[#0f172a] text-gray-400 text-center font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all border border-[#334155]"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignments Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-2"><span>📋</span> Assignments</h3>
          {assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map(a => {
                const submission = user.role === 'student' ? getSubmissionForAssignment(a._id) : null;
                const isLate = new Date() > new Date(a.dueDate);
                
                return (
                  <div key={a._id} className="p-6 rounded-2xl bg-[#1e293b] border border-[#334155] shadow-lg flex flex-col justify-between transition-all hover:scale-105">
                    <div className="mb-6">
                      <h4 className="text-xl font-bold mb-2 text-white">{a.title}</h4>
                      <p className="text-sm text-gray-400 mb-4">{a.description}</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-400"><span className="text-indigo-400 font-bold">Due:</span> {new Date(a.dueDate).toLocaleDateString()}</p>
                        <p className="text-gray-400"><span className="text-indigo-400 font-bold">Total Marks:</span> {a.totalMarks}</p>
                        {a.attachmentUrl && (
                          <a 
                            href={`${BACKEND_URL}${a.attachmentUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500 hover:text-white transition-all"
                          >
                            📄 View Assignment
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {user.role === 'student' && isEnrolled ? (
                      submission ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                              submission.status === 'submitted' ? 'bg-green-500/20 text-green-400' : 
                              submission.status === 'late' ? 'bg-red-500/20 text-red-400' : 
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {submission.status}
                            </span>
                          </div>
                          {submission.marks !== undefined && submission.marks !== null && (
                            <div className="p-3 rounded-xl bg-[#0f172a]/50 border border-[#334155]">
                              <p className="text-sm text-gray-400 mb-1">Marks</p>
                              <p className="font-bold text-indigo-400">{submission.marks}/{a.totalMarks}</p>
                              {submission.feedback && (
                                <div className="mt-2 pt-2 border-t border-[#334155]">
                                  <p className="text-xs text-gray-400 mb-1">Feedback</p>
                                  <p className="text-sm text-gray-300">{submission.feedback}</p>
                                </div>
                              )}
                            </div>
                          )}
                          <a 
                            href={`${BACKEND_URL}${submission.fileUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full py-3 rounded-xl bg-blue-600 text-white text-center font-bold text-sm hover:bg-blue-700 transition-all"
                          >
                            View My Submission
                          </a>
                        </div>
                      ) : (
                        <button 
                          onClick={() => { setSelectedAssignment(a); setShowSubmitModal(true); }}
                          disabled={isLate}
                          className={`w-full py-4 rounded-xl text-white font-black text-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 ${
                            isLate ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600'
                          }`}
                        >
                          {isLate ? 'Deadline Passed' : 'Submit Assignment'}
                        </button>
                      )
                    ) : user.role === 'instructor' ? (
                      <Link 
                        to="/instructor"
                        className="w-full py-4 rounded-xl bg-[#0f172a] text-indigo-400 font-bold text-center border border-[#334155] hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        Manage in Dashboard
                      </Link>
                    ) : (
                      <div className="w-full py-4 rounded-xl bg-[#0f172a] text-gray-500 font-bold text-center border border-[#334155]">
                        Enroll to Unlock
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="col-span-full p-12 text-center bg-[#1e293b]/30 rounded-3xl border-2 border-dashed border-[#334155]">
              <p className="text-gray-500 italic">No assignments available for this course.</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-2xl font-black mb-8 flex items-center gap-2"><span>📝</span> Course Quizzes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.length > 0 ? quizzes.map(q => (
              <div key={q._id} className="p-6 rounded-2xl bg-[#1e293b] border border-[#334155] shadow-lg flex flex-col justify-between transition-all hover:scale-105">
                <div className="mb-6">
                  <h4 className="text-xl font-bold mb-2 text-white">{q.title}</h4>
                  <p className="text-sm text-gray-400">{q.questions?.length || 0} Questions</p>
                </div>
                {user.role === 'student' ? (
                  isEnrolled ? (
                    <Link 
                      className="w-full py-4 rounded-xl bg-indigo-600 text-white font-black text-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95" 
                      to={`/quizzes/${q._id}`}
                    >
                      Attempt Quiz
                    </Link>
                  ) : (
                    <div className="w-full py-4 rounded-xl bg-[#0f172a] text-gray-500 font-bold text-center border border-[#334155]">
                      Enroll to Unlock
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link 
                      className="w-full py-4 rounded-xl bg-[#0f172a] text-indigo-400 font-bold text-center border border-[#334155] hover:bg-indigo-600 hover:text-white transition-all" 
                      to="/instructor"
                    >
                      Manage in Dashboard
                    </Link>
                    <button 
                      onClick={() => deleteQuiz(q._id)}
                      className="w-full py-4 rounded-xl bg-red-500/10 text-red-500 font-bold text-center border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                    >
                      Delete Quiz
                    </button>
                  </div>
                )}
              </div>
            )) : (
              <div className="col-span-full p-12 text-center bg-[#1e293b]/30 rounded-3xl border-2 border-dashed border-[#334155]">
                <p className="text-gray-500 italic">No quizzes available for this course.</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Assignment Modal */}
        {showSubmitModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] grid place-items-center p-6">
            <div className="bg-[#1e293b] rounded-[2rem] p-8 w-full max-w-lg shadow-2xl border border-[#334155]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">Submit: {selectedAssignment.title}</h3>
                <button onClick={() => setShowSubmitModal(false)} className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center hover:bg-red-900/30 hover:text-red-500 transition-colors">✕</button>
              </div>
              
              <form onSubmit={handleSubmitAssignment} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Upload Your Solution (PDF/DOC/DOCX)</label>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={e => setSelectedFile(e.target.files[0])}
                    className="w-full p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-sm"
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all">
                    Submit Assignment
                  </button>
                  <button type="button" onClick={() => setShowSubmitModal(false)} className="px-8 py-4 rounded-xl bg-[#0f172a] text-gray-400 font-bold hover:bg-red-900/20 hover:text-red-500 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
