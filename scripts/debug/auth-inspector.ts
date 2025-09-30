#!/usr/bin/env tsx

/**
 * Authentication Inspector
 * Debug authentication sessions, user states, and auth flow issues
 */

import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db/index";
import { accounts, sessions, users, verificationTokens } from "@/db/schema.base";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("auth-inspector");

interface AuthDebugInfo {
  user?: any;
  sessions: any[];
  accounts: any[];
  verificationTokens: any[];
  issues: string[];
}

class AuthenticationInspector {
  
  async inspectUserById(userId: string): Promise<AuthDebugInfo> {
    logger.info({ userId }, "Inspecting user by ID");

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const userSessions = await db.select().from(sessions).where(eq(sessions.userId, userId));
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId));
    const userTokens = await db.select().from(verificationTokens)
      .where(eq(verificationTokens.identifier, user[0]?.email || ""));

    const issues: string[] = [];

    // Check for issues
    if (!user.length) {
      issues.push("User not found");
      return { sessions: [], accounts: [], verificationTokens: [], issues };
    }

    if (!user[0].emailVerified) {
      issues.push("Email not verified");
    }

    if (!userAccounts.length) {
      issues.push("No accounts associated with user");
    }

    // Check session validity
    const now = new Date();
    const expiredSessions = userSessions.filter(s => new Date(s.expiresAt) < now);
    const activeSessions = userSessions.filter(s => new Date(s.expiresAt) >= now);

    if (expiredSessions.length > 0) {
      issues.push(`${expiredSessions.length} expired sessions`);
    }

    if (activeSessions.length === 0) {
      issues.push("No active sessions");
    }

    if (activeSessions.length > 5) {
      issues.push(`Too many active sessions (${activeSessions.length})`);
    }

    return {
      user: user[0],
      sessions: userSessions,
      accounts: userAccounts,
      verificationTokens: userTokens,
      issues
    };
  }

  async inspectUserByEmail(email: string): Promise<AuthDebugInfo> {
    logger.info({ email }, "Inspecting user by email");

    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (!user.length) {
      return {
        sessions: [],
        accounts: [],
        verificationTokens: [],
        issues: ["User not found with this email"]
      };
    }

    return await this.inspectUserById(user[0].id);
  }

  async inspectSessionById(sessionId: string) {
    logger.info({ sessionId }, "Inspecting session by ID");

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    
    if (!session.length) {
      return { session: null, user: null, issues: ["Session not found"] };
    }

    const user = await db.select().from(users).where(eq(users.id, session[0].userId)).limit(1);
    const now = new Date();
    const isExpired = new Date(session[0].expiresAt) < now;
    
    const issues: string[] = [];
    if (isExpired) {
      issues.push("Session is expired");
    }
    
    if (!user.length) {
      issues.push("Session user not found");
    }

    return {
      session: session[0],
      user: user[0] || null,
      isExpired,
      timeUntilExpiry: isExpired ? null : new Date(session[0].expiresAt).getTime() - now.getTime(),
      issues
    };
  }

  async getAllActiveSessions() {
    logger.info("Fetching all active sessions");

    const now = new Date();
    const activeSessions = await db.select({
      session: sessions,
      user: {
        id: users.id,
        email: users.email,
        name: users.name
      }
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(sql`${sessions.expiresAt} > datetime('now')`)
    .orderBy(desc(sessions.createdAt));

    return activeSessions.map(item => ({
      ...item,
      timeUntilExpiry: new Date(item.session.expiresAt).getTime() - now.getTime(),
      ageInDays: Math.floor((now.getTime() - new Date(item.session.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    }));
  }

  async getAllExpiredSessions() {
    logger.info("Fetching all expired sessions");

    const expiredSessions = await db.select({
      session: sessions,
      user: {
        id: users.id,
        email: users.email,
        name: users.name
      }
    })
    .from(sessions)
    .leftJoin(users, eq(sessions.userId, users.id))
    .where(sql`${sessions.expiresAt} < datetime('now')`)
    .orderBy(desc(sessions.createdAt))
    .limit(50);

    const now = new Date();
    return expiredSessions.map(item => ({
      ...item,
      expiredDaysAgo: Math.floor((now.getTime() - new Date(item.session.expiresAt).getTime()) / (1000 * 60 * 60 * 24))
    }));
  }

  async getProblematicAccounts() {
    logger.info("Finding problematic accounts");

    // Users without accounts
    const usersWithoutAccounts = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      emailVerified: users.emailVerified
    })
    .from(users)
    .leftJoin(accounts, eq(users.id, accounts.userId))
    .where(sql`${accounts.userId} IS NULL`)
    .limit(20);

    // Accounts without users
    const accountsWithoutUsers = await db.select({
      id: accounts.id,
      userId: accounts.userId,
      providerId: accounts.providerId
    })
    .from(accounts)
    .leftJoin(users, eq(accounts.userId, users.id))
    .where(sql`${users.id} IS NULL`)
    .limit(20);

    // Users with multiple accounts (might be suspicious)
    const usersWithMultipleAccounts = await db.select({
      userId: accounts.userId,
      accountCount: sql<number>`COUNT(*)`
    })
    .from(accounts)
    .groupBy(accounts.userId)
    .having(sql`COUNT(*) > 1`)
    .limit(20);

    return {
      usersWithoutAccounts,
      accountsWithoutUsers,
      usersWithMultipleAccounts
    };
  }

  async getAuthSystemStats() {
    logger.info("Generating authentication system statistics");

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      users: {
        total: await db.select().from(users).then(r => r.length),
        verified: await db.select().from(users).where(eq(users.emailVerified, true)).then(r => r.length),
        unverified: await db.select().from(users).where(eq(users.emailVerified, false)).then(r => r.length),
        recentRegistrations: {
          last24h: await db.select().from(users).where(sql`${users.createdAt} > ${oneDayAgo}`).then(r => r.length),
          lastWeek: await db.select().from(users).where(sql`${users.createdAt} > ${oneWeekAgo}`).then(r => r.length),
          lastMonth: await db.select().from(users).where(sql`${users.createdAt} > ${oneMonthAgo}`).then(r => r.length),
        }
      },
      sessions: {
        total: await db.select().from(sessions).then(r => r.length),
        active: await db.select().from(sessions).where(sql`${sessions.expiresAt} > datetime('now')`).then(r => r.length),
        expired: await db.select().from(sessions).where(sql`${sessions.expiresAt} < datetime('now')`).then(r => r.length),
        recentActivity: {
          last24h: await db.select().from(sessions).where(sql`${sessions.createdAt} > ${oneDayAgo}`).then(r => r.length),
          lastWeek: await db.select().from(sessions).where(sql`${sessions.createdAt} > ${oneWeekAgo}`).then(r => r.length),
        }
      },
      accounts: {
        total: await db.select().from(accounts).then(r => r.length),
        byProvider: await db.select({
          providerId: accounts.providerId,
          count: sql<number>`COUNT(*)`
        }).from(accounts).groupBy(accounts.providerId)
      },
      verificationTokens: {
        total: await db.select().from(verificationTokens).then(r => r.length),
        active: await db.select().from(verificationTokens).where(sql`${verificationTokens.expiresAt} > datetime('now')`).then(r => r.length),
        expired: await db.select().from(verificationTokens).where(sql`${verificationTokens.expiresAt} < datetime('now')`).then(r => r.length)
      }
    };

    return stats;
  }

  async testAuthConfiguration() {
    logger.info("Testing authentication configuration");

    const tests = {
      betterAuthConfig: null as any,
      databaseConnection: false,
      sessionGeneration: false,
      errors: [] as string[]
    };

    try {
      // Test database connection
      await db.select().from(users).limit(1);
      tests.databaseConnection = true;
    } catch (error) {
      tests.errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Try to access auth configuration (this is tricky since auth is configured)
      tests.betterAuthConfig = {
        baseURL: process.env.BETTER_AUTH_URL || "Not set",
        secretSet: !!(process.env.BETTER_AUTH_SECRET),
        sessionExpiry: "30 days (configured)",
      };
    } catch (error) {
      tests.errors.push(`Auth config check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return tests;
  }

  async cleanupExpiredData() {
    logger.info("Cleaning up expired authentication data");

    const now = new Date();
    
    // Clean expired sessions
    const expiredSessions = await db.delete(sessions)
      .where(sql`${sessions.expiresAt} < datetime('now')`)
      .returning({ id: sessions.id });

    // Clean expired verification tokens
    const expiredTokens = await db.delete(verificationTokens)
      .where(sql`${verificationTokens.expiresAt} < datetime('now')`)
      .returning({ id: verificationTokens.id });

    logger.info({
      sessionsDeleted: expiredSessions.length,
      tokensDeleted: expiredTokens.length
    }, "Cleanup completed");

    return {
      sessionsDeleted: expiredSessions.length,
      tokensDeleted: expiredTokens.length
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const value = args[1];

  console.log("🔍 Authentication Inspector\n");

  const inspector = new AuthenticationInspector();

  try {
    switch (command) {
      case "user-id":
        if (!value) {
          console.log("Usage: tsx auth-inspector.ts user-id <user-id>");
          process.exit(1);
        }
        const userInfo = await inspector.inspectUserById(value);
        console.log("👤 User Debug Info:");
        console.log(JSON.stringify(userInfo, null, 2));
        break;

      case "user-email":
        if (!value) {
          console.log("Usage: tsx auth-inspector.ts user-email <email>");
          process.exit(1);
        }
        const emailInfo = await inspector.inspectUserByEmail(value);
        console.log("📧 User Debug Info (by email):");
        console.log(JSON.stringify(emailInfo, null, 2));
        break;

      case "session":
        if (!value) {
          console.log("Usage: tsx auth-inspector.ts session <session-id>");
          process.exit(1);
        }
        const sessionInfo = await inspector.inspectSessionById(value);
        console.log("🔒 Session Debug Info:");
        console.log(JSON.stringify(sessionInfo, null, 2));
        break;

      case "active-sessions":
        const activeSessions = await inspector.getAllActiveSessions();
        console.log(`🔓 Active Sessions (${activeSessions.length}):`);
        activeSessions.forEach(session => {
          console.log(`   • User: ${session.user.email} | Session: ${session.session.id.substring(0, 8)}... | Age: ${session.ageInDays} days`);
        });
        break;

      case "expired-sessions":
        const expiredSessions = await inspector.getAllExpiredSessions();
        console.log(`⏰ Expired Sessions (showing last 50):`);
        expiredSessions.forEach(session => {
          const userEmail = session.user?.email || "Unknown";
          console.log(`   • User: ${userEmail} | Expired: ${session.expiredDaysAgo} days ago`);
        });
        break;

      case "problems":
        const problems = await inspector.getProblematicAccounts();
        console.log("⚠️  Problematic Accounts:");
        console.log(`   • Users without accounts: ${problems.usersWithoutAccounts.length}`);
        console.log(`   • Accounts without users: ${problems.accountsWithoutUsers.length}`);
        console.log(`   • Users with multiple accounts: ${problems.usersWithMultipleAccounts.length}`);
        
        if (problems.usersWithoutAccounts.length > 0) {
          console.log("\n   Users without accounts:");
          problems.usersWithoutAccounts.forEach(user => {
            console.log(`     - ${user.email} (${user.id})`);
          });
        }
        break;

      case "stats":
        const stats = await inspector.getAuthSystemStats();
        console.log("📊 Authentication System Statistics:");
        console.log(`\n👥 Users:`);
        console.log(`   • Total: ${stats.users.total}`);
        console.log(`   • Verified: ${stats.users.verified}`);
        console.log(`   • Unverified: ${stats.users.unverified}`);
        console.log(`   • Recent registrations:`);
        console.log(`     - Last 24h: ${stats.users.recentRegistrations.last24h}`);
        console.log(`     - Last week: ${stats.users.recentRegistrations.lastWeek}`);
        console.log(`     - Last month: ${stats.users.recentRegistrations.lastMonth}`);
        
        console.log(`\n🔒 Sessions:`);
        console.log(`   • Total: ${stats.sessions.total}`);
        console.log(`   • Active: ${stats.sessions.active}`);
        console.log(`   • Expired: ${stats.sessions.expired}`);
        
        console.log(`\n🔑 Accounts:`);
        console.log(`   • Total: ${stats.accounts.total}`);
        stats.accounts.byProvider.forEach(provider => {
          console.log(`   • ${provider.providerId}: ${provider.count}`);
        });
        break;

      case "test-config":
        const testResults = await inspector.testAuthConfiguration();
        console.log("🧪 Authentication Configuration Test:");
        console.log(`   • Database connection: ${testResults.databaseConnection ? '✅' : '❌'}`);
        console.log(`   • Base URL: ${testResults.betterAuthConfig?.baseURL || 'Not configured'}`);
        console.log(`   • Secret configured: ${testResults.betterAuthConfig?.secretSet ? '✅' : '❌'}`);
        
        if (testResults.errors.length > 0) {
          console.log("\n❌ Errors found:");
          testResults.errors.forEach(error => console.log(`   • ${error}`));
        }
        break;

      case "cleanup":
        console.log("🧹 Cleaning up expired authentication data...");
        const cleanupResults = await inspector.cleanupExpiredData();
        console.log(`✅ Cleanup completed:`);
        console.log(`   • Expired sessions deleted: ${cleanupResults.sessionsDeleted}`);
        console.log(`   • Expired tokens deleted: ${cleanupResults.tokensDeleted}`);
        break;

      default:
        console.log("Available commands:");
        console.log("  user-id <id>        - Inspect user by ID");
        console.log("  user-email <email>  - Inspect user by email");
        console.log("  session <id>        - Inspect session by ID");
        console.log("  active-sessions     - List all active sessions");
        console.log("  expired-sessions    - List expired sessions");
        console.log("  problems           - Find problematic accounts");
        console.log("  stats              - Show auth system statistics");
        console.log("  test-config        - Test authentication configuration");
        console.log("  cleanup            - Clean up expired data");
        break;
    }

  } catch (error) {
    logError(logger, "Auth inspection failed", error);
    console.error("❌ Auth inspection failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}