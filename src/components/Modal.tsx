import { useEffect, useId, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useTranslation();
  const titleId = useId();
  const modalRef = useRef<HTMLElement | null>(null);
  const returnFocus = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const reduceMotion = useReducedMotion();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = returnFocus.current;
    const dialog = modalRef.current;
    const focusable = () => [...(dialog?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])].filter((item) => item.getAttribute('aria-hidden') !== 'true' && item.offsetParent !== null);
    if (dialog && !dialog.contains(document.activeElement)) (focusable()[0] ?? dialog).focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') { closeRef.current(); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      const first = items[0]!;
      const last = items.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previousFocus?.focus(); };
  }, []);
  return createPortal(<div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><motion.section ref={modalRef} tabIndex={-1} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}><div className="modal-head"><div><div className="eyebrow">AION2Companion</div><h2 id={titleId}>{title}</h2></div><button type="button" className="icon-button" aria-label={t('close')} onClick={onClose}><X size={18} aria-hidden="true" /></button></div>{children}</motion.section></div>, document.body);
}

