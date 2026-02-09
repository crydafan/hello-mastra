import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const validateContentStep = createStep({
  id: "validate-content",
  description: "Validates incoming text content",
  inputSchema: z.object({
    content: z.string().min(1, "Content cannot be empty"),
    type: z.enum(["article", "blog", "social"]).default("article"),
  }),
  outputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    isValid: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    const { content, type } = inputData;

    const wordCount = content.trim().split(/\s+/).length;
    const isValid = wordCount >= 5; // Minimum 5 words

    if (!isValid) {
      throw new Error(`Content too short: ${wordCount} words`);
    }

    return {
      content: content.trim(),
      type,
      wordCount,
      isValid,
    };
  },
});

const enhanceContentStep = createStep({
  id: "enhance-content",
  description: "Adds metadata to validated content",
  inputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    isValid: z.boolean(),
  }),
  outputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    metadata: z.object({
      readingTime: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      processedAt: z.string(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { content, type, wordCount } = inputData;

    // Calculate reading time (200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);

    // Determine difficulty based on word count
    let difficulty: "easy" | "medium" | "hard" = "easy";
    if (wordCount > 100) difficulty = "medium";
    if (wordCount > 300) difficulty = "hard";

    return {
      content,
      type,
      wordCount,
      metadata: {
        readingTime,
        difficulty,
        processedAt: new Date().toISOString(),
      },
    };
  },
});

const generateSummaryStep = createStep({
  id: "generate-summary",
  description: "Creates a summary of the content",
  inputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    metadata: z.object({
      readingTime: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      processedAt: z.string(),
    }),
  }),
  outputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    metadata: z.object({
      readingTime: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      processedAt: z.string(),
    }),
    summary: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { content, type, wordCount, metadata } = inputData;

    // Create a simple summary from first sentence
    const sentences = content
      .split(/[.!?]+/)
      .filter((sentence) => sentence.trim().length > 0);
    const firstSentence = `${sentences[0]?.trim()}.`;

    // Generate summary based on content length
    let summary = firstSentence;
    if (wordCount > 50) {
      summary += ` This ${type} contains ${wordCount} words and takes approximately ${metadata.readingTime} minute(s) to read.`;
    }

    console.log(`\ud83d\udcdd Generated summary: ${summary.length} characters`);

    return {
      content,
      type,
      wordCount,
      metadata,
      summary,
    };
  },
});

const aiAnalysisStep = createStep({
  id: "ai-analysis",
  description: "AI-powered content analysis",
  inputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    metadata: z.object({
      readingTime: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      processedAt: z.string(),
    }),
    summary: z.string(),
  }),
  outputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    metadata: z.object({
      readingTime: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      processedAt: z.string(),
    }),
    summary: z.string(),
    aiAnalysis: z.object({
      score: z.number(),
      feedback: z.string(),
    }),
  }),
  execute: async ({ inputData, mastra }) => {
    const { content, type, wordCount, metadata, summary } = inputData;

    // Create prompt for the AI agent
    const prompt = `
Analyze this ${type} content:

Content: "${content}"
Word count: ${wordCount}
Reading time: ${metadata.readingTime} minutes
Difficulty: ${metadata.difficulty}

Please provide:
1. A quality score from 1-10
2. Brief feedback on strengths and areas for improvement

Format as JSON: {"score": number, "feedback": "your feedback here"}
    `;

    // Get the contentAgent from the mastra instance.
    const contentAgent = mastra.getAgent("contentAgent");
    const { text } = await contentAgent.generate([
      { role: "user", content: prompt },
    ]);

    // Parse AI response (with fallback)
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(text);
    } catch {
      aiAnalysis = {
        score: 7,
        feedback: "AI analysis completed. " + text,
      };
    }

    console.log(`\ud83e\udd16 AI Score: ${aiAnalysis.score}/10`);

    return {
      content,
      type,
      wordCount,
      metadata,
      summary,
      aiAnalysis,
    };
  },
});

const seoAnalysisStep = createStep({
  id: "seo-analysis",
  description: "SEO optimization analysis",
  inputSchema: z.object({
    content: z.string(),
    type: z.enum(["article", "blog", "social"]).default("article"),
  }),
  outputSchema: z.object({
    seoScore: z.number(),
    keywords: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    console.log("\ud83d\udd0d Running SEO analysis...");
    await new Promise((resolve) => setTimeout(resolve, 800));

    const words = inputData.content.toLowerCase().split(/\s+/);
    const keywords = words.filter((word) => word.length > 4).slice(0, 3);

    return {
      seoScore: Math.floor(Math.random() * 40) + 60,
      keywords,
    };
  },
});

const readabilityStep = createStep({
  id: "readability-analysis",
  description: "Content readability analysis",
  inputSchema: z.object({
    content: z.string(),
    type: z.enum(["article", "blog", "social"]).default("article"),
  }),
  outputSchema: z.object({
    readabilityScore: z.number(),
    gradeLevel: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log("\ud83d\udcd6 Running readability analysis...");
    await new Promise((resolve) => setTimeout(resolve, 600));

    const sentences = inputData.content.split(/[.!?]+/).length;
    const words = inputData.content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;

    const score = Math.max(0, 100 - avgWordsPerSentence * 3);
    const gradeLevel = score > 80 ? "Easy" : score > 60 ? "Medium" : "Hard";

    return {
      readabilityScore: Math.floor(score),
      gradeLevel,
    };
  },
});

const sentimentStep = createStep({
  id: "sentiment-analysis",
  description: "Content sentiment analysis",
  inputSchema: z.object({
    content: z.string(),
    type: z.enum(["article", "blog", "social"]).default("article"),
  }),
  outputSchema: z.object({
    sentiment: z.enum(["positive", "neutral", "negative"]),
    confidence: z.number(),
  }),
  execute: async ({ inputData }) => {
    console.log("\ud83d\ude0a Running sentiment analysis...");
    await new Promise((resolve) => setTimeout(resolve, 700));

    const content = inputData.content.toLowerCase();
    const positiveWords = ["good", "great", "excellent", "amazing"];
    const negativeWords = ["bad", "terrible", "awful", "horrible"];

    const positive = positiveWords.filter((word) =>
      content.includes(word),
    ).length;
    const negative = negativeWords.filter((word) =>
      content.includes(word),
    ).length;

    let sentiment: "positive" | "neutral" | "negative" = "neutral";
    if (positive > negative) sentiment = "positive";
    if (negative > positive) sentiment = "negative";

    return {
      sentiment,
      confidence: Math.random() * 0.3 + 0.7,
    };
  },
});

const contentWorkflow = createWorkflow({
  id: "content-processing-workflow",
  description: "Validates, enhances, and summarizes content",
  inputSchema: z.object({
    content: z.string(),
    type: z.enum(["article", "blog", "social"]).default("article"),
  }),
  outputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    metadata: z.object({
      readingTime: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      processedAt: z.string(),
    }),
    summary: z.string(),
  }),
})
  .then(validateContentStep)
  .then(enhanceContentStep)
  .then(generateSummaryStep)
  .commit();

const aiContentWorkflow = createWorkflow({
  id: "ai-content-workflow",
  description: "AI-enhanced content processing with analysis",
  inputSchema: z.object({
    content: z.string(),
    type: z.enum(["article", "blog", "social"]).default("article"),
  }),
  outputSchema: z.object({
    content: z.string(),
    type: z.string(),
    wordCount: z.number(),
    metadata: z.object({
      readingTime: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      processedAt: z.string(),
    }),
    summary: z.string(),
    aiAnalysis: z.object({
      score: z.number(),
      feedback: z.string(),
    }),
  }),
})
  .then(validateContentStep)
  .then(enhanceContentStep)
  .then(generateSummaryStep)
  .then(aiAnalysisStep)
  .commit();

const parallelAnalysisWorkflow = createWorkflow({
  id: "parallel-analysis-workflow",
  description: "Run multiple content analyses in parallel",
  inputSchema: z.object({
    content: z.string(),
    type: z.enum(["article", "blog", "social"]).default("article"),
  }),
  outputSchema: z.object({
    results: z.object({
      seo: z.object({
        seoScore: z.number(),
        keywords: z.array(z.string()),
      }),
      readability: z.object({
        readabilityScore: z.number(),
        gradeLevel: z.string(),
      }),
      sentiment: z.object({
        sentiment: z.enum(["positive", "neutral", "negative"]),
        confidence: z.number(),
      }),
    }),
  }),
})
  .parallel([seoAnalysisStep, readabilityStep, sentimentStep])
  .then(
    createStep({
      id: "combine-results",
      description: "Combines parallel analysis results",
      inputSchema: z.object({
        "seo-analysis": z.object({
          seoScore: z.number(),
          keywords: z.array(z.string()),
        }),
        "readability-analysis": z.object({
          readabilityScore: z.number(),
          gradeLevel: z.string(),
        }),
        "sentiment-analysis": z.object({
          sentiment: z.enum(["positive", "neutral", "negative"]),
          confidence: z.number(),
        }),
      }),
      outputSchema: z.object({
        results: z.object({
          seo: z.object({
            seoScore: z.number(),
            keywords: z.array(z.string()),
          }),
          readability: z.object({
            readabilityScore: z.number(),
            gradeLevel: z.string(),
          }),
          sentiment: z.object({
            sentiment: z.enum(["positive", "neutral", "negative"]),
            confidence: z.number(),
          }),
        }),
      }),
      execute: async ({ inputData }) => {
        console.log("\ud83d\udd04 Combining parallel results...");

        return {
          results: {
            seo: inputData["seo-analysis"],
            readability: inputData["readability-analysis"],
            sentiment: inputData["sentiment-analysis"],
          },
        };
      },
    }),
  )
  .commit();

export { contentWorkflow, aiContentWorkflow, parallelAnalysisWorkflow };
