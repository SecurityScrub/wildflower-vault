import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import {
  isAccountLocked,
  recordFailedLogin,
  recordSuccessfulLogin,
  userNeedsMfa,
  verifyMfaCode,
} from "./auth-security";

// Reject sign-in with a specific error code that the front-end can detect.
// NextAuth returns the literal `Error` message in the URL `?error=` param.
class AuthError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
    this.name = "AuthError";
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
    // 12 hours; user must re-authenticate after this even if active.
    maxAge: 60 * 60 * 12,
    updateAge: 60 * 60, // rotate JWT once an hour while active
  },
  // Hardened cookie defaults: HttpOnly, Secure (in prod), SameSite=Lax.
  // NextAuth applies these defaults but we make them explicit so a regression
  // would be caught in code review.
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaCode: { label: "MFA code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new AuthError("missing_credentials");
        }
        const emailNorm = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({ where: { email: emailNorm } });
        // Use a constant-ish failure path to limit user-enumeration timing leaks.
        if (!user || !user.passwordHash) {
          // Burn a similar amount of CPU to the bcrypt path.
          await bcrypt.compare(credentials.password, "$2a$10$invalidsaltinvalidsaltinvali.");
          throw new AuthError("invalid_credentials");
        }

        if (await isAccountLocked(user.id)) {
          throw new AuthError("account_locked");
        }

        const passwordOk = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!passwordOk) {
          const { locked } = await recordFailedLogin(user.id);
          throw new AuthError(locked ? "account_locked" : "invalid_credentials");
        }

        // Enforce MFA for everyone but the admin account.
        if (userNeedsMfa(user.role)) {
          const code = (credentials.mfaCode ?? "").trim();
          if (!code) {
            // The /api/auth/begin endpoint must have issued and sent a code by
            // the time we get here; if the user pressed sign-in without one,
            // tell the front-end to switch to the code-entry step.
            throw new AuthError("mfa_required");
          }
          const result = await verifyMfaCode(user.id, code);
          if (!result.ok) {
            const codeMap: Record<string, string> = {
              no_code: "mfa_no_code",
              expired: "mfa_expired",
              too_many_attempts: "mfa_too_many_attempts",
              mismatch: "mfa_invalid",
            };
            throw new AuthError(codeMap[result.reason ?? "mismatch"] ?? "mfa_invalid");
          }
        }

        await recordSuccessfulLogin(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as typeof user & { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { role: string; id: string }).role =
          token.role as string;
        (session.user as typeof session.user & { id: string }).id = token.id as string;
      }
      return session;
    },
  },
};
