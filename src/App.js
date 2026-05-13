import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardInstructor from "./pages/DashboardInstructor";
import DashboardStudent from "./pages/DashboardStudent";
import CourseCatalog from "./pages/CourseCatalog";
import CourseDetail from "./pages/CourseDetail";
import QuizAttempt from "./pages/QuizAttempt";
import { useAuth } from "./auth/AuthContext";

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

function AppRoutes() {
  const [message, setMessage] = useState("");
  
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then(res => res.json())
      .then(() => setMessage("Service healthy"))
      .catch(() => setMessage(""));
  }, []);

  return (
    <Routes>
      {/* Main App Layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home backendMessage={message} />} />
        <Route
          path="/courses"
          element={
            <ProtectedRoute roles={["student", "instructor", "admin"]}>
              <CourseCatalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute roles={["student", "instructor"]}>
              <CourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:id"
          element={
            <ProtectedRoute roles={["student"]}>
              <QuizAttempt />
            </ProtectedRoute>
          }
        />
        {/* Dashboards - usually these have their own Sidebar layout, 
            but for now keeping them in MainLayout or they might have internal layouts */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor"
          element={
            <ProtectedRoute roles={["instructor"]}>
              <DashboardInstructor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={["student"]}>
              <DashboardStudent />
            </ProtectedRoute>
          }
        />
        {/* Placeholder for About if needed */}
        <Route path="/about" element={<div className="p-20 text-center text-2xl font-bold">About OpenLearn Hub</div>} />
      </Route>

      {/* Auth Layout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
