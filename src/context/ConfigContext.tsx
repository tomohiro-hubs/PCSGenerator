import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConfigData, ConfigState } from '../types/config';

const ConfigContext = createContext<ConfigState | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'pcs_generator_config';

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [defaultConfig, setDefaultConfig] = useState<ConfigData | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const applyConfig = (base: ConfigData) => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const userConfig = JSON.parse(stored);
        // Deep merge or simple spread? Simple spread for top-level, but we have nested objects.
        // For simplicity, we'll replace whole sections if they exist in userConfig, or just use userConfig if it's full.
        // Assuming userConfig is a full ConfigData object.
        setConfig(userConfig);
      } else {
        setConfig(base);
      }
    } catch (e) {
      console.error('Failed to parse local storage config', e);
      setConfig(base);
    }
  };

  const fetchConfig = async () => {
    setStatus('loading');
    setError(null);
    try {
      const response = await fetch('data.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
      }
      const data: ConfigData = await response.json();
      setDefaultConfig(data);
      applyConfig(data);
      setStatus('ready');
    } catch (err) {
      console.error('Config load failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  const updateConfig = (newConfig: ConfigData) => {
    setConfig(newConfig);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newConfig));
  };

  const resetConfig = () => {
    if (defaultConfig) {
      setConfig(defaultConfig);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, status, error, reloadConfig: fetchConfig, updateConfig, resetConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
