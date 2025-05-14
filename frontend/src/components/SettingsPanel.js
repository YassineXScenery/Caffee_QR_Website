import React, { useState } from 'react';
import { FiSettings, FiGlobe } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

function SettingsPanel() {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');

  const handleLanguageChange = async (event) => {
    const newLang = event.target.value;
    setSelectedLanguage(newLang);
    await i18n.changeLanguage(newLang);
    // Save the language preference to localStorage
    localStorage.setItem('preferredLanguage', newLang);
  };

  return (
    <div id="settings-section" className="mb-16 px-4 sm:px-0" dir={selectedLanguage === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          <FiSettings className="mr-2" />
          {t('settings')}
        </h1>
        <span className="ml-3 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          {t('beta')}
        </span>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <FiGlobe className="mr-2" />
            {t('languageSettings')}
          </h2>
          <div className="max-w-md">
            <label htmlFor="language" className="block text-sm font-medium text-gray-600 mb-2">
              {t('selectLanguage')}
            </label>
            <div className="relative">
              <select
                id="language"
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="w-full px-4 py-3 pr-10 text-base bg-white border border-gray-200 rounded-xl shadow focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all appearance-none hover:border-blue-400 hover:shadow-lg font-semibold text-gray-800 cursor-pointer"
                style={{ minHeight: '3rem' }}
              >
                <option value="en">{t('english')}</option>
                <option value="fr">{t('french')}</option>
                <option value="ar">{t('arabic')}</option>
              </select>
              <svg className="pointer-events-none absolute top-1/2 right-4 transform -translate-y-1/2 w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
