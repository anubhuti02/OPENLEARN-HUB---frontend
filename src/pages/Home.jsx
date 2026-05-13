import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Home({ backendMessage }) {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalCourses: 0, totalQuizzes: 0 });
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetch('/api/data/courses')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          setCourses(data.slice(0, 6));
        }
      })
      .catch(err => console.error(err));

    fetch('/api/data/stats')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setStats(data);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const features = [
    { icon: '🤖', title: 'AI-Based Performance Analysis', desc: 'Get detailed insights into your learning patterns with ML-driven analytics' },
    { icon: '📝', title: 'Real-Time Quiz System', desc: 'Take interactive quizzes with instant feedback and automatic scoring' },
    { icon: '💡', title: 'Smart Recommendations', desc: 'Personalized course and quiz suggestions based on your performance' },
    { icon: '📊', title: 'Instructor Analytics Dashboard', desc: 'Comprehensive tools for instructors to manage and track student progress' }
  ];

  const howItWorks = [
    { step: 1, title: 'Register/Login', desc: 'Create your account or sign in to get started' },
    { step: 2, title: 'Enroll in Courses', desc: 'Browse our catalog and enroll in courses that interest you' },
    { step: 3, title: 'Attempt Quizzes', desc: 'Take quizzes to test your knowledge and skills' },
    { step: 4, title: 'Get ML-Based Insights', desc: 'View detailed analytics and recommendations to improve' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(data.message);
        setFormData({ name: '', email: '', message: '' });
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        setErrorMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      setErrorMessage('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0f172a] to-[#1e293b] py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="relative z-10 animate-fade-in">
            

            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-white">
              Learn Smarter with{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AI-Powered Quizzes
              </span>
            </h1>
            
            <p className="text-lg mb-8 leading-relaxed text-gray-400">
              Track your performance, identify weak areas, and improve with data-driven insights. 
              Our platform uses advanced ML to help you achieve your goals faster.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <Link to="/register" className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 transition-all hover:scale-105 shadow-lg shadow-indigo-500/25 active:scale-95">
                Get Started
              </Link>
              <Link to="/courses" className="px-8 py-4 rounded-2xl border-2 border-[#334155] font-bold text-lg hover:bg-[#1e293b] transition-all hover:scale-105 active:scale-95 text-white">
                Explore Courses
              </Link>
            </div>
          </div>

          <div className="relative hidden md:flex justify-center">
            <div className="w-full max-w-lg aspect-square rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-3xl border border-[#334155] flex items-center justify-center relative animate-float">
              <span className="text-[12rem]">🎓</span>
              <div className="absolute top-10 right-10 p-4 rounded-2xl bg-[#1e293b] shadow-xl animate-bounce-slow">
                <span className="text-4xl">📊</span>
              </div>
              <div className="absolute bottom-10 left-10 p-4 rounded-2xl bg-[#1e293b] shadow-xl animate-bounce-slow" style={{ animationDelay: '1s' }}>
                <span className="text-4xl">🤖</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">Powerful AI Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Discover how our intelligent platform transforms your learning experience with cutting-edge technology.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="group p-8 rounded-3xl bg-[#1e293b]/50 border border-transparent hover:border-indigo-500/50 transition-all hover:-translate-y-2">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-[#0f172a]/50 py-24 border-y border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-16 text-white">Your Learning Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative">
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-dashed border-[#334155]" />
                )}
                <div className="relative z-10 w-20 h-20 mx-auto mb-6 rounded-3xl bg-[#1e293b] shadow-xl flex items-center justify-center text-3xl font-black text-indigo-400 border border-[#334155]">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-7xl mx-auto px-6 py-24">
        <div className="rounded-[3rem] bg-indigo-600 p-12 md:p-20 text-white relative overflow-hidden">
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-black mb-6">Have Questions?</h2>
              <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                Our support team is here to help you 24/7. Whether you're a student or an instructor, we've got you covered.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">📧</div>
                  <div>
                    <p className="text-sm text-indigo-200">Email us at</p>
                    <p className="font-bold text-white">support@openlearnhub.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">📞</div>
                  <div>
                    <p className="text-sm text-indigo-200">Call us</p>
                    <p className="font-bold text-white">+1 (555) 000-0000</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              {successMessage && (
                <div className="mb-4 p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-200">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200">
                  {errorMessage}
                </div>
              )}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your Name" 
                  className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-white"
                  required
                />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address" 
                  className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-white"
                  required
                />
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Your Message" 
                  rows="4" 
                  className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-white"
                  required
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-white text-indigo-600 font-black hover:bg-indigo-50 transition-colors shadow-xl shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-20 -mb-20 blur-3xl" />
        </div>
      </section>
    </div>
  );
}
