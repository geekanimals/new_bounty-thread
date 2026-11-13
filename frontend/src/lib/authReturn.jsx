/**
 * Instagram / Facebook login ke baad Meta user ko yahan wapas bhejta hai.
 * next.config.mjs isko /legacy router par bhejta hai (code/state sahi panel tak jata hai).
 * Meta app ke "Valid OAuth Redirect URIs" mein <site>/auth/callback hona chahiye.
 * Purana /app.html bhi chalta rahega (puraane WhatsApp/email links ke liye).
 */
export const AUTH_RETURN_PATH = "/auth/callback";
export const authReturnUrl = () => window.location.origin + AUTH_RETURN_PATH;
