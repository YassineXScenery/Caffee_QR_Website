import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiFacebook, FiInstagram, FiTwitter, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:3000/api';

function Footer() {
  const { t } = useTranslation();  const [footerData, setFooterData] = useState({
    social: [],
    contact: {
      phone: [],
      email: ''
    },
    location: {
      address: []
    }
  });
  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const response = await axios.get(`${API_URL}/footer`);
        console.log('Footer data received:', response.data);
        setFooterData(response.data);
      } catch (err) {
        console.error('Error fetching footer data:', err);
      }
    };

    fetchFooterData();
  }, []);

  const getSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <FiFacebook className="h-5 w-5" />;
      case 'instagram':
        return <FiInstagram className="h-5 w-5" />;
      case 'twitter':
        return <FiTwitter className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <footer className="bg-white shadow-lg mt-12">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Social Media Links */}
          <div>
            <h3 className="text-gray-900 text-lg font-semibold mb-4">{t('followUs')}</h3>            <div className="space-y-3">
              {footerData.social.map((social, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <a
                    href={social.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                    aria-label={social.label}
                  >                    <span className="inline-block w-6">{getSocialIcon(social.label)}</span>
                    <span className="text-sm">{social.display_name ? social.display_name : t(social.label.toLowerCase())}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>          {/* Contact Information */}          <div>
            <h3 className="text-gray-900 text-lg font-semibold mb-4">{t('contactUs')}</h3>
            <div className="space-y-2">
              {Array.isArray(footerData.contact.phone) && footerData.contact.phone.map((phone, idx) => (
                phone && (
                  <p key={idx} className="flex items-center text-gray-600">
                    <FiPhone className="h-5 w-5 mr-2" />
                    <span>{phone}</span>
                  </p>
                )
              ))}
              {footerData.contact.email && (
                <p className="flex items-center text-gray-600">
                  <FiMail className="h-5 w-5 mr-2" />
                  <span>{footerData.contact.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Location Information */}          <div>
            <h3 className="text-gray-900 text-lg font-semibold mb-4">{t('location')}</h3>
            <div className="space-y-2">
              {Array.isArray(footerData.location.address) && footerData.location.address.map((address, idx) => (
                address && (
                  <p key={idx} className="flex items-center text-gray-600">
                    <FiMapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>{address}</span>
                  </p>
                )
              ))}
            </div>
          </div></div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
