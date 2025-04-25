"use client";

import { useRef, useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "What is Easy Inventory?",
    answer:
      "Easy Inventory is a comprehensive inventory management solution designed to help businesses of all sizes track, manage, and optimize their stock levels. It offers real-time tracking, POS integration, smart alerts, and intuitive dashboards to streamline your inventory processes.",
  },
  {
    question: "How does Easy Inventory integrate with my existing POS system?",
    answer:
      "Easy Inventory is designed to seamlessly integrate with a wide range of popular POS systems. Our API allows for real-time synchronization of sales data, ensuring your inventory levels are always up-to-date. For specific integration details, please contact our support team.",
  },
  {
    question: "Can I use Easy Inventory on multiple devices?",
    answer:
      "Yes, Easy Inventory is a cloud-based solution that can be accessed from any device with an internet connection. Whether you're using a desktop computer, laptop, tablet, or smartphone, you can manage your inventory on-the-go.",
  },
  {
    question: "Is there a limit to the number of products I can manage?",
    answer:
      "Our plans are designed to accommodate businesses of all sizes. While our basic plan has some limitations, our premium plans offer unlimited product management. Check our pricing page for detailed information on each plan's features.",
  },
  {
    question: "How secure is my data with Easy Inventory?",
    answer:
      "We take data security very seriously. Easy Inventory uses industry-standard encryption protocols to protect your data both in transit and at rest. We also perform regular security audits and backups to ensure the safety and integrity of your information.",
  },
  {
    question: "Do you offer customer support?",
    answer:
      "We provide 24/7 customer support via email for all our plans. Our premium plans also include priority phone support. Our dedicated team is always ready to assist you with any questions or issues you may encounter.",
  },
];

export default function FAQ() {
  const faqRef = useRef(null);
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

    if (faqRef.current) {
      observer.observe(faqRef.current);
    }

    return () => {
      if (faqRef.current) {
        observer.unobserve(faqRef.current);
      }
    };
  }, []);

  return (
    <section
      id="faq"
      className="py-12 md:py-16 lg:py-20 bg-white dark:bg-gray-900 overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" ref={faqRef}>
        <div className="text-left md:text-center">
          <h2 className="text-base text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">
            FAQ
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Frequently Asked Questions
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 md:mx-auto">
            Find answers to common questions about Easy Inventory
          </p>
        </div>
        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem
                value={`item-${index}`}
                key={index}
                className={`transition-all duration-700 ease-out transform border-b border-gray-200 dark:border-gray-700 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <AccordionTrigger className="text-left py-4 text-lg md:text-xl font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base md:text-lg text-gray-600 dark:text-gray-300 pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
