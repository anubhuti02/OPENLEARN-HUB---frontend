import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Line } from 'react-chartjs-2';
import { useAuth } from "../auth/AuthContext";

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export default function DashboardAdmin() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [courseList, setCourseList] = useState([]);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/api/data/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error(err));
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/api/data/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(setCourseList)
      .catch(err => console.error(err));
    }
  }, [token]);

  const sidebar = [
    { to: '/admin', label: 'Overview', icon: '📊' },
    { to: '/courses', label: 'Courses', icon: '📚' },
  ];

  if (!data) return (
    <DashboardLayout title="Admin Control Panel" sidebar={sidebar}>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    </DashboardLayout>
  );

  const { users, courses, activeStudents, pendingApprovals, systemUsage } = data;

  const deleteCourse = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      const res = await fetch(`/api/data/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setCourseList(prev => prev.filter(c => (c.id || c._id) !== id));
    }
  };

  const cards = [
    { k: 'users', v: users, label: 'Total Users', icon: '👥', color: 'indigo' },
    { k: 'courses', v: courses, label: 'Active Courses', icon: '📚', color: 'purple' },
    { k: 'active', v: activeStudents, label: 'Active Students', icon: '⚡', color: 'emerald' },
  ];
  
  const lineData = {
    labels: ['Jan','Feb','Mar','Apr','May','Jun'],
    datasets: [{ 
      label: 'System Usage', 
      data: systemUsage, 
      borderColor: '#6366f1', 
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  return (
    <DashboardLayout title="Admin Control Panel" sidebar={sidebar}>
      <div className="p-6 bg-[#0f172a] min-h-screen text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cards.map(c => (
            <div key={c.k} className="p-8 rounded-3xl bg-[#1e293b] shadow-xl border border-[#334155] transition-all hover:scale-105">
              <div className="flex justify-between items-start mb-4">
                <span className="text-3xl">{c.icon}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full bg-${c.color}-900/30 text-${c.color}-400`}>
                  Live
                </span>
              </div>
              <h3 className="text-4xl font-black mb-2">{c.v}</h3>
              <p className="text-gray-400 font-medium">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="p-8 rounded-3xl bg-[#1e293b] shadow-xl border border-[#334155]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold">Course Management</h3>
              <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all">
                + Create New
              </button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {courseList.map(c => (
                <div key={c.id || c._id} className="flex items-center justify-between p-4 rounded-2xl bg-[#0f172a]/50 border border-[#334155]">
                  <div>
                    <div className="font-bold">{c.title}</div>
                    <div className="text-xs text-gray-400">{c.students} students enrolled</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-[#1e293b] text-gray-400 hover:text-indigo-400 transition-colors">
                      ✏️
                    </button>
                    <button 
                      onClick={() => deleteCourse(c.id || c._id)}
                      className="p-2 rounded-lg bg-[#1e293b] text-gray-400 hover:text-red-400 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-[#1e293b] shadow-xl border border-[#334155]">
            <h3 className="text-xl font-bold mb-8">System Analytics</h3>
            <div className="h-64">
              <Line 
                data={lineData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { 
                    y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-[#1e293b] shadow-xl border border-[#334155]">
          <h3 className="text-xl font-bold mb-6">Pending Course Approvals</h3>
          {pendingApprovals && pendingApprovals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApprovals.map((c, i) => (
                <div key={i} className="p-4 rounded-2xl border border-dashed border-[#334155] flex items-center justify-between">
                  <span className="font-medium text-white">{c}</span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded-lg bg-green-900/30 text-green-400 text-xs font-bold">Approve</button>
                    <button className="px-3 py-1 rounded-lg bg-red-900/30 text-red-400 text-xs font-bold">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No pending approvals</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

