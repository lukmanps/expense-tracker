import { useRef, useState } from 'react';
import { Trash2, Edit3 } from 'lucide-react';

export default function SwipeableRow({ children, onDelete, onEdit }) {
  const rowRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!swiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    const clampedDiff = Math.max(0, Math.min(diff, 140));
    setOffset(clampedDiff);
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    if (offset > 70) {
      setOffset(140);
    } else {
      setOffset(0);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Action buttons behind */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        {onEdit && (
          <button
            onClick={() => { setOffset(0); onEdit(); }}
            className="w-[70px] bg-primary flex items-center justify-center"
          >
            <Edit3 className="w-5 h-5 text-bg-dark" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => { setOffset(0); onDelete(); }}
            className="w-[70px] bg-danger flex items-center justify-center"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Main content */}
      <div
        ref={rowRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative bg-bg transition-transform"
        style={{ transform: `translateX(-${offset}px)`, transition: swiping ? 'none' : 'transform 0.2s ease-out' }}
      >
        {children}
      </div>
    </div>
  );
}
