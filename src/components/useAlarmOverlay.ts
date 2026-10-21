import { useEffect, useRef, useState } from 'react';

export function useAlarmOverlay() {
  const [isOpen, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const desktop = window.aionDesktop;
    let active = true;
    const unsubscribe = desktop?.onAlarmsChanged(open => { if (active) setOpen(open); });
    void desktop?.isAlarmsOpen().then(open => { if (active) setOpen(open); });
    return () => { active = false; mounted.current = false; unsubscribe?.(); };
  }, []);
  async function open() {
    if (!window.aionDesktop || pending.current) return;
    pending.current = true;
    setOpening(true);
    setFailed(false);
    try { await window.aionDesktop.openAlarms(); }
    catch { if (mounted.current) setFailed(true); }
    finally { pending.current = false; if (mounted.current) setOpening(false); }
  }
  return { isOpen, opening, failed, open };
}
