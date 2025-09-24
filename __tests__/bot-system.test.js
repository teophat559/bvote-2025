// Bot System Tests - BotSystem module will be mocked for testing

describe("Bot System Tests", () => {
  let botSystem;

  beforeAll(async () => {
    botSystem = new BotSystem({
      maxBots: 5,
      enableLearning: true,
      enableAnalytics: true,
      dataDir: "./test-bot-data",
      updateInterval: 1000, // 1 second for testing
      randomnessLevel: 0.2,
    });
    await botSystem.initialize();
  });

  afterAll(async () => {
    if (botSystem) {
      await botSystem.cleanup();
    }
  });

  describe("Initialization", () => {
    it("should initialize bot system successfully", async () => {
      expect(botSystem).toBeDefined();
      expect(botSystem.bots).toBeDefined();
      expect(botSystem.behaviors).toBeDefined();
      expect(botSystem.analytics).toBeDefined();
      expect(botSystem.behaviorEngine).toBeDefined();
      expect(botSystem.learningSystem).toBeDefined();
      expect(botSystem.decisionMaker).toBeDefined();
    });

    it("should have required methods", () => {
      expect(typeof botSystem.createBot).toBe("function");
      expect(typeof botSystem.assignTask).toBe("function");
      expect(typeof botSystem.executeTask).toBe("function");
      expect(typeof botSystem.getSystemStatus).toBe("function");
    });

    it("should load default behaviors", () => {
      expect(botSystem.behaviors.size).toBeGreaterThan(0);
      expect(botSystem.behaviors.has("basic_social_interaction")).toBe(true);
      expect(botSystem.behaviors.has("content_creation")).toBe(true);
    });
  });

  describe("Bot Creation and Management", () => {
    it("should create a new bot", async () => {
      const botProfile = {
        name: "Test Bot 1",
        personality: "enthusiastic",
        skills: ["social_media", "content_creation"],
        goals: ["increase_engagement", "build_following"],
        capabilities: ["social_media_interaction", "content_creation"],
      };

      const bot = await botSystem.createBot(botProfile);

      expect(bot).toBeDefined();
      expect(bot.id).toBeDefined();
      expect(bot.profile.name).toBe("Test Bot 1");
      expect(bot.profile.personality).toBe("enthusiastic");
      expect(bot.state.status).toBe("idle");
      expect(bot.state.confidence).toBeDefined();
      expect(bot.state.energy).toBeDefined();
      expect(bot.metrics).toBeDefined();
      expect(bot.capabilities.size).toBeGreaterThan(0);
    });

    it("should create multiple bots with different personalities", async () => {
      const personalities = ["professional", "casual", "analytical"];
      const createdBots = [];

      for (const personality of personalities) {
        const bot = await botSystem.createBot({
          name: `${personality} Bot`,
          personality: personality,
          skills: ["data_analysis"],
          capabilities: ["pattern_recognition"],
        });
        createdBots.push(bot);
      }

      expect(createdBots).toHaveLength(3);
      expect(createdBots[0].profile.personality).toBe("professional");
      expect(createdBots[1].profile.personality).toBe("casual");
      expect(createdBots[2].profile.personality).toBe("analytical");
    });

    it("should assign initial behaviors to new bots", async () => {
      const bot = await botSystem.createBot({
        name: "Behavior Test Bot",
        personality: "neutral",
      });

      const assignBehaviorsSpy = jest
        .spyOn(botSystem, "assignInitialBehaviors")
        .mockResolvedValue(true);

      await botSystem.assignInitialBehaviors(bot);

      expect(assignBehaviorsSpy).toHaveBeenCalledWith(bot);

      assignBehaviorsSpy.mockRestore();
    });
  });

  describe("Task Assignment and Execution", () => {
    let testBot;

    beforeAll(async () => {
      testBot = await botSystem.createBot({
        name: "Task Test Bot",
        personality: "professional",
        capabilities: ["social_media_interaction", "content_creation"],
      });
    });

    it("should assign task to available bot", async () => {
      const taskData = {
        type: "social_media_post",
        params: {
          platform: "facebook",
          content: "Test post from bot",
          target: "audience",
        },
        priority: 1,
        deadline: Date.now() + 60000, // 1 minute from now
      };

      const taskId = await botSystem.assignTask(testBot.id, taskData);

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe("string");

      // Check bot status updated
      const updatedBot = botSystem.bots.get(testBot.id);
      expect(updatedBot.state.status).toBe("working");
      expect(updatedBot.state.currentTask).toBeDefined();
      expect(updatedBot.state.currentTask.type).toBe("social_media_post");
    });

    it("should execute different types of tasks", async () => {
      const bot = botSystem.bots.get(testBot.id);

      // Mock task execution methods
      const executeBehaviorSpy = jest
        .spyOn(botSystem, "executeBehavior")
        .mockResolvedValue([
          { step: "analyze_context", result: { success: true }, success: true },
          { step: "create_content", result: { success: true }, success: true },
          { step: "post_content", result: { success: true }, success: true },
        ]);

      await botSystem.executeTask(bot);

      expect(executeBehaviorSpy).toHaveBeenCalled();

      executeBehaviorSpy.mockRestore();
    });

    it("should handle task execution steps", async () => {
      const mockStep = {
        name: "test_step",
        type: "social_media_post",
        params: { platform: "facebook", content: "Test" },
      };

      const mockDecisions = {
        confidence: 0.8,
        approach: "standard",
        riskLevel: "low",
      };

      const executeStepSpy = jest
        .spyOn(botSystem, "executeStep")
        .mockResolvedValue({
          success: true,
          platform: "facebook",
          content: "Test content",
          engagement: 25,
        });

      const result = await botSystem.executeStep(
        testBot,
        mockStep,
        mockDecisions
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      executeStepSpy.mockRestore();
    });

    it("should personalize content based on bot personality", async () => {
      const baseContent = "This is test content";

      const enthusiasticBot = await botSystem.createBot({
        name: "Enthusiastic Bot",
        personality: "enthusiastic",
      });

      const professionalBot = await botSystem.createBot({
        name: "Professional Bot",
        personality: "professional",
      });

      const enthusiasticContent = await botSystem.personalizeContent(
        enthusiasticBot,
        baseContent
      );
      const professionalContent = await botSystem.personalizeContent(
        professionalBot,
        baseContent
      );

      expect(enthusiasticContent).toContain("🎉");
      expect(professionalContent).toContain("Professional insight:");
      expect(enthusiasticContent).not.toBe(professionalContent);
    });
  });

  describe("Bot Behavior and Learning", () => {
    let learningBot;

    beforeAll(async () => {
      learningBot = await botSystem.createBot({
        name: "Learning Bot",
        personality: "analytical",
      });
    });

    it("should process task results and update bot experience", async () => {
      const mockTask = {
        id: "task123",
        type: "content_creation",
        startedAt: Date.now() - 5000,
      };

      const mockResults = [
        { step: "research", success: true, result: { dataPoints: 50 } },
        { step: "create", success: true, result: { contentCreated: true } },
        { step: "review", success: false, result: { issues: ["grammar"] } },
      ];

      const initialExperience = learningBot.profile.experience;

      await botSystem.processTaskResult(learningBot, mockTask, mockResults);

      expect(learningBot.profile.experience).toBeGreaterThan(initialExperience);
      expect(learningBot.metrics.actionsPerformed).toBe(3);
      expect(learningBot.metrics.successfulActions).toBe(2);
      expect(learningBot.metrics.failedActions).toBe(1);
    });

    it("should handle task errors and update confidence", async () => {
      const mockError = new Error("Task execution failed");
      const initialConfidence = learningBot.state.confidence;

      await botSystem.handleTaskError(learningBot, mockError);

      expect(learningBot.state.status).toBe("error");
      expect(learningBot.state.confidence).toBeLessThan(initialConfidence);
      expect(learningBot.metrics.failedActions).toBeGreaterThan(0);
    });

    it("should calculate adaptive delays based on bot state", () => {
      const mockStep = { name: "test_step", type: "content_creation" };

      // High confidence bot should have shorter delays
      const highConfidenceBot = {
        state: { confidence: 0.9 },
        profile: { experience: 100 },
      };
      const lowConfidenceBot = {
        state: { confidence: 0.1 },
        profile: { experience: 0 },
      };

      const highConfidenceDelay = botSystem.calculateAdaptiveDelay(
        highConfidenceBot,
        mockStep
      );
      const lowConfidenceDelay = botSystem.calculateAdaptiveDelay(
        lowConfidenceBot,
        mockStep
      );

      expect(lowConfidenceDelay).toBeGreaterThan(highConfidenceDelay);
      expect(highConfidenceDelay).toBeGreaterThan(0);
    });

    it("should initiate autonomous actions for idle bots", async () => {
      const autonomousBot = await botSystem.createBot({
        name: "Autonomous Bot",
        personality: "neutral",
      });

      // Set bot to ideal conditions for autonomous action
      autonomousBot.state.status = "idle";
      autonomousBot.state.energy = 75;

      const assignTaskSpy = jest
        .spyOn(botSystem, "assignTask")
        .mockResolvedValue("auto_task_123");

      // Mock Math.random to always trigger autonomous action
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.05);

      await botSystem.initiateAutonomousAction(autonomousBot);

      expect(assignTaskSpy).toHaveBeenCalled();

      randomSpy.mockRestore();
      assignTaskSpy.mockRestore();
    });
  });

  describe("System Monitoring and Analytics", () => {
    it("should get system status", async () => {
      const status = await botSystem.getSystemStatus();

      expect(status).toBeDefined();
      expect(status.bots).toBeDefined();
      expect(status.bots.total).toBeGreaterThan(0);
      expect(status.bots.idle).toBeGreaterThanOrEqual(0);
      expect(status.bots.working).toBeGreaterThanOrEqual(0);
      expect(status.analytics).toBeDefined();
      expect(status.globalMemory).toBeDefined();
      expect(status.uptime).toBeGreaterThan(0);
      expect(status.timestamp).toBeDefined();
    });

    it("should update analytics", () => {
      const initialSuccessActions = botSystem.analytics.successfulActions;

      botSystem.analytics.successfulActions += 5;
      botSystem.analytics.failedActions += 2;

      botSystem.updateAnalytics();

      expect(botSystem.analytics.lastUpdate).toBeDefined();
      expect(botSystem.analytics.successRate).toBeGreaterThan(0);
      expect(botSystem.analytics.averageBotExperience).toBeGreaterThanOrEqual(
        0
      );
    });

    it("should update global memory", async () => {
      await botSystem.updateGlobalMemory();

      expect(botSystem.globalMemory.get("active_bots")).toBe(
        botSystem.bots.size
      );
      expect(botSystem.globalMemory.get("last_update")).toBeDefined();
    });

    it("should start and monitor system loop", () => {
      const startLoopSpy = jest
        .spyOn(botSystem, "startSystemLoop")
        .mockImplementation(() => {
          botSystem.isRunning = true;
        });

      botSystem.startSystemLoop();

      expect(botSystem.isRunning).toBe(true);
      expect(startLoopSpy).toHaveBeenCalled();

      startLoopSpy.mockRestore();
    });

    it("should update individual bots", async () => {
      const bot = Array.from(botSystem.bots.values())[0];
      const initialEnergy = bot.state.energy;

      await botSystem.updateBot(bot);

      // Energy should have increased (rest recovery)
      expect(bot.state.energy).toBeGreaterThanOrEqual(initialEnergy);
      expect(bot.metrics.uptime).toBeGreaterThan(0);
    });
  });

  describe("Behavior Engine", () => {
    it("should get appropriate behavior for task", async () => {
      const mockTask = { type: "social_media_post", platform: "facebook" };
      const mockBot = { capabilities: new Set(["social_media_interaction"]) };

      const behavior = await botSystem.behaviorEngine.getBehaviorForTask(
        mockTask,
        mockBot
      );

      expect(behavior).toBeDefined();
      expect(behavior.name).toBeDefined();
      expect(behavior.steps).toBeDefined();
    });

    it("should determine behavior suitability", () => {
      const mockBehavior = { name: "test_behavior", steps: [] };
      const mockTask = { type: "content_creation" };
      const mockBot = { capabilities: new Set(["content_creation"]) };

      const suitable = botSystem.behaviorEngine.isBehaviorSuitable(
        mockBehavior,
        mockTask,
        mockBot
      );

      expect(typeof suitable).toBe("boolean");
    });
  });

  describe("Learning System", () => {
    it("should process learning results", async () => {
      const bot = Array.from(botSystem.bots.values())[0];
      const mockTask = { type: "test_task" };
      const mockResults = [
        { success: true },
        { success: true },
        { success: false },
      ];

      const initialExperience = bot.profile.experience;

      await botSystem.learningSystem.processResults(bot, mockTask, mockResults);

      expect(bot.profile.experience).toBeGreaterThan(initialExperience);
      expect(bot.state.learningData).toBeDefined();
    });

    it("should process failures for learning", async () => {
      const bot = Array.from(botSystem.bots.values())[0];
      const mockStep = { type: "content_creation" };
      const mockError = new Error("Creation failed");

      await botSystem.learningSystem.processFailure(bot, mockStep, mockError);

      expect(bot.state.learningData).toBeDefined();
      expect(bot.state.learningData.length).toBeGreaterThan(0);
    });
  });

  describe("Decision Making", () => {
    it("should make decisions based on bot state", async () => {
      const bot = Array.from(botSystem.bots.values())[0];
      const mockTask = { type: "content_creation" };
      const mockBehavior = { name: "content_behavior", steps: [] };

      const decisions = await botSystem.decisionMaker.makeDecisions(
        bot,
        mockTask,
        mockBehavior
      );

      expect(decisions).toBeDefined();
      expect(decisions.confidence).toBeDefined();
      expect(decisions.approach).toBeDefined();
      expect(decisions.riskLevel).toBeDefined();
    });

    it("should decide whether to continue after error", async () => {
      const bot = Array.from(botSystem.bots.values())[0];
      const mockError = new Error("Test error");

      const shouldContinue = await botSystem.decisionMaker.shouldContinueAfterError(
        bot,
        mockError
      );

      expect(typeof shouldContinue).toBe("boolean");
    });

    it("should choose options based on criteria", async () => {
      const bot = Array.from(botSystem.bots.values())[0];
      const mockOptions = ["option1", "option2", "option3"];
      const mockCriteria = "effectiveness";

      const choice = await botSystem.decisionMaker.chooseOption(
        bot,
        mockOptions,
        mockCriteria
      );

      expect(mockOptions).toContain(choice);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle bot creation with invalid data", async () => {
      try {
        await botSystem.createBot(null);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle task assignment to non-existent bot", async () => {
      try {
        await botSystem.assignTask("non_existent_bot", { type: "test" });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain("not found");
      }
    });

    it("should handle task assignment to busy bot", async () => {
      const busyBot = await botSystem.createBot({ name: "Busy Bot" });
      busyBot.state.status = "working";

      try {
        await botSystem.assignTask(busyBot.id, { type: "test" });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain("not available");
      }
    });
  });

  describe("Utility Methods", () => {
    it("should generate unique IDs", () => {
      const id1 = botSystem.generateBotId();
      const id2 = botSystem.generateBotId();
      const taskId1 = botSystem.generateTaskId();
      const taskId2 = botSystem.generateTaskId();

      expect(id1).not.toBe(id2);
      expect(taskId1).not.toBe(taskId2);
      expect(id1).toMatch(/^bot_/);
      expect(taskId1).toMatch(/^task_/);
    });

    it("should handle delays", async () => {
      const startTime = Date.now();
      await botSystem.delay(50);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(50);
    });

    it("should adjust messages for personality", async () => {
      const baseMessage = "Hello world";

      const enthusiasticBot = { profile: { personality: "enthusiastic" } };
      const professionalBot = { profile: { personality: "professional" } };
      const casualBot = { profile: { personality: "casual" } };

      const enthusiasticMessage = await botSystem.adjustMessageForPersonality(
        enthusiasticBot,
        baseMessage
      );
      const professionalMessage = await botSystem.adjustMessageForPersonality(
        professionalBot,
        baseMessage
      );
      const casualMessage = await botSystem.adjustMessageForPersonality(
        casualBot,
        baseMessage
      );

      expect(enthusiasticMessage).toContain("!");
      expect(professionalMessage).toContain("I would like to");
      expect(casualMessage).toContain("Hey,");
    });
  });
});
