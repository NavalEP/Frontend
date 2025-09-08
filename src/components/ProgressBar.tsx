import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  steps?: string[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentStep, 
  steps = ['Eligibility', 'Select Plan', 'KYC', 'Autopay Setup', 'Authorize'] 
}) => {
  return (
    <div className="w-full bg-gray-50 px-3 py-1">
      <div className="flex items-center justify-center">
        <div className="flex items-center">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber <= currentStep;
            
            return (
              <React.Fragment key={step}>
                {/* Step Segment */}
                <div
                  className={`
                    relative flex items-center justify-center px-2 py-1 min-w-[60px] text-xs font-medium
                    ${isActive 
                      ? 'bg-purple-700 text-white' 
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }
                  `}
                  style={{
                    clipPath: index === 0 
                      ? 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)'
                      : index === steps.length - 1
                      ? 'polygon(10% 0%, 100% 0%, 100% 100%, 10% 100%)'
                      : 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%)'
                  }}
                >
                  <span className="text-center leading-tight">{step}</span>
                </div>
                
                {/* Arrow connector (except for last step) */}
                {index < steps.length - 1 && (
                  <div className="relative -ml-1 z-10">
                    <div 
                      className="w-0 h-0 border-l-[8px] border-r-0 border-t-[10px] border-b-[10px] border-t-transparent border-b-transparent"
                      style={{
                        borderLeftColor: isActive ? '#7c3aed' : '#f3f4f6'
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
