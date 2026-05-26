import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes intelligently — dedupes conflicting utilities so
 * `cn('p-2', 'p-4')` yields just `'p-4'`. Used throughout the shadcn-style
 * components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
