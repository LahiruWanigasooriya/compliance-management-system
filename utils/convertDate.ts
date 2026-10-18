type DateFormat = 'YYYY-MM-DD HH:mm:ss' | 'MM/DD/YYYY HH:mm:ss' | 'DD-MM-YYYY HH:mm:ss' | 'Month Day, Year';

export function convertDate(isoString: string, formatType: DateFormat): string {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthName = months[date.getMonth()];

  switch (formatType) {
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'MM/DD/YYYY HH:mm:ss':
      return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    case 'DD-MM-YYYY HH:mm:ss':
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    case 'Month Day, Year':
      return `${monthName} ${day}, ${year}`;
    default:
      throw new Error('Invalid format type');
  }
}