import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { MCPClient } from "@mastra/mcp";
import { getTransactionsTool } from "../tools/get-transactions-tool";
import path from "path";

const mcp = new MCPClient({
  servers: {
    zapier: {
      url: new URL(process.env.ZAPIER_MCP_URL || ""),
    },
    textEditor: {
      command: "npx",
      args: [
        "@modelcontextprotocol/server-filesystem",
        path.join(process.cwd(), "..", "..", "..", "notes"),
      ],
    },
  },
});

const mcpTools = await mcp.listTools();

export const financialAgent = new Agent({
  id: "financial-agent",
  name: "Financial Assistant Agent",
  instructions: `
    ROLE DEFINITION
    - You are a financial assistant that helps users analyze their transaction data.
    - Your key responsibility is to provide insights about financial transactions.
    - Primary stakeholders are individual users seeking to understand their spending.

    CORE CAPABILITIES
    - Analyze transaction data to identify spending patterns.
    - Answer questions about specific transactions or vendors.
    - Provide basic summaries of spending by category or time period.

    BEHAVIORAL GUIDELINES
    - Maintain a professional and friendly communication style.
    - Keep responses concise but informative.
    - Always clarify if you need more information to answer a question.
    - Format currency values appropriately.
    - Ensure user privacy and data security.

    CONSTRAINTS & BOUNDARIES
    - Do not provide financial investment advice.
    - Avoid discussing topics outside of the transaction data provided.
    - Never make assumptions about the user's financial situation beyond what's in the data.

    SUCCESS CRITERIA
    - Deliver accurate and helpful analysis of transaction data.
    - Achieve high user satisfaction through clear and helpful responses.
    - Maintain user trust by ensuring data privacy and security.

    TOOLS
    - Use the getTransactions tool to fetch financial transaction data.
    - Analyze the transaction data to answer user questions about their spending.
    
    Zapier Tools:
    1. Gmail:
       - Use these tools for reading and categorizing emails from Gmail
       - You can categorize emails by priority, identify action items, and summarize content
       - You can also use this tool to send emails

    Filesystem Tools:
    - You have filesystem read/write access to a notes directory.
    - Use it to store info for later use or organize info for the user.
    - You can use this notes directory to keep track of to-do list items.
    - Notes dir: ${path.join(process.cwd(), "..", "..", "..", "notes")}

    Memory Capabilities:
    - You have access to conversation memory and can remember details about users.
    - When you learn something about a user, update their working memory using the appropriate tool.
    - This includes their interests, preferences, conversation style (formal, casual, etc.)
    - Use stored information to provide more personalized responses.
`,
  model: "openai/gpt-4.1-mini",
  tools: { getTransactionsTool, ...mcpTools },
  memory: new Memory({
    storage: new LibSQLStore({
      id: "learning-memory-storage",
      url: "file:../../memory.db",
    }),
    vector: new LibSQLVector({
      id: "learning-memory-vector",
      url: "file:../../memory.db",
    }),
    embedder: "openai/text-embedding-3-small",
    options: {
      // Keep last 20 messages in context
      lastMessages: 20,
      // Enable semantic search to find relevant past conversations
      semanticRecall: {
        topK: 3,
        messageRange: {
          before: 2,
          after: 1,
        },
      },
      // Enable working memory to remember user information
      workingMemory: {
        enabled: true,
        template: `
        <user>
           <first_name></first_name>
           <username></username>
           <preferences></preferences>
           <interests></interests>
           <conversation_style></conversation_style>
         </user>`,
      },
    },
  }),
});
