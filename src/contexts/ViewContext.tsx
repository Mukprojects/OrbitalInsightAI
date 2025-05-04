
import { createContext, useContext, useState, ReactNode } from 'react';

type ViewType = 'dashboard' | 'satellites' | 'debris' | 'analytics' | 'weather' | 'navigation' | 'events';

interface ViewContextType {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider = ({ children }: { children: ReactNode }) => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  return (
    <ViewContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </ViewContext.Provider>
  );
};

export const useView = (): ViewContextType => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
};
