"use client";
import { useState, useEffect } from "react";
import { Menu, X, Package, ChevronDown } from "lucide-react";
import DarkModeToggle from "./DarkModeToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when screen size increases to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen]);

  // Close mobile menu when user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      const nav = document.querySelector("nav");
      const mobileMenu = document.getElementById("mobile-menu");

      if (
        isMenuOpen &&
        nav &&
        !nav.contains(event.target) &&
        mobileMenu &&
        !mobileMenu.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent scrolling when mobile menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isMenuOpen]);

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const section = document.querySelector(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  // Check if we're on the home page
  const isHomePage = pathname === "/";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center text-lg sm:text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200"
              aria-label="Easy Inventory home"
            >
              <Package
                className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 mr-1.5 sm:mr-2"
                aria-hidden="true"
              />
              <span className="hidden xs:inline">Easy Inventory</span>
              <span className="inline xs:hidden">Easy Inventory</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            {isHomePage && (
              <>
                <a
                  href="#features"
                  onClick={(e) => scrollToSection(e, "#features")}
                  className="group relative text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-2 lg:px-3 py-2 rounded-md text-sm lg:text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Features
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a
                  href="#benefits"
                  onClick={(e) => scrollToSection(e, "#benefits")}
                  className="group relative text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-2 lg:px-3 py-2 rounded-md text-sm lg:text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Benefits
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a
                  href="#faq"
                  onClick={(e) => scrollToSection(e, "#faq")}
                  className="group relative text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-2 lg:px-3 py-2 rounded-md text-sm lg:text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  FAQ
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300"></span>
                </a>
              </>
            )}

            <DarkModeToggle />

            <Link
              href="/login"
              className="group relative text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-2 lg:px-3 py-2 rounded-md text-sm lg:text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300"></span>
            </Link>

            <Link
              href="/signup"
              className="ml-2 lg:ml-4 whitespace-nowrap inline-flex items-center justify-center px-3 lg:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm lg:text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover:scale-105"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile navigation buttons */}
          <div className="flex md:hidden items-center space-x-2">
            <DarkModeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
              aria-controls="mobile-menu"
            >
              <span className="sr-only">
                {isMenuOpen ? "Close menu" : "Open menu"}
              </span>
              {isMenuOpen ? (
                <X className="block h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="block h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMounted && isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm z-40 transition-opacity duration-300"
          aria-hidden="true"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile menu, show/hide based on menu state */}
      <div
        id="mobile-menu"
        className={`md:hidden fixed top-16 right-0 w-[85%] max-w-sm h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 shadow-xl overflow-y-auto z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div className="pt-4 pb-3 px-4 space-y-2.5">
          {isHomePage && (
            <>
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, "#features")}
                className="flex items-center justify-between w-full px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-indigo-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span>Features</span>
                <ChevronDown
                  className="h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
              </a>
              <a
                href="#benefits"
                onClick={(e) => scrollToSection(e, "#benefits")}
                className="flex items-center justify-between w-full px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-indigo-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span>Benefits</span>
                <ChevronDown
                  className="h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
              </a>
              <a
                href="#faq"
                onClick={(e) => scrollToSection(e, "#faq")}
                className="flex items-center justify-between w-full px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-indigo-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span>FAQ</span>
                <ChevronDown
                  className="h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
              </a>
            </>
          )}
          <Link
            href="/login"
            className="flex items-center justify-between w-full px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-indigo-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <span>Login</span>
          </Link>
        </div>
        <div className="pt-2 pb-6 px-4 mt-2 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/signup"
            className="block w-full text-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover:scale-105"
          >
            Sign up
          </Link>
          <div className="mt-6 flex flex-col items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2023-2025 Easy Inventory. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
