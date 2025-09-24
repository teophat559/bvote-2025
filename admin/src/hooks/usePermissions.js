import { useAuth } from '@/hooks/useAuth';

export const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'Auditor'; // Default to Auditor if no user or role

  const permissions = {
    SuperAdmin: ['read', 'write', 'super'],
    Operator: ['read', 'write'],
    Auditor: ['read'],
  };

  const hasPermission = (requiredPermission) => {
    const userPermissions = permissions[userRole] || [];
    return userPermissions.includes(requiredPermission);
  };

  return { hasPermission, userRole };
};