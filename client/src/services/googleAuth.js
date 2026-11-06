// Google OAuth 2.0 Integration via Google Identity Services (GIS)

export const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
  '954608331828-p268j07f59d5kck6g148g82c1u1f1tqm.apps.googleusercontent.com';

/**
 * Initiates REAL Google OAuth authentication.
 * Opens the official Google Account selection and sign-in screen.
 * Rejects if cancelled or closed; returns verified Google user profile upon success.
 */
export function initiateGoogleLogin() {
  return new Promise((resolve, reject) => {
    // 1. Check if Google GIS SDK is loaded
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          prompt: 'select_account', // Forces Google account chooser screen
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Google authentication was cancelled.'));
              return;
            }
            if (!tokenResponse.access_token) {
              reject(new Error('No authorization token received from Google.'));
              return;
            }

            try {
              // Retrieve verified user profile from Google's official userinfo API
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });

              if (!res.ok) {
                throw new Error('Failed to retrieve verified Google profile.');
              }

              const profile = await res.json();
              if (!profile.email) {
                throw new Error('Google account must have a verified email address.');
              }

              resolve({
                email: profile.email,
                name: profile.name || profile.given_name || profile.email.split('@')[0],
                google_id: profile.sub,
                picture: profile.picture,
                access_token: tokenResponse.access_token,
              });
            } catch (fetchErr) {
              reject(new Error(fetchErr.message || 'Error communicating with Google userinfo API.'));
            }
          },
          error_callback: (error) => {
            reject(new Error(error.message || 'Google account sign-in popup was closed or cancelled.'));
          },
        });

        // Request real access token from Google
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Google GIS tokenClient initialization failed:', err);
      }
    }

    // 2. Direct Google OAuth Popup Fallback (Standard OAuth 2.0 Web flow)
    const redirectUri = window.location.origin + window.location.pathname;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      GOOGLE_CLIENT_ID
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token%20id_token&scope=openid%20email%20profile&prompt=select_account&nonce=${Date.now()}`;

    const width = 500;
    const height = 620;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
    const popup = window.open(
      oauthUrl,
      'GoogleOAuthWindow',
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
    );

    if (!popup) {
      reject(new Error('Google sign-in popup was blocked by your browser. Please allow popups for this site.'));
      return;
    }

    // Monitor popup closure
    let isResolved = false;
    const checkTimer = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(checkTimer);
          if (!isResolved) {
            reject(new Error('Google sign-in window was closed without completing authentication.'));
          }
        }
      } catch (e) {
        // Cross-origin checks may throw when navigating to accounts.google.com, which is normal
      }
    }, 600);
  });
}
