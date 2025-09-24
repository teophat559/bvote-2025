import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AdminKeyLogin from './AdminKeyLogin';

const AdminKeyModal = ({ isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none p-0">
        <AdminKeyLogin onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default AdminKeyModal;

