import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getLoanDetailsByUserId, getBureauDecisionData, updateTreatmentAndLoanAmount, updateProductDetail, BureauDecisionData, BureauEmiPlan, LoanDetailsByUserId } from '../services/loanApi';
import { createSession, sendMessage } from '../services/api';

interface PaymentPlanPopupProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string; // Pass the full URL to extract userId from it
  sessionId?: string; // Pass existing session ID to send message to chat
  onSessionRefresh?: () => void; // Callback to refresh session details after message is sent
}

const PaymentPlanPopup: React.FC<PaymentPlanPopupProps> = ({ 
  isOpen, 
  onClose, 
  url,
  sessionId: propSessionId,
  onSessionRefresh
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loanDetails, setLoanDetails] = useState<LoanDetailsByUserId | null>(null);
  const [bureauDecision, setBureauDecision] = useState<BureauDecisionData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<BureauEmiPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedLoanId, setExtractedLoanId] = useState<string | undefined>(undefined);
  const [extractedUserId, setExtractedUserId] = useState<string | undefined>(undefined);
  const [treatmentAmount, setTreatmentAmount] = useState<number>(0);
  const [isCheckingEmiPlans, setIsCheckingEmiPlans] = useState(false);
  const [hasAmountChanged, setHasAmountChanged] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(propSessionId);

  // Create session when popup opens (only if no sessionId provided)
  useEffect(() => {
    if (isOpen && !propSessionId) {
      createNewSession();
    }
  }, [isOpen, propSessionId]);

  // Update sessionId when propSessionId changes
  useEffect(() => {
    if (propSessionId) {
      setSessionId(propSessionId);
      console.log('PaymentPlanPopup: Using sessionId from props:', propSessionId);
    }
  }, [propSessionId]);

  // Create new session for chat
  const createNewSession = async () => {
    try {
      const session = await createSession();
      if (session.data?.session_id) {
        setSessionId(session.data.session_id);
        console.log('New session created:', session.data.session_id);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  // Initialize data when popup opens
  useEffect(() => {
    if (isOpen) {
      initializeData();
    }
  }, [isOpen]);

  // Initialize treatment amount when loan details are loaded
  useEffect(() => {
    if (loanDetails) {
      setTreatmentAmount(loanDetails.loanAmount);
      setHasAmountChanged(false); // Reset amount changed flag when loan details are loaded
    }
  }, [loanDetails]);

  // Initialize data when popup opens - prioritize localStorage for userId
  const initializeData = () => {
    try {
      // First, try to get userId from localStorage (primary source)
      const userIdFromStorage = localStorage.getItem('userId');
      
      if (userIdFromStorage) {
        console.log('Using userId from localStorage:', userIdFromStorage);
        setExtractedUserId(userIdFromStorage);
        fetchData(userIdFromStorage);
        return;
      }
      
      // If no userId in localStorage, try to extract from URL (fallback)
      if (url) {
        console.log('No userId in localStorage, trying to extract from URL:', url);
        const urlParts = url.split('/');
        const userIdFromUrl = urlParts[urlParts.length - 1]; // Get the last part of the URL
        
        if (userIdFromUrl && userIdFromUrl.length > 10) { // Basic validation that it looks like a userId
          console.log('Extracted userId from URL:', userIdFromUrl);
          setExtractedUserId(userIdFromUrl);
          fetchData(userIdFromUrl);
          return;
        }
      }
      
      // If neither localStorage nor URL has userId, show error
      console.error('No userId found in localStorage or URL');
      setError('User ID not found. Please ensure you are logged in properly.');
      
    } catch (error) {
      console.error('Error initializing data:', error);
      setError('Failed to initialize payment plan data. Please try again.');
    }
  };

  const fetchData = async (userId: string) => {
    if (!userId) {
      console.error('No userId provided to fetchData');
      setError('User ID is required to fetch payment plan data');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Get loan details by userId to extract loanId
      console.log('Step 1: Fetching loan details for userId:', userId);
      const loanDetailsResult = await getLoanDetailsByUserId(userId);
      
      if (!loanDetailsResult) {
        throw new Error('No loan details found for this user. Please ensure the user has an active loan application.');
      }
      
      console.log('Step 1: Loan details received successfully:', {
        loanId: loanDetailsResult.loanId,
        loanAmount: loanDetailsResult.loanAmount,
        doctorId: loanDetailsResult.doctorId
      });
      setLoanDetails(loanDetailsResult);
      
      // Extract loanId from loan details
      const loanId = loanDetailsResult.loanId;
      console.log('Step 1: Extracted loanId from loan details:', loanId);
      setExtractedLoanId(loanId);
      
      if (!loanId) {
        throw new Error('Loan ID not found in loan details. The loan application may not be properly initialized.');
      }
      
      // Step 2: Use the extracted loanId to get bureau decision and EMI plans
      console.log('Step 2: Fetching bureau decision for loanId:', loanId);
      const bureauDecisionResult = await getBureauDecisionData(loanId);
      
      if (!bureauDecisionResult) {
        throw new Error('No bureau decision found for this loan. Please ensure the loan application has been processed.');
      }
      
      console.log('Step 2: Bureau decision received successfully:', {
        emiPlanCount: bureauDecisionResult.emiPlanList?.length || 0,
        creditLimit: bureauDecisionResult.emiPlanList?.[0]?.creditLimitCalculated || 0
      });
      
      setBureauDecision(bureauDecisionResult);

      // Auto-select the first plan if available
      if (bureauDecisionResult?.emiPlanList && bureauDecisionResult.emiPlanList.length > 0) {
        setSelectedPlan(bureauDecisionResult.emiPlanList[0]);
        console.log('Auto-selected first EMI plan:', bureauDecisionResult.emiPlanList[0].productDetailsDO);
      } else {
        console.warn('No EMI plans available in bureau decision');
      }
      
      console.log('Payment plan data loaded successfully');
      
    } catch (err: any) {
      console.error('Error fetching payment plan data:', err);
      setError(err.message || 'Failed to fetch payment plan data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (plan: BureauEmiPlan) => {
    setSelectedPlan(plan);
  };

  const handleContinue = async () => {
    if (selectedPlan && extractedUserId && loanDetails && extractedLoanId) {
      try {
        // Step 1: Update product detail using the new API
        console.log('Updating product detail for loanId:', extractedLoanId, 'with productId:', selectedPlan.productDetailsDO.productId);
        const updateProductResult = await updateProductDetail(
          extractedLoanId,
          selectedPlan.productDetailsDO.productId,
          'user'
        );

        if (!updateProductResult.success) {
          throw new Error(updateProductResult.message || 'Failed to update product detail');
        }

        console.log('Product detail updated successfully:', updateProductResult.message);
        
        // Send detailed message to agent about the selected payment plan
        const agentMessage = `Preferred EMI plan:

Plan: ${selectedPlan.productDetailsDO.totalEmi}/${selectedPlan.productDetailsDO.advanceEmi}\n\n

Effective tenure: ${selectedPlan.productDetailsDO.totalEmi - selectedPlan.productDetailsDO.advanceEmi} months\n\n
EMI amount: ${selectedPlan.emi}\n\n
Treatment Amount: ${treatmentAmount}\n\n
Loan Amount: ${selectedPlan.netLoanAmount}\n\n

`;
        
        console.log('Agent message:', agentMessage);
        
        // Close the popup first
        onClose();
        
        // Send message to chat page after popup closes using setTimeout
        console.log('Current sessionId state:', sessionId);
        console.log('Prop sessionId:', propSessionId);
        
        if (sessionId) {
          console.log('Sending message to session:', sessionId);
          console.log('Message content:', agentMessage);
          
          setTimeout(async () => {
            try {
              console.log('Attempting to send message to session:', sessionId);
              const response = await sendMessage(sessionId, agentMessage);
              console.log('Message sent to chat successfully. Response:', response.data);
              
              // Call session refresh callback to fetch updated chat history
              if (onSessionRefresh) {
                console.log('Calling session refresh callback to fetch updated chat history');
                onSessionRefresh();
              }
            } catch (error: any) {
              console.error('Error sending message to chat:', error);
              console.error('Error details:', error.response?.data || error.message);
            }
          }, 100); // Small delay to ensure popup is closed
        } else {
          console.warn('No sessionId available, cannot send message to chat');
          console.warn('Available sessionId sources:', { propSessionId, sessionId });
        }
      } catch (error) {
        console.error('Error updating product detail:', error);
        setError('Error updating product detail. Please try again.');
      }
    }
  };

  const handleCheckEmiPlans = async () => {
    if (!extractedUserId || !loanDetails || !extractedLoanId) {
      setError('User ID, loan details, or loan ID not available');
      return;
    }

    setIsCheckingEmiPlans(true);
    setError(null);

    try {
      // Clear previous payment plans and selection immediately
      setBureauDecision(null);
      setSelectedPlan(null);

      // Step 1: Update treatment and loan amount using the new API
      console.log('Updating treatment and loan amount for loanId:', extractedLoanId, 'with amount:', treatmentAmount);
      const updateResult = await updateTreatmentAndLoanAmount(
        extractedLoanId,
        treatmentAmount,
        treatmentAmount, // Using treatment amount as loan amount
        'user'
      );

      if (!updateResult.success) {
        throw new Error(updateResult.message || 'Failed to update treatment and loan amount');
      }

      console.log('Treatment and loan amount updated successfully:', updateResult.message);

      // Step 3: Fetch updated bureau decision with new treatment amount
      console.log('Fetching new bureau decision for loanId:', extractedLoanId);
      const bureauDecisionResult = await getBureauDecisionData(extractedLoanId);
      
      if (bureauDecisionResult && bureauDecisionResult.emiPlanList && bureauDecisionResult.emiPlanList.length > 0) {
        console.log('New EMI plans received:', bureauDecisionResult.emiPlanList.length, 'plans available');
        setBureauDecision(bureauDecisionResult);
        
        // Reset selected plan when new plans are loaded
        setSelectedPlan(bureauDecisionResult.emiPlanList[0]);
        
        // Keep hasAmountChanged as true to show the new results section
        // This will display the "New EMI Plan Results Section" instead of the legacy section
        console.log('New EMI plans loaded successfully for updated treatment amount');
      } else {
        throw new Error('No new EMI plans available for the updated treatment amount. Please try a different amount.');
      }

    } catch (err: any) {
      console.error('Error checking EMI plans:', err);
      setError(err.message || 'Failed to check EMI plans');
      
      // Restore previous state on error
      if (extractedLoanId) {
        try {
          console.log('Attempting to restore previous bureau decision...');
          const previousBureauDecision = await getBureauDecisionData(extractedLoanId);
          if (previousBureauDecision) {
            setBureauDecision(previousBureauDecision);
            if (previousBureauDecision.emiPlanList && previousBureauDecision.emiPlanList.length > 0) {
              setSelectedPlan(previousBureauDecision.emiPlanList[0]);
            }
            console.log('Previous state restored successfully');
          }
        } catch (restoreError) {
          console.error('Failed to restore previous state:', restoreError);
        }
      }
    } finally {
      setIsCheckingEmiPlans(false);
    }
  };

  const handleTreatmentAmountChange = (newAmount: number) => {
    setTreatmentAmount(newAmount);
    // Check if amount has changed from the original loan amount
    if (loanDetails && Math.abs(newAmount - loanDetails.loanAmount) > 0) {
      setHasAmountChanged(true);
      // Clear selected plan when amount changes
      setSelectedPlan(null);
    } else {
      setHasAmountChanged(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatEMIAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (!isOpen) return null;

    return (
    <>
      <style>
        {`
          .payment-plan-scroll::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
        
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ease-out">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-full max-h-[95vh] overflow-hidden">


          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 text-lg">
                  {!extractedUserId ? 'Extracting user ID...' : 
                   !extractedLoanId ? 'Loading loan details...' : 'Loading payment plans...'}
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-red-600 text-lg mb-2">Error loading payment plan data</p>
                <p className="text-gray-600 text-center max-w-md">{error}</p>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      if (extractedUserId) {
                        fetchData(extractedUserId);
                      } else {
                        initializeData();
                      }
                    }}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#514c9f' }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
                        ) : (
              <div className="space-y-6">
                {/* Treatment Amount Input */}
                {loanDetails && (
                  <div className="space-y-3">
                    <label className="block text-lg font-bold text-gray-900">
                      Enter treatment amount
                    </label>
                    <div className="rounded-xl p-4" style={{ backgroundColor: '#f3f2ff' }}>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-gray-900 mr-2">₹</span>
                        <input
                          type="number"
                          value={treatmentAmount}
                          onChange={(e) => handleTreatmentAmountChange(parseFloat(e.target.value) || 0)}
                          className="flex-1 text-left text-2xl font-bold text-gray-900 bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Enter amount"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Credit Limit Display */}
                {bureauDecision?.emiPlanList && bureauDecision.emiPlanList.length > 0 && (
                  <div className="bg-green-100 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">Max Gross Treatment Amount:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(Math.max(...bureauDecision.emiPlanList.map(plan => plan.grossTreatmentAmount)))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Check EMI Plans Button */}
                <div className="text-center">
                  <button
                    onClick={handleCheckEmiPlans}
                    disabled={isCheckingEmiPlans || !loanDetails}
                    className={`w-full px-6 py-3 rounded-xl font-medium text-white transition-colors ${
                      isCheckingEmiPlans || !loanDetails
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'hover:opacity-90'
                    }`}
                    style={{
                      backgroundColor: isCheckingEmiPlans || !loanDetails ? undefined : '#514c9f'
                    }}
                  >
                    {isCheckingEmiPlans ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Checking EMI Plans...</span>
                      </div>
                    ) : (
                      'Check EMI plans'
                    )}
                  </button>
                </div>

                                {/* Select Preferred Payment Plan - Only show when amount hasn't changed */}
                {bureauDecision?.emiPlanList && bureauDecision.emiPlanList.length > 0 && !hasAmountChanged && !isCheckingEmiPlans && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Select preferred payment plan:</h3>
                    
                    <div className="relative">
                      <div 
                        className="flex overflow-x-auto gap-4 pb-2 -mx-6 px-6 snap-x snap-mandatory payment-plan-scroll"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >
                        {bureauDecision.emiPlanList.map((plan, index) => (
                          <div
                            key={`original-${index}`}
                            onClick={() => handlePlanSelect(plan)}
                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 flex-shrink-0 min-w-[200px] snap-start ${
                              selectedPlan === plan
                                ? 'border-blue-500 bg-blue-50 shadow-lg'
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-xl font-bold text-blue-600 mb-2">
                                {plan.productDetailsDO.totalEmi}/{plan.productDetailsDO.advanceEmi}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                {plan.productDetailsDO.advanceEmi} Advance EMIs
                              </div>
                              <div className="text-sm text-gray-500">
                                Pay over {plan.productDetailsDO.totalEmi-plan.productDetailsDO.advanceEmi} months
                              </div>
                            </div>
                            
                            {selectedPlan === plan && (
                              <div className="mt-3 flex justify-center">
                                <CheckCircle className="h-6 w-6 text-blue-600" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Scroll indicator dots */}
                      {bureauDecision.emiPlanList.length > 3 && (
                        <div className="flex justify-center mt-4 space-x-2">
                          {Array.from({ length: Math.ceil(bureauDecision.emiPlanList.length / 3) }).map((_, index) => (
                            <div
                              key={index}
                              className="w-2 h-2 bg-gray-300 rounded-full"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}



                {/* New EMI Plan Results Section - Shows after checking EMI plans with new amount */}
                {bureauDecision?.emiPlanList && bureauDecision.emiPlanList.length > 0 && hasAmountChanged && !isCheckingEmiPlans && (
                  <div className="space-y-4">
                    {/* New EMI Plans Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">New payment plans available:</h3>
                      
                      <div className="relative">
                        <div 
                          className="flex overflow-x-auto gap-4 pb-2 -mx-6 px-6 snap-x snap-mandatory payment-plan-scroll"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                          }}
                        >
                          {bureauDecision.emiPlanList.map((plan, index) => (
                            <div
                              key={`new-${index}`}
                              onClick={() => handlePlanSelect(plan)}
                              className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 flex-shrink-0 min-w-[200px] snap-start ${
                                selectedPlan === plan
                                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                              }`}
                            >
                              <div className="text-center">
                                <div className="text-xl font-bold text-blue-600 mb-2">
                                  {plan.productDetailsDO.totalEmi}/{plan.productDetailsDO.advanceEmi}
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                  {plan.productDetailsDO.advanceEmi} Advance EMIs
                                </div>
                                <div className="text-sm text-gray-500">
                                  Pay over {plan.productDetailsDO.totalEmi} months
                                </div>
                              </div>
                              
                              {selectedPlan === plan && (
                                <div className="mt-3 flex justify-center">
                                  <CheckCircle className="h-6 w-6 text-blue-600" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Scroll indicator dots */}
                        {bureauDecision.emiPlanList.length > 3 && (
                          <div className="flex justify-center mt-4 space-x-2">
                            {Array.from({ length: Math.ceil(bureauDecision.emiPlanList.length / 3) }).map((_, index) => (
                              <div
                                key={`new-dots-${index}`}
                                className="w-2 h-2 bg-gray-300 rounded-full"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading EMI Plans Message */}
                {isCheckingEmiPlans && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <div className="text-blue-800">
                        <p className="font-medium">Updating payment plans...</p>
                        <p className="text-sm">Please wait while we fetch new EMI options</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Plan Summary */}
                {selectedPlan && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      {selectedPlan.productDetailsDO.advanceEmi} Advance EMIs, {selectedPlan.productDetailsDO.totalEmi} monthly.
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Treatment amount</span>
                        <span className="font-medium text-gray-900">{formatCurrency(treatmentAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Advance amount</span>
                        <span className="font-medium text-gray-900">{formatCurrency(selectedPlan.productDetailsDO.advanceEmi * selectedPlan.emi)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Additional down Payment</span>
                        <span className="font-medium text-gray-900">{formatCurrency(selectedPlan.downPayment)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">You are borrowing</span>
                        <span className="font-medium text-gray-900">{formatCurrency(selectedPlan.netLoanAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">You will repay in</span>
                        <span className="font-medium text-gray-900">{selectedPlan.productDetailsDO.totalEmi - selectedPlan.productDetailsDO.advanceEmi} EMIs</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">EMI amount</span>
                        <span className="font-medium text-gray-900">{formatEMIAmount(selectedPlan.emi)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Interest</span>
                        <span className="font-medium text-gray-900">{selectedPlan.productDetailsDO.interest}% per month</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Processing fees</span>
                        <span className="font-medium text-gray-900">₹ {Math.round(selectedPlan.grossTreatmentAmount * selectedPlan.productDetailsDO.processingFesIncludingGSTRate / 100).toLocaleString()} ({selectedPlan.productDetailsDO.processingFesIncludingGSTRate}%)</span>
                      </div>
                      
                      <div className="text-sm text-gray-500 italic mt-3">
                        Will be added to the 1st EMI.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isLoading && !error && selectedPlan && (
            <div className="bg-gray-50 px-6 py-4 mb-4 rounded-b-3xl border-t">
              <div className="flex justify-center">
                <button
                  onClick={handleContinue}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-medium"
                  style={{ backgroundColor: '#514c9f' }}
                >
                  Continue with Payment Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentPlanPopup;
