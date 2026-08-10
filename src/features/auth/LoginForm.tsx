import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/routes/routes.config";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Static credentials for demo authentication
const STATIC_CREDENTIALS = {
  email: "admin@mailinator.com",
  password: "123456",
};

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Load remembered credentials on mount
  useEffect(() => {
    const rememberMe = localStorage.getItem("remember_me");
    const savedEmail = localStorage.getItem("remembered_email");
    const savedPassword = localStorage.getItem("remembered_password");

    if (rememberMe === "true" && savedEmail && savedPassword) {
      reset({
        email: savedEmail,
        password: savedPassword,
        rememberMe: true,
      });
    }
  }, [reset]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API auth call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Validate against static credentials
      if (
        data.email === STATIC_CREDENTIALS.email &&
        data.password === STATIC_CREDENTIALS.password
      ) {
        // Store auth token
        localStorage.setItem("access_token", `mock_jwt_token_${data.email}`);

        // Store user info for display
        const userInfo = {
          name: "Admin User",
          email: data.email,
          role: "Administrator",
        };
        localStorage.setItem("user_info", JSON.stringify(userInfo));

        // Handle Remember Me
        if (data.rememberMe) {
          localStorage.setItem("remember_me", "true");
          localStorage.setItem("remembered_email", data.email);
          localStorage.setItem("remembered_password", data.password);
        } else {
          localStorage.removeItem("remember_me");
          localStorage.removeItem("remembered_email");
          localStorage.removeItem("remembered_password");
        }

        toast.success("Successfully logged in!");
        navigate(ROUTES.DASHBOARD);
      } else {
        toast.error("Invalid email or password. Please try again.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        leftIcon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        leftIcon={<Lock className="w-4 h-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-400 hover:text-white transition-colors focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        }
        error={errors.password?.message}
        {...register("password")}
      />

      <div className="flex items-center justify-between pt-2">
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/50"
            {...register("rememberMe")}
          />
          <span>Remember Me</span>
        </label>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full mt-2"
        isLoading={isSubmitting}
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        Login
      </Button>
    </form>
  );
};
