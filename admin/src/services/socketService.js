import { io } from 'socket.io-client';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1';

// Browser-compatible EventEmitter
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventName, listener) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }

  emit(eventName, ...args) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(listener => listener(...args));
    }
  }

  off(eventName, listenerToRemove) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(listener => listener !== listenerToRemove);
    }
  }
}

class SocketService {
  constructor() {
    this.socket = null;
    this.mockInterval = null;
  }

  connect() {
    if (this.socket) {
      return;
    }

    if (USE_MOCK) {
      this.socket = new (this.createMockSocket())();
      console.log('--- MOCK SOCKET CONNECTED ---');
      this.startMocking();
    } else {
      const socketUrl = import.meta.env.VITE_SOCKET_URL;
      const token = localStorage.getItem('authToken');

      this.socket = io(socketUrl, {
        auth: { token },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log(USE_MOCK ? '--- MOCK SOCKET DISCONNECTED ---' : 'Socket disconnected');
    }
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
  
  createMockSocket() {
    class MockSocket extends EventEmitter {
      constructor() {
        super();
        this.connected = true;
      }
      disconnect() {
        this.connected = false;
        this.emit('disconnect', 'io client disconnect');
      }
    }
    return MockSocket;
  }

  startMocking() {
    const mockEvents = [
      { event: 'vote.cast', message: 'user_xyz đã bỏ phiếu cho thí sinh A.' },
      { event: 'auth.begin', message: 'user_abc đang thử đăng nhập.' },
      { event: 'kyc.status', message: 'KYC của user_123 đã được duyệt.' },
      { event: 'session.start', message: 'user_new đã bắt đầu phiên làm việc.' },
      { event: 'session.end', message: 'user_def đã đăng xuất.' },
    ];
    
    this.mockInterval = setInterval(() => {
        if(this.socket && this.socket.connected) {
            const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
            this.socket.emit('admin:feed', randomEvent);
        }
    }, 3000 + Math.random() * 2000);
  }
}

export const socketService = new SocketService();