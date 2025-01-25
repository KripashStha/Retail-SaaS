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
    <div id="features" className="pt-2 sm:pt-4 md:pt-8 lg:pt-12 pb-12 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Everything you need to manage your inventory
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
            Easy Inventory offers a comprehensive suite of tools designed to streamline your inventory management process.
          </p>
        </div>

        <div ref={featuresRef} className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {features.map((feature) => (
              <div key={feature.name} className="relative feature-item opacity-0">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">{feature.name}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-300">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

