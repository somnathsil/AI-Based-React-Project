import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { login, clearError } from "@/store/authSlice";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import "./styles.scss";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginErrors = { email?: string; password?: string };

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: LoginErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginErrors;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    dispatch(clearError());
    const loginResult = await dispatch(login({ email, password, remember }));
    if (login.fulfilled.match(loginResult)) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <Link to="/" className="login-page__brand">
          <span className="login-page__pixel">Pixel</span>
          <span className="login-page__coders">Coders</span>
        </Link>

        <h1 className="login-page__title">Welcome Back</h1>
        <p className="login-page__subtitle">Sign in to your AI SVG Studio</p>

        {error && (
          <div className="login-page__error" role="alert">
            {error}
          </div>
        )}

        <form className="login-page__form" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="Enter your emaili"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <div className="login-page__password-wrapper">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-page__toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <div className="login-page__options">
            <label className="login-page__remember">
              <div className="custom-checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <div className="custom-checkbox__box"></div>
              </div>
              <span>Remember me</span>
            </label>
          </div>

          <Button type="submit" fullWidth size="lg" loading={isLoading}>
            Sign In
          </Button>
        </form>

        <Link to="/" className="login-page__back">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
