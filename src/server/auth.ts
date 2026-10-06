import { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { UserRole, User, Business } from '../types/index.ts';

// In-memory token session map
interface SessionData {
  token: string;
  userId: string;
  businessId: string;
  role: UserRole;
  createdAt: number;
}

const sessions = new Map<string, SessionData>();

export type Permission =
  | 'VIEW_DASHBOARD'
  | 'MANAGE_PRODUCTS'
  | 'VIEW_COST_PRICE'
  | 'MANAGE_INVENTORY'
  | 'CREATE_SALE'
  | 'VOID_SALE'
  | 'MANAGE_PURCHASES'
  | 'MANAGE_SUPPLIERS'
  | 'MANAGE_CUSTOMERS'
  | 'MANAGE_EXPENSES'
  | 'MANAGE_EMPLOYEES'
  | 'VIEW_FINANCIAL_REPORTS'
  | 'USE_AI_COPILOT'
  | 'MANAGE_SETTINGS';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    'VIEW_DASHBOARD',
    'MANAGE_PRODUCTS',
    'VIEW_COST_PRICE',
    'MANAGE_INVENTORY',
    'CREATE_SALE',
    'VOID_SALE',
    'MANAGE_PURCHASES',
    'MANAGE_SUPPLIERS',
    'MANAGE_CUSTOMERS',
    'MANAGE_EXPENSES',
    'MANAGE_EMPLOYEES',
    'VIEW_FINANCIAL_REPORTS',
    'USE_AI_COPILOT',
    'MANAGE_SETTINGS',
  ],
  MANAGER: [
    'VIEW_DASHBOARD',
    'MANAGE_PRODUCTS',
    'VIEW_COST_PRICE',
    'MANAGE_INVENTORY',
    'CREATE_SALE',
    'VOID_SALE',
    'MANAGE_PURCHASES',
    'MANAGE_SUPPLIERS',
    'MANAGE_CUSTOMERS',
    'MANAGE_EXPENSES',
    'VIEW_FINANCIAL_REPORTS',
    'USE_AI_COPILOT',
  ],
  CASHIER: [
    'CREATE_SALE',
    'MANAGE_CUSTOMERS',
  ],
  INVENTORY_MANAGER: [
    'VIEW_DASHBOARD',
    'MANAGE_PRODUCTS',
    'VIEW_COST_PRICE',
    'MANAGE_INVENTORY',
    'MANAGE_PURCHASES',
    'MANAGE_SUPPLIERS',
    'USE_AI_COPILOT',
  ],
  ACCOUNTANT: [
    'VIEW_DASHBOARD',
    'VIEW_COST_PRICE',
    'MANAGE_EXPENSES',
    'MANAGE_CUSTOMERS',
    'MANAGE_SUPPLIERS',
    'VIEW_FINANCIAL_REPORTS',
    'USE_AI_COPILOT',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function createSession(user: User): string {
  const token = `msh_${Date.now()}_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
  sessions.set(token, {
    token,
    userId: user.id,
    businessId: user.businessId,
    role: user.role,
    createdAt: Date.now(),
  });
  return token;
}

export function revokeSession(token: string): void {
  sessions.delete(token);
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
      business?: Business;
      tenantId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.substring(7);
  const session = sessions.get(token);

  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
    return;
  }

  const user = db.getUserById(session.userId);
  if (!user || !user.active) {
    res.status(401).json({ error: 'User account not found or deactivated.' });
    return;
  }

  const business = db.getBusiness(session.businessId);
  if (!business) {
    res.status(403).json({ error: 'Shop/Business workspace not found.' });
    return;
  }

  // Inject secure tenant context
  req.user = user;
  req.business = business;
  req.tenantId = session.businessId;

  next();
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        error: `Permission denied. Your role (${req.user.role}) does not have permission for: ${permission}.`,
      });
      return;
    }

    next();
  };
}
