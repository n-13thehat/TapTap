export const authenticateUser = (username: string, password: string): boolean => {
  // Authentication logic here
  return username === 'admin' && password === 'password';
};