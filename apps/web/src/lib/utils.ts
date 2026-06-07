import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names — required for shadcn components */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extract a user-friendly error message from an Axios error */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response: { data: { message?: string } } }).response;
    return response?.data?.message ?? 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

/** Format a URL for display (strip protocol/www) */
export function formatUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
}

/** Get favicon URL for a domain */
export function getFaviconUrl(url: string): string {
  const domain = formatUrl(url).split('/')[0];
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}
