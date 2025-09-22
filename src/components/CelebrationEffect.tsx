import React, { useEffect, useState } from 'react';

interface CelebrationEffectProps {
  show: boolean;
  onComplete?: () => void;
}

const CelebrationEffect: React.FC<CelebrationEffectProps> = ({ show, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    life: number;
  }>>([]);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Create confetti particles
      const newParticles = [];
      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
      
      for (let i = 0; i < 100; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: -10,
          vx: (Math.random() - 0.5) * 8,
          vy: Math.random() * 3 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          life: 1
        });
      }
      
      setParticles(newParticles);
      
      // Animate particles
      const animate = () => {
        setParticles(prev => 
          prev.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.1, // gravity
            life: particle.life - 0.01
          })).filter(particle => particle.life > 0 && particle.y < window.innerHeight + 50)
        );
      };
      
      const interval = setInterval(animate, 16);
      
      // Hide after animation
      setTimeout(() => {
        setIsVisible(false);
        setParticles([]);
        onComplete?.();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Congratulations Message */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center animate-bounce">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Congratulations!</h2>
          <p className="text-lg text-gray-600">All steps completed successfully!</p>
        </div>
      </div>
      
      {/* Confetti Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life,
            transform: `rotate(${particle.x * 0.1}deg)`,
            boxShadow: `0 0 ${particle.size}px ${particle.color}`
          }}
        />
      ))}
      
      {/* Fireworks Effect */}
      <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-pink-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-5 h-5 bg-blue-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-2/3 right-1/3 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-3/4 left-2/3 w-3 h-3 bg-purple-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '2s' }}></div>
    </div>
  );
};

export default CelebrationEffect;
