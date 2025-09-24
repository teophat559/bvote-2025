import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';

const Chart = () => {
  const data = [
    { name: '00:00', success: 40, fail: 24 },
    { name: '04:00', success: 30, fail: 13 },
    { name: '08:00', success: 20, fail: 98 },
    { name: '12:00', success: 27, fail: 39 },
    { name: '16:00', success: 18, fail: 48 },
    { name: '20:00', success: 23, fail: 38 },
    { name: '24:00', success: 34, fail: 43 },
  ];
  return (
    <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart2 className="mr-2" />
          Thống kê truy cập
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.5)" />
            <YAxis stroke="rgba(255, 255, 255, 0.5)" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
            <Legend />
            <Line type="monotone" dataKey="success" stroke="#4ade80" strokeWidth={2} name="Thành công" />
            <Line type="monotone" dataKey="fail" stroke="#f87171" strokeWidth={2} name="Thất bại" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default Chart;