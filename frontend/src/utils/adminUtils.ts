// Admin utilities and constants
export const ADMIN_EMAILS = [
  "tomacwin9961@gmail.com",
  "prepixo.official@gmail.com"
];

export const isAdmin = (email: string | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

export const checkAdminAccess = async (email: string): Promise<boolean> => {
  try {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/admin/check?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    return data.is_admin || false;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
};
