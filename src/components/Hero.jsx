"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart2, Package, ShoppingCart } from "lucide-react";
import { useTheme } from "next-themes";

export default function Hero() {
  const heroRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true); // Start with visible content
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);

    // Set visibility to true immediately to ensure content shows
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Only use intersection observer for animation purposes, not visibility control
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
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

  // Only access theme after component has mounted to prevent hydration mismatch
  const isDark = mounted ? theme === "dark" : false;

  // Render initial state that will match the server during hydration
  if (!mounted) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50 to-purple-50">
        <div className="max-w-[1400px] py-12 mx-auto px-4 sm:px-6 relative z-10">
          <div
            ref={heroRef}
            className="flex flex-col items-start md:items-center pt-10 pb-12 md:pt-24 transition-all duration-1000 ease-out transform opacity-100 translate-y-0"
          >
            <div className="text-left md:text-center w-full mb-6 md:mb-8">
              <span className="inline-block px-4 py-1 text-sm font-medium rounded-full border text-indigo-600 bg-indigo-100/70 border-indigo-200">
                Now available - May 2025
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-left md:text-center md:max-w-4xl w-full mx-auto leading-tight text-gray-900">
              <span className="block mb-2 md:mb-4">
                Simplify your inventory
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600">
                with smart management
              </span>
            </h1>

            <p className="mt-5 text-base md:text-lg lg:text-xl text-left md:text-center w-full md:max-w-2xl md:mx-auto text-gray-600">
              Easy Inventory helps retail stores effortlessly track stock,
              integrate with POS systems, and make data-driven decisions.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-start md:justify-center w-full">
              <a
                href="/signup"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-indigo-600/20"
              >
                Get started for free
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base font-medium rounded-lg transition-all duration-300 ease-in-out text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200"
              >
                Learn More <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="relative mt-10 md:mt-20 transition-all duration-1000 delay-300 ease-out transform opacity-100 scale-100">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-xl md:rounded-2xl transform rotate-1 scale-[1.02] opacity-70"></div>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 rounded-xl md:rounded-2xl opacity-30 blur-sm"></div>

            <div className="relative mb-16 md:mb-24 overflow-hidden rounded-xl md:rounded-2xl border shadow-2xl shadow-indigo-500/10 bg-white/90 border-indigo-300/30">
              <div className="absolute top-0 left-0 right-0 h-8 md:h-10 backdrop-blur-sm z-10 flex items-center px-3 md:px-4 bg-gray-100/80">
                <div className="flex space-x-1.5 md:space-x-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/70"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/70"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/70"></div>
                </div>
                <div className="text-xs mx-auto text-gray-600">
                  Easy Inventory Dashboard
                </div>
              </div>

              <div className="transition-opacity duration-500 pt-8 md:pt-10">
                <img
                  className="w-full h-auto object-cover"
                  src="/dashboard.png"
                  alt="Light mode inventory dashboard"
                  width={1920}
                  height={1080}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Actual component with theme applied after mounting
  return (
    <div
      className={`relative overflow-hidden ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950"
          : "bg-gradient-to-br from-white via-indigo-50 to-purple-50"
      }`}
    >
      <div className="max-w-[1400px] py-12 mx-auto px-4 sm:px-6 relative z-10">
        {/* Main content div - always visible but with animation classes */}
        <div
          ref={heroRef}
          className={`flex flex-col items-start md:items-center pt-10 pb-12 md:pt-24 transition-all duration-1000 ease-out transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Top tag section */}
          <div className="text-left md:text-center w-full mb-6 md:mb-8">
            <span
              className={`inline-block px-4 py-1 text-sm font-medium rounded-full border ${
                isDark
                  ? "text-indigo-200 bg-indigo-900/30 border-indigo-700/30"
                  : "text-indigo-600 bg-indigo-100/70 border-indigo-200"
              }`}
            >
              Now available - May 2025
            </span>
          </div>

          {/* Main heading */}
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-left md:text-center md:max-w-4xl w-full mx-auto leading-tight ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            <span className="block mb-2 md:mb-4">Simplify your inventory</span>
            <span
              className={`bg-clip-text text-transparent ${
                isDark
                  ? "bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400"
                  : "bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600"
              }`}
            >
              with smart management
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`mt-5 text-base md:text-lg lg:text-xl text-left md:text-center w-full md:max-w-2xl md:mx-auto ${
              isDark ? "text-indigo-100/80" : "text-gray-600"
            }`}
          >
            Easy Inventory helps retail stores effortlessly track stock,
            integrate with POS systems, and make data-driven decisions.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-start md:justify-center w-full">
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-indigo-600/20"
            >
              Get started for free
            </a>
            <a
              href="#features"
              className={`inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base font-medium rounded-lg transition-all duration-300 ease-in-out ${
                isDark
                  ? "text-white bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700 hover:border-gray-600"
                  : "text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200"
              }`}
            >
              Learn More <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Dashboard image section */}
        <div
          className={`relative mt-10 md:mt-20 transition-all duration-1000 delay-300 ease-out transform ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* Image frame with overlay effects */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-xl md:rounded-2xl transform rotate-1 scale-[1.02] opacity-70"></div>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 rounded-xl md:rounded-2xl opacity-30 blur-sm"></div>

          {/* Main image container */}
          <div
            className={`relative mb-16 md:mb-24 overflow-hidden rounded-xl md:rounded-2xl border shadow-2xl shadow-indigo-500/10 ${
              isDark
                ? "bg-gray-900/90 border-indigo-500/20"
                : "bg-white/90 border-indigo-300/30"
            }`}
          >
            {/* Top UI bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-8 md:h-10 backdrop-blur-sm z-10 flex items-center px-3 md:px-4 ${
                isDark ? "bg-black/40" : "bg-gray-100/80"
              }`}
            >
              <div className="flex space-x-1.5 md:space-x-2">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/70"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/70"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/70"></div>
              </div>
              <div
                className={`text-xs mx-auto ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Easy Inventory Dashboard
              </div>
            </div>

            {/* Dashboard image */}
            <div className="transition-opacity duration-500 pt-8 md:pt-10">
              <img
                key={theme}
                className="w-full h-auto object-cover"
                src={isDark ? "/darkdash.png" : "/dashboard.png"}
                alt={`${isDark ? "Dark" : "Light"} mode inventory dashboard`}
                width={1920}
                height={1080}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
