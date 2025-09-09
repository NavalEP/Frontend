

const generateDisbursalOrderReceipt = (disbursalOrderData: any) => {
  return (
    <div style={{
      margin: 0,
      padding: '0.1rem',
      boxSizing: 'border-box',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      backgroundColor: '#fffbf9',
      width: '100%',
      maxWidth: '100%',
      boxShadow: '0 0 20px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#514c9f',
          color: 'white',
          padding: '0.8rem 1.5rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            marginBottom: '0.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'end',
              gap: '0.25rem'
            }}>
              <img 
                src="/images/Carepay full white logo.png" 
                alt="CarePay" 
                style={{
                  height: '20px',
                  width: 'auto',
                  objectFit: 'contain'
                }}
              />
            </div>
            <div style={{
              fontSize: '0.8rem',
              opacity: '0.95'
            }}>
              support@carepay.money
            </div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              letterSpacing: '0.03em'
            }}>
              Disbursal Order
            </div>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              ID: {disbursalOrderData.id}
            </div>
          </div>
        </div>

        {/* Recipient Banner */}
        <div style={{
          backgroundColor: '#ffb47d',
          padding: '0.5rem 1.5rem',
          fontSize: '0.85rem',
          fontWeight: '600',
          color: '#2c2c2c',
          wordBreak: 'break-word'
        }}>
          To - {disbursalOrderData.merchantName}
        </div>

        {/* Main Content */}
        <div style={{
          padding: '1rem 1.5rem'
        }}>
          {/* Patient and Date Info */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
              flex: '1',
              minWidth: '150px'
            }}>
              <div style={{
                fontSize: '0.8rem',
                color: '#2c2c2c',
                fontWeight: '600',
                marginBottom: '0.1rem'
              }}>
                Patient name
              </div>
              <div style={{
                fontSize: '1.3rem',
                color: '#2c2c2c',
                fontWeight: '300',
                lineHeight: '1.2',
                letterSpacing: '0.05rem',
                wordBreak: 'break-word'
              }}>
                {disbursalOrderData.patientName}
              </div>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
              textAlign: 'right',
              alignItems: 'flex-end',
              flex: '0 0 auto'
            }}>
              <div style={{
                fontSize: '0.8rem',
                color: '#2c2c2c',
                fontWeight: '600',
                marginBottom: '0.1rem'
              }}>
                Disbursed on
              </div>
              <div style={{
                fontSize: '1.3rem',
                color: '#2c2c2c',
                fontWeight: '300',
                lineHeight: '1.2',
                letterSpacing: '0.05rem'
              }}>
                {disbursalOrderData.disbursedOn}
              </div>
            </div>
          </div>

          {/* Treatment Info */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              fontSize: '0.8rem',
              color: '#2c2c2c',
              fontWeight: '600',
              marginBottom: '0.1rem'
            }}>
              Treatment name
            </div>
            <div style={{
              fontSize: '1.3rem',
              color: '#2c2c2c',
              fontWeight: '300',
              lineHeight: '1.2',
              letterSpacing: '0.05rem',
              wordBreak: 'break-word'
            }}>
              {disbursalOrderData.treatmentName}
            </div>
          </div>

          {/* Customer Details Section */}
          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#2c2c2c',
            textAlign: 'center',
            margin: '1rem -1.5rem 0.8rem -1.5rem',
            padding: '0.5rem 1.5rem',
            background: 'linear-gradient(90deg, #fffbf9 0%, #ecebff 50%, #fffbf9 100%)'
          }}>
            Customer details
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.15rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.2rem 0',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                flex: '1',
                minWidth: '120px'
              }}>
                Customer name
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                textAlign: 'right',
                wordBreak: 'break-word'
              }}>
                {disbursalOrderData.patientName}
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.2rem 0',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                flex: '1',
                minWidth: '120px'
              }}>
                Contact number
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                textAlign: 'right'
              }}>
                +91 {disbursalOrderData.customerNumber}
              </div>
            </div>
          </div>

          {/* Transaction Details Section */}
          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#2c2c2c',
            textAlign: 'center',
            margin: '1rem -1.5rem 0.8rem -1.5rem',
            padding: '0.5rem 1.5rem',
            background: 'linear-gradient(90deg, #fffbf9 0%, #ecebff 50%, #fffbf9 100%)'
          }}>
            Transaction details
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.15rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.2rem 0',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '600',
                flex: '1',
                minWidth: '120px'
              }}>
                Transaction amount
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '600',
                textAlign: 'right'
              }}>
                Rs. {disbursalOrderData.transactionAmount}
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.2rem 0',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                flex: '1',
                minWidth: '120px'
              }}>
                Payment plan
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                textAlign: 'right'
              }}>
                {disbursalOrderData.paymentPlan}
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.2rem 0',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '600',
                flex: '1',
                minWidth: '120px'
              }}>
                Advance amount to be collected
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '600',
                textAlign: 'right'
              }}>
                Rs. {disbursalOrderData.advanceAmount}
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.2rem 0',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                flex: '1',
                minWidth: '120px'
              }}>
                Platform charges to merchant
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                textAlign: 'right'
              }}>
                Rs. {disbursalOrderData.platformCharges}
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.2rem 0',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                flex: '1',
                minWidth: '120px'
              }}>
                GST on platform charges
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                textAlign: 'right'
              }}>
                Rs. {disbursalOrderData.gstOnCharges}
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.2rem 0',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                flex: '1',
                minWidth: '120px'
              }}>
                Payment to merchant
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                textAlign: 'right'
              }}>
                Rs. {disbursalOrderData.paymentToMerchant}
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.2rem 0',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                flex: '1',
                minWidth: '120px'
              }}>
                PF amount
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                textAlign: 'right'
              }}>
                Rs. {disbursalOrderData.pfAmount}
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.2rem 0',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                flex: '1',
                minWidth: '120px'
              }}>
                Financier name
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#2c2c2c',
                fontWeight: '300',
                textAlign: 'right',
                wordBreak: 'break-word'
              }}>
                {disbursalOrderData.financierName}
              </div>
            </div>
          </div>

          {/* Final Payment Amount */}
          <div style={{
            backgroundColor: '#ffe9db',
            padding: '1rem 1.5rem',
            margin: '1rem -1.5rem 0',
            textAlign: 'center',
            borderBottom: 'solid 0.6rem #ffb47d'
          }}>
            <div style={{
              fontSize: '0.9rem',
              color: '#2c2c2c',
              fontWeight: '600',
              marginBottom: '0.4rem',
              lineHeight: '1.3'
            }}>
              Payment to the merchant after platform charges settlement
            </div>
            <div style={{
              fontSize: '1.4rem',
              color: '#2c2c2c',
              fontWeight: '600'
            }}>
              Rs. {disbursalOrderData.paymentToMerchant}
            </div>
          </div>
        </div>
    </div>
  );
};

export default generateDisbursalOrderReceipt;