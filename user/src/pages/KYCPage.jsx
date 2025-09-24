import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Camera, Upload, CheckCircle, XCircle, Info, Loader } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { apiService } from '@/services/apiService';

const KYCPage = () => {
    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const [submissionStatus, setSubmissionStatus] = useState(null); // null, 'pending', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const handleFileChange = (setter) => (event) => {
        if (event.target.files && event.target.files[0]) {
            setter(event.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!idFront || !idBack || !selfie) {
            toast.error('Vui lòng tải lên đủ 3 ảnh.');
            return;
        }

        setSubmissionStatus('pending');
        setErrorMessage('');

        const formData = new FormData();
        formData.append('idFront', idFront);
        formData.append('idBack', idBack);
        formData.append('selfie', selfie);

        try {
            // In a real application, you'd send formData to your backend.
            // For mock, we'll just simulate success.
            await apiService.submitKYC({
                idFront: idFront.name,
                idBack: idBack.name,
                selfie: selfie.name
            });
            setSubmissionStatus('success');
            toast.success('Hồ sơ KYC của bạn đã được gửi thành công!');
        } catch (error) {
            setSubmissionStatus('error');
            setErrorMessage(error.message || 'Đã xảy ra lỗi khi gửi hồ sơ KYC.');
            toast.error(`Lỗi gửi KYC: ${error.message}`);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="container mx-auto px-4 py-8 min-h-screen bg-gradient-to-br from-gray-900 to-black text-white"
        >
            <Helmet>
                <title>Xác minh KYC - Giọng Hát Vàng 2025</title>
                <meta name="description" content="Hướng dẫn và quy trình xác minh danh tính (KYC) để tham gia bình chọn tại Giọng Hát Vàng 2025." />
                <meta property="og:title" content="Xác minh KYC - Giọng Hát Vàng 2025" />
                <meta property="og:description" content="Hướng dẫn và quy trình xác minh danh tính (KYC) để tham gia bình chọn tại Giọng Hát Vàng 2025." />
            </Helmet>
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-highlight"
            >
                Xác minh danh tính (KYC)
            </motion.h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="max-w-3xl mx-auto"
            >
                <Card className="bg-gray-800/70 border-gray-700 p-6">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl text-primary-foreground flex items-center">
                            <Info className="mr-2 text-blue-400" /> Hướng dẫn xác minh
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Để đảm bảo tính công bằng và bảo mật, vui lòng hoàn tất quy trình xác minh danh tính (KYC) của bạn. Quy trình này bao gồm việc tải lên các tài liệu sau:</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Ảnh mặt trước của giấy tờ tùy thân (CCCD/CMND/Hộ chiếu).</li>
                            <li>Ảnh mặt sau của giấy tờ tùy thân.</li>
                            <li>Ảnh selfie của bạn cầm giấy tờ tùy thân.</li>
                        </ul>
                        <p className="font-semibold text-yellow-400 flex items-center">
                            <Info className="w-5 h-5 mr-2" /> Lưu ý: Đảm bảo ảnh rõ nét, không bị lóa, và thông tin trên giấy tờ phải trùng khớp với thông tin đăng ký của bạn.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800/70 border-gray-700 p-6 mt-8">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl text-primary-foreground flex items-center">
                            <Upload className="mr-2 text-green-400" /> Tải lên tài liệu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="idFront" className="text-lg mb-2 block">Ảnh mặt trước giấy tờ tùy thân</Label>
                                <Input
                                    id="idFront"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange(setIdFront)}
                                    className="file:text-primary file:bg-primary-foreground file:border-0 file:rounded-md file:py-2 file:px-4 file:mr-4 file:cursor-pointer hover:file:bg-primary-foreground/90"
                                />
                                {idFront && <p className="text-sm text-muted-foreground mt-2">Đã chọn: {idFront.name}</p>}
                            </div>
                            <div>
                                <Label htmlFor="idBack" className="text-lg mb-2 block">Ảnh mặt sau giấy tờ tùy thân</Label>
                                <Input
                                    id="idBack"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange(setIdBack)}
                                    className="file:text-primary file:bg-primary-foreground file:border-0 file:rounded-md file:py-2 file:px-4 file:mr-4 file:cursor-pointer hover:file:bg-primary-foreground/90"
                                />
                                {idBack && <p className="text-sm text-muted-foreground mt-2">Đã chọn: {idBack.name}</p>}
                            </div>
                            <div>
                                <Label htmlFor="selfie" className="text-lg mb-2 block">Ảnh selfie cầm giấy tờ tùy thân</Label>
                                <Input
                                    id="selfie"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange(setSelfie)}
                                    className="file:text-primary file:bg-primary-foreground file:border-0 file:rounded-md file:py-2 file:px-4 file:mr-4 file:cursor-pointer hover:file:bg-primary-foreground/90"
                                />
                                {selfie && <p className="text-sm text-muted-foreground mt-2">Đã chọn: {selfie.name}</p>}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg font-bold"
                                disabled={submissionStatus === 'pending'}
                            >
                                {submissionStatus === 'pending' ? (
                                    <><Loader className="animate-spin mr-2" /> Đang gửi...</>
                                ) : (
                                    'Gửi hồ sơ xác minh'
                                )}
                            </Button>

                            {submissionStatus === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-center text-green-400"
                                >
                                    <CheckCircle className="w-6 h-6 mr-3" />
                                    <p>Hồ sơ của bạn đã được gửi thành công. Chúng tôi sẽ xem xét trong thời gian sớm nhất!</p>
                                </motion.div>
                            )}
                            {submissionStatus === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center text-red-400"
                                >
                                    <XCircle className="w-6 h-6 mr-3" />
                                    <p>Lỗi: {errorMessage || 'Không thể gửi hồ sơ. Vui lòng thử lại.'}</p>
                                </motion.div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
};

export default KYCPage;