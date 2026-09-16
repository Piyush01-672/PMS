import { Loader2 } from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ConfirmContext = createContext(null);

/** Promise-based confirmation for destructive actions: `if (await confirm({...})) …` */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const resolver = useRef(null);

  const confirm = useCallback((options) => {
    setTyped('');
    setState({ confirmLabel: 'Confirm', destructive: false, ...options });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
    setBusy(false);
  };

  const onConfirm = async () => {
    if (state?.onConfirm) {
      setBusy(true);
      try {
        await state.onConfirm();
      } catch {
        setBusy(false);
        return;
      }
    }
    close(true);
  };

  const blocked = state?.requireText && typed !== state.requireText;

  return (
    <ConfirmContext value={confirm}>
      {children}
      <AlertDialog open={Boolean(state)} onOpenChange={(open) => !open && !busy && close(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state?.title}</AlertDialogTitle>
            {state?.description && <AlertDialogDescription className="whitespace-pre-line">{state.description}</AlertDialogDescription>}
          </AlertDialogHeader>
          {state?.requireText && (
            <div className="space-y-1.5">
              <label className="text-sm" htmlFor="confirm-text">
                Type <strong className="font-mono">{state.requireText}</strong> to confirm
              </label>
              <Input id="confirm-text" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button variant={state?.destructive ? 'destructive' : 'default'} onClick={onConfirm} disabled={busy || blocked}>
              {busy && <Loader2 className="animate-spin" />}
              {state?.confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
