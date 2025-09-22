# API Server Setup Guide

## Issue: Loan Transactions Error

The application is showing "An unexpected error occurred while fetching loan transactions" because the backend API server is not properly configured or running.

## Root Cause

The server on port 8000 is currently serving the React frontend (HTML) instead of API responses (JSON). This indicates that:

1. The Django API server is not running
2. The API server is running on a different port
3. There's a routing/configuration issue

## Solution

### Option 1: Start the Django API Server

1. Navigate to the Django backend directory:
   ```bash
   cd /Users/navalkumar/Downloads/CarePay_Bot_Clean/cpapp_backend
   ```

2. Install dependencies (if needed):
   ```bash
   pip install -r requirements.txt
   ```

3. Start the Django server on port 8000:
   ```bash
   python manage.py runserver 8000
   ```

### Option 2: Update Frontend Configuration

If the API server is running on a different port, update the API_BASE_URL in:
- `src/services/api.ts` (line 143)
- `src/services/loanApi.ts` (line 4)

Change from:
```javascript
const API_BASE_URL = 'http://localhost:8000/api/v1/agent';
```

To the correct port:
```javascript
const API_BASE_URL = 'http://localhost:8001/api/v1/agent'; // or whatever port
```

## Verification

Test the API endpoint directly:
```bash
curl -X GET "http://localhost:8000/api/v1/agent/getAllLoanDetailForDoctorNew?doctorId=DOC001&type=detail" \
  -H "Accept: application/json"
```

Expected: JSON response with loan data
Current: HTML response (React app)

## Current Error Handling

The application now provides better error messages:
- Detects when server returns HTML instead of JSON
- Shows technical details for debugging
- Provides retry and dismiss options
- Guides users on potential solutions

## Next Steps

1. Start the Django API server on the correct port
2. Verify API endpoints are responding with JSON
3. Test the loan transactions feature
4. Monitor console logs for any remaining issues
