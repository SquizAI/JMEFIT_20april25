import React from 'react';

const transformations = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
    name: "Sarah M.",
    achievement: "Lost 30lbs in 6 months"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
    name: "Mike R.",
    achievement: "Gained 15lbs muscle mass"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=800&q=80",
    name: "Jessica K.",
    achievement: "Completed SHRED challenge"
  }
];

function TransformationsBanner() {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          Transformations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {transformations.map((item) => (
            <div key={item.id} className="relative group">
              <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden">
                <img 
                  src={item.image} 
                  alt={`${item.name}'s transformation`}
                  className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-4">
                  <div className="text-white">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm opacity-90">{item.achievement}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TransformationsBanner;