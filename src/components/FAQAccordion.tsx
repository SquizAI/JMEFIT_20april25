import { useState } from 'react';
import { PlusCircle, MinusCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-6">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={index} 
            className={`bg-dark-card/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${isOpen ? 'border-l-4 border-jme-cyan shadow-jme-cyan/10 scale-[1.02]' : 'border border-dark-accent/50'} card-hover-effect`}
          >
            <button
              className="w-full px-8 py-5 flex justify-between items-center text-left group transition-all duration-300 hover:bg-dark-accent/10"
              onClick={() => toggleItem(index)}
              aria-expanded={isOpen}
            >
              <span className={`text-xl font-semibold transition-colors duration-300 ${isOpen ? 'text-jme-cyan' : 'text-white group-hover:text-jme-cyan/80'}`}>
                {item.question}
              </span>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${isOpen ? 'bg-jme-cyan text-white rotate-180' : 'bg-dark-accent/30 text-gray-300 group-hover:bg-dark-accent/50'}`}>
                {isOpen ? (
                  <MinusCircle className="h-5 w-5" />
                ) : (
                  <PlusCircle className="h-5 w-5" />
                )}
              </div>
            </button>
            <div 
              className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 animate-slideDown' : 'max-h-0'}`}
              aria-hidden={!isOpen}
            >
              <div className="px-8 pb-6 pt-2">
                <p className="text-gray-300 leading-relaxed transition-opacity duration-300">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FAQAccordion;