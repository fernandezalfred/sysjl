import type { DictionaryKey, TranslateFn } from "@/lib/i18n/translations";

// Server actions return their validation/permission errors as fixed English
// messages (their tests assert on them). This maps each one to its translation key
// so forms show it in the user's language; an unlisted message is shown as is.
const ERROR_KEYS: Record<string, DictionaryKey> = {
  "Admin access required.": "error.adminRequired",
  "Sign-in required.": "error.signInRequired",
  "A user with this email already exists.": "error.emailTaken",
  "Cheese left cannot exceed Cheese taken.": "error.quesoLeftOverTaken",
  "Cheese left must be 0 or more.": "error.quesoLeftMin",
  "Cheese taken must be 0 or more.": "error.quesoTakenMin",
  "Yogurt left cannot exceed Yogurt taken.": "error.yogurtLeftOverTaken",
  "Yogurt left must be 0 or more.": "error.yogurtLeftMin",
  "Yogurt taken must be 0 or more.": "error.yogurtTakenMin",
  "Total sold must be 0 or more.": "error.totalSoldMin",
  "Milk liters must be 0 or more.": "error.milkLitersMin",
  "Milk price per liter must be 0 or more.": "error.milkUnitCostMin",
  "Current password is incorrect.": "error.currentPasswordWrong",
  "Date is required.": "error.dateRequired",
  "Enter a valid email address.": "error.emailInvalid",
  "Enter your current password.": "error.currentPasswordRequired",
  "Invalid email or password.": "error.loginInvalid",
  "Invalid input.": "error.invalidInput",
  "Name is required.": "error.nameRequired",
  "Password is required.": "error.passwordRequired",
  "Password must be at least 8 characters.": "error.passwordTooShort",
  "Purchase cost must be 0 or more.": "error.purchaseCostMin",
  "Sale price must be 0 or more.": "error.salePriceMin",
  "Unit cost must be 0 or more.": "error.unitCostMin",
  "Quantity must be at least 1.": "error.quantityMin",
  "Record not found.": "error.recordNotFound",
  "Stock purchase not found.": "error.purchaseNotFound",
  "Select a user.": "error.selectUser",
  "User not found.": "error.userNotFound",
  "The new password must be different from the current one.": "error.passwordSameAsCurrent",
  "The new passwords don't match.": "error.passwordsDontMatch",
  "You already have a record for this date.": "error.recordExists",
};

export function localizeError(t: TranslateFn, message: string): string {
  const key = ERROR_KEYS[message];
  return key ? t(key) : message;
}
