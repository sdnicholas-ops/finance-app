import { ReactNode } from 'react';

interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`cds-tabs ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
          className={`cds-tab ${activeTab === tab.id ? 'cds-tab--active' : ''} ${tab.disabled ? 'cds-tab--disabled' : ''}`}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
        >
          {tab.icon && <span className="cds-tab__icon">{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  tabId: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ id, tabId, activeTab, children, className = '' }: TabPanelProps) {
  if (activeTab !== tabId) return null;

  return (
    <div
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      className={`cds-tab-panel ${className}`}
    >
      {children}
    </div>
  );
}