import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Line, Doughnut, Radar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  ArcElement,
  RadialLinearScale,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { useAuth } from "../auth/AuthContext";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  ArcElement,
  RadialLinearScale,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const BACKEND_URL = process.env.REACT_APP_API_URL || "";

export default function DashboardStudent() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [progresses, setProgresses] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showWeakTopicsModal, setShowWeakTopicsModal] = useState(false);
  const [topStudents, setTopStudents] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: "Hello! I'm your OpenLearn AI. How can I help you clear your doubts today?" }
  ]);

  useEffect(() => {
    if (token) {
      fetch(`${BACKEND_URL}/api/data/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error(err));
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetch(`${BACKEND_URL}/api/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setTopStudents(data.topStudents || []);
          setCurrentUserRank(data.currentUserRank);
        })
        .catch(err => console.error('Leaderboard error:', err));
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      // First backfill progress from existing submissions
      fetch(`${BACKEND_URL}/api/progress/backfill`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          return null;
        })
        .then(data => {
          if (data && data.progresses) {
            setProgresses(data.progresses);
          } else {
            // If backfill fails, just fetch normally
            fetch(`${BACKEND_URL}/api/progress/student`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
              .then(res => res.json())
              .then(setProgresses)
              .catch(err => console.error('Progress fetch error:', err));
          }
        })
        .catch(err => console.error('Backfill error:', err));
      
      // Fetch assignment submissions
      fetch(`${BACKEND_URL}/api/assignments/student/my-submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          return [];
        })
        .then(setAssignmentSubmissions)
        .catch(err => console.error('Assignment submissions fetch error:', err));
    }
  }, [token]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const userMsg = { role: 'user', text: chatQuery };
    setChatMessages(prev => [...prev, userMsg]);
    setChatQuery('');
    setAiLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ query: chatQuery })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "I'm currently operating in basic mode. I can help you with questions about courses, quizzes, and your performance analytics!" }]);
    } finally {
      setAiLoading(false);
    }
  };

  const sidebar = [
    { to: '/student', label: 'Overview', icon: '📊' },
    { to: '/courses', label: 'My Courses', icon: '📚' },
  ];

  if (!data) return <DashboardLayout title="Student Overview" sidebar={sidebar}><div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div></div></DashboardLayout>;

  const { 
    enrolled = [], 
    quizScores = [], 
    submissions = [], 
    predictedLevel = 0, 
  } = data;

  const clusterLabels = ["Weak", "Average", "Strong"];
  const clusterColors = ["#ef4444", "#f59e0b", "#10b981"];
  const rfLabel = clusterLabels[predictedLevel || 0];
  const rfColor = clusterColors[predictedLevel || 0];

  const avgAccuracy = quizScores.length > 0 
    ? (quizScores.reduce((a, b) => a + b, 0) / quizScores.length).toFixed(1) 
    : 0;
  
  const totalAttempts = submissions?.length || 0;
  
  const clusterCounts = submissions?.reduce((acc, s) => {
    const cluster = s.cluster ?? 1;
    acc[cluster] = (acc[cluster] || 0) + 1;
    return acc;
  }, [0, 0, 0]) || [0, 0, 0];

  const distributionData = {
    labels: ['Weak', 'Average', 'Strong'],
    datasets: [{
      data: clusterCounts,
      backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
      borderWidth: 0,
    }]
  };

  const avgTime = submissions?.length > 0 
    ? submissions.reduce((a, b) => a + (b.timeTaken || 0), 0) / submissions.length 
    : 0;
  
  const speedScore = Math.max(0, 100 - (avgTime / 5));
  const consistencyScore = quizScores.length > 1 
    ? 100 - (Math.sqrt(quizScores.reduce((sq, n) => sq + Math.pow(n - avgAccuracy, 2), 0) / quizScores.length))
    : 100;

  const radarData = {
    labels: ['Accuracy', 'Score', 'Speed', 'Consistency', 'Attempts'],
    datasets: [{
      label: 'Your Profile',
      data: [avgAccuracy, avgAccuracy, speedScore, consistencyScore, Math.min(100, totalAttempts * 10)],
      backgroundColor: 'rgba(32, 190, 255, 0.3)',
      borderColor: '#20beff',
      pointBackgroundColor: '#20beff',
    }]
  };

  const allAnswers = submissions?.flatMap(s => s.answers || []) || [];
  const topicStats = allAnswers.reduce((acc, ans) => {
    const topic = ans.topic || 'General';
    if (!acc[topic]) acc[topic] = { total: 0, wrong: 0 };
    acc[topic].total += 1;
    if (!ans.isCorrect) acc[topic].wrong += 1;
    return acc;
  }, {});

  const weakTopics = Object.entries(topicStats)
    .filter(([_, stats]) => (stats.wrong / stats.total) > 0.4)
    .map(([topic]) => topic);

  const trendData = {
    labels: submissions?.map((s, i) => `Attempt ${i+1}`) || ['N/A'],
    datasets: [{ 
      label: 'Score %', 
      data: quizScores, 
      borderColor: '#60a5fa', 
      backgroundColor: 'rgba(96, 165, 250, 0.2)',
      tension: 0.3,
      fill: true
    }]
  };

  return (
    <DashboardLayout title="Student Overview">
      <div className="min-h-screen p-6 bg-[#0f172a] text-white">
        <div className="flex flex-wrap gap-3 mb-8">
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-900/50 text-indigo-300">
            🚀 Data-driven insights
          </span>
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-purple-900/50 text-purple-300">
            📊 Real-time ML analytics
          </span>
        </div>

        <div className="bg-[#1e293b] rounded-3xl p-8 shadow-xl border border-[#334155] mb-12 transition-all hover:shadow-2xl hover:shadow-indigo-500/10">
          <div className="flex items-center gap-6 mb-10">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-indigo-500/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-black">{user?.name}</h2>
                <span className="px-3 py-1 rounded-full bg-indigo-900/50 text-indigo-300 text-[10px] font-black uppercase tracking-widest">Student</span>
              </div>
              <p className="text-gray-400 font-medium flex items-center gap-2">
                <span>📍</span> Learning Journey Member
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#0f172a]/50 border border-[#334155] transition-all hover:scale-105 group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎯</span>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Avg Accuracy</p>
              </div>
              <h4 className="text-3xl font-black text-indigo-400">{avgAccuracy}%</h4>
            </div>
            <div className="p-6 rounded-2xl bg-[#0f172a]/50 border border-[#334155] transition-all hover:scale-105 group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📝</span>
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Total Attempts</p>
              </div>
              <h4 className="text-3xl font-black text-purple-400">{totalAttempts}</h4>
            </div>
            <div 
              onClick={() => setShowWeakTopicsModal(true)}
              className="p-6 rounded-2xl bg-[#0f172a]/50 border border-[#334155] transition-all hover:scale-105 group cursor-pointer hover:border-red-500/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚠️</span>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Weak Topics</p>
              </div>
              <div className="flex justify-between items-end">
                <h4 className="text-3xl font-black text-red-400">{weakTopics.length}</h4>
                <span className="text-[10px] font-bold text-gray-500 group-hover:text-red-400 transition-colors">View Details →</span>
              </div>
              {weakTopics.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {weakTopics.slice(0, 3).map((topic, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-red-900/20 text-red-400 text-[10px] font-bold">
                      {topic}
                    </span>
                  ))}
                  {weakTopics.length > 3 && (
                    <span className="text-[10px] font-bold text-gray-500 self-center">
                      +{weakTopics.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 rounded-2xl border border-[#334155] transition-all hover:scale-105 group" style={{ backgroundColor: `${rfColor}15` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🤖</span>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: rfColor }}>Predicted Level</p>
              </div>
              <h4 className="text-3xl font-black" style={{ color: rfColor }}>{rfLabel}</h4>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Your Rank Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 shadow-xl border border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/20">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                <span>🎯</span> Your Rank
              </h3>
              {currentUserRank ? (
                <div className="text-center">
                  <div className="text-7xl font-black text-white mb-4">#{currentUserRank.rank}</div>
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-2xl p-4">
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Avg Score</p>
                      <p className="text-2xl font-black text-white">{currentUserRank.averageScore}%</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-4">
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Accuracy</p>
                      <p className="text-2xl font-black text-white">{currentUserRank.accuracy}%</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-4">
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Total Attempts</p>
                      <p className="text-2xl font-black text-white">{currentUserRank.totalAttempts}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📊</span>
                  <p className="text-indigo-200 font-medium">Complete quizzes to get your rank!</p>
                </div>
              )}
            </div>
          </div>

          {/* Top 5 Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-[#1e293b] rounded-3xl p-8 shadow-xl border border-[#334155] transition-all hover:shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <span>🏆</span> Leaderboard (All Courses)
                </h3>
              </div>

              {topStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-[#334155]">
                        <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400 w-20">Rank</th>
                        <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Name</th>
                        <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400 text-center">Avg Score</th>
                        <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400 text-center">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topStudents.map((student) => {
                        const isCurrentUser = student.userId === user?._id || student.email === user?.email;
                        
                        return (
                          <tr 
                            key={student.userId} 
                            className={`border-b border-[#334155] transition-all hover:bg-slate-700 ${
                              isCurrentUser ? 'bg-indigo-900/20' : ''
                            }`}
                          >
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                {student.rank === 1 && <span className="text-2xl">🥇</span>}
                                {student.rank === 2 && <span className="text-2xl">🥈</span>}
                                {student.rank === 3 && <span className="text-2xl">🥉</span>}
                                {student.rank > 3 && (
                                  <span className="font-black text-lg text-gray-400">#{student.rank}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                {student.avatar ? (
                                  <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {student.name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <p className={`font-bold ${isCurrentUser ? 'text-indigo-400' : 'text-white'}`}>
                                    {student.name}
                                    {isCurrentUser && <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">You</span>}
                                    {student.rank === 1 && !isCurrentUser && <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-600 text-white text-[10px] font-bold">Top Performer</span>}
                                  </p>
                                  <p className="text-gray-500 text-xs">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-center">
                              <span className="font-black text-xl text-indigo-400">{student.averageScore}%</span>
                            </td>
                            <td className="py-4 text-center">
                              <span className="font-bold text-green-400">{student.accuracy}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <span className="text-6xl mb-6 block">🏆</span>
                  <p className="text-gray-400 font-medium">Leaderboard will appear once students start taking quizzes!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-[#1e293b] rounded-3xl p-8 shadow-xl border border-[#334155] transition-all hover:scale-[1.02]">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><span>👤</span> Performance Profile</h3>
            <div className="h-64">
              <Radar 
                data={radarData} 
                options={{ 
                  maintainAspectRatio: false, 
                  scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: '#334155' }, angleLines: { color: '#334155' } } },
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-3xl p-8 shadow-xl border border-[#334155] transition-all hover:scale-[1.02]">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><span>📈</span> Learning Trend</h3>
            <div className="h-64">
              <Line 
                data={trendData} 
                options={{ 
                  maintainAspectRatio: false, 
                  scales: { 
                    y: { min: 0, max: 100, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, 
                    x: { display: false } 
                  },
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-3xl p-8 shadow-xl border border-[#334155] transition-all hover:scale-[1.02]">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><span>🍩</span> Class Distribution</h3>
            <div className="h-64">
              <Doughnut 
                data={distributionData} 
                options={{ 
                  maintainAspectRatio: false, 
                  plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } 
                }} 
              />
            </div>
          </div>
        </div>

        {/* Recent Quiz Attempts Table */}
        <div className="bg-[#1e293b] rounded-3xl p-8 shadow-xl border border-[#334155] mb-12 overflow-hidden">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-2"><span>📝</span> Recent Quiz Attempts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-[#334155]">
                  <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Quiz Title</th>
                  <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Score</th>
                  <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">Date</th>
                  <th className="py-4 font-bold text-sm uppercase tracking-wider text-gray-400">ML Analysis</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length > 0 ? [...submissions].reverse().map((s) => (
                  <tr key={s.id || s._id} className="border-b border-[#334155] hover:bg-[#0f172a]/50 transition-colors group">
                    <td className="py-5 font-bold text-white">{s.quizTitle}</td>
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
                )) : (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-gray-500 italic">No quizzes attempted yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-3xl p-8 shadow-xl border border-[#334155] mb-12">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-2"><span>📚</span> My Enrolled Courses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enrolled.map((c) => {
              // Get course ID
              const courseId = c.id || c._id;
              
              // Find matching progress from backend-calculated data
              const courseProgress = progresses.find(p => {
                const progressCourseId = typeof p.courseId === 'object' ? p.courseId._id : p.courseId;
                return progressCourseId === courseId || progressCourseId === c._id;
              });
              
              // Use backend progress or default to 0%
              const overallProgress = courseProgress?.overallProgress || 0;
              const completedQuizzes = courseProgress?.completedQuizzes?.length || 0;
              const submittedAssignments = courseProgress?.completedAssignments?.length || 0;
              const lastActivityDate = courseProgress?.lastUpdated || courseProgress?.createdAt;
              
              // Determine status
              let progressColor = '#10b981'; // Green for high
              let statusLabel = 'Advanced';
              
              if (overallProgress < 31) {
                progressColor = '#ef4444'; // Red for beginner
                statusLabel = 'Beginner';
              } else if (overallProgress < 71) {
                progressColor = '#f59e0b'; // Yellow for intermediate
                statusLabel = 'Intermediate';
              }

              return (
                <div key={c.id || c._id} className="group p-8 rounded-3xl bg-[#0f172a]/50 border border-[#334155] transition-all hover:scale-[1.05] hover:shadow-2xl hover:shadow-indigo-500/10">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-bold group-hover:text-indigo-400 transition-colors">{c.title}</h4>
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
                      style={{ backgroundColor: `${progressColor}15`, color: progressColor }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-400">Progress</span>
                      <span className="text-2xl font-black" style={{ color: progressColor }}>
                        {overallProgress}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#334155] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${overallProgress}%`, backgroundColor: progressColor }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 flex items-center gap-2">
                        <span>📝</span> Quizzes Completed
                      </span>
                      <span className="font-bold text-purple-400">
                        {completedQuizzes}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 flex items-center gap-2">
                        <span>📋</span> Assignments Submitted
                      </span>
                      <span className="font-bold text-green-400">
                        {submittedAssignments}
                      </span>
                    </div>
                    {lastActivityDate && (
                      <div className="pt-2 border-t border-[#334155]">
                        <p className="text-xs text-gray-500">
                          Last activity: {new Date(lastActivityDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/courses/${c.id || c._id}`}
                    className="block w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                  >
                    Continue Learning
                  </Link>
                </div>
              );
            })}
            {enrolled.length === 0 && (
              <div className="col-span-full text-center py-20 bg-[#0f172a]/30 rounded-3xl border-2 border-dashed border-[#334155]">
                <span className="text-6xl mb-6 block">📭</span>
                <p className="text-gray-400 mb-8 font-medium">No courses enrolled yet. Start your journey today!</p>
                <Link to="/courses" className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 active:scale-95">
                  Browse Catalog
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Toggle */}
        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all z-[1000] group"
        >
          {chatOpen ? '✕' : '🤖'}
          {!chatOpen && (
            <span className="absolute right-full mr-4 px-4 py-2 rounded-xl bg-[#1e293b] border border-[#334155] text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Need help? Ask AI
            </span>
          )}
        </button>

        {/* AI Chat Window */}
        {chatOpen && (
          <div className="fixed bottom-28 right-8 w-96 h-[500px] bg-[#1e293b] border border-[#334155] rounded-3xl shadow-2xl z-[1000] flex flex-col overflow-hidden animate-fade-in-up">
            <div className="p-6 bg-indigo-600 text-white flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h4 className="font-black text-sm">OpenLearn AI</h4>
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Always Active</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-[#0f172a] text-gray-300 rounded-tl-none border border-[#334155]'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#0f172a] p-4 rounded-2xl rounded-tl-none border border-[#334155]">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="p-4 bg-[#0f172a] border-t border-[#334155]">
              <div className="relative">
                <input 
                  type="text" 
                  value={chatQuery}
                  onChange={e => setChatQuery(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full p-4 pr-12 rounded-xl bg-[#1e293b] border border-[#334155] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  type="submit"
                  disabled={aiLoading || !chatQuery.trim()}
                  className="absolute right-2 top-2 p-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Weak Topics Modal */}
        {showWeakTopicsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] grid place-items-center p-6">
            <div className="bg-[#1e293b] rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-[#334155] animate-fade-in-up">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⚠️</span>
                  <h3 className="text-2xl font-black">Weak Topics Detail</h3>
                </div>
                <button 
                  onClick={() => setShowWeakTopicsModal(false)} 
                  className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center hover:bg-red-900/30 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>

              <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                The following topics have an accuracy below 60% based on your recent quiz attempts. We recommend reviewing these areas.
              </p>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {weakTopics.length > 0 ? weakTopics.map((topic, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#0f172a]/50 border border-[#334155] flex items-center justify-between">
                    <span className="font-bold text-white">{topic}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-400/10 px-3 py-1 rounded-full">
                      Needs Review
                    </span>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <span className="text-4xl mb-4 block">🎉</span>
                    <p className="text-gray-400 font-bold">No weak topics found! Keep up the great work.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowWeakTopicsModal(false)}
                className="w-full mt-8 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
