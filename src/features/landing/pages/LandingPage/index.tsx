import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppSelector";
import { Button } from "@/components/common/Button";
import { Header } from "@/features/landing/components/Header";
import { HeroPreview } from "@/features/landing/components/HeroPreview";
import { FeatureCards } from "@/features/landing/components/FeatureCards";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { Footer } from "@/features/landing/components/Footer";
import "./styles.scss";

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handleCta = () => {
    navigate(isAuthenticated ? "/dashboard" : "/login");
  };

  return (
    <div className="landing">
      <Header />

      <main className="landing__main">
        {/* Hero */}
        <section className="landing__hero">
          <div className="landing__hero-badge">
            ✨ AI-Powered SVG Icon Search
          </div>

          <h1 className="landing__hero-title">
            <span className="landing__hero-title-gradient">Search It.</span>{" "}
            Find It.
          </h1>

          <p className="landing__hero-description">
            Search thousands of SVG icons across top libraries like Iconify, Lucide,
            and Remix Icon. AI understands your query and finds the best matches
            from multiple sources in seconds.
          </p>

          <div className="landing__hero-cta">
            <Button size="lg" onClick={handleCta}>
              Search Icons →
            </Button>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="landing__features">
          <FeatureCards />
        </section>

        {/* How It Works */}
        <section className="landing__how">
          <HowItWorks />
        </section>
      </main>

      <Footer />
    </div>
  );
}
