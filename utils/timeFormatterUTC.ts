export const formatTimestampWithAMPM = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return "Invalid Date";
    
    // Get MM/DD/YYYY format
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    
    // Format time with AM/PM
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    const formattedHours = hours.toString(); 
    
    return `${month}/${day}/${year},  ${formattedHours}:${minutes}:${seconds} ${ampm}`;
    
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return "Invalid Date";
  }
};