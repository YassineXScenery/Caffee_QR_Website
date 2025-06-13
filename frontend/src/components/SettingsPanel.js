import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import ReportReceivers from './ReportReceivers';
import { useLocation } from 'react-router-dom';

const API_URL = 'http://localhost:3000/api';

function SettingsPanel() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  const [footerSettings, setFooterSettings] = useState({
    social: [],
    contact: { phone: [''], email: '' },
    location: { address: [''] }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openSection, setOpenSection] = useState(null); // 'language', 'footer', or 'report-receivers'

  useEffect(() => {
    const fetchFooterSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/footer`);
        setFooterSettings({
          ...response.data,
          contact: {
            ...response.data.contact,
            phone: Array.isArray(response.data.contact.phone)
              ? response.data.contact.phone
              : response.data.contact.phone
                ? [response.data.contact.phone]
                : [''],
            email: response.data.contact.email || ''
          },
          location: {
            ...response.data.location,
            address: Array.isArray(response.data.location.address)
              ? response.data.location.address
              : response.data.location.address
                ? [response.data.location.address]
                : ['']
          }
        });
      } catch (err) {
        console.error('Error fetching footer settings:', err);
        setError(t('failedToLoadSettings'));
      }
    };

    fetchFooterSettings();
  }, [t]);

  useEffect(() => {
    if (location.state && location.state.openSection === 'report-receivers') {
      setOpenSection('report-receivers');
    }
  }, [location.state]);

  const handleLanguageChange = async (event) => {
    const newLang = event.target.value;
    setSelectedLanguage(newLang);
    await i18n.changeLanguage(newLang);
    localStorage.setItem('preferredLanguage', newLang);
  };

  const handleSocialMediaAdd = () => {
    setFooterSettings(prev => ({
      ...prev,
      social: [...prev.social, { label: '', value: '', display_name: '' }]
    }));
  };

  const handleSocialMediaChange = (index, field, value) => {
    setFooterSettings(prev => ({
      ...prev,
      social: prev.social.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSocialMediaRemove = (index) => {
    setFooterSettings(prev => ({
      ...prev,
      social: prev.social.filter((_, i) => i !== index)
    }));
  };

  const handleContactChange = (field, value) => {
    setFooterSettings(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
  };

  const handleAddPhone = () => {
    setFooterSettings(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        phone: [...(prev.contact.phone || ['']), '']
      }
    }));
  };

  const handleRemovePhone = idx => {
    setFooterSettings(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        phone: prev.contact.phone.filter((_, i) => i !== idx)
      }
    }));
  };

  const handlePhoneChange = (idx, value) => {
    setFooterSettings(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        phone: prev.contact.phone.map((p, i) => (i === idx ? value : p))
      }
    }));
  };

  const handleAddAddress = () => {
    setFooterSettings(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: [...(prev.location.address || ['']), '']
      }
    }));
  };

  const handleRemoveAddress = idx => {
    setFooterSettings(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: prev.location.address.filter((_, i) => i !== idx)
      }
    }));
  };

  const handleAddressChange = (idx, value) => {
    setFooterSettings(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: prev.location.address.map((a, i) => (i === idx ? value : a))
      }
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.put(`${API_URL}/footer`, { 
        settings: footerSettings 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess(t('settingsSaved'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('failedToSaveSettings'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto py-8">
      <button
        className="fixed top-6 left-6 z-50 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
        onClick={() => window.history.back()}
      >
        ← {t('back')}
      </button>
      <h2 className="text-3xl font-bold mb-6 text-blue-700">{t('settings')}</h2>
      <div className="space-y-8">
        {/* Language Settings Collapsible */}
        <div className="bg-white rounded-xl shadow p-6">
          <button
            className="w-full flex justify-between items-center text-lg font-semibold text-blue-700 focus:outline-none"
            onClick={() => setOpenSection(openSection === 'language' ? null : 'language')}
          >
            {t('languageSettings')}
            <span>{openSection === 'language' ? <FiChevronUp /> : <FiChevronDown />}</span>
          </button>
          {openSection === 'language' && (
            <div className="mt-4">
              <label htmlFor="language" className="block text-sm font-medium text-gray-600 mb-2">
                {t('selectLanguage')}
              </label>
              <select
                id="language"
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="en">{t('english')}</option>
                <option value="fr">{t('french')}</option>
                <option value="ar">{t('arabic')}</option>
              </select>
              {openSection === 'language' && error && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg mt-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              {openSection === 'language' && success && (
                <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg mt-4">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`mt-2 px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                  isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? t('saving') : t('saveSettings')}
              </button>
            </div>
          )}
        </div>
        {/* Footer Settings Collapsible */}
        <div className="bg-white rounded-xl shadow p-6">
          <button
            className="w-full flex justify-between items-center text-lg font-semibold text-blue-700 focus:outline-none"
            onClick={() => setOpenSection(openSection === 'footer' ? null : 'footer')}
          >
            {t('footerSettings')}
            <span>{openSection === 'footer' ? <FiChevronUp /> : <FiChevronDown />}</span>
          </button>
          {openSection === 'footer' && (
            <div className="mt-4">
              {/* Social Media */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">{t('socialMedia')}</h3>
                {footerSettings.social.map((social, index) => (
                  <div key={index} className="flex gap-4 mb-3">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <select
                        value={social.label}
                        onChange={(e) => handleSocialMediaChange(index, 'label', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="">{t('platform')}</option>
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="twitter">Twitter</option>
                      </select>
                      <input
                        type="text"
                        value={social.display_name || ''}
                        onChange={(e) => handleSocialMediaChange(index, 'display_name', e.target.value)}
                        placeholder={t('enterDisplayName')}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <input
                      type="url"
                      value={social.value || ''}
                      onChange={(e) => handleSocialMediaChange(index, 'value', e.target.value)}
                      placeholder={t('enterLink')}
                      className="flex-2 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleSocialMediaRemove(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleSocialMediaAdd}
                  className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiPlus className="h-5 w-5 mr-1" />
                  {t('addSocialMedia')}
                </button>
              </div>

              {/* Contact Information */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">{t('contactInformation')}</h3>
                <div className="space-y-3">
                  {(footerSettings.contact.phone || ['']).map((phone, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => handlePhoneChange(idx, e.target.value)}
                        placeholder={t('enterPhoneNumber')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                      {footerSettings.contact.phone.length > 1 && (
                        <button type="button" onClick={() => handleRemovePhone(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={handleAddPhone} className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <FiPlus className="h-5 w-5 mr-1" /> {t('addPhone')}
                  </button>
                  <input
                    type="email"
                    value={footerSettings.contact.email || ''}
                    onChange={e => handleContactChange('email', e.target.value)}
                    placeholder={t('enterEmailAddress')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">{t('locationInformation')}</h3>
                {(footerSettings.location.address || ['']).map((address, idx) => (
                  <div key={idx} className="flex gap-2 items-center mb-2">
                    <textarea
                      value={address}
                      onChange={e => handleAddressChange(idx, e.target.value)}
                      placeholder={t('enterAddress')}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    {footerSettings.location.address.length > 1 && (
                      <button type="button" onClick={() => handleRemoveAddress(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={handleAddAddress} className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <FiPlus className="h-5 w-5 mr-1" /> {t('addAddress')}
                </button>
              </div>
              {openSection === 'footer' && error && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg mt-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              {openSection === 'footer' && success && (
                <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg mt-4">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`mt-2 px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                  isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? t('saving') : t('saveSettings')}
              </button>
            </div>
          )}
        </div>
        {/* Report Receivers Collapsible */}
        <div className="bg-white rounded-xl shadow p-6">
          <button
            className="w-full flex justify-between items-center text-lg font-semibold text-blue-700 focus:outline-none"
            onClick={() => setOpenSection(openSection === 'report-receivers' ? null : 'report-receivers')}
          >
            {t('reportReceiversSettings')}
            <span>{openSection === 'report-receivers' ? <FiChevronUp /> : <FiChevronDown />}</span>
          </button>
          {openSection === 'report-receivers' && (
            <div className="mt-4">
              <ReportReceivers />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;