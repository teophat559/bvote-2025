import React, { Suspense } from 'react';
import ContentWindow from '@/components/dashboard/ContentWindow';

const LoginRequestTable = React.lazy(() => import('@/components/dashboard/AccessLogTable'));

const DashboardContent = () => {
    return (
        <ContentWindow 
            title="Bảng Điều Khiển LOGIN AUTO"
            secondaryTitle="Danh Sách Lịch Sử Truy Cập"
        >
            <Suspense fallback={<div className="h-[500px] w-full bg-slate-900/50 rounded-lg flex items-center justify-center">Đang tải bảng yêu cầu...</div>}>
                <LoginRequestTable />
            </Suspense>
        </ContentWindow>
    );
};

export default DashboardContent;