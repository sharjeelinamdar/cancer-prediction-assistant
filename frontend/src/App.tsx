import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import ChatPage from "./pages/ChatPage";
import DashboardPage from "./pages/DashboardPage";
import KnowledgeHubPage from "./pages/KnowledgeHubPage";
import ReportHistoryPage from "./pages/ReportHistoryPage";
import UploadReportPage from "./pages/UploadReportPage";
import HospitalFinderPage from "./pages/HospitalFinderPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { clearSessionUser, getSessionUser, saveSessionUser } from "./lib/auth";
import type { SessionUser } from "./lib/auth";

type SidebarItem = {
  label: string;
  route: string;
  icon: string;
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", route: "/dashboard", icon: "home" },
  { label: "Analyze Report", route: "/analyze", icon: "file" },
  { label: "Hospital Finder", route: "/hospitals", icon: "hospital" },
  { label: "Chat Assistant", route: "/chat", icon: "chat" },
  { label: "History", route: "/history", icon: "clock" },
  { label: "Knowledge Hub", route: "/knowledge", icon: "book" },
];

function SidebarIcon({ type }: { type: string }) {
  if (type === "home") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20h14V9.5" />
      </svg>
    );
  }
  if (type === "file") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    );
  }
  if (type === "hospital") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H3v16h18V8" />
        <path d="M9 8h6" />
        <path d="M12 5v6" />
        <path d="M15 14h4" />
        <path d="M17 12v4" />
      </svg>
    );
  }
  if (type === "chat") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      </svg>
    );
  }
  if (type === "clock") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="mt-4 space-y-1">
      {SIDEBAR_ITEMS.map((item) => (
        <NavLink
          key={item.route}
          to={item.route}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
              isActive
                ? "border border-slate-300 bg-slate-200 text-slate-900"
                : "text-slate-600 hover:border hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")
          }
        >
          <span className="text-slate-500 group-hover:text-slate-800">
            <SidebarIcon type={item.icon} />
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setSessionUser(getSessionUser());
  }, []);

  const handleAuthenticated = (user: SessionUser) => {
    saveSessionUser(user);
    setSessionUser(user);
  };

  const handleLogout = () => {
    clearSessionUser();
    setSessionUser(null);
    setMobileOpen(false);
  };

  if (!sessionUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={handleAuthenticated} />} />
        <Route path="/signup" element={<SignupPage onSignupSuccess={handleAuthenticated} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 rounded-r-2xl border-r border-slate-200 bg-slate-50 px-4 py-5 shadow-sm lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">OncoAssist</p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">Cancer Virtual Assistant</h1>
        <SidebarNav />
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:ml-72 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">OncoAssist</p>
            <h1 className="text-sm font-semibold text-slate-900">Cancer Virtual Assistant</h1>
          </div>

          <nav className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 lg:flex">
            {SIDEBAR_ITEMS.map((item) => (
              <NavLink
                key={`top-${item.route}`}
                to={item.route}
                className={({ isActive }) =>
                  [
                    "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                    isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <p className="text-xs font-semibold text-slate-500">{sessionUser.email}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 lg:hidden"
          >
            Menu
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/35"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute inset-y-0 left-0 w-64 rounded-r-2xl border-r border-slate-200 bg-slate-50 px-4 py-5 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">OncoAssist</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Navigation</h2>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </aside>
        </div>
      ) : null}

      <main className="px-4 py-6 sm:px-6 lg:ml-72 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analyze" element={<UploadReportPage />} />
          <Route path="/upload" element={<Navigate to="/analyze" replace />} />
          <Route path="/hospitals" element={<HospitalFinderPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/history" element={<ReportHistoryPage />} />
          <Route path="/knowledge" element={<KnowledgeHubPage />} />
          <Route path="/knowledge/:articleId" element={<KnowledgeHubPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
