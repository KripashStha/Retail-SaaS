"use client";

import { CheckCircle } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const benefits = [
  "Reduce stockouts and overstocking",
  "Increase sales and profitability",
  "Improve cash flow management",
  "Enhance customer satisfaction",
  "Save time on inventory tasks",
  "Make data-driven decisions",
];

export default function Benefits() {
  const sectionRef = useRef(null);
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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <div
      id="benefits"
      className="py-12 md:py-16 lg:py-20 bg-gray-50 dark:bg-gray-800 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={sectionRef}>
        <div className="text-left md:text-center">
          <h2 className="text-base text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">
            Benefits
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Why choose Easy Inventory?
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 md:mx-auto">
            Our powerful inventory management solution helps you optimize your
            business operations and boost your bottom line.
          </p>
        </div>

        <div className="mt-12">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-12 md:gap-y-10">
            {benefits.map((benefit, index) => (
              <li
                key={benefit}
                className={`transition-all duration-700 ease-out transform ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle
                      className="h-6 w-6 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {benefit}
                    </p>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                      {index % 2 === 0
                        ? "Optimize your inventory with our intelligent system that prevents costly issues."
                        : "Our solution provides the insights and tools you need for better business outcomes."}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
