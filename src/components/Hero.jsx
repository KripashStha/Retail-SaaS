'use client'

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-indigo-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 pt-24 pb-8 sm:pt-20 sm:pb-12 md:pt-24 md:pb-16 lg:mt-14 lg:pb-24 lg:max-w-2xl">
          <div ref={heroRef} className="opacity-0">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
              <span className="block xl:inline">Simplify your</span>{' '}
              <span className="block text-indigo-600 dark:text-indigo-400 xl:inline">inventory management</span>
            </h1>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
              Easy Inventory helps retail stores effortlessly track stock, integrate with POS systems, and make data-driven decisions. Say goodbye to stockouts and hello to increased profits.
            </p>
            <div className="mt-5 sm:mt-8 sm:flex sm:justify-start">
              <div className="rounded-md shadow">
                <a
                  href="/signup"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 md:py-4 md:text-lg md:px-10 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
                >
                  Get started
                </a>
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <a
                  href="#features"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Learn More <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-2/5 mt-8 lg:mt-11">
        <Image
          className="h-48 w-full object-cover object-left sm:h-64 md:h-72 lg:w-full lg:h-full rounded-lg shadow-2xl transform lg:translate-x-8 lg:translate-y-16"
          src="/dashboard.png"
          alt="Inventory management dashboard"
          width={1600}
          height={900}
        />
      </div>
    </div>
  );
}

