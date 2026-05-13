import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState(null);
  
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const handleRoleSelection = async (selectedRole) => {
    if (!pendingGoogleCredential) return;
    
    setGoogleLoading(true);
    try {
      const res = await googleLogin(pendingGoogleCredential, selectedRole);
      if (res.success) {
        let stored = null;
        try {
          const storedUserStr = localStorage.getItem("olh_user");
          stored = storedUserStr && storedUserStr !== "undefined" ? JSON.parse(storedUserStr) : null;
        } catch (err) {
          console.error("Error parsing user data:", err);
        }
        if (stored?.role === 'admin') navigate('/admin');
        else if (stored?.role === 'instructor') navigate('/instructor');
        else navigate('/student');
        setShowRoleModal(false);
      } else {
        setError(res.message || "Failed to create account");
        setShowRoleModal(false);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setShowRoleModal(false);
    } finally {
      setGoogleLoading(false);
      setPendingGoogleCredential(null);
    }
  };

  useEffect(() => {
    const handleGoogleCallback = async (response) => {
      try {
        console.log("Google response received:", response);
        setGoogleLoading(true);
        setError("");
        
        const res = await googleLogin(response.credential);
        console.log("googleLogin result:", res);
        
        if (res.success) {
          if (res.isNewUser) {
            // New user - show role selection modal
            console.log("New user detected - showing role modal");
            setPendingGoogleCredential(response.credential);
            setShowRoleModal(true);
          } else {
            // Existing user - proceed to dashboard
            console.log("Existing user - redirecting to dashboard");
            let stored = null;
            try {
              const storedUserStr = localStorage.getItem("olh_user");
              stored = storedUserStr && storedUserStr !== "undefined" ? JSON.parse(storedUserStr) : null;
            } catch (err) {
              console.error("Error parsing user data:", err);
            }
            if (stored?.role === 'admin') navigate('/admin');
            else if (stored?.role === 'instructor') navigate('/instructor');
            else navigate('/student');
          }
        } else {
          console.log("googleLogin failed:", res.message);
          setError(res.message || "Google login failed");
        }
      } catch (err) {
        console.error("Google sign-in error:", err);
        setError(err.message || "Something went wrong with Google login. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    };

    const loadGoogleScript = () => {
      if (document.getElementById('google-gsi-script')) {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            prompt: "select_account"
          });
          if (googleButtonRef.current) {
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              theme: document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              logo_alignment: 'left'
            });
          }
        }
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            prompt: "select_account"
          });
          if (googleButtonRef.current) {
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              theme: document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              logo_alignment: 'left'
            });
          }
        }
      };
      document.body.appendChild(script);
    };

    loadGoogleScript();
  }, [googleLogin, navigate]);

  const validateForm = () => {
    if (!name || !email || !password) {
      setError("Please fill all fields");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    const validDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'];
    const domain = email.split('@')[1].toLowerCase();
    if (!validDomains.includes(domain)) {
      setError("Please use a valid email domain (e.g. gmail.com)");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (name.trim().length < 3) {
      setError("Name must be at least 3 characters");
      return false;
    }

    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError("");
    setLoading(true);

    try {
      const res = await register(name, email, password, role);
      if (res.success) {
        if (role === 'admin') navigate('/admin');
        else if (role === 'instructor') navigate('/instructor');
        else navigate('/student');
      } else {
        setError(res.message || "Registration failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">
      <div className="w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Create Account ✨</h2>
            <p className="text-gray-600 dark:text-gray-400">Join our AI-powered platform</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">I am a</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white cursor-pointer"
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${
                loading 
                  ? "bg-indigo-400 cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-500/25"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : "Register"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 dark:bg-slate-900/80 text-gray-500 dark:text-gray-400 font-medium">or continue with</span>
            </div>
          </div>

          <div ref={googleButtonRef} className="w-full"></div>
          {googleLoading && (
            <div className="text-center mt-4 text-gray-600 dark:text-gray-400">
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in with Google...
              </span>
            </div>
          )}

          <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors underline decoration-2 underline-offset-4">
              Login Now
            </Link>
          </p>
        </div>

        {/* Role Selection Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] grid place-items-center p-6">
            <div className="bg-[#1e293b] rounded-[2rem] p-8 w-full max-w-sm shadow-2xl border border-[#334155] animate-fade-in-up">
              <div className="text-center mb-8">
                <span className="text-5xl block mb-4">👤</span>
                <h3 className="text-2xl font-black">Select Your Role</h3>
                <p className="text-gray-400 mt-2">Choose how you want to use OpenLearn Hub</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleRoleSelection('student')}
                  disabled={googleLoading}
                  className={`w-full py-5 px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                    googleLoading 
                      ? "bg-indigo-400 cursor-not-allowed" 
                      : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-500/25"
                  } text-white`}
                >
                  <span className="text-2xl">🎓</span>
                  {googleLoading ? "Creating Account..." : "Student"}
                </button>

                <button
                  onClick={() => handleRoleSelection('instructor')}
                  disabled={googleLoading}
                  className={`w-full py-5 px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 border-2 ${
                    googleLoading 
                      ? "border-gray-600 cursor-not-allowed text-gray-500" 
                      : "border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-500/10 active:scale-95 text-indigo-400"
                  }`}
                >
                  <span className="text-2xl">👨‍🏫</span>
                  {googleLoading ? "Creating Account..." : "Instructor"}
                </button>
              </div>

              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setPendingGoogleCredential(null);
                }}
                disabled={googleLoading}
                className="w-full mt-6 py-3 px-4 rounded-xl text-gray-400 hover:text-white hover:bg-[#0f172a] transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
