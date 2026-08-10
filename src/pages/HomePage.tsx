import React from "react";
import { NavLink } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Image,
  Wand2,
  Code2,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/routes/routes.config";

interface FeatureItem {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

const featuresList: FeatureItem[] = [
  {
    id: 0,
    title: "Instant Image Vectorization",
    description:
      "Upload PNG, JPG, or raster icons and convert them into clean, layered vector SVGs in seconds using AI vision models.",
    icon: Image,
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
    borderColor: "border-sky-500/20",
  },
  {
    id: 1,
    title: "AI Precision Paths",
    description:
      "Smart Bezier curve fitting, color palette extraction, and noise reduction engineered for retina displays.",
    icon: Wand2,
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    borderColor: "border-indigo-500/20",
  },
  {
    id: 3,
    title: "Clean React & SVG Code",
    description:
      "Export production-ready SVG code, JSX components, or raw path markup ready for instant developer integration.",
    icon: Code2,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/20",
  },
];

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Glow background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-87.5 bg-linear-to-b from-sky-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header Nav */}
      <header className="h-20 max-w-7xl w-full mx-auto px-6 flex items-center justify-between z-10 animate-fade-in">
        <div className="flex items-center gap-3">
          <span className="font-heading text-4xl font-bold tracking-tight text-white">
            Pixel<span className="text-gradient">Coders</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <NavLink to={ROUTES.LOGIN}>
            <Button
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </NavLink>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 pt-16 pb-24 text-center space-y-8 z-10 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-md font-medium text-sky-400 animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <span>Next-Gen AI Vector & SVG Generator Studio</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-gradient font-heading tracking-tight leading-tight max-w-3xl animate-fade-in-delay-1">
          Convert Image Icons to Crisp
          <span className="text-gradient">Vector SVGs with AI</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-3xl leading-relaxed animate-fade-in-delay-2">
          Transform raster images, PNGs, and sketch icons into
          resolution-independent, scalable SVGs instantly using AI.
          Pixel-perfect vector generation engineered for modern web design
          systems.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 animate-fade-in-delay-3">
          <NavLink to={ROUTES.LOGIN}>
            <Button
              size="lg"
              variant="primary"
              className="btn-glow font-semibold"
              rightIcon={
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              }
            >
              Generate SVG Icon Now
            </Button>
          </NavLink>
        </div>

        {/* Feature Grid mapped dynamically with ultra-smooth spring animations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 w-full text-left animate-fade-in-delay-3">
          {featuresList.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.id}
                style={{ animationDelay: `${0.36 + idx * 0.12}s` }}
                className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5 group hover:border-sky-500/40 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)] hover:-translate-y-2.5 transition-all duration-500 cursor-pointer animate-fade-in"
              >
                <div
                  className={`size-14 rounded-xl flex items-center justify-center border ${feature.iconBg} ${feature.iconColor} ${feature.borderColor} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                >
                  <IconComponent className="size-7 transition-transform duration-500 group-hover:scale-110" />
                </div>
                <h3 className="text-lg font-semibold text-white font-heading group-hover:text-sky-300 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-md text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-base text-slate-500 animate-fade-in-delay-3">
        <p>
          © {new Date().getFullYear()} PixelCoders. AI Image Icon to SVG
          Generator Platform.
        </p>
      </footer>
    </div>
  );
};
