#!/usr/bin/env tsx

/**
 * Authentication System Health Check
 * Validates auth system integrity, session management, and user account health
 */

import { and, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db/index";
import { accounts, sessions, users, verificationTokens } from "@/db/schema.base";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("auth-system-health-check");

interface AuthIssue {
  type: "error" | "warning" | "info";
  category: string;
  description: string;
  count?: number;
  details?: any;
}

class AuthSystemHealthChecker {
  private issues: AuthIssue[] = [];

  addIssue(issue: AuthIssue) {
    this.issues.push(issue);
    const level = issue.type === "error" ? "error" : issue.type === "warning" ? "warn" : "info";
    logger[level]({
      category: issue.category,
      count: issue.count,
      details: issue.details
    }, issue.description);
  }

  async checkUserAccountHealth() {
    logger.info("Checking user account health");

    // Check for users with invalid email formats
    const invalidEmails = await db.select({
      id: users.id,
      email: users.email,
      name: users.name
    }).from(users).where(
      sql`${users.email} NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`
    );

    if (invalidEmails.length > 0) {
      this.addIssue({
        type: "error",
        category: "user-accounts",
        description: "Users with invalid email addresses",
        count: invalidEmails.length,
        details: invalidEmails.slice(0, 5).map(u => ({ 
          id: u.id, 
          email: u.email,
          name: u.name 
        }))
      });
    }

    // Check for duplicate email addresses
    const duplicateEmails = await db.select({
      email: users.email,
      count: sql<number>`COUNT(*)`
    })
    .from(users)
    .groupBy(users.email)
    .having(sql`COUNT(*) > 1`);

    if (duplicateEmails.length > 0) {
      this.addIssue({
        type: "error",
        category: "user-accounts",
        description: "Duplicate email addresses found",
        count: duplicateEmails.length,
        details: duplicateEmails.slice(0, 5)
      });
    }

    // Check for users with missing names
    const usersWithoutNames = await db.select({
      id: users.id,
      email: users.email,
      name: users.name
    }).from(users).where(
      sql`${users.name} IS NULL OR ${users.name} = ''`
    );

    if (usersWithoutNames.length > 0) {
      this.addIssue({
        type: "warning",
        category: "user-accounts",
        description: "Users with missing or empty names",
        count: usersWithoutNames.length,
        details: usersWithoutNames.slice(0, 5).map(u => ({ 
          id: u.id, 
          email: u.email 
        }))
      });
    }

    // Check for unverified users older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldUnverifiedUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
      emailVerified: users.emailVerified
    }).from(users).where(
      and(
        sql`${users.emailVerified} = false`,
        lt(users.createdAt, thirtyDaysAgo)
      )
    );

    if (oldUnverifiedUsers.length > 0) {
      this.addIssue({
        type: "info",
        category: "user-accounts",
        description: "Unverified user accounts older than 30 days",
        count: oldUnverifiedUsers.length,
        details: oldUnverifiedUsers.slice(0, 5).map(u => ({
          id: u.id,
          email: u.email,
          createdAt: u.createdAt,
          daysOld: Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }))
      });
    }

    // Check user preference consistency
    const usersWithInvalidPreferences = await db.select({
      id: users.id,
      email: users.email,
      preferredTemperatureUnit: users.preferredTemperatureUnit,
      preferredWeightUnit: users.preferredWeightUnit,
      preferredVolumeUnit: users.preferredVolumeUnit
    }).from(users).where(
      sql`
        ${users.preferredTemperatureUnit} NOT IN ('fahrenheit', 'celsius') OR
        ${users.preferredWeightUnit} NOT IN ('imperial', 'metric') OR
        ${users.preferredVolumeUnit} NOT IN ('imperial', 'metric')
      `
    );

    if (usersWithInvalidPreferences.length > 0) {
      this.addIssue({
        type: "error",
        category: "user-accounts",
        description: "Users with invalid preference values",
        count: usersWithInvalidPreferences.length,
        details: usersWithInvalidPreferences.slice(0, 5)
      });
    }
  }

  async checkSessionHealth() {
    logger.info("Checking session health");

    // Expired sessions that haven't been cleaned up
    const expiredSessions = await db.select({
      id: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
      createdAt: sessions.createdAt
    }).from(sessions).where(
      lt(sessions.expiresAt, new Date())
    );

    if (expiredSessions.length > 0) {
      this.addIssue({
        type: "warning",
        category: "session-management",
        description: "Expired sessions that should be cleaned up",
        count: expiredSessions.length,
        details: expiredSessions.slice(0, 5).map(s => ({
          id: s.id,
          userId: s.userId,
          expiredDaysAgo: Math.floor((Date.now() - new Date(s.expiresAt).getTime()) / (1000 * 60 * 60 * 24))
        }))
      });
    }

    // Sessions for non-existent users
    const sessionsWithoutUsers = await db.select({
      id: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt
    })
    .from(sessions)
    .leftJoin(users, sql`${sessions.userId} = ${users.id}`)
    .where(isNull(users.id));

    if (sessionsWithoutUsers.length > 0) {
      this.addIssue({
        type: "error",
        category: "session-management",
        description: "Sessions for non-existent users (orphaned sessions)",
        count: sessionsWithoutUsers.length,
        details: sessionsWithoutUsers.slice(0, 5)
      });
    }

    // Users with excessive active sessions (potential security issue)
    const usersWithManySessions = await db.select({
      userId: sessions.userId,
      sessionCount: sql<number>`COUNT(*)`
    })
    .from(sessions)
    .where(sql`${sessions.expiresAt} > datetime('now')`)
    .groupBy(sessions.userId)
    .having(sql`COUNT(*) > 5`);

    if (usersWithManySessions.length > 0) {
      this.addIssue({
        type: "warning",
        category: "session-management",
        description: "Users with excessive active sessions (>5)",
        count: usersWithManySessions.length,
        details: usersWithManySessions.slice(0, 5)
      });
    }

    // Very old active sessions (potential security risk)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldActiveSessions = await db.select({
      id: sessions.id,
      userId: sessions.userId,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt
    }).from(sessions).where(
      and(
        sql`${sessions.expiresAt} > datetime('now')`,
        lt(sessions.createdAt, thirtyDaysAgo)
      )
    );

    if (oldActiveSessions.length > 0) {
      this.addIssue({
        type: "info",
        category: "session-management",
        description: "Active sessions older than 30 days",
        count: oldActiveSessions.length,
        details: oldActiveSessions.slice(0, 5).map(s => ({
          id: s.id,
          userId: s.userId,
          ageInDays: Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }))
      });
    }
  }

  async checkAccountProviders() {
    logger.info("Checking account providers");

    // Accounts for non-existent users
    const accountsWithoutUsers = await db.select({
      id: accounts.id,
      userId: accounts.userId,
      providerId: accounts.providerId
    })
    .from(accounts)
    .leftJoin(users, sql`${accounts.userId} = ${users.id}`)
    .where(isNull(users.id));

    if (accountsWithoutUsers.length > 0) {
      this.addIssue({
        type: "error",
        category: "account-providers",
        description: "Accounts for non-existent users (orphaned accounts)",
        count: accountsWithoutUsers.length,
        details: accountsWithoutUsers.slice(0, 5)
      });
    }

    // Users without any accounts (should not be possible in normal operation)
    const usersWithoutAccounts = await db.select({
      id: users.id,
      email: users.email,
      name: users.name
    })
    .from(users)
    .leftJoin(accounts, sql`${users.id} = ${accounts.userId}`)
    .where(isNull(accounts.userId))
    .groupBy(users.id, users.email, users.name);

    if (usersWithoutAccounts.length > 0) {
      this.addIssue({
        type: "warning",
        category: "account-providers",
        description: "Users without any associated accounts",
        count: usersWithoutAccounts.length,
        details: usersWithoutAccounts.slice(0, 5)
      });
    }

    // Account provider distribution
    const providerStats = await db.select({
      providerId: accounts.providerId,
      count: sql<number>`COUNT(*)`
    })
    .from(accounts)
    .groupBy(accounts.providerId);

    this.addIssue({
      type: "info",
      category: "account-providers",
      description: "Account provider distribution",
      details: providerStats
    });
  }

  async checkVerificationTokens() {
    logger.info("Checking verification tokens");

    // Expired verification tokens
    const expiredTokens = await db.select({
      id: verificationTokens.id,
      identifier: verificationTokens.identifier,
      expiresAt: verificationTokens.expiresAt,
      createdAt: verificationTokens.createdAt
    }).from(verificationTokens).where(
      lt(verificationTokens.expiresAt, new Date())
    );

    if (expiredTokens.length > 0) {
      this.addIssue({
        type: "info",
        category: "verification-tokens",
        description: "Expired verification tokens (should be cleaned up)",
        count: expiredTokens.length,
        details: expiredTokens.slice(0, 5).map(t => ({
          id: t.id,
          identifier: t.identifier,
          expiredDaysAgo: Math.floor((Date.now() - new Date(t.expiresAt).getTime()) / (1000 * 60 * 60 * 24))
        }))
      });
    }

    // Very old verification tokens (potential cleanup needed)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oldTokens = await db.select({
      id: verificationTokens.id,
      identifier: verificationTokens.identifier,
      createdAt: verificationTokens.createdAt
    }).from(verificationTokens).where(
      lt(verificationTokens.createdAt, sevenDaysAgo)
    );

    if (oldTokens.length > 0) {
      this.addIssue({
        type: "warning",
        category: "verification-tokens",
        description: "Verification tokens older than 7 days",
        count: oldTokens.length,
        details: oldTokens.slice(0, 5).map(t => ({
          id: t.id,
          identifier: t.identifier,
          ageInDays: Math.floor((Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }))
      });
    }
  }

  async generateAuthStats() {
    logger.info("Generating authentication system statistics");

    const totalUsers = await db.select().from(users).then(r => r.length);
    const verifiedUsers = await db.select().from(users)
      .where(sql`${users.emailVerified} = true`)
      .then(r => r.length);
    const activeSessions = await db.select().from(sessions)
      .where(sql`${sessions.expiresAt} > datetime('now')`)
      .then(r => r.length);
    const totalAccounts = await db.select().from(accounts).then(r => r.length);
    const activeTokens = await db.select().from(verificationTokens)
      .where(sql`${verificationTokens.expiresAt} > datetime('now')`)
      .then(r => r.length);

    // User registration trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRegistrations = await db.select().from(users)
      .where(sql`${users.createdAt} > ${sevenDaysAgo}`)
      .then(r => r.length);

    const authStats = {
      totalUsers,
      verifiedUsers,
      verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
      activeSessions,
      totalAccounts,
      activeVerificationTokens: activeTokens,
      recentRegistrations,
      averageSessionsPerUser: totalUsers > 0 ? Math.round((activeSessions / totalUsers) * 10) / 10 : 0
    };

    this.addIssue({
      type: "info",
      category: "auth-statistics",
      description: "Authentication system statistics",
      details: authStats
    });

    return authStats;
  }

  async runAllChecks() {
    logger.info("Starting comprehensive authentication system health check");

    try {
      await this.checkUserAccountHealth();
      await this.checkSessionHealth();
      await this.checkAccountProviders();
      await this.checkVerificationTokens();
      const stats = await this.generateAuthStats();

      const summary = {
        total: this.issues.length,
        errors: this.issues.filter(i => i.type === "error").length,
        warnings: this.issues.filter(i => i.type === "warning").length,
        info: this.issues.filter(i => i.type === "info").length,
      };

      logger.info({ summary, stats }, "Authentication system health check completed");

      return {
        success: summary.errors === 0,
        issues: this.issues,
        summary,
        stats
      };

    } catch (error) {
      logError(logger, "Authentication system health check failed", error);
      throw error;
    }
  }
}

async function main() {
  console.log("🔍 Running Authentication System Health Check...\n");
  
  try {
    const checker = new AuthSystemHealthChecker();
    const result = await checker.runAllChecks();

    console.log("\n📊 Auth Health Check Results:");
    console.log(`   • Total Issues: ${result.summary.total}`);
    console.log(`   • Errors: ${result.summary.errors}`);
    console.log(`   • Warnings: ${result.summary.warnings}`);
    console.log(`   • Info: ${result.summary.info}`);

    if (result.stats) {
      console.log("\n📈 Auth System Statistics:");
      console.log(`   • Total Users: ${result.stats.totalUsers}`);
      console.log(`   • Verified Users: ${result.stats.verifiedUsers} (${result.stats.verificationRate}%)`);
      console.log(`   • Active Sessions: ${result.stats.activeSessions}`);
      console.log(`   • Total Accounts: ${result.stats.totalAccounts}`);
      console.log(`   • Active Verification Tokens: ${result.stats.activeVerificationTokens}`);
      console.log(`   • Recent Registrations (7 days): ${result.stats.recentRegistrations}`);
      console.log(`   • Avg Sessions/User: ${result.stats.averageSessionsPerUser}`);
    }

    if (result.summary.errors > 0) {
      console.log("\n❌ Critical authentication issues found:");
      result.issues
        .filter(i => i.type === "error")
        .forEach(issue => {
          console.log(`   • ${issue.description} (${issue.count || "unknown"} items)`);
        });
    }

    if (result.summary.warnings > 0) {
      console.log("\n⚠️  Authentication warnings:");
      result.issues
        .filter(i => i.type === "warning")
        .forEach(issue => {
          console.log(`   • ${issue.description} (${issue.count || "unknown"} items)`);
        });
    }

    // Provide cleanup recommendations
    const expiredSessions = result.issues.find(i => i.description.includes("Expired sessions"));
    const expiredTokens = result.issues.find(i => i.description.includes("Expired verification tokens"));
    
    if (expiredSessions || expiredTokens) {
      console.log("\n🧹 Cleanup Recommendations:");
      if (expiredSessions) {
        console.log(`   • Clean up ${expiredSessions.count} expired sessions`);
      }
      if (expiredTokens) {
        console.log(`   • Clean up ${expiredTokens.count} expired verification tokens`);
      }
    }

    if (result.success) {
      console.log("\n✅ Authentication system health check passed!");
    } else {
      console.log("\n❌ Authentication system health check failed - please address the errors above");
      process.exit(1);
    }

  } catch (error) {
    console.error("❌ Auth health check failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}