import { useEffect, useState } from 'react';

/**
 * Returns `value` only once it has stopped changing for `delay` ms.
 *
 * The search box writes straight to the URL so the field stays responsive and the
 * query stays shareable; this keeps the request that follows from firing on every
 * keystroke.
 */
export function useDebounced(value, delay = 300) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
