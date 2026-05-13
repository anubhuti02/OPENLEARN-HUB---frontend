import { useLocation, useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();
  const loc = useLocation();

  const handleScroll = (id) => {
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

  return (
    <footer className="border-t border-[#334155] bg-[#0f172a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📚</span>
              <span className="text-xl font-bold text-white">OpenLearn Hub</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              AI-powered learning platform for smarter studying and better results. 
              Our mission is to democratize education through intelligent technology.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-white uppercase tracking-wider text-xs">Links</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => handleScroll("about")} 
                  className="text-sm text-gray-400 hover:text-indigo-400 transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleScroll("contact")} 
                  className="text-sm text-gray-400 hover:text-indigo-400 transition-colors"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-white uppercase tracking-wider text-xs">Platform</h4>
            <div className="flex gap-4">
              <div className="p-3 rounded-2xl bg-[#1e293b] border border-[#334155] text-indigo-400">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <p className="text-xs font-black text-white">Fast & Secure</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">MERN Stack</p>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-[#334155] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            © 2026 OpenLearn Hub • All rights reserved
          </p>
          <div className="flex gap-6">
            <span className="text-xs font-bold text-gray-500 hover:text-indigo-400 cursor-pointer transition-colors uppercase tracking-widest">Privacy</span>
            <span className="text-xs font-bold text-gray-500 hover:text-indigo-400 cursor-pointer transition-colors uppercase tracking-widest">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
