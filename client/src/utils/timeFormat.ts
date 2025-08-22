/**
 * Formats a duration in seconds to a human-readable string format (mm:ss or hh:mm:ss)
 * @param seconds - Duration in seconds
 * @returns Formatted time string
 */
export function formatDuration(seconds: number | string): string {
  // Handle empty or invalid input
  if (seconds === undefined || seconds === null) {
    return '';
  }
  
  // Convert string to number if necessary
  const totalSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  
  // Return empty string for invalid numbers
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '';
  }
  
  // Calculate hours, minutes, and remaining seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);
  
  // Format with leading zeros
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  // Return formatted string (include hours only if necessary)
  if (hours > 0) {
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
  
  return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Formats a duration in seconds to a more human-readable form
 * Examples: "2h 15m", "45m 30s", "30s"
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDurationWords(seconds: number | string): string {
  // Handle empty or invalid input
  if (seconds === undefined || seconds === null) {
    return '';
  }
  
  // Convert string to number if necessary
  const totalSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  
  // Return empty string for invalid numbers
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '';
  }
  
  // Calculate hours, minutes, and remaining seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);
  
  // Build formatted string parts
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  
  // Only include seconds if there are no hours or there are remaining seconds
  if ((hours === 0 && minutes === 0) || remainingSeconds > 0) {
    parts.push(`${remainingSeconds}s`);
  }
  
  return parts.join(' ');
}
