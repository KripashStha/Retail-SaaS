export default function CTA() {
    return (
      <section className="py-16 sm:py-20 bg-grey-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Experience the simplest inventory
            <span className="block">management software.</span>
          </h2>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-300">
          Discover Easy Inventory. See if it's the perfect fit for your needs!
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 md:py-4 md:text-lg md:px-10 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
            >
              Try Easy Inventory
            </a>
          </div>
        </div>
      </section>
    );
  }
  
  