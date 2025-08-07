import React, { useState, useEffect } from 'react';

interface TypingAnimationProps {
  isLoading: boolean;
  startTime: number | null;
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({ isLoading, startTime }) => {
  const [currentMessage, setCurrentMessage] = useState<string>('Careena is typing');
  const [dotCount, setDotCount] = useState<number>(3);

  // Messages to show based on time elapsed
  const messages = [
    { time: 0, message: 'Careena is typing' },
    { time: 3, message: 'Saving your details' },
    { time: 8, message: 'Finding information according to your details' },
    { time: 15, message: 'Checking your employment verification' },
    { time: 22, message: 'Checking your loan application decision' },
    { time: 30, message: 'Analyzing your financial profile' },
    { time: 40, message: 'Processing your application' },
    { time: 50, message: 'Almost done, finalizing your results' },
    { time: 60, message: 'Just a moment more...' }
  ];

  useEffect(() => {
    if (!isLoading || !startTime) {
      setCurrentMessage('Careena is typing');
      return;
    }

    const updateMessage = () => {
      const elapsed = (Date.now() - startTime) / 1000; // Convert to seconds
      
      // Find the appropriate message based on elapsed time
      let messageToShow = messages[0].message;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (elapsed >= messages[i].time) {
          messageToShow = messages[i].message;
          break;
        }
      }
      
      setCurrentMessage(messageToShow);
    };

    // Update message immediately
    updateMessage();

    // Update message every second
    const interval = setInterval(updateMessage, 1000);

    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  // Animate dots
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setDotCount(prev => prev === 3 ? 1 : prev + 1);
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="flex items-start space-x-2 typing-message">
      <div className="flex-shrink-0">
        <img
          src="/images/careeena-avatar.jpg"
          alt="Careena"
          className="h-6 w-6 rounded-full object-cover"
        />
      </div>
      <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm max-w-xs typing-container">
        <div className="flex items-center space-x-1">
          <span className="text-gray-500 text-xs font-medium">{currentMessage}</span>
          <div className="flex space-x-1">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index < dotCount ? 'typing-dot-active' : 'typing-dot-inactive'
                }`}
                style={{
                  animationDelay: `${index * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingAnimation; 