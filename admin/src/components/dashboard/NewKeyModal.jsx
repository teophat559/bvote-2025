import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Check, ShieldCheck } from 'lucide-react';

const NewKeyModal = ({ isOpen, onOpenChange, newKey }) => {
    const { toast } = useToast();
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(newKey.key);
        setCopied(true);
        toast({
            title: "Đã sao chép!",
            description: "Khóa admin đã được sao chép vào clipboard.",
            variant: "success",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    if (!newKey) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-green-400" />
                        Khóa Admin Mới Đã Được Tạo
                    </DialogTitle>
                    <DialogDescription>
                        Đây là lần duy nhất bạn sẽ thấy khóa này. Hãy sao chép và lưu trữ ở một nơi an toàn.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative flex items-center mt-4">
                    <Input
                        id="new-key"
                        readOnly
                        value={newKey.key}
                        className="pr-12 bg-slate-800 border-slate-600 font-mono"
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
                    <Button onClick={() => onOpenChange(false)}>Đã hiểu</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NewKeyModal;