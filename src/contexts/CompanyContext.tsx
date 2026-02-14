import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company, CompanySettings } from '../types';
import { companyApi } from '../api';

interface CompanyContextType {
  company: Company | null;
  settings: CompanySettings | null;
  isLoading: boolean;
  error: string | null;
  refreshCompany: () => Promise<void>;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await companyApi.getCompany();
      console.log('Company data fetched:', response.company);
      console.log('Company logo:', response.company.logo);
      setCompany(response.company);
      setSettings(response.company.settings);
    } catch (err: any) {
      console.error('Error fetching company data:', err);
      setError(err.response?.data?.message || 'Failed to fetch company data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCompany = async () => {
    await fetchCompanyData();
  };

  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    try {
      await companyApi.updateSettings(newSettings);
      if (settings) {
        setSettings({ ...settings, ...newSettings });
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update settings');
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const value: CompanyContextType = {
    company,
    settings,
    isLoading,
    error,
    refreshCompany,
    updateSettings,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
