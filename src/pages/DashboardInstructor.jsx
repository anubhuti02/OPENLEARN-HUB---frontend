import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement
} from 'chart.js';
import { useAuth } from "../auth/AuthContext";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend
);

const BACKEND_URL = "http://localhost:5001";

export default function DashboardInstructor() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [studentProgress, setStudentProgress] = useState([]);
  const [selectedCourseForProgress, setSelectedCourseForProgress] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedQuizFilter, setSelectedQuizFilter] = useState('');
  
  // Modal states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showAllStudentsModal, setShowAllStudentsModal] = useState(false);
  const [showActiveStudentsModal, setShowActiveStudentsModal] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // Form states
  const [newCourse, setNewCourse] = useState({ title: '', category: '', desc: '' });
  const [noteForm, setNoteForm] = useState({ title: '', file: null });
  const [newQuiz, setNewQuiz] = useState({ 
    title: '', 
    courseId: '', 
    source: 'Manual',
    duration: 30,
    datasetQuestionCount: 10,
    questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: [] }] 
  });
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    totalMarks: 100,
    courseId: '',
    attachment: null
  });
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const dRes = await fetch(`${BACKEND_URL}/api/data/instructor`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!dRes.ok) throw new Error(`Data fetch failed: ${dRes.status}`);
      const dData = await dRes.json();
      setData(dData);

      const qRes = await fetch(`${BACKEND_URL}/api/quizzes/instructor`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!qRes.ok) throw new Error(`Quizzes fetch failed: ${qRes.status}`);
      const qData = await qRes.json();
      setQuizzes(qData);

      const aRes = await fetch(`${BACKEND_URL}/api/assignments/instructor`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (aRes.ok) {
        const aData = await aRes.json();
        setAssignments(aData);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      let url = `${BACKEND_URL}/api/leaderboard/full`;
      const params = new URLSearchParams();
      
      if (selectedCourseFilter) params.append('courseId', selectedCourseFilter);
      if (selectedQuizFilter) params.append('quizId', selectedQuizFilter);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error('Leaderboard error:', err);
    }
  }, [selectedCourseFilter, selectedQuizFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    const url = isUpdateMode ? `${BACKEND_URL}/api/data/courses/${activeId}` : `${BACKEND_URL}/api/data/courses`;
    const method = isUpdateMode ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newCourse)
      });
      if (res.ok) {
        setShowCourseModal(false);
        setNewCourse({ title: '', category: '', desc: '' });
        setIsUpdateMode(false);
        fetchData();
      }
    } catch (err) { alert(err.message); }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    const url = isUpdateMode ? `${BACKEND_URL}/api/quizzes/${activeId}` : `${BACKEND_URL}/api/quizzes`;
    const method = isUpdateMode ? 'PUT' : 'POST';

    let quizData = {
      title: newQuiz.title,
      courseId: newQuiz.courseId,
      source: newQuiz.source,
      duration: (newQuiz.duration !== undefined && newQuiz.duration !== null && newQuiz.duration !== '') ? Number(newQuiz.duration) : 30,
      datasetQuestionCount: newQuiz.datasetQuestionCount
    };
    
    if (newQuiz.source === 'Manual' || newQuiz.source === 'Mixed') {
      quizData.questions = newQuiz.questions.filter(q => q.questionText.trim() !== '');
    }
    
    if (!newQuiz.courseId) {
      alert('Please select a course');
      return;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(quizData)
      });
      
      if (res.ok) {
        setShowQuizModal(false);
        setNewQuiz({ 
          title: '', 
          courseId: '', 
          source: 'Manual',
          duration: 30,
          datasetQuestionCount: 10,
          questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: [] }] 
        });
        setIsUpdateMode(false);
        fetchData();
        alert("Quiz saved successfully!");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || 'Failed to save quiz'}`);
      }
    } catch (err) { 
      alert(`Error: ${err.message}`); 
    }
  };

  const openCourseUpdate = (course) => {
    setNewCourse({ title: course.title, category: course.category || '', desc: course.desc || '' });
    setActiveId(course.id || course._id);
    setIsUpdateMode(true);
    setShowCourseModal(true);
  };

  const openQuizUpdate = (quiz) => {
    const processedQuestions = (quiz.questions || []).map(q => ({
      ...q,
      correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]
    }));
    
    setNewQuiz({ 
      title: quiz.title, 
      courseId: quiz.course?._id || quiz.course?.id || '', 
      source: quiz.source || 'Manual',
      duration: quiz.duration || 30,
      datasetQuestionCount: quiz.datasetQuestionCount || 10,
      questions: processedQuestions.length > 0 ? processedQuestions : [{ questionText: '', options: ['', '', '', ''], correctAnswer: [] }]
    });
    setActiveId(quiz._id);
    setIsUpdateMode(true);
    setShowQuizModal(true);
  };

  const deleteQuiz = async (id) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      const res = await fetch(`${BACKEND_URL}/api/quizzes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setQuizzes(prev => prev.filter(q => q._id !== id));
      }
    }
  };

  const deleteCourse = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      const res = await fetch(`${BACKEND_URL}/api/data/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    }
  };

  const handleNoteUpload = async (e) => {
    e.preventDefault();
    if (!noteForm.file) return alert("Please select a PDF file");
    
    const formData = new FormData();
    formData.append('title', noteForm.title);
    formData.append('note', noteForm.file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/data/courses/${selectedCourse.id || selectedCourse._id}/notes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const uploadedNote = await res.json();
        setNoteForm({ title: '', file: null });
        setSelectedCourse(prev => ({
          ...prev,
          notes: [...(prev.notes || []), uploadedNote]
        }));
        fetchData();
        alert("Note uploaded successfully!");
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (err) { alert(err.message); }
  };

  const deleteNote = async (courseId, noteId) => {
    if (window.confirm('Delete this note?')) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/data/courses/${courseId}/notes/${noteId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setSelectedCourse(prev => ({
            ...prev,
            notes: prev.notes.filter(n => n._id !== noteId)
          }));
          fetchData();
          alert("Note deleted");
        }
      } catch (err) { alert(err.message); }
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newAssignment.title);
    formData.append('description', newAssignment.description);
    formData.append('dueDate', newAssignment.dueDate);
    formData.append('totalMarks', newAssignment.totalMarks);
    formData.append('courseId', newAssignment.courseId);
    if (newAssignment.attachment) {
      formData.append('attachment', newAssignment.attachment);
    }

    const url = isUpdateMode ? `${BACKEND_URL}/api/assignments/${activeId}` : `${BACKEND_URL}/api/assignments`;
    const method = isUpdateMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setShowAssignmentModal(false);
        setNewAssignment({ title: '', description: '', dueDate: '', totalMarks: 100, courseId: '', attachment: null });
        setIsUpdateMode(false);
        fetchData();
        alert("Assignment saved successfully!");
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (err) { alert(err.message); }
  };

  const openAssignmentUpdate = (assignment) => {
    setNewAssignment({
      title: assignment.title,
      description: assignment.description,
      dueDate: new Date(assignment.dueDate).toISOString().split('T')[0],
      totalMarks: assignment.totalMarks,
      courseId: assignment.courseId?._id || assignment.courseId,
      attachment: null
    });
    setActiveId(assignment._id);
    setIsUpdateMode(true);
    setShowAssignmentModal(true);
  };

  const deleteAssignment = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/assignments/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setAssignments(prev => prev.filter(a => a._id !== id));
          alert("Assignment deleted");
        }
      } catch (err) { alert(err.message); }
    }
  };

  const viewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments/${assignment._id}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
        setShowSubmissionsModal(true);
      }
    } catch (err) { alert(err.message); }
  };

  const openGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeForm({ marks: submission.marks || '', feedback: submission.feedback || '' });
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments/submissions/${selectedSubmission._id}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(gradeForm)
      });
      if (res.ok) {
        const updatedSubmission = await res.json();
        setSubmissions(prev => prev.map(s => s._id === updatedSubmission._id ? updatedSubmission : s));
        setShowGradeModal(false);
        alert("Submission graded successfully!");
      }
    } catch (err) { alert(err.message); }
  };

  const viewStudentProgress = async (courseId) => {
    setSelectedCourseForProgress(courseId);
    try {
      const res = await fetch(`${BACKEND_URL}/api/progress/instructor/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudentProgress(data);
        setShowProgressModal(true);
      }
    } catch (err) { alert(err.message); }
  };

  const sidebar = [
    { to: '/instructor', label: 'Overview', icon: '📊' },
    { to: '/courses', label: 'My Courses', icon: '📚' },
  ];

  if (!data) return <DashboardLayout title="Instructor Control Panel" sidebar={sidebar}><div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div></div></DashboardLayout>;

  const { 
    courses = [], 
    totalStudentsCount = 0, 
    activeStudentsCount = 0, 
    allStudents = [], 
    activeStudentsList = [], 
    quizPerformance = [], 
    studentAttempts = [], 
    clusterDistribution = [0, 0, 0], 
    mlStats = {} 
  } = data;

  const clusterLabels = ["Weak", "Average", "Strong"];
  const clusterColors = ["#ef4444", "#f59e0b", "#10b981"];
  const clusterRecommendations = [
    "Weak: Students in this group need focus on fundamental concepts. We suggest assigning foundational practice quizzes.",
    "Average: These students have a good grasp but need consistency. Medium-level challenges will help them progress.",
    "Strong: Excellent performers. Assign advanced challenges and real-world project tasks to keep them engaged."
  ];

  const distributionData = {
    labels: clusterLabels,
    datasets: [{
      data: clusterDistribution || [0, 0, 0],
      backgroundColor: clusterColors,
      borderWidth: 0,
    }]
  };

  const scatterData = {
    datasets: clusterLabels.map((label, i) => ({
      label,
      data: (mlStats?.trainingData || []).filter(d => d.label === i).map(d => ({ x: d.time, y: d.accuracy })),
      backgroundColor: clusterColors[i]
    }))
  };

  const barData = {
    labels: courses.map(c => c.title),
    datasets: [{ label: 'Avg Quiz Score', data: quizPerformance, backgroundColor: '#6c5ce7' }]
  };

  return (
    <DashboardLayout title="Instructor Control Panel" sidebar={sidebar}>
      <div className="min-h-screen p-6 bg-[#0f172a] text-white">
        {/* Total Students Modal */}
        {showAllStudentsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] grid place-items-center p-6">
            <div className="bg-[#1e293b] rounded-[2rem] p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border border-[#334155]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">Registered Students 👤</h3>
                <button onClick={() => setShowAllStudentsModal(false)} className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center hover:bg-red-900/30 hover:text-red-600 transition-colors">✕</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-[#334155]">
                      <th className="py-4 font-bold text-sm uppercase tracking-wider">Name</th>
                      <th className="py-4 font-bold text-sm uppercase tracking-wider">Email</th>
                      <th className="py-4 font-bold text-sm uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStudents?.map(s => (
                      <tr key={s._id} className="border-b border-[#334155] hover:bg-[#0f172a]/50 transition-colors">
                        <td className="py-4 font-medium">{s.name}</td>
                        <td className="py-4 text-gray-400">{s.email}</td>
                        <td className="py-4 text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Active Students Modal */}
        {showActiveStudentsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] grid place-items-center p-6">
            <div className="bg-[#1e293b] rounded-[2rem] p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border border-[#334155]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">Active Participants 📊</h3>
                <button onClick={() => setShowActiveStudentsModal(false)} className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center hover:bg-red-900/30 hover:text-red-600 transition-colors">✕</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-[#334155]">
                      <th className="py-4 font-bold text-sm uppercase tracking-wider">Student</th>
                      <th className="py-4 font-bold text-sm uppercase tracking-wider">Last Quiz</th>
                      <th className="py-4 font-bold text-sm uppercase tracking-wider">Attempted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeStudentsList?.map(s => (
                      <tr key={s.id} className="border-b border-[#334155] hover:bg-[#0f172a]/50 transition-colors">
                        <td className="py-4 font-medium">{s.name}</td>
                        <td className="py-4 text-gray-400">{s.lastQuizTitle}</td>
                        <td className="py-4 text-gray-400">{new Date(s.lastAttemptDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <button onClick={() => { setIsUpdateMode(false); setShowCourseModal(true); }} className="group p-8 rounded-[2rem] bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition-all hover:scale-[1.02] text-left relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-4xl mb-4 block">📚</span>
              <h3 className="text-xl font-black mb-2">Create Course</h3>
              <p className="text-indigo-100 text-sm">Launch a new learning path</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform" />
          </button>

          <button onClick={() => { setIsUpdateMode(false); setShowQuizModal(true); }} className="group p-8 rounded-[2rem] bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition-all hover:scale-[1.02] text-left relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-4xl mb-4 block">📝</span>
              <h3 className="text-xl font-black mb-2">Add Quiz</h3>
              <p className="text-indigo-100 text-sm">Create new assessments</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform" />
          </button>

          <button onClick={() => { setIsUpdateMode(false); setShowAssignmentModal(true); }} className="group p-8 rounded-[2rem] bg-purple-600 text-white shadow-xl hover:bg-purple-700 transition-all hover:scale-[1.02] text-left relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-4xl mb-4 block">📋</span>
              <h3 className="text-xl font-black mb-2">Add Assignment</h3>
              <p className="text-purple-100 text-sm">Create new assignments</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="p-8 rounded-3xl bg-[#1e293b] shadow-xl border border-[#334155] transition-all hover:scale-105 group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-3xl">📚</span>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Courses</p>
            </div>
            <h3 className="text-5xl font-black text-indigo-400">{courses.length}</h3>
          </div>
          <div onClick={() => setShowAllStudentsModal(true)} className="p-8 rounded-3xl bg-[#1e293b] shadow-xl border border-[#334155] transition-all hover:scale-105 cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-3xl">👤</span>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Students</p>
            </div>
            <div className="flex justify-between items-end">
              <h3 className="text-5xl font-black">{totalStudentsCount}</h3>
              <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">View All →</span>
            </div>
          </div>
          <div onClick={() => setShowActiveStudentsModal(true)} className="p-8 rounded-3xl bg-[#1e293b] shadow-xl border border-[#334155] transition-all hover:scale-105 cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-3xl">📊</span>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Now</p>
            </div>
            <div className="flex justify-between items-end">
              <h3 className="text-5xl font-black text-emerald-400">{activeStudentsCount}</h3>
              <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Details →</span>
            </div>
          </div>
        </div>

        {/* Recent Quiz Activity */}
        <div className="bg-[#1e293b] rounded-3xl p-8 shadow-xl border border-[#334155] mb-12 overflow-hidden">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-2"><span>📝</span> Recent Quiz Activity</h3>
          <div className="max-h-[400px] overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#1e293b]">
                  <tr className="border-b-2 border-[#334155]">
                    <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Student</th>
                    <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Quiz Title</th>
                    <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Score</th>
                    <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Date</th>
                    <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">ML Analysis</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAttempts.length > 0 ? [...studentAttempts].reverse().map((s) => {
                    const clusterColors = ["#ef4444", "#f59e0b", "#10b981"];
                    const clusterLabels = ["Weak", "Average", "Strong"];
                    return (
                      <tr key={s.id || s._id} className="border-b border-[#334155] hover:bg-[#0f172a]/50 transition-colors">
                        <td className="py-5 font-bold text-white">{s.studentName}</td>
                        <td className="py-5">{s.quizTitle}</td>
                        <td className="py-5">
                          <span className="text-xl font-black text-indigo-400">{s.score}</span>
                          <span className="text-sm text-gray-500 ml-1">/ {s.total}</span>
                        </td>
                        <td className="py-5 text-gray-400 font-medium">
                          {new Date(s.date).toLocaleDateString()}
                        </td>
                        <td className="py-5">
                          <span 
                            className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                            style={{ 
                              backgroundColor: `${clusterColors[s.cluster ?? 1]}15`, 
                              color: clusterColors[s.cluster ?? 1] 
                            }}
                          >
                            {clusterLabels[s.cluster ?? 1]}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-gray-500 italic">No quiz attempts yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-[#1e293b] rounded-3xl p-8 shadow-xl border border-[#334155] mb-12">
          <h3 className="text-3xl font-black mb-8 flex items-center gap-2"><span>🏆</span> Leaderboard (All Courses)</h3>
          
          <div className="flex gap-4 mb-8">
            <select 
              value={selectedCourseFilter} 
              onChange={(e) => setSelectedCourseFilter(e.target.value)} 
              className="px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Courses</option>
              {courses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
            </select>
            
            <select 
              value={selectedQuizFilter} 
              onChange={(e) => setSelectedQuizFilter(e.target.value)} 
              className="px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Quizzes</option>
              {quizzes.map(q => <option key={q._id} value={q._id}>{q.title}</option>)}
            </select>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-[#1e293b] z-10">
                    <tr className="border-b-2 border-[#334155]">
                      <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400 w-20">Rank</th>
                      <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Student</th>
                      <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400 text-center">Avg Score</th>
                      <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400 text-center">Accuracy</th>
                      <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400 text-center">Attempts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((student, idx) => (
                      <tr key={student._id || idx} className="border-b border-[#334155] hover:bg-[#0f172a]/50 transition-colors">
                        <td className="py-3 text-2xl">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </td>
                        <td className="py-3 font-bold text-white">{student.name || student.studentName}</td>
                        <td className="py-3 text-center text-lg font-black text-indigo-400">{student.averageScore}%</td>
                        <td className="py-3 text-center text-lg font-black text-emerald-400">{student.accuracy}%</td>
                        <td className="py-3 text-center font-medium text-gray-400">{student.totalAttempts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center bg-[#0f172a]/30 rounded-3xl border-2 border-dashed border-[#334155]">
                <span className="text-6xl mb-6 block">🏆</span>
                <p className="text-gray-500 italic">Leaderboard will appear once students start taking quizzes!</p>
              </div>
            )}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Bar Chart */}
          <div className="bg-[#1e293b] rounded-3xl p-8 shadow-xl border border-[#334155]">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2"><span>📊</span> Course Engagement</h3>
            <div className="h-80">
              <Bar 
                data={barData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { legend: { display: false } },
                  scales: { 
                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: '#334155' } }
                  }
                }} 
              />
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="bg-[#1e293b] rounded-3xl p-8 shadow-xl border border-[#334155]">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2"><span>🎯</span> Class Distribution</h3>
            <div className="h-80">
              <Doughnut 
                data={distributionData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } 
                }} 
              />
            </div>
          </div>

          {/* Scatter Chart */}
          <div className="bg-[#1e293b] rounded-3xl p-8 shadow-xl border border-[#334155]">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2"><span>⏱️</span> Time vs Accuracy</h3>
            <div className="h-80">
              <Scatter 
                data={scatterData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } },
                  scales: { 
                    x: { title: { display: true, text: 'Time (seconds)', color: '#94a3b8' }, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    y: { title: { display: true, text: 'Accuracy (%)', color: '#94a3b8' }, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Assignments Section */}
        <div className="mb-12">
          <h3 className="text-3xl font-black mb-8 flex items-center gap-2"><span>📋</span> Assignments</h3>
          {assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left bg-[#1e293b] rounded-3xl overflow-hidden shadow-xl border border-[#334155]">
                <thead>
                  <tr className="border-b-2 border-[#334155]">
                    <th className="py-4 px-6 font-bold text-sm uppercase tracking-wider text-gray-400">Title</th>
                    <th className="py-4 px-6 font-bold text-sm uppercase tracking-wider text-gray-400">Course</th>
                    <th className="py-4 px-6 font-bold text-sm uppercase tracking-wider text-gray-400">Due Date</th>
                    <th className="py-4 px-6 font-bold text-sm uppercase tracking-wider text-gray-400">Total Marks</th>
                    <th className="py-4 px-6 font-bold text-sm uppercase tracking-wider text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a._id} className="border-b border-[#334155] hover:bg-[#0f172a]/50 transition-colors">
                      <td className="py-4 px-6 font-medium">{a.title}</td>
                      <td className="py-4 px-6 text-gray-400">{a.courseId?.title || 'Unknown Course'}</td>
                      <td className="py-4 px-6 text-gray-400">{new Date(a.dueDate).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-indigo-400 font-bold">{a.totalMarks}</td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2 flex-wrap">
                          <button 
                            onClick={() => viewSubmissions(a)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
                          >
                            Submissions
                          </button>
                          <button 
                            onClick={() => openAssignmentUpdate(a)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteAssignment(a._id)}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#1e293b]/30 rounded-3xl border-2 border-dashed border-[#334155]">
              <p className="text-gray-500 italic">No assignments created yet.</p>
            </div>
          )}
        </div>

        {/* Course Grid */}
        <h3 className="text-3xl font-black mb-8 flex items-center gap-2"><span>📚</span> Active Courses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {courses.map(c => (
            <div key={c.id || c._id} className="p-6 rounded-2xl bg-[#1e293b] border border-[#334155] shadow-lg">
              <h4 className="text-xl font-bold mb-2">{c.title}</h4>
              <p className="text-sm text-gray-400 mb-6">{c.students} students</p>
              
              <div className="flex flex-wrap items-center gap-2">
                <Link 
                  to={`/courses/${c.id || c._id}`} 
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                  Open
                </Link>
                <button 
                  onClick={() => viewStudentProgress(c.id || c._id)}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors"
                >
                  View Progress
                </button>
                <button 
                  onClick={() => { setSelectedCourse(c); setShowNotesModal(true); }}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors"
                >
                  Notes ({c.notes?.length || 0})
                </button>
                <button 
                  onClick={() => openCourseUpdate(c)}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors"
                >
                  Update
                </button>
                <button 
                  onClick={() => deleteCourse(c.id || c._id)}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Course Modal */}
        {showCourseModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] grid place-items-center p-6">
            <div className="bg-[#1e293b] rounded-[2rem] p-8 w-full max-w-lg shadow-2xl border border-[#334155]">
              <h3 className="text-2xl font-black mb-6">{isUpdateMode ? 'Update Course ✏️' : 'Create New Course 📚'}</h3>
              <form onSubmit={handleCourseSubmit} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Course Title" 
                  value={newCourse.title}
                  onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                  className="w-full p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Category (e.g. Programming, AI)" 
                  value={newCourse.category}
                  onChange={e => setNewCourse({...newCourse, category: e.target.value})}
                  className="w-full p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <textarea 
                  placeholder="Course Description" 
                  value={newCourse.desc}
                  onChange={e => setNewCourse({...newCourse, desc: e.target.value})}
                  className="w-full p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                />
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all">
                    {isUpdateMode ? 'Update Course' : 'Create Course'}
                  </button>
                  <button type="button" onClick={() => setShowCourseModal(false)} className="px-8 py-4 rounded-xl bg-[#0f172a] text-gray-400 font-bold hover:bg-red-900/20 hover:text-red-500 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && selectedCourse && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] grid place-items-center p-6">
            <div className="bg-[#1e293b] rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl border border-[#334155]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">Course Notes: {selectedCourse.title} 📁</h3>
                <button onClick={() => setShowNotesModal(false)} className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center hover:bg-red-900/30 hover:text-red-500 transition-colors">✕</button>
              </div>
              
              <form onSubmit={handleNoteUpload} className="mb-8 p-6 rounded-2xl bg-[#0f172a]/50 border border-[#334155]">
                <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-4">Upload New Note</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input 
                    type="text" 
                    placeholder="Note Title" 
                    value={noteForm.title}
                    onChange={e => setNoteForm({...noteForm, title: e.target.value})}
                    className="p-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white"
                    required
                  />
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={e => setNoteForm({...noteForm, file: e.target.files[0]})}
                    className="p-2 rounded-xl bg-[#0f172a] border border-[#334155] text-sm"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all">
                  Upload PDF Note
                </button>
              </form>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {selectedCourse.notes?.map(note => (
                  <div key={note._id} className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a]/30 border border-[#334155]">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📄</span>
                      <span className="font-medium">{note.title}</span>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={`${BACKEND_URL}${note.path}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                      >
                        👁️
                      </a>
                      <button 
                        onClick={() => deleteNote(selectedCourse.id || selectedCourse._id, note._id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                {(!selectedCourse.notes || selectedCourse.notes.length === 0) && (
                  <p className="text-center py-8 text-gray-500 italic">No notes uploaded yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignmentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] grid place-items-center p-6">
            <div className="bg-[#1e293b] rounded-[2rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#334155]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">{isUpdateMode ? 'Update Assignment 📋' : 'Create New Assignment 📋'}</h3>
                <button onClick={() => setShowAssignmentModal(false)} className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center hover:bg-red-900/30 hover:text-red-500 transition-colors">✕</button>
              </div>
              
              <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Assignment Title" 
                  value={newAssignment.title}
                  onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                  className="w-full p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                
                <textarea 
                  placeholder="Description" 
                  value={newAssignment.description}
                  onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                  className="w-full p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                  required
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Due Date</label>
                    <input 
                      type="date" 
                      value={newAssignment.dueDate}
                      onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                      className="w-full p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Total Marks</label>
                    <input 
                      type="number" 
                      placeholder="Total Marks" 
                      value={newAssignment.totalMarks}
                      onChange={e => setNewAssignment({...newAssignment, totalMarks: parseInt(e.target.value)})}
                      className="w-full p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="1"
                      required
                    />
                  </div>
                </div>
                
                <select 
                  value={newAssignment.courseId}
                  onChange={e => setNewAssignment({...newAssignment, courseId: e.target.value})}
                  className="w-full p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
                </select>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Attachment (PDF/DOC/DOCX)</label>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={e => setNewAssignment({...newAssignment, attachment: e.target.files[0]})}
                    className="w-full p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-sm"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all">
                    {isUpdateMode ? 'Update Assignment' : 'Create Assignment'}
                  </button>
                  <button type="button" onClick={() => setShowAssignmentModal(false)} className="px-8 py-4 rounded-xl bg-[#0f172a] text-gray-400 font-bold hover:bg-red-900/20 hover:text-red-500 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submissions Modal */}
        {showSubmissionsModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] grid place-items-center p-6">
            <div className="bg-[#1e293b] rounded-[2rem] p-8 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl border border-[#334155]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">Submissions for: {selectedAssignment.title}</h3>
                <button onClick={() => setShowSubmissionsModal(false)} className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center hover:bg-red-900/30 hover:text-red-500 transition-colors">✕</button>
              </div>
              
              {submissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-[#334155]">
                        <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Student</th>
                        <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Submitted At</th>
                        <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Status</th>
                        <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Marks</th>
                        <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(s => (
                        <tr key={s._id} className="border-b border-[#334155] hover:bg-[#0f172a]/50 transition-colors">
                          <td className="py-4 font-medium">{s.studentId?.name || 'Unknown'}</td>
                          <td className="py-4 text-gray-400">{new Date(s.submittedAt).toLocaleString()}</td>
                          <td className="py-4">
                            <span 
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                                s.status === 'submitted' ? 'bg-green-500/20 text-green-400' : 
                                s.status === 'late' ? 'bg-red-500/20 text-red-400' : 
                                'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="py-4 font-bold text-indigo-400">
                            {s.marks !== undefined && s.marks !== null ? `${s.marks}/${selectedAssignment.totalMarks}` : 'Not Graded'}
                          </td>
                          <td className="py-4">
                            <div className="flex gap-2 flex-wrap">
                              <a 
                                href={`${BACKEND_URL}${s.fileUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                              >
                                View
                              </a>
                              <button 
                                onClick={() => openGradeModal(s)}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors"
                              >
                                Grade
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <span className="text-6xl mb-6 block">📭</span>
                  <p className="text-gray-400 font-medium">No submissions yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grade Modal */}
        {showGradeModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] grid place-items-center p-6">
            <div className="bg-[#1e293b] rounded-[2rem] p-8 w-full max-w-lg shadow-2xl border border-[#334155]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">Grade Submission</h3>
                <button onClick={() => setShowGradeModal(false)} className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center hover:bg-red-900/30 hover:text-red-500 transition-colors">✕</button>
              </div>
              
              <div className="mb-6 p-4 rounded-xl bg-[#0f172a]/50 border border-[#334155]">
                <p className="text-gray-400 text-sm mb-1">Student</p>
                <p className="font-bold text-white">{selectedSubmission.studentId?.name}</p>
              </div>
              
              <form onSubmit={handleGradeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Marks</label>
                  <input 
                    type="number" 
                    placeholder="Marks" 
                    value={gradeForm.marks}
                    onChange={e => setGradeForm({...gradeForm, marks: e.target.value})}
                    className="w-full p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Feedback</label>
                  <textarea 
                    placeholder="Feedback" 
                    value={gradeForm.feedback}
                    onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})}
                    className="w-full p-4 rounded-xl bg-[#0f172a] border border-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all">
                    Submit Grade
                  </button>
                  <button type="button" onClick={() => setShowGradeModal(false)} className="px-8 py-4 rounded-xl bg-[#0f172a] text-gray-400 font-bold hover:bg-red-900/20 hover:text-red-500 transition-all">
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
