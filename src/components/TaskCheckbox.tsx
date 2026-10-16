type Props = {
  title: string;
  detail?: string;
  done: boolean;
  onToggle: () => void;
  compact?: boolean;
};

export function TaskCheckbox({ title, detail, done, onToggle, compact }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      onClick={onToggle}
      className={compact ? 'task task--compact' : 'task'}
    >
      <span className="task__box" aria-hidden="true">
        {done && (
          <svg width="12" height="12" viewBox="0 0 16 16">
            <polyline points="3,8.5 6.5,12 13,4.5" fill="none" stroke="var(--plant-on)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="task__text">
        <span className="task__title">{title}</span>
        {detail && !compact && <span className="task__detail">{detail}</span>}
      </span>
    </button>
  );
}
