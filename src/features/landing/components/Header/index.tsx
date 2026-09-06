import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppSelector";
import "./styles.scss";

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <header className="landing-header">
      <div className="landing-header__inner">
        <div className="landing-header__brand" onClick={() => navigate("/")}>
          <span className="landing-header__pixel">Pixel</span>
          <span className="landing-header__coders">Coders</span>
        </div>

        <nav className="landing-header__nav">
          {/* <button
            className="landing-header__link"
            onClick={() => navigate('/demo')}
          >
            Demo →
          </button> */}
          {isAuthenticated ? (
            <button
              className="landing-header__link"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard →
            </button>
          ) : (
            <button
              className="landing-header__link"
              onClick={() => navigate("/login")}
            >
              Sign In →
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
