import { ID } from "node-appwrite";
import {
  createAdminClient,
  createSessionClient,
  createSessionClientFromSecret,
  serializeSessionCookie,
  serializeDeleteSessionCookie,
} from "../utils/appwrite/server";

export const authService = {
  /**
   * Get the currently logged-in user from the session cookie
   */
  async getSessionUser(request?: Request) {
    if (!request) return null;
    try {
      const { account } = createSessionClient(request);
      return await account.get();
    } catch {
      return null;
    }
  },

  /**
   * Register a new user:
   * 1. Create Appwrite Account (via Admin Client)
   * 2. Create Email/Password Session
   * 3. Send Verification Email with redirect URL
   * 4. Return Session Cookie header
   */
  async register({
    name,
    email,
    password,
    origin,
  }: {
    name: string;
    email: string;
    password: string;
    origin: string;
  }) {
    const { account: adminAccount } = createAdminClient();

    // 1. Create account
    const user = await adminAccount.create(ID.unique(), email, password, name);

    // 2. Create session
    const session = await adminAccount.createEmailPasswordSession(email, password);

    // 3. Send verification email using session client
    try {
      const { account: sessionAccount } = createSessionClientFromSecret(session.secret);
      await sessionAccount.createVerification(`${origin}/verify`);
    } catch (verificationError) {
      console.error("Verification email failed to send:", verificationError);
    }

    // 4. Serialize session cookie
    const cookieHeader = serializeSessionCookie(session.secret);
    return { user, cookieHeader };
  },

  /**
   * Login with email and password
   */
  async login({ email, password }: { email: string; password: string }) {
    const { account: adminAccount } = createAdminClient();
    const session = await adminAccount.createEmailPasswordSession(email, password);
    const cookieHeader = serializeSessionCookie(session.secret);
    return { session, cookieHeader };
  },

  /**
   * Verify email token
   * Uses Admin Users service to mark user as email verified (server-side without client public scope restriction)
   */
  async verifyEmail({ userId }: { userId: string; secret: string }) {
    const { users } = createAdminClient();
    return await users.updateEmailVerification(userId, true);
  },

  /**
   * Resend verification email to current session user
   */
  async resendVerification(request: Request, origin: string) {
    const { account } = createSessionClient(request);
    return await account.createVerification(`${origin}/verify`);
  },

  /**
   * Anonymous login fallback (if desired)
   */
  async anonymousLogin(request?: Request) {
    try {
      const { account } = request ? createSessionClient(request) : createAdminClient();
      const session = await account.createAnonymousSession();
      const user = await account.get();
      const cookieHeader = serializeSessionCookie(session.secret);
      return { sessionSecret: session.secret, user, cookieHeader };
    } catch (error) {
      console.error("Anonymous login failed:", error);
      throw error;
    }
  },

  /**
   * Log out current session
   */
  async logout(request?: Request): Promise<{ cookieHeader: string }> {
    if (request) {
      try {
        const { account } = createSessionClient(request);
        await account.deleteSession("current");
      } catch (e) {
        console.warn("Error deleting Appwrite session:", e);
      }
    }
    return { cookieHeader: serializeDeleteSessionCookie() };
  },
};
