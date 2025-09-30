#!/usr/bin/env tsx

/**
 * Database Query Analyzer
 * Analyzes and logs slow database queries for performance optimization
 */

import { desc, eq, like, sql } from "drizzle-orm";
import { performance } from "perf_hooks";
import { db } from "@/db/index";
import { users } from "@/db/schema.base";
import { recipeIngredients, recipeInstructions, recipes, recipeTagRelations, recipeTags } from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("query-analyzer");

interface QueryResult {
  name: string;
  duration: number;
  resultCount: number;
  query: string;
  status: "fast" | "slow" | "critical";
}

class QueryAnalyzer {
  private results: QueryResult[] = [];

  async timeQuery<T>(name: string, queryFn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await queryFn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    const status = duration > 1000 ? "critical" : duration > 500 ? "slow" : "fast";
    const resultCount = Array.isArray(result) ? result.length : 1;

    this.results.push({
      name,
      duration,
      resultCount,
      query: "Query execution tracked",
      status
    });

    logger.info({
      query: name,
      duration: `${duration.toFixed(2)}ms`,
      resultCount,
      status
    }, `Query ${name} executed`);

    return { result, duration };
  }

  async analyzeBasicQueries() {
    logger.info("Analyzing basic database queries");

    // Simple user query
    await this.timeQuery("Select all users", async () => {
      return await db.select().from(users);
    });

    // Simple recipe query
    await this.timeQuery("Select all recipes", async () => {
      return await db.select().from(recipes);
    });

    // Recipe count by user
    await this.timeQuery("Recipe count by user", async () => {
      return await db.select({
        userId: recipes.userId,
        count: sql<number>`COUNT(*)`
      })
      .from(recipes)
      .groupBy(recipes.userId);
    });
  }

  async analyzeJoinQueries() {
    logger.info("Analyzing join queries");

    // Recipe with ingredients
    await this.timeQuery("Recipes with ingredients", async () => {
      return await db.select({
        recipeId: recipes.id,
        recipeTitle: recipes.title,
        ingredientName: recipeIngredients.name,
        ingredientAmount: recipeIngredients.amount
      })
      .from(recipes)
      .leftJoin(recipeIngredients, eq(recipes.id, recipeIngredients.recipeId))
      .limit(100);
    });

    // Recipe with full details
    await this.timeQuery("Recipes with full details", async () => {
      return await db.select({
        recipe: recipes,
        ingredient: recipeIngredients,
        instruction: recipeInstructions
      })
      .from(recipes)
      .leftJoin(recipeIngredients, eq(recipes.id, recipeIngredients.recipeId))
      .leftJoin(recipeInstructions, eq(recipes.id, recipeInstructions.recipeId))
      .limit(50);
    });

    // Recipe with tags (many-to-many)
    await this.timeQuery("Recipes with tags", async () => {
      return await db.select({
        recipeId: recipes.id,
        recipeTitle: recipes.title,
        tagName: recipeTags.name
      })
      .from(recipes)
      .leftJoin(recipeTagRelations, eq(recipes.id, recipeTagRelations.recipeId))
      .leftJoin(recipeTags, eq(recipeTagRelations.tagId, recipeTags.id))
      .limit(100);
    });
  }

  async analyzeSearchQueries() {
    logger.info("Analyzing search queries");

    // Recipe title search
    await this.timeQuery("Recipe title search", async () => {
      return await db.select()
        .from(recipes)
        .where(like(recipes.title, "%chicken%"))
        .limit(20);
    });

    // Ingredient search
    await this.timeQuery("Ingredient search", async () => {
      return await db.select({
        recipeId: recipes.id,
        recipeTitle: recipes.title,
        ingredientName: recipeIngredients.name
      })
      .from(recipes)
      .innerJoin(recipeIngredients, eq(recipes.id, recipeIngredients.recipeId))
      .where(like(recipeIngredients.name, "%chicken%"))
      .limit(20);
    });

    // Complex search (title + ingredients)
    await this.timeQuery("Complex search (title + ingredients)", async () => {
      return await db.select({
        recipe: recipes,
        ingredient: recipeIngredients
      })
      .from(recipes)
      .leftJoin(recipeIngredients, eq(recipes.id, recipeIngredients.recipeId))
      .where(
        sql`${recipes.title} LIKE '%pasta%' OR ${recipeIngredients.name} LIKE '%pasta%'`
      )
      .limit(20);
    });
  }

  async analyzeAggregationQueries() {
    logger.info("Analyzing aggregation queries");

    // Recipe statistics
    await this.timeQuery("Recipe statistics", async () => {
      return await db.select({
        totalRecipes: sql<number>`COUNT(*)`,
        avgPrepTime: sql<number>`AVG(${recipes.prepTimeMinutes})`,
        avgCookTime: sql<number>`AVG(${recipes.cookTimeMinutes})`,
        maxServings: sql<number>`MAX(${recipes.servings})`
      }).from(recipes);
    });

    // Ingredients per recipe
    await this.timeQuery("Ingredients per recipe", async () => {
      return await db.select({
        recipeId: recipeIngredients.recipeId,
        ingredientCount: sql<number>`COUNT(*)`
      })
      .from(recipeIngredients)
      .groupBy(recipeIngredients.recipeId)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(20);
    });

    // Tag usage statistics
    await this.timeQuery("Tag usage statistics", async () => {
      return await db.select({
        tagId: recipeTags.id,
        tagName: recipeTags.name,
        usageCount: sql<number>`COUNT(${recipeTagRelations.recipeId})`
      })
      .from(recipeTags)
      .leftJoin(recipeTagRelations, eq(recipeTags.id, recipeTagRelations.tagId))
      .groupBy(recipeTags.id, recipeTags.name)
      .orderBy(desc(sql`COUNT(${recipeTagRelations.recipeId})`))
      .limit(20);
    });
  }

  async analyzeComplexQueries() {
    logger.info("Analyzing complex queries");

    // Most popular recipes (by tag count)
    await this.timeQuery("Most popular recipes by tags", async () => {
      return await db.select({
        recipeId: recipes.id,
        recipeTitle: recipes.title,
        tagCount: sql<number>`COUNT(${recipeTagRelations.tagId})`
      })
      .from(recipes)
      .leftJoin(recipeTagRelations, eq(recipes.id, recipeTagRelations.recipeId))
      .groupBy(recipes.id, recipes.title)
      .orderBy(desc(sql`COUNT(${recipeTagRelations.tagId})`))
      .limit(10);
    });

    // Recipes with complete data
    await this.timeQuery("Recipes with complete data", async () => {
      return await db.select({
        recipeId: recipes.id,
        recipeTitle: recipes.title,
        hasDescription: sql<boolean>`${recipes.description} IS NOT NULL AND ${recipes.description} != ''`,
        ingredientCount: sql<number>`COUNT(DISTINCT ${recipeIngredients.id})`,
        instructionCount: sql<number>`COUNT(DISTINCT ${recipeInstructions.id})`,
        tagCount: sql<number>`COUNT(DISTINCT ${recipeTagRelations.tagId})`
      })
      .from(recipes)
      .leftJoin(recipeIngredients, eq(recipes.id, recipeIngredients.recipeId))
      .leftJoin(recipeInstructions, eq(recipes.id, recipeInstructions.recipeId))
      .leftJoin(recipeTagRelations, eq(recipes.id, recipeTagRelations.recipeId))
      .groupBy(recipes.id, recipes.title, recipes.description)
      .limit(20);
    });

    // User activity summary
    await this.timeQuery("User activity summary", async () => {
      return await db.select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        recipeCount: sql<number>`COUNT(${recipes.id})`,
        publicRecipeCount: sql<number>`SUM(CASE WHEN ${recipes.isPublic} = true THEN 1 ELSE 0 END)`,
        avgPrepTime: sql<number>`AVG(${recipes.prepTimeMinutes})`
      })
      .from(users)
      .leftJoin(recipes, eq(users.id, recipes.userId))
      .groupBy(users.id, users.name, users.email)
      .limit(20);
    });
  }

  async simulatePerformanceLoad() {
    logger.info("Simulating performance load");

    // Simulate multiple concurrent queries
    const concurrentQueries = [
      () => db.select().from(recipes).limit(100),
      () => db.select().from(recipeIngredients).limit(500),
      () => db.select().from(recipeInstructions).limit(300),
      () => db.select().from(users).limit(50),
      () => db.select().from(recipeTags).limit(100)
    ];

    await this.timeQuery("Concurrent query load test", async () => {
      const results = await Promise.all(
        concurrentQueries.map(query => query())
      );
      return results;
    });

    // Heavy join simulation
    await this.timeQuery("Heavy join simulation", async () => {
      return await db.select()
        .from(recipes)
        .leftJoin(recipeIngredients, eq(recipes.id, recipeIngredients.recipeId))
        .leftJoin(recipeInstructions, eq(recipes.id, recipeInstructions.recipeId))
        .leftJoin(recipeTagRelations, eq(recipes.id, recipeTagRelations.recipeId))
        .leftJoin(recipeTags, eq(recipeTagRelations.tagId, recipeTags.id))
        .leftJoin(users, eq(recipes.userId, users.id))
        .limit(200);
    });
  }

  generatePerformanceReport() {
    logger.info("Generating performance report");

    const sortedResults = this.results.sort((a, b) => b.duration - a.duration);
    
    const summary = {
      totalQueries: this.results.length,
      fastQueries: this.results.filter(r => r.status === "fast").length,
      slowQueries: this.results.filter(r => r.status === "slow").length,
      criticalQueries: this.results.filter(r => r.status === "critical").length,
      averageDuration: this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length,
      slowestQuery: sortedResults[0],
      fastestQuery: sortedResults[sortedResults.length - 1]
    };

    return {
      summary,
      allResults: sortedResults
    };
  }

  async runAnalysis() {
    logger.info("Starting comprehensive database query analysis");

    try {
      await this.analyzeBasicQueries();
      await this.analyzeJoinQueries();
      await this.analyzeSearchQueries();
      await this.analyzeAggregationQueries();
      await this.analyzeComplexQueries();
      await this.simulatePerformanceLoad();

      const report = this.generatePerformanceReport();
      
      logger.info({
        summary: report.summary,
        topSlowQueries: report.allResults.slice(0, 5)
      }, "Query analysis completed");

      return report;

    } catch (error) {
      logError(logger, "Query analysis failed", error);
      throw error;
    }
  }
}

async function main() {
  console.log("🔍 Running Database Query Analysis...\n");
  
  try {
    const analyzer = new QueryAnalyzer();
    const report = await analyzer.runAnalysis();

    console.log("\n📊 Query Performance Report:");
    console.log(`   • Total Queries Analyzed: ${report.summary.totalQueries}`);
    console.log(`   • Fast Queries (<500ms): ${report.summary.fastQueries}`);
    console.log(`   • Slow Queries (500-1000ms): ${report.summary.slowQueries}`);
    console.log(`   • Critical Queries (>1000ms): ${report.summary.criticalQueries}`);
    console.log(`   • Average Duration: ${report.summary.averageDuration.toFixed(2)}ms`);

    if (report.summary.slowestQuery) {
      console.log("\n⚠️  Slowest Query:");
      console.log(`   • Name: ${report.summary.slowestQuery.name}`);
      console.log(`   • Duration: ${report.summary.slowestQuery.duration.toFixed(2)}ms`);
      console.log(`   • Result Count: ${report.summary.slowestQuery.resultCount}`);
    }

    if (report.summary.criticalQueries > 0) {
      console.log("\n❌ Critical Performance Issues:");
      report.allResults
        .filter(r => r.status === "critical")
        .forEach(query => {
          console.log(`   • ${query.name}: ${query.duration.toFixed(2)}ms (${query.resultCount} results)`);
        });
    }

    if (report.summary.slowQueries > 0) {
      console.log("\n⚠️  Slow Queries to Optimize:");
      report.allResults
        .filter(r => r.status === "slow")
        .forEach(query => {
          console.log(`   • ${query.name}: ${query.duration.toFixed(2)}ms (${query.resultCount} results)`);
        });
    }

    console.log("\n🔧 Optimization Recommendations:");
    if (report.summary.criticalQueries > 0) {
      console.log("   • Add database indexes for critical queries");
      console.log("   • Consider query optimization for complex joins");
    }
    if (report.summary.slowQueries > 0) {
      console.log("   • Review slow queries for potential index improvements");
      console.log("   • Consider adding LIMIT clauses to large result sets");
    }
    if (report.summary.averageDuration > 200) {
      console.log("   • Overall query performance could be improved");
      console.log("   • Consider database connection pooling");
    }

    console.log("\n✅ Query analysis completed!");

  } catch (error) {
    console.error("❌ Query analysis failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}