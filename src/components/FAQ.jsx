'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqItems = [
  {
    question: "What is Easy Inventory?",
    answer: "Easy Inventory is a comprehensive inventory management solution designed to help businesses of all sizes track, manage, and optimize their stock levels. It offers real-time tracking, POS integration, smart alerts, and intuitive dashboards to streamline your inventory processes."
  },
  {
    question: "How does Easy Inventory integrate with my existing POS system?",
    answer: "Easy Inventory is designed to seamlessly integrate with a wide range of popular POS systems. Our API allows for real-time synchronization of sales data, ensuring your inventory levels are always up-to-date. For specific integration details, please contact our support team."
  },
  {
    question: "Can I use Easy Inventory on multiple devices?",
    answer: "Yes, Easy Inventory is a cloud-based solution that can be accessed from any device with an internet connection. Whether you're using a desktop computer, laptop, tablet, or smartphone, you can manage your inventory on-the-go."
  },
  {
    question: "Is there a limit to the number of products I can manage?",
    answer: "Our plans are designed to accommodate businesses of all sizes. While our basic plan has some limitations, our premium plans offer unlimited product management. Check our pricing page for detailed information on each plan's features."
  },
  {
    question: "How secure is my data with Easy Inventory?",
    answer: "We take data security very seriously. Easy Inventory uses industry-standard encryption protocols to protect your data both in transit and at rest. We also perform regular security audits and backups to ensure the safety and integrity of your information."
  },
  {
    question: "Do you offer customer support?",
    answer: "We provide 24/7 customer support via email for all our plans. Our premium plans also include priority phone support. Our dedicated team is always ready to assist you with any questions or issues you may encounter."
  }
]

export default function FAQ() {
  return (
    <section id="faq" className="py-12 bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">FAQ</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Frequently Asked Questions
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
            Find answers to common questions about Easy Inventory
          </p>
        </div>
        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

