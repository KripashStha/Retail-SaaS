'use client'

import { useEffect, useRef } from 'react';
import { BarChart3, Zap, Bell, LayoutDashboard, Upload } from 'lucide-react';

const features = [
  {
    name: 'Real-time Inventory Tracking',
    description:
      'Get instant updates on stock levels with clear visual indicators and dynamic charts.',
    icon: BarChart3,
  },
  {
    name: 'POS Integration',
    description:
      'Seamlessly integrate with your point of sale system for automatic inventory updates.',
    icon: Zap,
  },
  {
    name: 'Smart Alert System',
    description:
      'Receive timely notifications for low stock items and set up custom alert thresholds.',
    icon: Bell,
  },
  {
    name: 'Intuitive Dashboards',
    description:
      'Access comprehensive insights with interactive graphs and performance metrics.',
    icon: LayoutDashboard,
  },
  {
    name: 'Easy CSV Upload',
    description:
      'Quickly import and preview inventory data with our user-friendly CSV upload feature.',
    icon: Upload,
  },
];

export default function Features() {
  const featuresRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const featureElements = featuresRef.current.querySelectorAll('.feature-item');
    featureElements.forEach((el) => observer.observe(el));

    return () => {
      featureElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <section id="features" className="py-10 sm:py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-sm sm:text-base text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-2xl sm:text-3xl md:text-4xl leading-tight font-extrabold tracking-tight text-gray-900 dark:text-white">
            Everything you need to manage your inventory
          </p>
          <p className="mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-300 mx-auto">
            Easy Inventory offers a comprehensive suite of tools designed to streamline your inventory management process.
          </p>
        </div>

        <div ref={featuresRef} className="mt-8 sm:mt-10 md:mt-12">
          <dl className="space-y-8 sm:space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-3 lg:gap-x-10">
            {features.map((feature) => (
              <div key={feature.name} className="relative feature-item opacity-0 transition-all duration-300">
                <dt>
                  <div className="absolute flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-indigo-500 text-white shadow-md">
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-14 sm:ml-16 text-base sm:text-lg leading-6 font-medium text-gray-900 dark:text-white">{feature.name}</p>
                </dt>
                <dd className="mt-2 ml-14 sm:ml-16 text-sm sm:text-base text-gray-500 dark:text-gray-300">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

