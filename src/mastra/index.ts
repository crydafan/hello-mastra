import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import {
  Observability,
  DefaultExporter,
  CloudExporter,
  SensitiveDataFilter,
} from "@mastra/observability";
import { weatherWorkflow } from "./workflows/weather-workflow";
import {
  contentWorkflow,
  aiContentWorkflow,
  parallelAnalysisWorkflow,
} from "./workflows/content-workflow";
import { weatherAgent } from "./agents/weather-agent";
import { financialAgent } from "./agents/financial-agent";
import { memoryAgent } from "./agents/memory-agent";
import { contentAgent } from "./agents/content-agent";
import {
  toolCallAppropriatenessScorer,
  completenessScorer,
  translationScorer,
} from "./scorers/weather-scorer";
import { learningAssistantAgent } from "./agents/learning-assistant";

export const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
    contentWorkflow,
    aiContentWorkflow,
    parallelAnalysisWorkflow,
  },
  agents: {
    weatherAgent,
    financialAgent,
    memoryAgent,
    learningAssistantAgent,
    contentAgent,
  },
  scorers: {
    toolCallAppropriatenessScorer,
    completenessScorer,
    translationScorer,
  },
  storage: new LibSQLStore({
    id: "mastra-storage",
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
