import { getLoanStatusWithUserStatus } from '../services/loanApi';
import { getPostApprovalStatus, PostApprovalStatusData } from '../services/postApprovalApi';

/**
 * Utility function to get user statuses for progress bar
 * @param loanId - The loan ID to fetch statuses for
 * @returns Promise with array of user status strings
 */
export const getUserStatusesForProgress = async (loanId: string): Promise<string[]> => {
  try {
    const statusData = await getLoanStatusWithUserStatus(loanId);
    return statusData.map(item => item.userStatus);
  } catch (error) {
    console.error('Error fetching user statuses for progress:', error);
    return [];
  }
};

/**
 * Function to determine current step based on user statuses
 * @param userStatuses - Array of user status strings
 * @returns Current step number (1-5)
 */
export const getCurrentStepFromUserStatuses = (userStatuses: string[]): number => {
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

/**
 * Function to get post-approval status for progress bar
 * @param loanId - The loan ID to fetch post-approval status for
 * @returns Promise with post-approval status data or null
 */
export const getPostApprovalStatusForProgress = async (loanId: string): Promise<PostApprovalStatusData | null> => {
  try {
    const result = await getPostApprovalStatus(loanId);
    return result.success ? result.data || null : null;
  } catch (error) {
    console.error('Error fetching post-approval status for progress:', error);
    return null;
  }
};

/**
 * Function to determine which steps are completed based on post-approval status and user statuses
 * @param postApprovalData - Post-approval status data
 * @param userStatuses - Array of user status strings to check for EMI plan selection
 * @returns Object with completion status for each step
 */
export const getStepCompletionFromPostApproval = (postApprovalData: PostApprovalStatusData | null, userStatuses: string[] = []) => {
  if (!postApprovalData) {
    return {
      eligibility: true, // Always completed
      selectPlan: false,
      kyc: false,
      autopaySetup: false,
      authorize: false
    };
  }

  // Check if EMI plan has been selected by looking at user statuses
  const hasEmiPlanSelected = userStatuses.some(status => 
    status.toLowerCase().includes('emi plan selected') || 
    status.toLowerCase().includes('plan selected')
  );

  return {
    eligibility: true, // Always completed
    selectPlan: hasEmiPlanSelected, // Only green when EMI plan is actually selected
    kyc: postApprovalData.selfie, // KYC is green when selfie is true
    autopaySetup: postApprovalData.auto_pay, // Autopay Setup is green when auto_pay is true
    authorize: postApprovalData.agreement_setup // Authorize is green when agreement_setup is true
  };
};

/**
 * Function to determine current step based on post-approval status
 * @param postApprovalData - Post-approval status data
 * @returns Current step number (1-5)
 */
export const getCurrentStepFromPostApproval = (postApprovalData: PostApprovalStatusData | null): number => {
  if (!postApprovalData) {
    return 1; // Default to first step
  }

  // If all post-approval requirements are complete, we're at the final step
  if (postApprovalData.selfie && postApprovalData.agreement_setup && postApprovalData.auto_pay && postApprovalData.aadhaar_verified) {
    return 5; // All steps completed
  }

  // Determine current step based on what's completed
  if (postApprovalData.agreement_setup) {
    return 5; // Authorize step
  }
  
  if (postApprovalData.auto_pay) {
    return 4; // Autopay Setup step
  }
  
  if (postApprovalData.selfie) {
    return 3; // KYC step
  }

  // Default to Select Plan step if we have post-approval data but no specific completions
  return 2;
};

/**
 * Hook-like function to manage progress bar state with post-approval integration
 * @param loanId - The loan ID
 * @returns Object with userStatuses, currentStep, postApprovalData, and stepCompletion
 */
export const useProgressBarState = async (loanId: string) => {
  const userStatuses = await getUserStatusesForProgress(loanId);
  const postApprovalData = await getPostApprovalStatusForProgress(loanId);
  
  // Use post-approval data if available, otherwise fall back to user statuses
  const currentStep = postApprovalData 
    ? getCurrentStepFromPostApproval(postApprovalData)
    : getCurrentStepFromUserStatuses(userStatuses);
  
  const stepCompletion = getStepCompletionFromPostApproval(postApprovalData, userStatuses);
  
  return {
    userStatuses,
    currentStep,
    postApprovalData,
    stepCompletion
  };
};
