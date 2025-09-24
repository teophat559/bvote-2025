/**
 * Unit Tests for AutoLoginWorkflow Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AutoLoginWorkflow from '../../components/dashboard/AutoLoginWorkflow';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('react-hot-toast');
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => children
}));

describe('AutoLoginWorkflow', () => {
  const mockOnVictimControlOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders workflow steps correctly', () => {
    render(<AutoLoginWorkflow onVictimControlOpen={mockOnVictimControlOpen} />);
    
    expect(screen.getByText('Auto Login Workflow')).toBeInTheDocument();
    expect(screen.getByText('User Request')).toBeInTheDocument();
    expect(screen.getByText('Auto Login Process')).toBeInTheDocument();
    expect(screen.getByText('Admin Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Admin Intervention')).toBeInTheDocument();
    expect(screen.getByText('Final Processing')).toBeInTheDocument();
  });

  test('shows intervention panel when admin monitoring is active', () => {
    render(<AutoLoginWorkflow onVictimControlOpen={mockOnVictimControlOpen} />);
    
    expect(screen.getByText('Cần Can Thiệp')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập mã OTP...')).toBeInTheDocument();
    expect(screen.getByText('Gửi OTP')).toBeInTheDocument();
  });

  test('handles OTP submission', async () => {
    render(<AutoLoginWorkflow onVictimControlOpen={mockOnVictimControlOpen} />);
    
    const otpInput = screen.getByPlaceholderText('Nhập mã OTP...');
    const submitButton = screen.getByText('Gửi OTP');
    
    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Đã cung cấp OTP: 123456');
    });
  });

  test('handles manual approval', async () => {
    render(<AutoLoginWorkflow onVictimControlOpen={mockOnVictimControlOpen} />);
    
    const approvalButton = screen.getByText('Duyệt thủ công');
    fireEvent.click(approvalButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Đã duyệt thủ công');
    });
  });

  test('handles abort action', async () => {
    render(<AutoLoginWorkflow onVictimControlOpen={mockOnVictimControlOpen} />);
    
    const abortButton = screen.getByText('Hủy bỏ');
    fireEvent.click(abortButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Đã hủy quá trình auto login');
    });
  });

  test('opens victim control modal', () => {
    render(<AutoLoginWorkflow onVictimControlOpen={mockOnVictimControlOpen} />);
    
    const controlButton = screen.getByText('Control Victim');
    fireEvent.click(controlButton);
    
    expect(mockOnVictimControlOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'Target_User_001',
        ip: '192.168.1.50',
        location: 'Hà Nội, VN'
      })
    );
  });

  test('shows correct step status badges', () => {
    render(<AutoLoginWorkflow onVictimControlOpen={mockOnVictimControlOpen} />);
    
    expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
    expect(screen.getByText('Đang giám sát')).toBeInTheDocument();
    expect(screen.getByText('Chờ can thiệp')).toBeInTheDocument();
  });
});
