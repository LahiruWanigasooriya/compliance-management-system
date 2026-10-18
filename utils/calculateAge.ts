export function calculateAge(
  birthDate: string | Date | number,
): number | string | null {
  if (!birthDate) return null;

  let birthDateObj: Date;

  if (birthDate instanceof Date) {
    birthDateObj = birthDate;
  } else {
    birthDateObj = new Date(birthDate);
  }

  if (isNaN(birthDateObj.getTime())) {
    console.warn("calculateAge: Received an invalid date input", birthDate);
    return "Invalid Date";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();
  const dayDiff = today.getDate() - birthDateObj.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age < 0 ? 0 : age;
}
