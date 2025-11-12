import React, { createContext, useContext, useState, useEffect } from 'react';

interface DemoContextType {
  isDemoStarted: boolean;
  startDemo: () => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoStarted, setIsDemoStarted] = useState(() => {
    const saved = localStorage.getItem('demoStarted');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('demoStarted', isDemoStarted.toString());
  }, [isDemoStarted]);

  const startDemo = () => {
    setIsDemoStarted(true);
  };

  const resetDemo = () => {
    setIsDemoStarted(false);
    localStorage.removeItem('demoStarted');
  };

  return (
    <DemoContext.Provider value={{ isDemoStarted, startDemo, resetDemo }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
