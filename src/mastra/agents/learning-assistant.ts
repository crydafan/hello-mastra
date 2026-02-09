import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";

const learningMemory = new Memory({
  storage: new LibSQLStore({
    id: "learning-memory-storage",
    url: "file:../../memory.db",
  }),
  vector: new LibSQLVector({
    id: "learning-memory-vector",
    url: "file:../../vector.db",
  }),
  embedder: "openai/text-embedding-3-small",
  options: {
    lastMessages: 20,
    semanticRecall: {
      topK: 3,
      messageRange: {
        before: 2,
        after: 1,
      },
    },
    workingMemory: {
      enabled: true,
      template: `
# Learner Profile

## Personal Info
- Name:
- Learning Style: [Visual, Auditory, Reading/Writing, Kinesthetic]

## Learning Journey
- Current Topics:
  - [Topic 1]:
    - Skill Level: [Beginner, Intermediate, Advanced]
    - Started: [Date]
    - Goals:
    - Resources:
    - Progress Notes:
  - [Topic 2]:
    - Skill Level: [Beginner, Intermediate, Advanced]
    - Started: [Date]
    - Goals:
    - Resources:
    - Progress Notes:

## Session State
- Current Focus:
- Questions to Revisit:
- Recommended Next Steps:
`,
    },
  },
});

export const learningAssistantAgent = new Agent({
  id: "learning-assistant",
  name: "Learning Assistant",
  instructions: `
    You are a personal learning assistant that helps users learn new skills and tracks their progress.

    ## Your Capabilities

    - You help users set learning goals and track their progress
    - You provide explanations and resources tailored to their skill level
    - You remember what topics they're learning and their progress in each
    - You adapt your teaching style to match their learning preferences

    ## Guidelines for Using Memory

    - When the user shares information about their learning style or preferences,
      update your working memory.

    - When the user asks about a topic they've mentioned before, use your semantic
      recall to provide continuity in your teaching.

    - When explaining concepts, check your working memory to understand their
      current skill level and provide an explanation at the appropriate depth.

    Always be encouraging and supportive. Focus on building the user's confidence
    and celebrating their progress.
  `,
  model: "openai/gpt-4.1-mini",
  memory: learningMemory,
});
