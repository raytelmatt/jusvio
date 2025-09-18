// Network utilities for Firebase authentication
export async function checkNetworkConnectivity(): Promise<boolean> {
  if (!navigator.onLine) {
    return false;
  }
  
  try {
    // Test connectivity to Firebase Auth API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://identitytoolkit.googleapis.com/v1/projects', {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors' // Avoid CORS issues for connectivity test
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.warn('Network connectivity check failed:', error);
    return false;
  }
}

export async function waitForNetworkConnectivity(maxWaitTime = 10000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    if (await checkNetworkConnectivity()) {
      return true;
    }
    
    // Wait 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
}

export function isFirebaseError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as any).code === 'string' &&
    typeof (error as any).message === 'string'
  );
}

export function getFirebaseErrorMessage(error: unknown): string {
  if (!isFirebaseError(error)) {
    return error instanceof Error ? error.message : 'Unknown error occurred';
  }
  
  switch (error.code) {
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection and try again. If the problem persists, try refreshing the page.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a few minutes before trying again.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please check your email or contact support.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or reset your password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please contact support.';
    default:
      return `Authentication error: ${error.message}`;
  }
}