/**
 * UserBvote Adaptors Export
 */
export { contestAdaptor } from './domain/ContestAdaptor.js';
export { default as config } from './config.js';

// Adaptor Manager for UserBvote
import { contestAdaptor } from './domain/ContestAdaptor.js';
import config from './config.js';

class UserAdaptorManager {
  constructor() {
    this.adaptors = {
      contest: contestAdaptor,
    };
    
    this.mode = config.mode;
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) {
      return;
    }
    
    console.log(`🚀 UserBvote adaptors initializing in ${this.mode} mode`);
    
    try {
      console.log('✅ Contest adaptor initialized');
      
      this.initialized = true;
      console.log('🎉 UserBvote adaptors initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize UserBvote adaptors:', error);
      throw error;
    }
  }
  
  get(name) {
    return this.adaptors[name];
  }
  
  async switchMode(newMode) {
    if (newMode !== 'mock' && newMode !== 'real') {
      throw new Error('Invalid mode. Must be "mock" or "real"');
    }
    
    console.log(`🔄 UserBvote switching from ${this.mode} to ${newMode} mode`);
    
    config.mode = newMode;
    this.mode = newMode;
    
    Object.values(this.adaptors).forEach(adaptor => {
      adaptor.mode = newMode;
    });
    
    console.log(`✅ UserBvote switched to ${newMode} mode`);
  }
  
  isMockMode() {
    return this.mode === 'mock';
  }
  
  isRealMode() {
    return this.mode === 'real';
  }
}

export const userAdaptorManager = new UserAdaptorManager();

// Auto-initialize
if (typeof window !== 'undefined') {
  userAdaptorManager.initialize().catch(console.error);
}
