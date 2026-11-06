// Google OAuth 2.0 Integration via Google Identity Services (GIS)

export const DEFAULT_GOOGLE_CLIENT_ID = '521700204269-55776lqgjp4l8c07fvn63vh0kn33b7vh.apps.googleusercontent.com';

/**
 * Retrieves the configured Google Client ID.
 * Priority:
 * 1. Vite Environment Variable: VITE_GOOGLE_CLIENT_ID
 * 2. Window runtime global: window.QUEUEFLOW_GOOGLE_CLIENT_ID
 * 3. LocalStorage override: queueflow_google_client_id
 * 4. Default configured Google Client ID
 */
export function getGoogleClientId() {
  const envId = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID;
  if (envId && envId.trim() && !envId.includes('placeholder') && !envId.includes('your-google-client-id')) {
    return envId.trim();
  }

  if (typeof window !== 'undefined') {
    if (window.QUEUEFLOW_GOOGLE_CLIENT_ID && window.QUEUEFLOW_GOOGLE_CLIENT_ID.trim()) {
      return window.QUEUEFLOW_GOOGLE_CLIENT_ID.trim();
    }
    const stored = localStorage.getItem('queueflow_google_client_id');
    if (stored && stored.trim() && !stored.includes('placeholder')) {
      return stored.trim();
    }
  }

  return DEFAULT_GOOGLE_CLIENT_ID;
}

/**
 * Saves a Google Client ID to localStorage for the session.
 */
export function setGoogleClientId(clientId) {
  if (typeof window !== 'undefined' && clientId) {
    localStorage.setItem('queueflow_google_client_id', clientId.trim());
  }
}

/**
 * Checks whether Google OAuth is configured with a non-empty client ID.
 */
export function isGoogleOAuthConfigured() {
  const id = getGoogleClientId();
  return Boolean(id && id.length > 10 && id.includes('.apps.googleusercontent.com'));
}

/**
 * Ensures Google Identity Services (GIS) script is loaded.
 */
export async function ensureGoogleScriptLoaded() {
  if (typeof window === 'undefined') return false;
  if (window.google?.accounts?.oauth2) return true;
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (window.google?.accounts?.oauth2) return true;
  }
  return Boolean(window.google?.accounts?.oauth2);
}

/**
 * Initiates REAL Google OAuth authentication.
 * Opens the official Google Account selection and sign-in screen.
 * Rejects if cancelled, closed, or invalid; returns verified Google user profile upon success.
 */
export async function initiateGoogleLogin() {
  const clientId = getGoogleClientId();

  if (!clientId || !clientId.includes('.apps.googleusercontent.com')) {
    const err = new Error('CONFIG_REQUIRED');
    err.code = 'CONFIG_REQUIRED';
    throw err;
  }

  await ensureGoogleScriptLoaded();

  return new Promise((resolve, reject) => {
    // 1. Google Identity Services (GIS) Web SDK
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          prompt: 'select_account', // Forces Google to show the account picker
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              const errMsg = tokenResponse.error_description || tokenResponse.error;
              if (errMsg.includes('invalid_client') || tokenResponse.error === 'invalid_client') {
                reject(new Error('Invalid Google Client ID. The OAuth client was not found in Google Cloud Console (Error 401: invalid_client).'));
                return;
              }
              reject(new Error(errMsg || 'Google authentication was cancelled.'));
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
            const errStr = error?.message || String(error);
            if (errStr.includes('invalid_client')) {
              reject(new Error('Invalid Google Client ID (Error 401: invalid_client). Verify this Client ID is registered in Google Cloud Console.'));
              return;
            }
            reject(new Error(errStr || 'Google sign-in popup was closed or blocked.'));
          },
        });

        // Open real Google account picker dialog
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Google GIS tokenClient initialization failed:', err);
      }
    }

    // 2. Direct Google OAuth Popup Fallback (Standard OAuth 2.0 Web flow)
    const redirectUri = window.location.origin + window.location.pathname;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
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
        // Cross-origin checks during Google redirect are expected
      }
    }, 600);
  });
}
