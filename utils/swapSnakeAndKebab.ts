/**
 * Swaps underscores (_) with hyphens (-) and vice-versa.
 * Handles null, undefined, or empty strings gracefully.
 */
export const swapSnakeAndKebab = (input: string | null | undefined): string => {
  if (!input) {
    return '';
  }

  if (input.includes('_')) {
    return input.replace(/_/g, '-');
  } 
  
  if (input.includes('-')) {
    return input.replace(/-/g, '_');
  }

  return input;
};