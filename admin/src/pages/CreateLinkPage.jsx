/**
 * Create Link Page - Tính năng Tạo Link đơn giản
 * Thay thế cho tính năng Link Fake phức tạp trước đây
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link2, Copy, Plus, Edit, Trash2, Eye, EyeOff,
  Save, RefreshCw, Check, X, Globe, User
} from "lucide-react";
import toast from "react-hot-toast";

const CreateLinkPage = () => {
  const [links, setLinks] = useState([
    {
      id: 1,
      name: "Login Portal",
      originalUrl: "https://facebook.com/login",
      shortUrl: "https://short.ly/abc123",
      clicks: 156,
      active: true,
      createdBy: "Admin John",
      createdAt: new Date()
    },
    {
      id: 2,
      name: "Email Access",
      originalUrl: "https://gmail.com",
      shortUrl: "https://short.ly/xyz789",
      clicks: 89,
      active: false,
      createdBy: "Admin Sarah",
      createdAt: new Date(Date.now() - 86400000)
    }
  ]);

  const [newLink, setNewLink] = useState({
    name: "",
    originalUrl: ""
  });

  const [editingLink, setEditingLink] = useState(null);

  const generateShortUrl = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `https://short.ly/${result}`;
  };

  const createLink = () => {
    if (!newLink.name || !newLink.originalUrl) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const link = {
      id: Date.now(),
      ...newLink,
      shortUrl: generateShortUrl(),
      clicks: 0,
      active: true,
      createdBy: "Current Admin",
      createdAt: new Date()
    };

    setLinks(prev => [link, ...prev]);
    setNewLink({ name: "", originalUrl: "" });
    toast.success("Tạo link thành công!");
  };

  const toggleLinkStatus = (linkId) => {
    setLinks(prev => 
      prev.map(link => 
        link.id === linkId ? { ...link, active: !link.active } : link
      )
    );
    toast.success("Đã cập nhật trạng thái link!");
  };

  const deleteLink = (linkId) => {
    setLinks(prev => prev.filter(link => link.id !== linkId));
    toast.success("Đã xóa link!");
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã copy ${label}!`);
    } catch (error) {
      toast.error(`Lỗi copy ${label}`);
    }
  };

  const editLink = (link) => {
    setEditingLink({ ...link });
  };

  const saveEditLink = () => {
    setLinks(prev => 
      prev.map(link => 
        link.id === editingLink.id ? editingLink : link
      )
    );
    setEditingLink(null);
    toast.success("Đã cập nhật link!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tạo Link</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý các liên kết rút gọn một cách đơn giản
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {links.length} Links
          </Badge>
          <Badge variant="outline">
            {links.filter(l => l.active).length} Active
          </Badge>
        </div>
      </div>

      {/* Create New Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-500" />
            Tạo Link Mới
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tên Hiển Thị</Label>
              <Input
                value={newLink.name}
                onChange={(e) => setNewLink(prev => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Login Portal"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label>URL Gốc</Label>
              <Input
                value={newLink.originalUrl}
                onChange={(e) => setNewLink(prev => ({ ...prev, originalUrl: e.target.value }))}
                placeholder="https://example.com"
                className="mt-2"
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={createLink} className="w-full">
                <Link2 className="h-4 w-4 mr-2" />
                Tạo Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-500" />
            Danh Sách Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              <AnimatePresence>
                {links.map((link) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {editingLink?.id === link.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            value={editingLink.name}
                            onChange={(e) => setEditingLink(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Tên link"
                          />
                          <Input
                            value={editingLink.originalUrl}
                            onChange={(e) => setEditingLink(prev => ({ ...prev, originalUrl: e.target.value }))}
                            placeholder="URL gốc"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEditLink}>
                            <Save className="h-3 w-3 mr-1" />
                            Lưu
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingLink(null)}>
                            <X className="h-3 w-3 mr-1" />
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{link.name}</h4>
                            <Badge variant={link.active ? "default" : "secondary"}>
                              {link.active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                              {link.clicks} clicks
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              <span className="font-mono">{link.originalUrl}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(link.originalUrl, "URL gốc")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Link2 className="h-3 w-3" />
                              <span className="font-mono text-blue-600">{link.shortUrl}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(link.shortUrl, "Short URL")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span>Tạo bởi: {link.createdBy}</span>
                              <span>•</span>
                              <span>{link.createdAt.toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleLinkStatus(link.id)}
                          >
                            {link.active ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editLink(link)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteLink(link.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng Links</p>
                <p className="text-2xl font-bold">{links.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Links</p>
                <p className="text-2xl font-bold">{links.filter(l => l.active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng Clicks</p>
                <p className="text-2xl font-bold">{links.reduce((sum, link) => sum + link.clicks, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Hôm nay</p>
                <p className="text-2xl font-bold">+12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateLinkPage;
