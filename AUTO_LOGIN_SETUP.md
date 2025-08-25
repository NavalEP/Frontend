# Auto-Login Setup for Doctor Staff

## Overview

This application implements an automatic login system for doctor staff that ensures fresh authentication tokens and up-to-date doctor information on every login.

## How It Works

### 1. URL Parameter Handling
When a user visits the application with auto-login parameters, the system automatically stores the credentials:

```
https://yourapp.com/doctor-login?merchantCode=ABC123&password=secret123
```

The App.tsx component detects these parameters and stores them in localStorage:
- `autoLogin_merchantCode`: The doctor's merchant code
- `autoLogin_password`: The doctor's password

### 2. Automatic API Call
Every time auto-login is triggered, the system:
- Always calls the doctor staff API (`/login/doctor-staff/`)
- Generates a fresh authentication token
- Updates doctor information (doctor_id and doctor_name) from the API response
- Never reuses old tokens

### 3. Periodic Re-authentication
The system automatically re-authenticates every 5 minutes to ensure:
- Tokens remain fresh
- Doctor information is always current
- No session expiration issues

## Key Features

### Fresh Token Generation
- Every auto-login call generates a new token
- Old tokens are never reused
- Ensures maximum security and session validity

### Doctor Information Updates
- Doctor ID and name are always fetched from the API
- Ensures the most current information is displayed
- Handles cases where doctor details might change

### Robust Error Handling
- Failed auto-login attempts clear stored credentials
- Periodic failures don't clear credentials (only initial failures)
- Comprehensive logging for debugging

### Persistent Doctor Data
- Doctor information is stored in multiple locations for redundancy
- Survives page refreshes and browser restarts
- Automatic restoration if data is lost

## Implementation Details

### AuthContext Functions

#### `performAutoLogin()`
- Main auto-login function
- Always calls the doctor staff API
- Updates all doctor information and tokens
- Handles errors gracefully

#### `storeDoctorData(id, name)`
- Stores doctor information in multiple locations
- Ensures data persistence across sessions

#### `retrieveDoctorData()`
- Retrieves doctor information from storage
- Uses fallback mechanisms if primary storage fails

### Storage Strategy

The system uses a multi-layered storage approach:
1. `localStorage` - Primary storage
2. `localStorage_backup` - Backup storage
3. `sessionStorage` - Additional backup

This ensures doctor information is never lost, even if one storage mechanism fails.

## Usage

### For Developers

To trigger auto-login programmatically:

```javascript
import { storeAutoLoginCredentials } from './utils/shareUtils';

// Store credentials and trigger auto-login
storeAutoLoginCredentials('merchantCode', 'password');
```

To check if auto-login credentials exist:

```javascript
import { hasAutoLoginCredentials } from './utils/shareUtils';

if (hasAutoLoginCredentials()) {
  // Auto-login credentials are available
}
```

### For End Users

Users can access the application with auto-login by visiting:
```
https://yourapp.com/doctor-login?merchantCode=THEIR_CODE&password=THEIR_PASSWORD
```

The system will automatically:
1. Store the credentials
2. Call the doctor staff API
3. Generate a fresh token
4. Update doctor information
5. Redirect to the chat page

## Security Considerations

- Credentials are stored in localStorage (consider encryption for production)
- Tokens are always fresh and never reused
- Failed login attempts clear stored credentials
- Periodic re-authentication ensures session validity

## Troubleshooting

### Common Issues

1. **Auto-login not working**
   - Check browser console for error messages
   - Verify URL parameters are correct
   - Ensure API endpoint is accessible

2. **Doctor information not updating**
   - Check API response format
   - Verify doctor_id and doctor_name fields
   - Check network connectivity

3. **Periodic re-login failing**
   - Check API availability
   - Verify credentials are still valid
   - Check browser console for errors

### Debug Information

The system provides comprehensive logging:
- Auto-login attempts and results
- Doctor information updates
- Token generation status
- Error details and handling

Check the browser console for detailed information about the auto-login process.
