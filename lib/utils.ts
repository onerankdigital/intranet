import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a user is admin, handling both boolean and string values
 * (API might return is_admin as string "true" instead of boolean true)
 */
export function isAdmin(user: { is_admin?: boolean | string } | null | undefined): boolean {
  if (!user || user.is_admin === undefined || user.is_admin === null) {
    return false
  }
  if (user.is_admin === true) return true
  if (user.is_admin === "true" || String(user.is_admin).toLowerCase() === "true") return true
  return false
}

