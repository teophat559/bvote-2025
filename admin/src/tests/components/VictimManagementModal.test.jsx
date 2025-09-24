/**
 * Unit Tests for VictimManagementModal Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import VictimManagementModal from '../../components/dashboard/VictimManagementModal';

// Mock dependencies
vi.mock('react-hot-toast');
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => children
}));

describe('VictimManagementModal', () => {
  const mockVictim = {
    id: 'Target_User_001',
    ip: '192.168.1.50',
    location: 'Hà Nội, VN',
    device: 'Windows 11 - Chrome 120',
    status: 'online',
    os: 'Windows 11',
    browser: 'Chrome 120',
    lastSeen: '08:30:15'
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal when open', () => {
    render(
      <VictimManagementModal 
        victim={mockVictim} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('Victim Management - Target_User_001')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.50')).toBeInTheDocument();
    expect(screen.getByText('Hà Nội, VN')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <VictimManagementModal 
        victim={mockVictim} 
        isOpen={false} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.queryByText('Victim Management - Target_User_001')).not.toBeInTheDocument();
  });

  test('renders all tabs', () => {
    render(
      <VictimManagementModal 
        victim={mockVictim} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('Điều khiển')).toBeInTheDocument();
    expect(screen.getByText('Màn hình')).toBeInTheDocument();
    expect(screen.getByText('File Manager')).toBeInTheDocument();
    expect(screen.getByText('Thông tin')).toBeInTheDocument();
  });

  test('switches tabs correctly', () => {
    render(
      <VictimManagementModal 
        victim={mockVictim} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    );
    
    const infoTab = screen.getByText('Thông tin');
    fireEvent.click(infoTab);
    
    expect(screen.getByText('Thông tin hệ thống')).toBeInTheDocument();
    expect(screen.getByText('Thông tin mạng')).toBeInTheDocument();
  });

  test('closes modal when close button clicked', () => {
    render(
      <VictimManagementModal 
        victim={mockVictim} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /✕/ });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows victim status badge', () => {
    render(
      <VictimManagementModal 
        victim={mockVictim} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByLabelText('status:online')).toBeInTheDocument();
    expect(screen.getByText('Windows 11')).toBeInTheDocument();
    expect(screen.getByText('Chrome 120')).toBeInTheDocument();
  });
});
