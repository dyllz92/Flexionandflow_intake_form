  function autoFormatDateInput(input) {
    if (!input || !input.value) return;
    
    const value = input.value.trim();
    if (!value) return;
    
    // Remove all non-digit characters to get just numbers
    const digitsOnly = value.replace(/\D/g, '');
    
    // Need at least 6 digits for a valid date (DDMMYY)
    if (digitsOnly.length < 6) return;
    
    let day, month, year;
    
    // Try YYYY-MM-DD format first (4 digits at start)
    const yyyymmddPattern = /^(\d{4})[\s\-\/\.](\d{1,2})[\s\-\/\.](\d{1,2})$/;
    const yyyymmddMatch = value.match(yyyymmddPattern);
    
    if (yyyymmddMatch) {
      // YYYY-MM-DD or YYYY/MM/DD format
      year = parseInt(yyyymmddMatch[1]);
      month = parseInt(yyyymmddMatch[2]);
      day = parseInt(yyyymmddMatch[3]);
    } else {
      // Try to parse the original value with other separators
      const withSeparators = /^(\d{1,2})[\s\-\/\.](\d{1,2})[\s\-\/\.](\d{2,4})$/;
      const match = value.match(withSeparators);
      
      if (match) {
        // Has separators - need to determine if DD/MM/YYYY or MM/DD/YYYY
        const part1 = parseInt(match[1]);
        const part2 = parseInt(match[2]);
        const part3 = parseInt(match[3]);
        
        // If part3 is 4 digits or > 31, it's likely the year
        if (match[3].length === 4 || part3 > 31) {
          year = part3;
          // Now determine if part1/part2 is DD/MM or MM/DD
          // If part1 > 12, it must be DD/MM/YYYY
          if (part1 > 12) {
            day = part1;
            month = part2;
          }
          // If part2 > 12, it must be MM/DD/YYYY
          else if (part2 > 12) {
            month = part1;
            day = part2;
          }
          // Ambiguous - assume DD/MM/YYYY (Australian/European format)
          else {
            day = part1;
            month = part2;
          }
        } else {
          // part3 is likely 2-digit year (YY format)
          year = part3 < 50 ? 2000 + part3 : 1900 + part3;
          day = part1;
          month = part2;
        }
      } else if (digitsOnly.length === 8) {
        // No separators, 8 digits - could be DDMMYYYY or YYYYMMDD
        const first4 = parseInt(digitsOnly.substring(0, 4));
        
        if (first4 > 1900 && first4 < 2100) {
          // Likely YYYYMMDD
          year = first4;
          month = parseInt(digitsOnly.substring(4, 6));
          day = parseInt(digitsOnly.substring(6, 8));
        } else {
          // Likely DDMMYYYY
          day = parseInt(digitsOnly.substring(0, 2));
          month = parseInt(digitsOnly.substring(2, 4));
          year = parseInt(digitsOnly.substring(4, 8));
        }
      } else if (digitsOnly.length === 6) {
        // DDMMYY format
        day = parseInt(digitsOnly.substring(0, 2));
        month = parseInt(digitsOnly.substring(2, 4));
        const yy = parseInt(digitsOnly.substring(4, 6));
        year = yy < 50 ? 2000 + yy : 1900 + yy;
      } else {
        // Can't reliably parse
        return;
      }
    }
    
    // Validate the parsed date
    if (month < 1 || month > 12 || day < 1 || day > 31) return;
    
    // Check if it's a valid date
    const testDate = new Date(year, month - 1, day);
    if (
      testDate.getFullYear() !== year ||
      testDate.getMonth() !== month - 1 ||
      testDate.getDate() !== day
    ) {
      return; // Invalid date (e.g., Feb 31)
    }
    
    // Format as DD/MM/YYYY
    const formatted = 
      String(day).padStart(2, '0') + '/' +
      String(month).padStart(2, '0') + '/' +
      String(year);
    
    // Only update if the format changed
    if (value !== formatted) {
      input.value = formatted;
    }
  }
