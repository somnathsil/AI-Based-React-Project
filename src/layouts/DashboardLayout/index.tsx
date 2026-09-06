import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { logout } from "@/store/authSlice";
import { ToastContainer, useToasts } from "@/components/common/Toast";
import "./styles.scss";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<"search" | "history">(
    "search",
  );
  const { toasts, dismiss } = useToasts();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <div className="dashboard-header__left">
            <Link to="/" className="dashboard-header__brand">
              <span className="dashboard-header__pixel">Pixel</span>
              <span className="dashboard-header__coders">Coders</span>
            </Link>

            <nav className="dashboard-header__nav">
              <button
                className={`dashboard-header__nav-btn ${activeTab === "search" ? "dashboard-header__nav-btn--active" : ""}`}
                onClick={() => setActiveTab("search")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Search
              </button>
              {/* <button
                className={`dashboard-header__nav-btn ${activeTab === 'history' ? 'dashboard-header__nav-btn--active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                History
              </button> */}
            </nav>
          </div>

          <div className="dashboard-header__right">
            <div className="dashboard-header__user">
              <div className="dashboard-header__avatar">
                {user?.name?.charAt(0) || "U"}
              </div>
              <span className="dashboard-header__name">
                {user?.name || "User"}
              </span>
            </div>
            <button className="dashboard-header__logout" onClick={handleLogout}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {typeof children === "object" &&
        children !== null &&
        "type" in children ? (
          <>{children}</>
        ) : (
          children
        )}
        {/* Pass activeTab to children via cloneElement or context - simplified approach */}
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
