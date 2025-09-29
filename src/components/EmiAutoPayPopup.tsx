import React, { useState, useEffect } from 'react';
import { 
  getAccountInfoByUserId, 
  addAccountDetails, 
  // pennyDrop, // DISABLED FOR NOW
  getDigioMandateBankDetail,
  getUserLoanAndProductDetail,
  createMandateRequest,
  AddAccountDetailsPayload,
  DigioMandateBankDetailData,
  UserLoanAndProductDetailData
} from '../services/postApprovalApi';
import { Digio, DigioOptions, DigioResponse } from '../types/digio';

interface EmiAutoPayPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  loanId: string;
  onSuccess?: () => void;
}

interface IFSCDetails {
  MICR: string | null;
  BRANCH: string;
  ADDRESS: string;
  STATE: string;
  CONTACT: string;
  UPI: boolean;
  RTGS: boolean;
  CITY: string;
  CENTRE: string;
  DISTRICT: string;
  NEFT: boolean;
  IMPS: boolean;
  SWIFT: string | null;
  ISO3166: string;
  BANK: string;
  BANKCODE: string;
  IFSC: string;
}

type ScreenType = 'intro' | 'bankDetails' | 'confirmation' | 'paymentMethods';

const EmiAutoPayPopup: React.FC<EmiAutoPayPopupProps> = ({
  isOpen,
  onClose,
  userId,
  loanId,
  onSuccess
}) => {
  // Always start with intro screen - flow is always: intro → bank details → confirmation → payment methods
  // CRITICAL: Even if account details API returns success AND IFSC validation is successful,
  // user must still go through ALL screens - NO SKIPPING ALLOWED
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('intro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Bank details form state
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [nameAsBankAccount, setNameAsBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [ifscDetails, setIfscDetails] = useState<IFSCDetails | null>(null);
  const [ifscLoading, setIfscLoading] = useState(false);
  
  // API data state
  const [mandateBankDetails, setMandateBankDetails] = useState<DigioMandateBankDetailData | null>(null);
  const [loanAndProductDetails, setLoanAndProductDetails] = useState<UserLoanAndProductDetailData | null>(null);
  const [mandateLoading, setMandateLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'NACH' | null>(null);
  const [digioInstance, setDigioInstance] = useState<Digio | null>(null);

  // Reset screen flow when popup opens - always start with intro
  useEffect(() => {
    if (isOpen) {
      setCurrentScreen('intro');
      setSelectedPaymentMethod(null);
    }
  }, [isOpen]);

  // Load existing account info on component mount
  useEffect(() => {
    if (isOpen && userId) {
      loadAccountInfo();
    }
  }, [isOpen, userId]);

  // Load loan and product details when payment methods screen is shown
  useEffect(() => {
    if (currentScreen === 'paymentMethods' && userId && !loanAndProductDetails) {
      loadLoanAndProductDetails();
    }
  }, [currentScreen, userId, loanAndProductDetails]);

  // Auto-validate IFSC code when it changes and is 11 characters
  useEffect(() => {
    if (ifscCode && ifscCode.length === 11 && !ifscDetails && !ifscLoading) {
      validateIFSC(ifscCode);
    }
  }, [ifscCode, ifscDetails, ifscLoading]);

  // Cleanup Digio instance on component unmount
  useEffect(() => {
    return () => {
      if (digioInstance) {
        try {
          digioInstance.cancel();
        } catch (error) {
          console.warn('Error canceling Digio instance:', error);
        }
      }
    };
  }, [digioInstance]);

  // Handle URL parameters when returning from Digio redirection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const txnId = urlParams.get('txn_id');
    const digioDocId = urlParams.get('digio_doc_id');
    const errorCode = urlParams.get('error_code');
    
    if (txnId || digioDocId || errorCode) {
      console.log('Digio redirection response:', { txnId, digioDocId, errorCode });
      
      if (errorCode) {
        setError(`Mandate setup failed: ${urlParams.get('message') || 'Unknown error'}`);
        setMandateLoading(false);
      } else if (txnId && digioDocId) {
        // Success case
        console.log('Mandate setup completed successfully via redirection');
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onSuccess, onClose]);

  const loadAccountInfo = async () => {
    try {
      setLoading(true);
      const result = await getAccountInfoByUserId(userId);
      if (result.success && result.data) {
        // Auto-fill form with existing data (but NEVER change screen - always follow sequential flow)
        setAccountNumber(result.data.accountNumber || '');
        setConfirmAccountNumber(result.data.accountNumber || '');
        setNameAsBankAccount(result.data.nameAsBankAccount || '');
        setIfscCode(result.data.ifscCode || '');
        
        // Auto-fill form with existing account info
        if (result.data.accountNumber && result.data.nameAsBankAccount && result.data.ifscCode) {
          console.log('Existing account info found, auto-filling form - but user must still go through all screens');
          
          // Automatically validate IFSC code if it exists and is 11 characters
          // CRITICAL: Even if account details and IFSC validation are successful, 
          // user must still go through all screens: intro → bank details → confirmation → payment methods
          // NO SCREEN SKIPPING ALLOWED
          if (result.data.ifscCode && result.data.ifscCode.length === 11) {
            console.log('Auto-validating existing IFSC code:', result.data.ifscCode);
            await validateIFSC(result.data.ifscCode);
          }
        }
      }
    } catch (error) {
      console.error('Error loading account info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLoanAndProductDetails = async () => {
    try {
      setLoading(true);
      const result = await getUserLoanAndProductDetail(userId);
      if (result.success && result.data) {
        setLoanAndProductDetails(result.data);
        console.log('Loan and product details loaded:', result.data);
      }
    } catch (error) {
      console.error('Error loading loan and product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDigioSDK = (redirectUrl?: string) => {
    if (typeof window !== 'undefined' && window.Digio) {
      const options: DigioOptions = {
        environment: 'production',
        callback: (response: DigioResponse) => {
          console.log('Digio callback response:', response);
          
          if (response.error_code) {
            console.error('Digio error occurred:', response.error_code);
            setError(`Mandate setup failed: ${response.message || 'Unknown error'}`);
            setMandateLoading(false);
            return;
          }
          
          // Success case
          console.log('Mandate setup completed successfully:', response);
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        },
        logo: 'https://carepay.money/static/media/CarepayLogo1.9e97fd1b1ac4690ac40e.webp', // Using CarePay logo
        theme: {
          primaryColor: '#514c9f', // CarePay primary color
          secondaryColor: '#3d3a7a' // CarePay secondary color
        },
        is_redirection_approach: true, // Using redirection approach
        redirect_url: redirectUrl || window.location.origin // Redirect back to current page
      };
      
      console.log('Digio SDK options with logo:', {
        logo: options.logo,
        theme: options.theme,
        environment: options.environment,
        is_redirection_approach: options.is_redirection_approach
      });
      
      const digio = new window.Digio(options);
      setDigioInstance(digio);
      return digio;
    } else {
      console.error('Digio SDK not loaded');
      setError('Digio SDK not available. Please refresh the page and try again.');
      return null;
    }
  };

  const validateIFSC = async (ifsc: string) => {
    if (ifsc.length !== 11) return;
    
    try {
      setIfscLoading(true);
      const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
      if (response.ok) {
        const data: IFSCDetails = await response.json();
        setIfscDetails(data);
        setError(null);
        // CRITICAL: Successful IFSC validation only enables the setup button, 
        // it does NOT skip any screens - user must still go through all steps
        // NO SCREEN CHANGES ALLOWED FROM THIS FUNCTION
        console.log('IFSC validation successful - but user must still go through all screens');
      } else {
        setIfscDetails(null);
        setError('Invalid IFSC code');
      }
    } catch (error) {
      setIfscDetails(null);
      setError('Failed to validate IFSC code');
    } finally {
      setIfscLoading(false);
    }
  };

  const handleIFSCChange = (value: string) => {
    setIfscCode(value.toUpperCase());
    if (value.length === 11) {
      validateIFSC(value);
    } else {
      setIfscDetails(null);
      setError(null);
    }
  };

  const handleProceedToSetup = () => {
    setCurrentScreen('bankDetails');
  };

  const handleConfirmationOkay = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load mandate bank details for payment methods screen
      const mandateResult = await getDigioMandateBankDetail(userId);
      if (mandateResult.success && mandateResult.data) {
        setMandateBankDetails(mandateResult.data);
      }
      
      setCurrentScreen('paymentMethods');
    } catch (error: any) {
      setError(error.message || 'An error occurred while loading payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAccount = () => {
    setCurrentScreen('bankDetails');
  };

  const handleBankDetailsSubmit = async () => {
    if (!accountNumber || !confirmAccountNumber || !nameAsBankAccount || !ifscCode) {
      setError('Please fill all required fields');
      return;
    }

    if (accountNumber !== confirmAccountNumber) {
      setError('Account numbers do not match');
      return;
    }

    if (!ifscDetails) {
      setError('Please enter a valid IFSC code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add account details
      const accountPayload: AddAccountDetailsPayload = {
        userId,
        accountNumber,
        accountType: 'Savings',
        bankBranch: ifscDetails.BRANCH,
        bankName: ifscDetails.BANK,
        formStatus: '',
        ifscCode,
        nameAsBankAccount
      };

      const addAccountResult = await addAccountDetails(accountPayload);
      if (!addAccountResult.success) {
        throw new Error(addAccountResult.message || 'Failed to add account details');
      }

      // Perform penny drop verification - DISABLED FOR NOW
      // const pennyDropResult = await pennyDrop(loanId, userId);
      // if (!pennyDropResult.success) {
      //   throw new Error(pennyDropResult.message || 'Penny drop verification failed');
      // }

      // Go to confirmation screen instead of directly to payment methods
      setCurrentScreen('confirmation');
    } catch (error: any) {
      setError(error.message || 'An error occurred while setting up account');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = async (method: 'UPI' | 'NACH') => {
    try {
      setSelectedPaymentMethod(method);
      setMandateLoading(true);
      setError(null);
      
      // Map payment method to mandate type
      const mandateType = method === 'UPI' ? 'upi' : 'api';
      
      console.log('Creating mandate request for:', { loanId, mandateType });
      
      const result = await createMandateRequest(loanId, mandateType);
      
      if (result.success && result.data) {
        console.log('Mandate created successfully:', result.data);
        console.log('Parsed data:', result.parsedData);
        
        // Initialize Digio SDK if not already done
        let digio = digioInstance;
        if (!digio) {
          digio = initializeDigioSDK();
        }
        
        if (digio && result.data) {
          // Extract documentId, identifier, and token from the API response
          const documentId = result.data.mandateId; // mandateId is the documentId
          const identifier = result.data.phoneNumber; // phoneNumber is the customer identifier
          
          // Validate required fields
          if (!documentId || !identifier) {
            throw new Error('Missing required mandate data: documentId or phoneNumber');
          }
          
          // Try to get token from parsed data, fallback to null if not available
          let tokenId = null;
          if (result.parsedData && result.parsedData.access_token) {
            tokenId = result.parsedData.access_token.id;
          }
          
          console.log('Starting Digio mandate process:', { documentId, identifier, tokenId });
          
          // Initialize the Digio popup
          digio.init();
          
          // Submit the mandate for signing (with or without token)
          if (tokenId) {
            digio.submit(documentId, identifier, tokenId);
          } else {
            digio.submit(documentId, identifier);
          }
        } else {
          // Fallback to direct URL redirect if Digio SDK is not available
          if (result.data.authenticationUrl) {
            window.open(result.data.authenticationUrl, '_blank');
            if (onSuccess) {
              onSuccess();
            }
            onClose();
          } else {
            throw new Error('No authentication URL available');
          }
        }
      } else {
        throw new Error(result.message || 'Failed to create mandate request');
      }
    } catch (error: any) {
      console.error('Error creating mandate request:', error);
      setError(error.message || 'Failed to create mandate request');
      setMandateLoading(false);
    }
  };

  const renderIntroScreen = () => (
    <div className="p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">EMI auto payment</h2>
        <p className="text-gray-600 mb-6">
          This setup will automatically pay the EMI amount from your bank account on the due date.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">To ensure:</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-gray-700">Timely repayment of your EMIs.</span>
          </div>
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-gray-700">Improvement of your credit score.</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleProceedToSetup}
        className="w-full text-white py-3 px-6 rounded-lg font-semibold transition-colors"
        style={{
          background: 'linear-gradient(135deg, #514c9f 0%, #3d3a7a 100%)',
          boxShadow: '0 4px 6px rgba(81, 76, 159, 0.3)'
        }}
      >
        Proceed to setup
      </button>
    </div>
  );

  const renderBankDetailsScreen = () => (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Bank details for EMI autopay</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter account number
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': '#514c9f' } as React.CSSProperties}
            placeholder="Enter your account number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm the account number
          </label>
          <input
            type="text"
            value={confirmAccountNumber}
            onChange={(e) => setConfirmAccountNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': '#514c9f' } as React.CSSProperties}
            placeholder="Confirm your account number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name as on your bank account
          </label>
          <input
            type="text"
            value={nameAsBankAccount}
            onChange={(e) => setNameAsBankAccount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': '#514c9f' } as React.CSSProperties}
            placeholder="Enter name as on bank account"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IFSC Code
          </label>
          <input
            type="text"
            value={ifscCode}
            onChange={(e) => handleIFSCChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': '#514c9f' } as React.CSSProperties}
            placeholder="Enter IFSC code"
            maxLength={11}
          />
          {ifscLoading && (
            <p className="text-sm text-blue-600 mt-1">Validating IFSC code...</p>
          )}
          {ifscDetails && (
            <div className="mt-2 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>{ifscDetails.BANK}</strong> - {ifscDetails.BRANCH}
              </p>
              <p className="text-xs text-green-600">{ifscDetails.ADDRESS}</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleBankDetailsSubmit}
          disabled={loading || !ifscDetails || !accountNumber || !confirmAccountNumber || !nameAsBankAccount || ifscLoading}
          className="w-full text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #514c9f 0%, #3d3a7a 100%)',
            boxShadow: '0 4px 6px rgba(81, 76, 159, 0.3)'
          }}
        >
          {loading ? 'Processing...' : ifscLoading ? 'Validating IFSC...' : 'Proceed to Setup'}
        </button>
      </div>
    </div>
  );

  const renderConfirmationScreen = () => (
    <div className="p-6">
      <div className="text-center mb-8">
        <p className="text-lg font-medium text-gray-900 mb-6">
          Auto-debit of EMIs will happen from this account. Make sure that this is your primary income account.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleConfirmationOkay}
          disabled={loading}
          className="w-full text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #514c9f 0%, #3d3a7a 100%)',
            boxShadow: '0 4px 6px rgba(81, 76, 159, 0.3)'
          }}
        >
          {loading ? 'Loading...' : 'Okay'}
        </button>
        
        <button
          onClick={handleChangeAccount}
          disabled={loading}
          className="w-full py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2"
          style={{
            color: '#514c9f',
            borderColor: '#514c9f',
            backgroundColor: 'rgba(81, 76, 159, 0.1)'
          }}
        >
          Change account
        </button>
      </div>
    </div>
  );

  const renderPaymentMethodsScreen = () => (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">EMI Auto Payment</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      <div className="space-y-4 mb-6">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(81, 76, 159, 0.1)' }}>
          <p className="text-sm text-gray-600 mb-2">Automatic EMI payments will happen to</p>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'rgba(81, 76, 159, 0.2)' }}>
              <svg className="w-5 h-5" style={{ color: '#514c9f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Findoc</p>
              <p className="text-sm text-gray-600">Findoc Finvest Pvt. Ltd.</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Automatic EMI payments will happen to</p>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">EMI Schedule</p>
              <p className="text-sm text-gray-600">31st of every month</p>
              <p className="text-xs text-gray-500">Starting from</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Your auto-debit will be processed by Digiotech Solutions Pvt. Ltd.
      </p>

      <div className="space-y-4">
        {mandateBankDetails?.esignMandate && (
          <button
            onClick={() => handlePaymentMethodSelect('UPI')}
            disabled={mandateLoading}
            className="w-full p-4 rounded-lg border text-left hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'rgba(81, 76, 159, 0.1)', borderColor: 'rgba(81, 76, 159, 0.3)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold mb-1" style={{ color: '#514c9f' }}>Proceed with UPI</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Setup auto-debit via Google Pay, PhonePe, UPI ID, or other UPI apps.
                </p>
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-xs font-medium">Faster process</span>
                </div>
              </div>
              <div className="ml-4 p-2 rounded-full" style={{ color: '#514c9f', backgroundColor: 'rgba(81, 76, 159, 0.1)' }}>
                {mandateLoading && selectedPaymentMethod === 'UPI' ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        )}

        {mandateBankDetails?.physicalMandate && (
          <button
            onClick={() => handlePaymentMethodSelect('NACH')}
            disabled={mandateLoading}
            className="w-full p-4 rounded-lg border text-left hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'rgba(81, 76, 159, 0.1)', borderColor: 'rgba(81, 76, 159, 0.3)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold mb-1" style={{ color: '#514c9f' }}>Proceed with NACH Mandate</h3>
                <p className="text-sm text-gray-600 mb-2">
                  More options to setup auto-debit:
                </p>
                <div className="flex flex-wrap gap-1">
                  {mandateBankDetails.allowedAuthSubType.map((authType, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white text-xs text-gray-600 rounded border"
                    >
                      {authType.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ml-4 p-2 rounded-full" style={{ color: '#514c9f', backgroundColor: 'rgba(81, 76, 159, 0.1)' }}>
                {mandateLoading && selectedPaymentMethod === 'NACH' ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-semibold text-gray-900">EMI Auto Pay Setup</h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {currentScreen === 'intro' && renderIntroScreen()}
        {currentScreen === 'bankDetails' && renderBankDetailsScreen()}
        {currentScreen === 'confirmation' && renderConfirmationScreen()}
        {currentScreen === 'paymentMethods' && renderPaymentMethodsScreen()}
      </div>
    </div>
  );
};

export default EmiAutoPayPopup;
