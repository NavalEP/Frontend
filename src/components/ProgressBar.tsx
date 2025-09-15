import React from 'react';
import { PostApprovalStatusData } from '../services/postApprovalApi';

interface ProgressBarProps {
  currentStep?: number;
  steps?: string[];
  userStatuses?: string[];
  postApprovalData?: PostApprovalStatusData | null;
  stepCompletion?: {
    eligibility: boolean;
    selectPlan: boolean;
    kyc: boolean;
    autopaySetup: boolean;
    authorize: boolean;
  };
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentStep, 
  steps = ['Eligibility', 'Select Plan', 'KYC', 'Autopay', 'Authorize'],
  userStatuses = [],
  stepCompletion
}) => {
  // Function to determine current step based on user statuses
  const getCurrentStepFromStatuses = (): number => {
    if (currentStep !== undefined) {
      return currentStep;
    }

    if (!userStatuses || userStatuses.length === 0) {
      return 1; // Default to first step
    }

    // Check for specific statuses and map to progress steps
    const statuses = userStatuses.map(status => status.toLowerCase().trim());
    
    // Check for KYC Complete
    if (statuses.some(status => 
      status.includes('kyc complete') || 
      status.includes('kyc completed') ||
      status === 'kyc complete'
    )) {
      return 3; // KYC step
    }

    // Check for Plan Selected
    if (statuses.some(status => 
      status.includes('plan selected') || 
      status.includes('emi plan selected') ||
      status === 'plan selected'
    )) {
      return 2; // Select Plan step
    }

    // Check for Agreement Signed
    if (statuses.some(status => 
      status.includes('agreement signed') || 
      status.includes('agreement') ||
      status === 'agreement signed'
    )) {
      return 5; // Authorize step (Agreement Signed)
    }

    // Check for EMI auto-pay setup complete
    if (statuses.some(status => 
      status.includes('emi auto-pay setup complete') || 
      status.includes('autopay setup complete') ||
      status.includes('auto pay setup complete') ||
      status === 'emi auto-pay setup complete'
    )) {
      return 4; // Autopay Setup step
    }

    // Check for KYC in progress or required
    if (statuses.some(status => 
      status.includes('kyc') && (status.includes('progress') || status.includes('required'))
    )) {
      return 2; // Select Plan step (KYC is next)
    }

    // Default to first step if no specific status found
    return 1;
  };

  const activeStep = getCurrentStepFromStatuses();

  // Function to determine if a step is completed based on post-approval data
  const isStepCompleted = (stepIndex: number): boolean => {
    if (!stepCompletion) {
      // Fallback to original logic if no step completion data
      return stepIndex === 0 || (stepIndex + 1) <= activeStep;
    }

    switch (stepIndex) {
      case 0: // Eligibility
        return stepCompletion.eligibility;
      case 1: // Select Plan
        return stepCompletion.selectPlan;
      case 2: // KYC
        return stepCompletion.kyc;
      case 3: // Autopay Setup
        return stepCompletion.autopaySetup;
      case 4: // Authorize
        return stepCompletion.authorize;
      default:
        return false;
    }
  };

  // Function to determine if a step is the current active step
  const isCurrentStep = (stepIndex: number): boolean => {
    if (!stepCompletion) {
      // Fallback to original logic
      return stepIndex + 1 === activeStep;
    }

    // Find the first incomplete step to determine current step
    const steps = [
      stepCompletion.eligibility,
      stepCompletion.selectPlan,
      stepCompletion.kyc,
      stepCompletion.autopaySetup,
      stepCompletion.authorize
    ];

    // Find the first incomplete step
    const firstIncompleteIndex = steps.findIndex(completed => !completed);
    
    // If all steps are complete, the last step is current
    if (firstIncompleteIndex === -1) {
      return stepIndex === steps.length - 1;
    }
    
    // The first incomplete step is the current step
    return stepIndex === firstIncompleteIndex;
  };

  return (
    <div className="w-full bg-gray-50 px-1 sm:px-2 py-1">
      <div className="flex items-center justify-center overflow-x-auto">
        <div style={{justifyContent: "space-around", width:"100%"}} className="flex space-x-0.5 sm:space-x-1 min-w-max">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            // Determine step state based on post-approval data or fallback logic
            const isCompleted = stepCompletion 
              ? isStepCompleted(index)
              : (index === 0 || stepNumber <= activeStep);
            
            const isCurrent = stepCompletion 
              ? isCurrentStep(index)
              : (stepNumber === activeStep);
            
            // Special logic for last step: if it's completed, show as green even if it's current
            const isLastStep = index === steps.length - 1; // Last step (Authorize)
            const shouldShowAsCompleted = isCompleted || (isLastStep && isCurrent && stepCompletion?.authorize);
            
            // Determine classes based on state - responsive padding and text sizes
            let stepClasses = "relative px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold transition-colors flex-shrink-0 text-center";
            
            if (shouldShowAsCompleted) {
              stepClasses += " bg-green-600 text-white";
            } else if (isCurrent) {
              stepClasses += " text-white";
            } else {
              stepClasses += " bg-gray-300 text-gray-600";
            }
            
            // Determine clip-path based on position - smaller arrows for mobile
            let clipPathStyle;
            if (index === 0) {
              // First step - no left arrow
              clipPathStyle = "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)";
            } else {
              // All other steps - both arrows
              clipPathStyle = "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)";
            }
            
            return (
              <div
                key={step}
                className={stepClasses}
                style={{
                  clipPath: clipPathStyle,
                  flex:1,
                  paddingRight : 0,
                  backgroundColor: (isCurrent && !shouldShowAsCompleted) ? '#514c9f' : undefined
                }}
              >
                <span className="whitespace-nowrap text-center">{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
