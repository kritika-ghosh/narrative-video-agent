import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import Footer from './Footer';

/**
 * LandingPage – full-page marketing landing.
 * Props:
 *   onLaunch: () => void  — called when the user clicks any "Try it out" / "Launch App" button
 */
export default function LandingPage({ onLaunch }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Navbar onLaunch={onLaunch} />
      <main className="flex-1">
        <HeroSection onLaunch={onLaunch} />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
