import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api, setCsrfToken, setUnauthorizedHandler } from '@/lib/api';
import { adminUrl } from '@/lib/config';

const AuthContext = createContext(null);

export const meQuery = {
  queryKey: ['admin-me'],
  queryFn: () => api.get('/auth/me', { skipAuthRedirect: true }).then((r) => r.data),
  retry: false,
  staleTime: 5 * 60_000,
};

export function AdminAuthProvider({ children }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const me = useQuery(meQuery);

  useEffect(() => {
    if (me.data?.csrfToken) setCsrfToken(me.data.csrfToken);
  }, [me.data]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.setQueryData(['admin-me'], null);
      toast.error('Your session has ended. Please sign in again.');
      navigate(adminUrl('/login'), { replace: true, state: { from: location.pathname } });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate, location.pathname, queryClient]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', null, { skipAuthRedirect: true });
    } finally {
      setCsrfToken(null);
      queryClient.clear();
      navigate(adminUrl('/login'), { replace: true });
    }
  }, [navigate, queryClient]);

  const value = useMemo(() => {
    const permissions = me.data?.permissions || [];
    return {
      admin: me.data?.admin || null,
      permissions,
      can: (permission) => permissions.includes(permission),
      mustEnroll2fa: Boolean(me.data?.mustEnroll2fa),
      isLoading: me.isPending,
      isError: me.isError,
      refresh: me.refetch,
      logout,
    };
  }, [me.data, me.isPending, me.isError, me.refetch, logout]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export const useAdminAuth = () => useContext(AuthContext);

export function FullScreenLoader({ label = 'Loading…' }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-muted/40" role="status">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin text-brand" /> {label}
      </div>
    </div>
  );
}

export function RequireAdmin({ children }) {
  const auth = useAdminAuth();
  const location = useLocation();
  if (auth.isLoading) return <FullScreenLoader label="Checking your session…" />;
  if (!auth.admin) return <Navigate to={adminUrl('/login')} replace state={{ from: location.pathname }} />;
  if (auth.mustEnroll2fa && !location.pathname.endsWith('/account')) return <Navigate to={adminUrl('/account')} replace />;
  return children;
}

export function Can({ permission, children, fallback = null }) {
  const auth = useAdminAuth();
  return auth?.can(permission) ? children : fallback;
}
