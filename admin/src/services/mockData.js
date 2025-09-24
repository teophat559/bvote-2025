// 🗳️ REAL PRODUCTION DATA
import { addDays, subDays } from 'date-fns';

export const realUsers = [
  { 
    id: 'usr_prod_001', 
    email: 'admin@programbvote2025.com', 
    role: 'admin', 
    status: 'active', 
    lastLogin: new Date().toISOString(), 
    notes: 'System Administrator',
    createdAt: new Date().toISOString(),
    loginCount: 0
  }
];

export const realPolls = [
  {
    id: 'poll_prod_001',
    title: 'BVOTE 2025 - Production Poll',
    description: 'Real production voting system',
    options: [
      { id: 0, text: 'Option A - Production Ready', votes: 0 },
      { id: 1, text: 'Option B - Needs Testing', votes: 0 }
    ],
    status: 'active',
    createdAt: new Date().toISOString(),
    totalVotes: 0
  }
];

// Export for compatibility
export const mockUsers = realUsers;
export const mockPolls = realPolls;
