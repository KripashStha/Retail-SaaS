import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Benefits from '../components/Benefits';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import CTA from '@/components/CTA';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main>
        <Hero />
        <Features />
        <Benefits />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

