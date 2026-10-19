import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { waitForCelebrationSound } from '../lib/celebrationSound';

export function FloatingDailyRow({ complete, completionKey, gap = 6, children }: { complete: boolean; completionKey: string; gap?: number; children: ReactNode }) {
  const [phase, setPhase] = useState<'visible' | 'waiting' | 'leaving' | 'hidden'>(complete ? 'hidden' : 'visible');
  const wasComplete = useRef(complete);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const justCompleted = complete && !wasComplete.current;
    wasComplete.current = complete;
    if (!complete) setPhase('visible');
    if (!justCompleted) return;
    setPhase('waiting');
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    void waitForCelebrationSound(completionKey).then((endedAt) => {
      if (!cancelled) timeout = setTimeout(() => setPhase('leaving'), Math.max(0, endedAt + 2000 - Date.now()));
    });
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [complete, completionKey]);

  if (phase === 'hidden') return null;
  const leaving = phase === 'leaving';
  return <motion.div className="floating-daily-row" data-completion-phase={phase} inert={leaving}
    initial={false} animate={{ opacity: leaving ? 0 : 1, height: leaving ? 0 : 'auto', paddingBottom: leaving ? 0 : gap }}
    transition={{ opacity: { duration: reducedMotion ? .15 : .5 }, height: { duration: reducedMotion ? 0 : .6, delay: reducedMotion ? .15 : .25, ease: [.22, 1, .36, 1] }, paddingBottom: { duration: reducedMotion ? 0 : .6, delay: reducedMotion ? .15 : .25 } }}
    onAnimationComplete={() => { if (leaving) setPhase((current) => current === 'leaving' ? 'hidden' : current); }}>
    {children}
  </motion.div>;
}
