import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import DashboardLayout from "../components/DashboardLayout";

const BACKEND_URL = process.env.REACT_APP_API_URL || "";

export default function QuizAttempt() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(null);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/quizzes/detail/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setQuiz(data);
      // Initialize answers as arrays for multiple choice support
      setAnswers(new Array(data.questions.length).fill([]));

      // Timer Initialization
      const savedTime = localStorage.getItem(`quiz_timer_${id}`);
      const savedDuration = localStorage.getItem(`quiz_duration_${id}`);
      const currentDuration = (data.duration !== undefined && data.duration !== null) ? data.duration.toString() : "30";

      console.log("Quiz Duration Check:", {
        id,
        savedTime,
        savedDuration,
        currentDuration,
        receivedFromBackend: data.duration
      });

      if (savedTime && savedDuration && savedDuration === currentDuration) {
        setTimeLeft(parseInt(savedTime));
      } else {
        console.log("Resetting timer to:", currentDuration, "minutes");
        const initialSeconds = parseInt(currentDuration) * 60;
        setTimeLeft(initialSeconds);
        localStorage.setItem(`quiz_timer_${id}`, initialSeconds.toString());
        localStorage.setItem(`quiz_duration_${id}`, currentDuration);
      }
    });
  }, [id, token]);

  // Countdown logic
  useEffect(() => {
    if (timeLeft === null || submitted) return;

    if (timeLeft <= 0) {
      if (!isAutoSubmitting) {
        autoSubmitQuiz();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        localStorage.setItem(`quiz_timer_${id}`, next.toString());
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, id, isAutoSubmitting]);

  const trackQuizCompleted = async () => {
    if (!quiz?.courseId) return;
    try {
      const courseId = typeof quiz.courseId === 'object' ? quiz.courseId._id : quiz.courseId;
      await fetch(`${BACKEND_URL}/api/progress/quiz/${courseId}/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error tracking quiz completion:', err);
    }
  };

  const autoSubmitQuiz = async () => {
    setIsAutoSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      const res = await fetch(`${BACKEND_URL}/api/quizzes/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ answers, timeTaken, autoSubmitted: true })
      });
      
      if (res.ok) {
        const data = await res.json();
        await trackQuizCompleted();
        setResult(data);
        setSubmitted(true);
        localStorage.removeItem(`quiz_timer_${id}`);
        localStorage.removeItem(`quiz_duration_${id}`);
      }
    } catch (err) {
      console.error("Auto-submit failed:", err);
    } finally {
      setIsAutoSubmitting(false);
    }
  };

  const handleAnswerChange = (qIndex, oIndex) => {
    const newAnswers = [...answers];
    const currentAnswers = Array.isArray(newAnswers[qIndex]) ? newAnswers[qIndex] : [];
    
    if (currentAnswers.includes(oIndex)) {
      // Remove the option
      newAnswers[qIndex] = currentAnswers.filter(idx => idx !== oIndex);
    } else {
      // Add the option
      newAnswers[qIndex] = [...currentAnswers, oIndex];
    }
    
    setAnswers(newAnswers);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    // Check if all questions have at least one answer
    const hasEmptyAnswers = answers.some(answer => !Array.isArray(answer) || answer.length === 0);
    
    if (hasEmptyAnswers) {
      alert("Please answer all questions before submitting!");
      return;
    }

    const timeTaken = Math.floor((Date.now() - startTime) / 1000); // seconds

    const res = await fetch(`${BACKEND_URL}/api/quizzes/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ answers, timeTaken })
    });
    
    if (res.ok) {
      const data = await res.json();
      await trackQuizCompleted();
      setResult(data);
      setSubmitted(true);
      localStorage.removeItem(`quiz_timer_${id}`);
      localStorage.removeItem(`quiz_duration_${id}`);
    }
  };

  if (!quiz) return <div>Loading Quiz...</div>;

  if (submitted) {
    const percentage = (result.score / result.totalQuestions) * 100;
    
    // Recommendation logic remains same, but UI updates to dark
    let recommendedLevel = "";
    let recommendationMsg = "";
    let recommendationColor = "";
    
    if (percentage < 40) {
      recommendedLevel = "Easy Quiz";
      recommendationMsg = "Don't worry! We recommend starting with some easier quizzes to build your foundation.";
      recommendationColor = "#ef4444"; 
    } else if (percentage >= 40 && percentage <= 70) {
      recommendedLevel = "Medium Quiz";
      recommendationMsg = "Good job! You have a solid grasp. Try some intermediate quizzes to sharpen your skills further.";
      recommendationColor = "#f59e0b"; 
    } else {
      recommendedLevel = "Hard Quiz";
      recommendationMsg = "Excellent! You've mastered this. We recommend challenging yourself with advanced topics.";
      recommendationColor = "#10b981"; 
    }

    const topicStats = result.answers.reduce((acc, ans) => {
      const topic = ans.topic || 'General';
      if (!acc[topic]) acc[topic] = { total: 0, wrong: 0 };
      acc[topic].total += 1;
      if (!ans.isCorrect) acc[topic].wrong += 1;
      return acc;
    }, {});

    const weakTopics = Object.entries(topicStats)
      .filter(([_, stats]) => (stats.wrong / stats.total) > 0.4)
      .map(([topic]) => topic);

    const clusterLabels = ["Weak", "Average", "Strong"];
    const clusterColors = ["#ef4444", "#f59e0b", "#10b981"];
    const clusterLabel = clusterLabels[result.cluster || 0];
    const clusterColor = clusterColors[result.cluster || 0];

    return (
      <DashboardLayout title="Quiz Result">
        <div className="p-8 bg-[#0f172a] min-h-screen text-white">
          {result.autoSubmitted && (
            <div className="max-w-4xl mx-auto mb-8 p-4 rounded-2xl bg-amber-900/20 border border-amber-500/30 text-amber-400 font-bold text-center animate-pulse">
              ⏳ Quiz auto-submitted due to time limit
            </div>
          )}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="p-10 rounded-3xl bg-[#1e293b] border border-[#334155] shadow-xl text-center">
              <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">Your Score</h3>
              <h2 className="text-7xl font-black text-white mb-4">
                {result.score} <span className="text-3xl text-gray-500">/ {result.totalQuestions}</span>
              </h2>
              <div className="text-2xl font-bold text-indigo-400 mb-6">({percentage.toFixed(0)}%)</div>
              <div className="inline-block px-6 py-2 rounded-full font-black text-sm uppercase tracking-wider" style={{ backgroundColor: `${recommendationColor}15`, color: recommendationColor }}>
                {recommendedLevel} Performance
              </div>
              <p className="mt-8 text-gray-400">Time Taken: <span className="text-white font-bold">{result.timeTaken}s</span></p>
            </div>

            <div className="p-10 rounded-3xl bg-[#1e293b] border border-[#334155] shadow-xl border-l-8" style={{ borderLeftColor: clusterColor }}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🤖</span>
                <h3 className="text-2xl font-black">AI Analysis</h3>
              </div>
              <div className="mb-6">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Performance Cluster</span>
                <div className="text-4xl font-black" style={{ color: clusterColor }}>{clusterLabel}</div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                The ML model grouped you into the <span className="text-white font-bold">{clusterLabel}</span> category based on your accuracy and speed.
              </p>
            </div>
          </div>

          {weakTopics.length > 0 && (
            <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-red-900/10 border border-red-500/30 mb-8">
              <div className="flex items-center gap-3 mb-4 text-red-400">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-xl font-black">Weak Topic Alert</h3>
              </div>
              <div className="flex flex-wrap gap-3 mb-4">
                {weakTopics.map(t => (
                  <span key={t} className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm">
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-sm text-red-300/70">Focus on these topics in your study materials to improve your overall performance.</p>
            </div>
          )}

          <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-[#1e293b] border border-[#334155] shadow-xl mb-8">
            <h3 className="text-2xl font-black mb-8">Detailed Topic Analysis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Object.entries(topicStats).map(([topic, stats]) => (
                <div key={topic} className="p-6 rounded-2xl bg-[#0f172a]/50 border border-[#334155] text-center">
                  <div className="font-bold text-gray-300 mb-2">{topic}</div>
                  <div className="text-3xl font-black mb-1" style={{ color: (stats.wrong/stats.total > 0.4) ? '#ef4444' : '#10b981' }}>
                    {((stats.total - stats.wrong) / stats.total * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500 font-bold">{stats.total - stats.wrong} / {stats.total} correct</div>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto flex flex-col gap-4 mb-8">
            <button 
              className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-black text-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/25 active:scale-95" 
              onClick={() => setShowReview(!showReview)}
            >
              {showReview ? 'Hide Answers' : 'Review Answers'}
            </button>
            
            <button 
              className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black text-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 active:scale-95" 
              onClick={() => navigate('/student')}
            >
              Back to Dashboard
            </button>
          </div>

          {/* Answer Review Section */}
          {showReview && result.quizQuestions && (
            <div className="max-w-4xl mx-auto space-y-6 mb-8">
              <h2 className="text-3xl font-black text-center mb-8">Answer Review</h2>
              
              {result.quizQuestions.map((question, qIndex) => {
                const answerData = result.answers[qIndex];
                return (
                  <div 
                    key={qIndex} 
                    className="p-8 rounded-3xl bg-[#1e293b] border border-[#334155] shadow-xl"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">Question {qIndex + 1}</h4>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        answerData.isCorrect 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {answerData.isCorrect ? '✓ Correct' : '✗ Wrong'}
                      </span>
                    </div>
                    
                    <p className="text-xl font-medium text-white mb-6">{question.questionText}</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {question.options.map((opt, oIndex) => {
                        const isSelected = answerData.selectedOptions.includes(oIndex);
                        const isCorrect = answerData.correctAnswers.includes(oIndex);
                        
                        let bgClass = 'bg-[#0f172a]/50 border-[#334155]';
                        let textClass = 'text-gray-400';
                        
                        if (isCorrect) {
                          bgClass = 'bg-emerald-500/10 border-emerald-500/30';
                          textClass = 'text-emerald-400 font-bold';
                        }
                        
                        if (isSelected && !isCorrect) {
                          bgClass = 'bg-red-500/10 border-red-500/30';
                          textClass = 'text-red-400 font-bold';
                        }
                        
                        return (
                          <div 
                            key={oIndex} 
                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 ${bgClass}`}
                          >
                            <span className="text-2xl">
                              {isCorrect ? '✅' : (isSelected ? '❌' : '⭕')}
                            </span>
                            <div className="flex-1">
                              <span className={textClass}>{opt}</span>
                              {isSelected && !isCorrect && (
                                <p className="text-xs text-red-400 mt-1 font-bold">Your answer</p>
                              )}
                              {isCorrect && (
                                <p className="text-xs text-emerald-400 mt-1 font-bold">Correct answer</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={quiz.title}>
      <div className="p-8 bg-[#0f172a] min-h-screen text-white relative">
        {/* Sticky Timer */}
        <div className="sticky top-4 z-50 flex justify-center mb-8">
          <div className={`px-8 py-4 rounded-3xl border shadow-2xl flex items-center gap-4 backdrop-blur-xl transition-all ${
            timeLeft < 60 ? 'bg-red-900/30 border-red-500/50 animate-pulse' : 'bg-[#1e293b]/80 border-[#334155]/50'
          }`}>
            <span className={`text-2xl ${timeLeft < 60 ? 'text-red-400' : 'text-indigo-400'}`}>
              {timeLeft < 60 ? '⚠️' : '⏳'}
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Time Remaining</span>
              <span className={`text-3xl font-mono font-black ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {quiz.questions.map((q, qIndex) => (
            <div key={qIndex} className="p-8 rounded-3xl bg-[#1e293b] border border-[#334155] shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">Question {qIndex + 1}</h4>
                <span className="px-3 py-1 rounded-lg bg-[#0f172a] text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Multiple Choice</span>
              </div>
              <p className="text-xl font-medium text-white mb-8">{q.questionText}</p>
              
              <div className="grid grid-cols-1 gap-4">
                {q.options.map((opt, oIndex) => {
                  const isSelected = Array.isArray(answers[qIndex]) && answers[qIndex].includes(oIndex);
                  return (
                    <label key={oIndex} className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
                      isSelected 
                        ? 'bg-indigo-600/10 border-indigo-600 shadow-lg shadow-indigo-600/10' 
                        : 'bg-[#0f172a]/50 border-[#334155] hover:border-gray-500'
                    }`}>
                      <input 
                        type="checkbox" 
                        className="w-6 h-6 rounded border-[#334155] text-indigo-600 focus:ring-indigo-500 bg-transparent"
                        checked={isSelected}
                        onChange={() => handleAnswerChange(qIndex, oIndex)}
                      />
                      <span className={`text-lg transition-colors ${isSelected ? 'text-white font-bold' : 'text-gray-400'}`}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <button 
            className="w-full py-6 rounded-3xl bg-indigo-600 text-white font-black text-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 mb-20" 
            onClick={handleSubmit}
          >
            Submit Quiz
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
