import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Check, Eye } from 'lucide-react';

const ViewKeyModal = ({ isOpen, onOpenChange, apiKey }) => {
    const { toast } = useToast();
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (!apiKey?.key) return;
        navigator.clipboard.writeText(apiKey.key);
        setCopied(true);
        toast({
            title: "Đã sao chép!",
            description: `Khóa "${apiKey.name}" đã được sao chép.`,
            variant: "success",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    if (!apiKey) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="h-6 w-6 text-cyan-400" />
                        Xem Khóa Admin
                    </DialogTitle>
                    <DialogDescription>
                        Đây là mã khóa đầy đủ cho: <strong>{apiKey.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative flex items-center mt-4">
                    <Input
                        id="view-key"
                        readOnly
                        value={apiKey.key}
                        className="pr-12 bg-slate-800 border-slate-600 font-mono text-sm"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1"
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ViewKeyModal;