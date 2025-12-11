exports.cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  domain: '.ekowlabs.space',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Helper function to generate cookie options for different environments
exports.getCookieOptions = () => {
  return {
    ...this.cookieOptions,
    secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
  };
};