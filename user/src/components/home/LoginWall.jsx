import React from 'react';

const LoginWall = ({ onLoginRequest }) => {
    return (
        <div
            onClick={onLoginRequest}
            className="absolute inset-0 z-30 cursor-pointer bg-black/10 backdrop-blur-sm"
            aria-label="Nhấp để đăng nhập và bình chọn"
            role="button"
        >
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center p-4 bg-background/50 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-glow">Yêu cầu đăng nhập</h3>
                <p className="text-center text-muted-foreground mt-2">
                    Vui lòng đăng nhập để bình chọn cho các thí sinh yêu thích.
                </p>
            </div>
        </div>
    );
};

export default LoginWall;