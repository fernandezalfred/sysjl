// What every form's Server Action returns: an English error message on failure
// (shown in the user's language with localizeError).
export interface ActionState {
  success: boolean;
  error?: string;
}
