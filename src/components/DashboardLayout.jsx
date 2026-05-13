import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function DashboardLayout({ title, sidebar, children }) {
  const loc = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = sidebar || [
    { to: '/student', label: 'Overview', icon: '📊' },
    { to: '/courses', label: 'My Courses', icon: '📚' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)] transition-colors duration-300 bg-[#0f172a] text-white overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 left-0 h-full w-64 border-r z-50 transition-all duration-300
        bg-[#1e293b] border-[#334155]
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-500/20">
                OL
              </span>
              <span className="text-xl font-bold">Portal</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl bg-[#0f172a] text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="space-y-2">
            {links.map((link) => {
              const isActive = loc.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-gray-400 hover:bg-[#0f172a] hover:text-white'
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-full">
        <header className="px-4 md:px-6 lg:px-10 py-6 border-b transition-colors duration-300 bg-[#1e293b] border-[#334155] flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-[#0f172a] border border-[#334155] text-white hover:bg-white/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-xl md:text-2xl font-black">{title}</h2>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6 lg:px-10 py-8 w-full max-w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
