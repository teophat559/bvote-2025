import React from 'react';

const ObsoleteComponent = () => {
  return (
    <div className="p-4 m-4 bg-yellow-900/20 border border-yellow-700 rounded-lg text-yellow-300">
      <p className="font-bold">Component Lỗi Thời</p>
      <p className="text-sm">Thành phần này không còn được sử dụng và đã được lên lịch để xóa.</p>
    </div>
  );
};

export default ObsoleteComponent;