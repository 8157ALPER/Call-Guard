import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from './queryClient';
import { Settings } from '@shared/schema';

// Define the accessibility context type
type AccessibilityContextType = {
  highContrast: boolean;
  largeText: boolean;
  textSizeMultiplier: string;
  setHighContrast: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  setTextSizeMultiplier: (value: string) => void;
};

// Create the context with default values
const AccessibilityContext = createContext<AccessibilityContextType>({
  highContrast: false,
  largeText: false,
  textSizeMultiplier: '1',
  setHighContrast: () => {},
  setLargeText: () => {},
  setTextSizeMultiplier: () => {},
});

// Hook for components to access the accessibility settings
export const useAccessibility = () => useContext(AccessibilityContext);

// Provider component that fetches accessibility settings from the server
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [textSizeMultiplier, setTextSizeMultiplier] = useState('1');

  // Fetch settings from server
  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<Settings>) => apiRequest('PATCH', '/api/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });

  // Update server when accessibility settings change
  useEffect(() => {
    if (settings) {
      if (settings.highContrastMode !== highContrast || 
          settings.largeTextMode !== largeText ||
          settings.textSizeMultiplier !== textSizeMultiplier) {
        
        updateSettingsMutation.mutate({
          highContrastMode: highContrast,
          largeTextMode: largeText,
          textSizeMultiplier: textSizeMultiplier
        });
      }
    }
  }, [highContrast, largeText, textSizeMultiplier]);

  // Sync state with server settings
  useEffect(() => {
    if (settings) {
      setHighContrast(settings.highContrastMode || false);
      setLargeText(settings.largeTextMode || false);
      setTextSizeMultiplier(settings.textSizeMultiplier || '1');
    }
  }, [settings]);

  // Apply the accessibility settings to the HTML/body element
  useEffect(() => {
    const html = document.documentElement;
    
    // Apply high contrast mode
    if (highContrast) {
      html.classList.add('high-contrast');
    } else {
      html.classList.remove('high-contrast');
    }
    
    // Apply text size
    html.style.fontSize = `${parseFloat(textSizeMultiplier) * 100}%`;
    
    return () => {
      // Cleanup
      html.classList.remove('high-contrast');
      html.style.fontSize = '100%';
    };
  }, [highContrast, textSizeMultiplier]);

  const value = {
    highContrast,
    largeText,
    textSizeMultiplier,
    setHighContrast,
    setLargeText,
    setTextSizeMultiplier,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};