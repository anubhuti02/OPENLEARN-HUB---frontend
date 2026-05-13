import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const handleScroll = (id) => {
    setMobileMenuOpen(false);
    if (loc.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const navLinks = [
    { label: 'Home', to: '/', type: 'link' },
    { label: 'Courses', to: '/courses', type: 'link' },
    { label: 'About', to: 'about', type: 'scroll' },
    { label: 'Contact', to: 'contact', type: 'scroll' },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300 bg-[#1e293b]/90 border-[#334155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-3xl group-hover:scale-110 transition-transform">📚</span>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
              OpenLearn <span className="text-indigo-600">Hub</span>
            </span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            link.type === 'link' ? (
              <Link 
                key={link.label}
                to={link.to} 
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  loc.pathname === link.to 
                    ? "text-indigo-600 bg-indigo-900/20" 
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ) : (
              <button 
                key={link.label}
                onClick={() => handleScroll(link.to)} 
                className="px-4 py-2 rounded-xl font-bold text-sm transition-all text-gray-300 hover:text-white hover:bg-white/5"
              >
                {link.label}
              </button>
            )
          ))}
          
          {user && (
            <Link 
              to={user.role === "admin" ? "/admin" : (user.role === "instructor" ? "/instructor" : "/student")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                loc.pathname.includes(user.role)
                  ? "text-indigo-600 bg-indigo-900/20" 
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!user ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link 
                to="/login" 
                className="px-5 py-2.5 rounded-2xl font-bold text-sm transition-all text-gray-300 hover:text-white"
              >
                Log in
              </Link>
              <Link 
                to="/register" 
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95"
              >
                Sign up
              </Link>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-4 pl-4 border-l border-[#334155]">
              <div className="text-right">
                <p className="text-sm font-black text-white">{user.name}</p>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{user.role}</p>
              </div>
              <button 
                onClick={handleLogout} 
                className="p-2.5 rounded-2xl bg-red-900/20 text-red-600 hover:bg-red-900/40 transition-all group"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#0f172a]/50 border border-[#334155] text-white hover:bg-white/5 transition-all"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#334155] bg-[#1e293b]">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              link.type === 'link' ? (
                <Link 
                  key={link.label}
                  to={link.to} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    loc.pathname === link.to 
                      ? "text-indigo-600 bg-indigo-900/20" 
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <button 
                  key={link.label}
                  onClick={() => handleScroll(link.to)} 
                  className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all text-gray-300 hover:text-white hover:bg-white/5"
                >
                  {link.label}
                </button>
              )
            ))}
            
            {user && (
              <Link 
                to={user.role === "admin" ? "/admin" : (user.role === "instructor" ? "/instructor" : "/student")}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  loc.pathname.includes(user.role)
                    ? "text-indigo-600 bg-indigo-900/20" 
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                Dashboard
              </Link>
            )}

            {!user ? (
              <div className="pt-3 border-t border-[#334155] space-y-3">
                <Link 
                  to="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 rounded-xl font-bold text-sm transition-all text-gray-300 hover:text-white hover:bg-white/5"
                >
                  Log in
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="pt-3 border-t border-[#334155]">
                <div className="flex items-center justify-between px-4 py-3 mb-3 rounded-xl bg-[#0f172a]/50 border border-[#334155]">
                  <div>
                    <p className="text-sm font-black text-white">{user.name}</p>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="w-full px-4 py-3 rounded-xl bg-red-900/20 text-red-600 hover:bg-red-900/40 transition-all font-bold text-sm flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
