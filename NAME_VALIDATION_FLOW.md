# Name Validation Flow

## Single Word Names (e.g., "John", "Madonna", "Cher")

1. User enters single word name
2. **Submit button is ENABLED** (all fields filled)
3. User clicks "Submit Information"
4. **Input border turns RED**
5. **Aadhaar verification UI appears** with question: "Is this name, as on your Aadhaar card?"
6. User clicks **"Yes"** to verify
7. **Input border turns NORMAL** (not red anymore)
8. **Form automatically submits** after verification
9. Success! ✅

## Multi-Word Names (e.g., "John Doe", "Mary Jane Smith")

1. User enters multi-word name
2. **Submit button is ENABLED** (all fields filled)
3. User clicks "Submit Information"
4. **No Aadhaar verification required**
5. Form submits directly (if all other validations pass)
6. Success! ✅

## Key Features

- ✅ Submit button enabled for both single and multi-word names
- ✅ Single word names show verification UI on submit attempt
- ✅ Multi-word names submit directly without verification
- ✅ Red border appears only when verification is needed
- ✅ Border turns normal after "Yes" confirmation
- ✅ Form automatically submits after "Yes" confirmation
- ✅ Seamless user experience for both scenarios
