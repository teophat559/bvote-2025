import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { FileText, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const LoginLogger = ({ accountId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;

    // Initial load
    loadLogs();

    // Poll for new logs every 2 seconds
    const interval = setInterval(loadLogs, 2000);

    return () => clearInterval(interval);
  }, [accountId]);

  const loadLogs = async () => {
    try {
      const response = await fetch(`/api/facebook/logs/${accountId}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const getIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      success: 'success',
      warning: 'warning',
      error: 'destructive',
      info: 'default'
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Nhật Ký Đăng Nhập
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full pr-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Đang tải nhật ký...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Chưa có nhật ký nào
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="mt-0.5">
                    {getIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        [{formatTime(log.timestamp)}]
                      </span>
                      {getStatusBadge(log.status)}
                    </div>
                    <div className="text-sm font-medium">
                      {log.action}
                    </div>
                    {log.details && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LoginLogger;
