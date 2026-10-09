import { memo } from 'react';
import { Tabs } from '../ui/Tabs';
import type { TimeWindow } from '../../types/finance';

interface TimeWindowTabsProps {
  activeWindow: TimeWindow;
  onChange: (window: TimeWindow) => void;
}

const timeWindowTabs = [
  { id: '1D', label: 'Current Day' },
  { id: '7D', label: 'Last 7 Days' },
  { id: '1Q', label: 'Last Quarter' },
] as const satisfies Array<{ id: TimeWindow; label: string }>;

const TimeWindowTabs = memo(function TimeWindowTabs({ activeWindow, onChange }: TimeWindowTabsProps) {
  return (
    <Tabs
      tabs={timeWindowTabs as Array<{ id: string; label: string }>}
      activeTab={activeWindow}
      onChange={onChange as (tabId: string) => void}
      className="cds-dashboard__tabs"
    />
  );
});

TimeWindowTabs.displayName = 'TimeWindowTabs';

export { TimeWindowTabs };