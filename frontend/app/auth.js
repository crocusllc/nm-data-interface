import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth } = NextAuth({
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        // Send credentials to your API for validation
        const res = await fetch(`${process.env.API_URL}/login`, {
          method: "POST",
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" },
        });

        const user = await res.json();

        if (res.ok && user) {
          return user; // Return user object if authentication succeeds
        } else {
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT for session management
  },
  secret: process.env.NEXTAUTH_SECRET, // Ensure this is set in .env
  callbacks: {
    // Attach user data to the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.accessToken = user.token;
        token.new_password = user.new_password;
      }
      return token;
    },

    // Include JWT data in the session object
    async session({ session, token }) {
      session.user = {
        id: token.id,
        username: token.username,
        role: token.role,
        accessToken: token.accessToken,
        require_pass: token.new_password,
      };
      return session;
    },
  },
  pages: {
    signIn: `/login`, // Redirect to custom login page
    signOut: `/login`
  },
})
