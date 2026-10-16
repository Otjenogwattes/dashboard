import { dayName, isoWeek, monthShort } from '../lib/dates';

export function DateHero({ date, compact }: { date: Date; compact?: boolean }) {
  const day = dayName(date).toUpperCase();
  return (
    <h1 className={compact ? 'date-hero date-hero--m' : 'date-hero'}>
      <span className="date-hero__day">{date.getDate()}</span>
      <span className="date-hero__side">
        <span className="date-hero__month">{monthShort(date)}</span>
        <span className="date-hero__meta">{compact ? day : `${day} · WEEK ${isoWeek(date)}`}</span>
      </span>
    </h1>
  );
}
