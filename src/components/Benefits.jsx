import { CheckCircle } from 'lucide-react';

const benefits = [
  'Reduce stockouts and overstocking',
  'Increase sales and profitability',
  'Improve cash flow management',
  'Enhance customer satisfaction',
  'Save time on inventory tasks',
  'Make data-driven decisions',
];

export default function Benefits() {
  return (
    <div id="benefits" className="py-8 sm:py-10 md:py-12 lg:py-16 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">Benefits</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Why choose Easy Inventory?
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
            Our powerful inventory management solution helps you optimize your business operations and boost your bottom line.
          </p>
        </div>

        <div className="mt-10">
          <ul className="md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {benefits.map((benefit) => (
              <li key={benefit} className="mt-10 first:mt-0 md:mt-0">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg leading-6 font-medium text-gray-900 dark:text-white">{benefit}</p>
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

