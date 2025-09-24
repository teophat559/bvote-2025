import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Chrome, Plus, Edit, Trash2, Play, Square, RotateCcw, Copy, Search } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

const ProfileManagement = ({ searchTerm }) => {
    const [profiles, setProfiles] = useState([
        {
            id: 1,
            name: 'Profile Facebook 01',
            platform: 'Facebook',
            status: 'Active',
            lastUsed: '2025-09-06 07:15:30',
            cookies: 'Valid',
            proxy: '192.168.1.100:8080',
            userAgent: 'Chrome/120.0.0.0'
        },
        {
            id: 2,
            name: 'Profile Instagram 01',
            platform: 'Instagram',
            status: 'Inactive',
            lastUsed: '2025-09-06 06:45:12',
            cookies: 'Expired',
            proxy: '192.168.1.101:8080',
            userAgent: 'Chrome/120.0.0.0'
        },
        {
            id: 3,
            name: 'Profile Twitter 01',
            platform: 'Twitter',
            status: 'Active',
            lastUsed: '2025-09-06 07:20:45',
            cookies: 'Valid',
            proxy: '192.168.1.102:8080',
            userAgent: 'Chrome/120.0.0.0'
        }
    ]);

    const { toast } = useToast();

    const handleProfileAction = (action, profileId, profileName) => {
        toast({
            title: `${action} Profile`,
            description: `Đã thực hiện ${action} cho "${profileName}"`,
        });
    };

    const filteredProfiles = profiles.filter(profile =>
        profile.name.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
        profile.platform.toLowerCase().includes(searchTerm?.toLowerCase() || '')
    );

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-3xl font-bold">Quản Lý Profile</h1>
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Tạo Profile Mới
                </Button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                            <Chrome className="h-6 w-6 text-blue-400" />
                            Danh Sách Profile Chrome
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                                        <TableHead className="text-slate-300 font-semibold">Tên Profile</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Platform</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Trạng Thái</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Lần Cuối Sử Dụng</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Cookies</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Proxy</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Hành Động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProfiles.map((profile) => (
                                        <TableRow key={profile.id} className="border-slate-700 hover:bg-slate-800/30 transition-colors">
                                            <TableCell className="text-slate-300 font-medium">
                                                {profile.name}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <Badge variant="outline" className="border-blue-500 text-blue-400">
                                                    {profile.platform}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <Badge variant={profile.status === 'Active' ? 'default' : 'secondary'}>
                                                    {profile.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-300 font-mono text-sm">
                                                {profile.lastUsed}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <Badge variant={profile.cookies === 'Valid' ? 'default' : 'destructive'}>
                                                    {profile.cookies}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm">{profile.proxy}</span>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-6 w-6 p-0 hover:bg-slate-700"
                                                        onClick={() => navigator.clipboard.writeText(profile.proxy)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <div className="flex gap-1">
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 px-2 text-green-400 hover:bg-green-500/10"
                                                        onClick={() => handleProfileAction('Start', profile.id, profile.name)}
                                                    >
                                                        <Play className="h-3 w-3" />
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 px-2 text-red-400 hover:bg-red-500/10"
                                                        onClick={() => handleProfileAction('Stop', profile.id, profile.name)}
                                                    >
                                                        <Square className="h-3 w-3" />
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 px-2 text-blue-400 hover:bg-blue-500/10"
                                                        onClick={() => handleProfileAction('Refresh', profile.id, profile.name)}
                                                    >
                                                        <RotateCcw className="h-3 w-3" />
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 px-2 text-yellow-400 hover:bg-yellow-500/10"
                                                        onClick={() => handleProfileAction('Edit', profile.id, profile.name)}
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 px-2 text-red-400 hover:bg-red-500/10"
                                                        onClick={() => handleProfileAction('Delete', profile.id, profile.name)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default ProfileManagement;
