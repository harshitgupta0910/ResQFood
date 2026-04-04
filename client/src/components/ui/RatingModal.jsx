import { useEffect, useState } from 'react';
import { HiStar } from 'react-icons/hi';
import Modal from './Modal';
import Button from './Button';

const RatingModal = ({ isOpen, onClose, title, initialScore = 0, initialReview = '', onSubmit, isLoading = false }) => {
  const [score, setScore] = useState(initialScore || 0);
  const [review, setReview] = useState(initialReview || '');
  const [hovered, setHovered] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setScore(initialScore || 0);
      setReview(initialReview || '');
      setHovered(0);
    }
  }, [isOpen, initialScore, initialReview]);

  const submit = () => {
    if (score < 1 || score > 5) return;
    onSubmit?.({ score, review: review.trim() });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-surface-600 mb-3">Select a rating from 1 to 5 stars.</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((v) => {
              const active = (hovered || score) >= v;
              return (
                <button
                  key={v}
                  type="button"
                  onMouseEnter={() => setHovered(v)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setScore(v)}
                  className="p-1"
                  aria-label={`Rate ${v} stars`}
                >
                  <HiStar className={`w-7 h-7 ${active ? 'text-amber-400' : 'text-surface-300'}`} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Review (optional)</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value.slice(0, 500))}
            rows={4}
            placeholder="Share your experience..."
            className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
          />
          <p className="text-xs text-surface-400 mt-1">{review.length}/500</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button size="sm" onClick={submit} isLoading={isLoading} disabled={score < 1 || score > 5}>
            Submit Rating
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RatingModal;
