// A readable "you're probably signed in" hint cookie. Contains only "1", no personal data.
// proxy.js keeps it in sync with the real (HttpOnly) session cookie on every request.
// It only decides what the static landing page shows before loading the user; it grants nothing.
export const SIGNED_IN_HINT_COOKIE = "mbg_signed_in";
