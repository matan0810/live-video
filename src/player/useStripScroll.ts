import { useCallback, useEffect, useState, type RefObject } from 'react';

/** How much of the visible width one press of an edge arrow scrolls. */
const PAGE_SHARE = 0.8;

/** Whether more of a horizontal list lies before or after what is shown. */
export function scrollRoom(element: {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}) {
  // In right-to-left lists scrollLeft runs from 0 down to negative numbers.
  const travelled = Math.abs(element.scrollLeft);
  const total = element.scrollWidth - element.clientWidth;
  return { hasBefore: travelled > 2, hasAfter: travelled < total - 2 };
}

/**
 * A horizontal list that a mouse can move: the wheel scrolls it sideways, and `page`
 * moves it by most of its width, toward its start or its end in the reading direction.
 */
export function useStripScroll(listRef: RefObject<HTMLElement | null>) {
  const [room, setRoom] = useState({ hasBefore: false, hasAfter: false });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const isRtl = () => getComputedStyle(list).direction === 'rtl';
    const update = () => setRoom(scrollRoom(list));
    const handleWheel = (event: WheelEvent) => {
      // A vertical wheel moves the strip sideways; a sideways one already does.
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (list.scrollWidth <= list.clientWidth) return;
      event.preventDefault();
      list.scrollBy({ left: isRtl() ? -event.deltaY : event.deltaY });
    };
    update();
    list.addEventListener('scroll', update, { passive: true });
    list.addEventListener('wheel', handleWheel, { passive: false });
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => {
      list.removeEventListener('scroll', update);
      list.removeEventListener('wheel', handleWheel);
      observer.disconnect();
    };
  }, [listRef]);

  const page = useCallback(
    (toward: 'before' | 'after') => {
      const list = listRef.current;
      if (!list) return;
      const isRtl = getComputedStyle(list).direction === 'rtl';
      const forward = toward === 'after' ? 1 : -1;
      const distance = list.clientWidth * PAGE_SHARE * forward * (isRtl ? -1 : 1);
      list.scrollBy({ left: distance, behavior: 'smooth' });
    },
    [listRef],
  );

  return { ...room, page };
}
