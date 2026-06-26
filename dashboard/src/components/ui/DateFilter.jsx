import { useState } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const { RangePicker } = DatePicker;

// ─── Preset helpers ───────────────────────────────────────────────────────────

function getPresets() {
  const now = dayjs();
  const presets = [];
  for (let i = 0; i < 12; i++) {
    const d = now.subtract(i, 'month');
    const value = d.format('YYYY-MM');
    const label = i === 0 ? 'This Month' : i === 1 ? 'Last Month' : d.format('MMM YYYY');
    presets.push({ value, label, shortLabel: i === 0 ? 'This Month' : i === 1 ? 'Last Month' : d.format('MMM YY') });
  }
  return presets;
}

const QUICK_PICKS = [
  { value: 'this_month',   label: 'This Month' },
  { value: 'last_month',   label: 'Last Month' },
  { value: '3months',      label: 'Last 3 Mo' },
  { value: '6months',      label: 'Last 6 Mo' },
  { value: 'all',          label: 'All Time' },
];

/**
 * Builds the filter object consumed by OverviewPage.
 * For quick picks that map to known server strings, we pass `month` as-is.
 * For calendar-month picks, we pass the YYYY-MM string.
 * For custom range, we pass startDate + endDate ISO strings.
 */
export function buildFilter(mode, data) {
  if (mode === 'quick') {
    return { mode: 'quick', month: data.value, label: data.label };
  }
  if (mode === 'month') {
    return { mode: 'month', month: data.value, label: data.label };
  }
  if (mode === 'range') {
    const [start, end] = data;
    return {
      mode: 'range',
      startDate: start.startOf('day').toISOString(),
      endDate: end.endOf('day').toISOString(),
      label: `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`,
    };
  }
  // fallback — current month
  const now = dayjs();
  return { mode: 'month', month: now.format('YYYY-MM'), label: 'This Month' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DateFilter({ filter, onChange }) {
  const [showMonthList, setShowMonthList] = useState(false);
  const allMonths = getPresets();

  function selectQuick(pick) {
    onChange(buildFilter('quick', pick));
    setShowMonthList(false);
  }

  function selectMonth(preset) {
    onChange(buildFilter('month', preset));
    setShowMonthList(false);
  }

  function selectRange([start, end]) {
    if (start && end) {
      onChange(buildFilter('range', [start, end]));
    }
  }

  const activeLabel = filter?.label || 'This Month';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
      {/* Left label */}
      <div className="flex items-center gap-2 text-gray-500 shrink-0">
        <CalendarDays size={15} className="text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Period</span>
      </div>

      {/* Quick-pick chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_PICKS.map((pick) => {
          const isActive =
            filter?.mode === 'quick' && filter?.month === pick.value;
          return (
            <button
              key={pick.value}
              onClick={() => selectQuick(pick)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                isActive
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-primary/40 hover:text-primary'
              )}
            >
              {pick.label}
            </button>
          );
        })}

        {/* Month picker dropdown trigger */}
        <div className="relative">
          <button
            onClick={() => setShowMonthList((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
              filter?.mode === 'month'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-primary/40 hover:text-primary'
            )}
          >
            {filter?.mode === 'month' ? filter.label : 'Pick Month'}
            <ChevronDown
              size={12}
              className={cn('transition-transform', showMonthList && 'rotate-180')}
            />
          </button>

          {showMonthList && (
            <div className="absolute top-full left-0 mt-1.5 w-40 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 py-1 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
              {allMonths.map((m) => (
                <button
                  key={m.value}
                  onClick={() => selectMonth(m)}
                  className={cn(
                    'w-full text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-gray-50',
                    filter?.month === m.value && filter?.mode === 'month'
                      ? 'text-primary font-semibold'
                      : 'text-gray-600'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-gray-200 hidden sm:block" />

      {/* Ant Design RangePicker */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 hidden sm:block">Custom Range</span>
        <RangePicker
          size="small"
          format="MMM D, YYYY"
          disabledDate={(d) => d && d.isAfter(dayjs())}
          value={
            filter?.mode === 'range'
              ? [dayjs(filter.startDate), dayjs(filter.endDate)]
              : null
          }
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) selectRange(dates);
          }}
          onClear={() => {
            const now = dayjs();
            onChange(buildFilter('month', {
              value: now.format('YYYY-MM'),
              label: 'This Month',
            }));
          }}
          allowClear
          style={{ borderRadius: 12 }}
          className="text-xs"
        />
      </div>

      {/* Active label badge */}
      {filter?.mode === 'range' && (
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {activeLabel}
          </span>
        </div>
      )}
    </div>
  );
}
