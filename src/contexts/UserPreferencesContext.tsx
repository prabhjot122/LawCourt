import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserPreferences {
  // Dashboard preferences
  dashboardLayout: 'grid' | 'list';
  dashboardWidgets: string[];
  compactMode: boolean;

  // Notification preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationSound: boolean;
  notificationFrequency: 'immediate' | 'hourly' | 'daily';

  // Content preferences
  defaultContentView: 'card' | 'list' | 'table';
  itemsPerPage: number;
  autoSave: boolean;

  // Accessibility preferences
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';

  // Language and locale
  language: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

  // Privacy preferences
  profileVisibility: 'public' | 'private' | 'friends';
  activityTracking: boolean;
  analyticsOptIn: boolean;
}

const defaultPreferences: UserPreferences = {
  dashboardLayout: 'grid',
  dashboardWidgets: ['recent-activity', 'quick-stats', 'notifications', 'upcoming-events'],
  compactMode: false,
  emailNotifications: true,
  pushNotifications: true,
  notificationSound: true,
  notificationFrequency: 'immediate',
  defaultContentView: 'card',
  itemsPerPage: 10,
  autoSave: true,
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  profileVisibility: 'public',
  activityTracking: true,
  analyticsOptIn: true,
};

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  exportPreferences: () => string;
  importPreferences: (data: string) => boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

interface UserPreferencesProviderProps {
  children: React.ReactNode;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({
  children,
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('userPreferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all properties exist
        return { ...defaultPreferences, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
    return defaultPreferences;
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }, [preferences]);

  // Apply accessibility preferences to document
  useEffect(() => {
    const root = document.documentElement;

    // Apply reduced motion preference
    if (preferences.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    // Apply font size preference
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.setProperty('--base-font-size', fontSizeMap[preferences.fontSize]);

    // Apply high contrast if needed
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [preferences.reducedMotion, preferences.fontSize, preferences.highContrast]);

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  const exportPreferences = () => {
    return JSON.stringify(preferences, null, 2);
  };

  const importPreferences = (data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      // Validate that it's a valid preferences object
      if (typeof parsed === 'object' && parsed !== null) {
        setPreferences({ ...defaultPreferences, ...parsed });
        return true;
      }
    } catch (error) {
      console.error('Failed to import preferences:', error);
    }
    return false;
  };

  const value = {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    exportPreferences,
    importPreferences,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};
