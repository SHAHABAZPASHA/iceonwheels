'use client';

import { useState, useEffect } from 'react';

interface Poster {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  type: 'promotion' | 'announcement' | 'event' | 'seasonal';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  endDate: string;
  active: boolean;
  targetAudience?: string[];
  clickUrl?: string;
  createdAt: string;
}

export default function PostersDisplay() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadPosters = () => {
      // Load posters from localStorage
      const storedPosters = localStorage.getItem('adminPosters');
      if (storedPosters) {
        const allPosters: Poster[] = JSON.parse(storedPosters);

        // Filter active posters that are within date range
        const now = new Date();
        const activePosters = allPosters.filter(poster => {
          const startDate = new Date(poster.startDate);
          const endDate = new Date(poster.endDate);
          return poster.active && startDate <= now && endDate >= now;
        });

        // Sort by priority (high first) and then by creation date (newest first)
        activePosters.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setPosters(activePosters);
      }
    };

    loadPosters();

    // Listen for storage changes and custom events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminPosters') {
        loadPosters();
      }
    };

    const handlePostersUpdate = () => {
      loadPosters();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('postersUpdated', handlePostersUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('postersUpdated', handlePostersUpdate);
    };
  }, []);

  // Auto-rotate posters every 5 seconds
  useEffect(() => {
    if (posters.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % posters.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [posters.length]);

  if (posters.length === 0) {
    return null; // Don't show anything if no active posters
  }

  const currentPoster = posters[currentIndex];

  const getTypeColor = (type: Poster['type']) => {
    switch (type) {
      case 'promotion': return 'bg-blue-500';
      case 'announcement': return 'bg-green-500';
      case 'event': return 'bg-purple-500';
      case 'seasonal': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  // Display poster as informational slide (no clicking/navigation)
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-float"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-white rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-1/3 relative">
            <img
              src={currentPoster.imageUrl}
              alt={currentPoster.title}
              className="w-full h-48 md:h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-poster.jpg';
              }}
            />
            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white ${getTypeColor(currentPoster.type)}`}>
              {currentPoster.type.toUpperCase()}
            </div>
          </div>

          {/* Content Section */}
          <div className="md:w-2/3 p-6 flex flex-col justify-center">
            <h3 className="text-2xl font-bold mb-3 animate-slide-in-left">
              {currentPoster.title}
            </h3>
            <p className="text-lg mb-4 opacity-90 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
              {currentPoster.description}
            </p>
          </div>
        </div>

        {/* Navigation Dots */}
        {posters.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {posters.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}