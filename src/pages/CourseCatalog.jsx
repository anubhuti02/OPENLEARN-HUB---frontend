import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function CourseCatalog() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetch('/api/data/courses', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setCourses)
    .catch(err => console.error(err));
  }, [token]);

  return (
    <main className="min-h-screen p-8 bg-[#0f172a] text-white">
      <h2 className="text-3xl font-black mb-8">Course Catalog</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.map(c => (
          <div key={c._id} className="p-6 rounded-2xl bg-[#1e293b] border border-[#334155] shadow-xl hover:scale-105 transition-all">
            <h3 className="text-xl font-bold mb-2">{c.title}</h3>
            <p className="text-sm text-gray-400 mb-6">{c.students} students enrolled</p>
            <Link 
              className="block w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-center hover:bg-indigo-700 transition-all" 
              to={`/courses/${c._id}`}
            >
              View Course
            </Link>
          </div>
        ))}
      </div>
      {courses.length === 0 && (
        <div className="text-center py-20 bg-[#1e293b]/50 rounded-3xl border-2 border-dashed border-[#334155]">
          <p className="text-gray-400">No courses available at the moment.</p>
        </div>
      )}
    </main>
  );
}
