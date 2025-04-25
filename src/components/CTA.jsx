'use client'

import { useRef, useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  const ctaRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ctaRef.current) {
      observer.observe(ctaRef.current);
    }

    return () => {
      if (ctaRef.current) {
        observer.unobserve(ctaRef.current);
      }
    };
  }, []);

  return (
    <section className="py-16 sm:py-20  overflow-hidden">
      <div 
        ref={ctaRef}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 ease-out transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-xl">
          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-100/80 dark:bg-indigo-900/20 blur-3xl opacity-70"></div>
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-purple-100/70 dark:bg-purple-900/20 blur-3xl opacity-70"></div>
          
          <div className="relative px-6 py-12 md:p-12 lg:px-16 lg:py-16 text-left md:text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              <span className="block mb-2">Experience the simplest inventory</span>
              <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 dark:from-indigo-400 dark:via-blue-400 dark:to-purple-400 text-transparent bg-clip-text">
                management software.
              </span>
            </h2>
            <p className="mt-4 text-base md:text-xl text-gray-500 dark:text-gray-300 max-w-2xl md:mx-auto">
              Discover Easy Inventory. See if it's the perfect fit for your needs with our risk-free trial!
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-start md:justify-center">
              <a
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 md:text-lg transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-indigo-600/20"
              >
                Try Easy Inventory
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-base font-medium rounded-lg text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 dark:text-indigo-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700/50 md:text-lg transition-all duration-300 ease-in-out"
              >
                Learn More <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

