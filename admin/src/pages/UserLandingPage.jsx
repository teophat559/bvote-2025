import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader } from 'lucide-react';
import { Helmet } from 'react-helmet';

const UI_SETTINGS_KEY = 'userLandingPageUISettings';

const defaultSettings = {
  logoUrl: '/logo.svg',
  backgroundImageUrl: '',
  backgroundColor: '#020817',
  heading: 'Cổng Dịch Vụ An Toàn',
  subheading: 'Chúng tôi đang chuẩn bị chuyển hướng bạn một cách an toàn. Vui lòng đợi trong giây lát.',
  loadingText: 'Đang xác thực và thiết lập kết nối an toàn...',
  successText: 'Chuyển hướng thành công!',
  textColor: '#e2e8f0',
};

const UserLandingPage = () => {
    const { linkId } = useParams();
    const [status, setStatus] = useState('loading');
    const [uiSettings, setUiSettings] = useState(defaultSettings);

    useEffect(() => {
        const savedSettings = localStorage.getItem(UI_SETTINGS_KEY);
        if (savedSettings) {
            setUiSettings(JSON.parse(savedSettings));
        }
    }, []);

    useEffect(() => {
        console.log(`Processing link ID: ${linkId}`);
        
        const loadingTimer = setTimeout(() => {
            setStatus('success');
        }, 3000);

        const redirectTimer = setTimeout(() => {
            // In a real scenario, you would redirect to a URL associated with the linkId
            // For this demo, we'll just show the success state.
            console.log('Redirect would happen here.');
        }, 5000);

        return () => {
            clearTimeout(loadingTimer);
            clearTimeout(redirectTimer);
        };
    }, [linkId]);

    const containerStyle = {
        backgroundColor: uiSettings.backgroundColor,
        color: uiSettings.textColor,
        backgroundImage: uiSettings.backgroundImageUrl ? `url(${uiSettings.backgroundImageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    return (
        <>
            <Helmet>
                <title>{uiSettings.heading}</title>
                <meta name="description" content={uiSettings.subheading} />
            </Helmet>
            <div
                style={containerStyle}
                className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
            >
                {uiSettings.backgroundImageUrl && <div className="absolute inset-0 bg-black/50 z-0" />}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center z-10"
                >
                    <img src={uiSettings.logoUrl} alt="Logo" className="h-16 w-16 mx-auto mb-6" />
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{uiSettings.heading}</h1>
                    <p className="text-lg md:text-xl max-w-2xl mx-auto">{uiSettings.subheading}</p>

                    <div className="mt-12 h-20 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {status === 'loading' && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center text-xl"
                                >
                                    <Loader className="animate-spin mr-4 h-8 w-8" />
                                    <span>{uiSettings.loadingText}</span>
                                </motion.div>
                            )}
                            {status === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center text-xl text-green-400"
                                >
                                    <CheckCircle className="mr-4 h-8 w-8" />
                                    <span>{uiSettings.successText}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default UserLandingPage;