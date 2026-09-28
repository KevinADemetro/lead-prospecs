import { AuthContext } from '../common/types/auth-context';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      currentUser?: AuthContext;
    }
  }
}

export {};
