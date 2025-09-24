/**
 * Victim File Manager Component
 * Quản lý file system của victim từ xa
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  File,
  Download,
  Upload,
  Trash2,
  Copy,
  Move,
  Search,
  RefreshCw,
  Home,
  ArrowLeft,
  ArrowRight,
  HardDrive,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Code,
  Database,
  Settings,
  Eye,
  Edit,
  Share,
  Lock,
  Unlock,
  Calendar,
  User,
  Monitor
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";

const VictimFileManager = ({ victimId, onClose }) => {
  const [currentPath, setCurrentPath] = useState("C:\\");
  const [pathHistory, setPathHistory] = useState(["C:\\"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // list, grid
  const [sortBy, setSortBy] = useState("name"); // name, size, date, type

  // Mock file system data
  const mockFileSystem = {
    "C:\\": [
      { name: "Users", type: "folder", size: null, modified: new Date("2024-01-10"), permissions: "rwx" },
      { name: "Program Files", type: "folder", size: null, modified: new Date("2024-01-05"), permissions: "r-x" },
      { name: "Windows", type: "folder", size: null, modified: new Date("2024-01-01"), permissions: "r-x" },
      { name: "temp", type: "folder", size: null, modified: new Date("2024-01-15"), permissions: "rwx" },
      { name: "pagefile.sys", type: "file", size: 8589934592, modified: new Date("2024-01-15"), permissions: "rw-" }
    ],
    "C:\\Users": [
      { name: "Administrator", type: "folder", size: null, modified: new Date("2024-01-12"), permissions: "rwx" },
      { name: "Public", type: "folder", size: null, modified: new Date("2024-01-10"), permissions: "r-x" },
      { name: "Default", type: "folder", size: null, modified: new Date("2024-01-08"), permissions: "r--" }
    ],
    "C:\\Users\\Administrator": [
      { name: "Desktop", type: "folder", size: null, modified: new Date("2024-01-15"), permissions: "rwx" },
      { name: "Documents", type: "folder", size: null, modified: new Date("2024-01-14"), permissions: "rwx" },
      { name: "Downloads", type: "folder", size: null, modified: new Date("2024-01-15"), permissions: "rwx" },
      { name: "Pictures", type: "folder", size: null, modified: new Date("2024-01-13"), permissions: "rwx" },
      { name: "Videos", type: "folder", size: null, modified: new Date("2024-01-12"), permissions: "rwx" },
      { name: "AppData", type: "folder", size: null, modified: new Date("2024-01-15"), permissions: "rwx" }
    ],
    "C:\\Users\\Administrator\\Desktop": [
      { name: "passwords.txt", type: "file", size: 2048, modified: new Date("2024-01-15"), permissions: "rw-" },
      { name: "banking_info.docx", type: "file", size: 15360, modified: new Date("2024-01-14"), permissions: "rw-" },
      { name: "family_photos", type: "folder", size: null, modified: new Date("2024-01-13"), permissions: "rwx" },
      { name: "work_project.zip", type: "file", size: 52428800, modified: new Date("2024-01-12"), permissions: "rw-" },
      { name: "browser_bookmarks.html", type: "file", size: 8192, modified: new Date("2024-01-15"), permissions: "rw-" }
    ],
    "C:\\Users\\Administrator\\Downloads": [
      { name: "setup.exe", type: "file", size: 104857600, modified: new Date("2024-01-15"), permissions: "rwx" },
      { name: "document.pdf", type: "file", size: 2097152, modified: new Date("2024-01-14"), permissions: "rw-" },
      { name: "music.mp3", type: "file", size: 5242880, modified: new Date("2024-01-13"), permissions: "rw-" },
      { name: "video.mp4", type: "file", size: 209715200, modified: new Date("2024-01-12"), permissions: "rw-" },
      { name: "image.jpg", type: "file", size: 1048576, modified: new Date("2024-01-11"), permissions: "rw-" }
    ]
  };

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  const loadDirectory = (path) => {
    setIsLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
      const dirFiles = mockFileSystem[path] || [];
      setFiles(dirFiles);
      setIsLoading(false);
    }, 500);
  };

  const navigateTo = (path) => {
    const newHistory = pathHistory.slice(0, historyIndex + 1);
    newHistory.push(path);
    setPathHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(path);
    setSelectedFiles(new Set());
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPath(pathHistory[newIndex]);
      setSelectedFiles(new Set());
    }
  };

  const goForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPath(pathHistory[newIndex]);
      setSelectedFiles(new Set());
    }
  };

  const goUp = () => {
    const parentPath = currentPath.split("\\").slice(0, -1).join("\\");
    if (parentPath && parentPath !== currentPath) {
      navigateTo(parentPath || "C:\\");
    }
  };

  const handleFileClick = (file) => {
    if (file.type === "folder") {
      const newPath = currentPath.endsWith("\\") 
        ? currentPath + file.name 
        : currentPath + "\\" + file.name;
      navigateTo(newPath);
    } else {
      // Handle file selection
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.name)) {
        newSelected.delete(file.name);
      } else {
        newSelected.add(file.name);
      }
      setSelectedFiles(newSelected);
    }
  };

  const handleFileDoubleClick = (file) => {
    if (file.type === "file") {
      toast.success(`Mở file: ${file.name}`);
    }
  };

  const downloadFile = (fileName) => {
    toast.success(`Tải xuống: ${fileName}`);
  };

  const deleteFile = (fileName) => {
    toast.success(`Xóa: ${fileName}`);
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const uploadFile = () => {
    toast.success("Tải lên file thành công");
  };

  const getFileIcon = (file) => {
    if (file.type === "folder") return <Folder className="h-5 w-5 text-blue-400" />;
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-5 w-5 text-green-400" />;
      case 'mp4':
      case 'avi':
      case 'mkv':
        return <Video className="h-5 w-5 text-purple-400" />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music className="h-5 w-5 text-pink-400" />;
      case 'txt':
      case 'doc':
      case 'docx':
      case 'pdf':
        return <FileText className="h-5 w-5 text-yellow-400" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="h-5 w-5 text-orange-400" />;
      case 'js':
      case 'html':
      case 'css':
      case 'py':
        return <Code className="h-5 w-5 text-cyan-400" />;
      case 'exe':
      case 'msi':
        return <Settings className="h-5 w-5 text-red-400" />;
      default:
        return <File className="h-5 w-5 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "-";
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'size':
        return (b.size || 0) - (a.size || 0);
      case 'date':
        return new Date(b.modified) - new Date(a.modified);
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  return (
    <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700 h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-green-400" />
            <span>File Manager - {victimId}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={uploadFile}>
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Navigation Bar */}
        <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
          <Button
            size="sm"
            variant="ghost"
            onClick={goBack}
            disabled={historyIndex <= 0}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={goForward}
            disabled={historyIndex >= pathHistory.length - 1}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={goUp}
            disabled={currentPath === "C:\\"}
          >
            <ArrowLeft className="h-4 w-4" />
            Up
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigateTo("C:\\")}
          >
            <Home className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 mx-2">
            <Input
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  loadDirectory(currentPath);
                }
              }}
            />
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => loadDirectory(currentPath)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm file..."
              className="pl-10 bg-slate-800 border-slate-600 text-white"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
          >
            <option value="name">Tên</option>
            <option value="size">Kích thước</option>
            <option value="date">Ngày sửa</option>
            <option value="type">Loại</option>
          </select>
          
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-2' : 'space-y-1'}>
                <AnimatePresence>
                  {sortedFiles.map((file, index) => (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                      className={`
                        ${viewMode === 'grid' 
                          ? 'p-3 text-center' 
                          : 'flex items-center gap-3 p-2'
                        }
                        rounded cursor-pointer transition-colors
                        ${selectedFiles.has(file.name) 
                          ? 'bg-blue-500/20 border border-blue-500/50' 
                          : 'hover:bg-slate-700/50'
                        }
                      `}
                      onClick={() => handleFileClick(file)}
                      onDoubleClick={() => handleFileDoubleClick(file)}
                    >
                      {viewMode === 'grid' ? (
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            {getFileIcon(file)}
                          </div>
                          <div className="text-xs text-slate-300 truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-shrink-0">
                            {getFileIcon(file)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-300 truncate">
                              {file.name}
                            </div>
                          </div>
                          
                          <div className="text-xs text-slate-500 w-20 text-right">
                            {formatFileSize(file.size)}
                          </div>
                          
                          <div className="text-xs text-slate-500 w-32 text-right">
                            {format(file.modified, "dd/MM/yyyy HH:mm", { locale: vi })}
                          </div>
                          
                          <div className="flex gap-1">
                            {file.type === 'file' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadFile(file.name);
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFile(file.name);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between text-sm text-slate-400 pt-2 border-t border-slate-700">
          <div className="flex items-center gap-4">
            <span>{sortedFiles.length} items</span>
            <span>{selectedFiles.size} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-slate-700 text-slate-300">
              <Monitor className="h-3 w-3 mr-1" />
              {victimId}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VictimFileManager;
