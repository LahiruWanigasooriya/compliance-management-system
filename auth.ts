// import NextAuth, { DefaultSession } from "next-auth";
// import Credentials from "next-auth/providers/credentials";
// import axios from "axios";
// import { APPLICATION } from "./constants/application";
// import { getTenantId } from "./utils/functions";
// import { createServerAxios } from "./utils/axios_server";

// // Extend the built-in session types
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       tenant_id: string;
//       email: string;
//       full_name: string;
//       phone: string;
//       role: string;
//       status: string;
//       risk_level: number;
//     } & DefaultSession["user"];
//     accessToken: string;
//     refreshToken: string;
//     error?: string;
//   }

//   interface User {
//     id: string;
//     tenant_id: string;
//     email: string;
//     full_name: string;
//     phone: string;
//     role: string;
//     status: string;
//     risk_level: number;
//     access_token: string;
//     refresh_token: string;
//   }
// }

// export const { handlers, signIn, signOut, auth } = NextAuth({
//   secret: process.env.AUTH_SECRET,
//   trustHost: true,
//   providers: [
//     Credentials({
//       id: "credentials",
//       name: "Credentials",
//       credentials: {
//         accessToken: { label: "Access Token", type: "text" },
//         refreshToken: { label: "Refresh Token", type: "text" },
//         user: { label: "User", type: "text" },
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//         tenant_id: { label: "Tenant ID", type: "text" },
//       },
//       async authorize(credentials) {
//         try {
//           if (!credentials?.accessToken || !credentials?.refreshToken) {
//             return null;
//           }
//           console.log("Authorizing user with provided credentials...", credentials);

//           const axiosInstance = createServerAxios(credentials?.accessToken as string, credentials.tenant_id as string || APPLICATION.TENANT_ID);
//           const meResponse = await axiosInstance.post(
//             `${APPLICATION.BASE_URL}/api/v1/auth/refresh`, 
//             {
//               refresh_token: credentials.refreshToken,
//             },
//             {
//               headers: {
//                 Authorization: `Bearer ${credentials.accessToken}`,
//                 "X-Tenant-ID": APPLICATION.TENANT_ID,
//               },
//             }
//           );

//           console.log("Me response data:", meResponse.data);

//           const user = meResponse.data?.user;

//           if (!user?.id) {
//             return null;
//           }

//           const role =
//             user.role ||
//             user.role_name ||
//             user.roleName ||
//             (typeof user.role === "object"
//               ? user.role?.role_name || user.role?.roleName
//               : undefined);

//           const tenantId =
//             (credentials.tenant_id as string) ||
//             APPLICATION.TENANT_ID ||
//             (typeof window !== "undefined" ? getTenantId() : "");

//           return {
//             id: user?.id,
//             tenant_id: user.tenant_id,
//             email: user.email,
//             full_name: user.full_name,
//             phone: user.phone,
//             role: role || "N/A",
//             status: user.status,
//             risk_level: user.risk_level,
//             access_token: credentials.accessToken,
//             refresh_token: credentials.refreshToken,
//           } as any;  
//         } catch(error) {
//         console.error("Authorization error:", error);
//         return null;
//       }
//     },
//     }),
//   ],
// pages: {
//   signIn: "/login",
//     error: "/login",
//   },
// session: {
//   strategy: "jwt",
//     maxAge: 24 * 60 * 60, // 1 day
//   },
// cookies: {
//   sessionToken: {
//     name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
//       options: {
//       httpOnly: true,
//         sameSite: 'lax',
//           path: '/',
//             secure: process.env.NODE_ENV === 'production',
//       },
//   },
//   callbackUrl: {
//     name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
//       options: {
//       httpOnly: true,
//         sameSite: 'lax',
//           path: '/',
//             secure: process.env.NODE_ENV === 'production',
//       },
//   },
//   csrfToken: {
//     name: `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}next-auth.csrf-token`,
//       options: {
//       httpOnly: true,
//         sameSite: 'lax',
//           path: '/',
//             secure: process.env.NODE_ENV === 'production',
//       },
//   },
// },
// callbacks: {
//     async jwt({ token, user, trigger, session }) {
//     // Initial sign in
//     if (user) {
//       (token as any).user = {
//         id: user.id,
//         tenant_id: user.tenant_id,
//         email: user.email,
//         full_name: user.full_name,
//         phone: user.phone,
//         role: user.role,
//         status: user.status,
//         risk_level: user.risk_level,
//       };
//       (token as any).accessToken = user.access_token;
//       (token as any).refreshToken = user.refresh_token;
//       (token as any).tenant_id = user.tenant_id;
//       // FIXED: Set realistic token expiry - assuming 1 hour tokens
//       // Adjust this based on your actual token expiry from backend
//       (token as any).accessTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour
//     }

//     // Handle session updates (e.g., after MFA verification)
//     if (trigger === "update" && session) {
//       if (session.user) {
//         (token as any).user = session.user;
//       }
//       if (session.accessToken) {
//         (token as any).accessToken = session.accessToken;
//         (token as any).accessTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour
//       }
//       if (session.refreshToken) {
//         (token as any).refreshToken = session.refreshToken;
//       }
//     }

//     // Return previous token if the access token has not expired yet
//     // FIXED: Add 5 minute buffer before expiry to refresh proactively
//     const bufferTime = 5 * 60 * 1000; // 5 minutes
//     if (
//       (token as any).accessTokenExpires &&
//       Date.now() < (token as any).accessTokenExpires - bufferTime
//     ) {
//       return token;
//     }

//     // FIXED: Access token has expired or about to expire, try to refresh it
//     console.log("Access token expired or expiring soon, refreshing...");
//     return await refreshAccessToken(token);
//   },
//     async session({ session, token }) {
//     if ((token as any).user) {
//       session.user = {
//         ...session.user,
//         ...(token as any).user,
//       };
//     }
//     if ((token as any).accessToken) {
//       session.accessToken = (token as any).accessToken;
//     }
//     if ((token as any).refreshToken) {
//       session.refreshToken = (token as any).refreshToken;
//     }
//     if ((token as any).error) {
//       session.error = (token as any).error;
//     }
//     return session;
//   },
// },
// debug: process.env.NODE_ENV === "development",
// });

// // FIXED: Token refresh function with proper error handling
// async function refreshAccessToken(token: any) {
//   try {
//     console.log("Attempting to refresh access token...");

//     // FIXED: Correct endpoint URL
//     const response = await axios.post(
//       `${APPLICATION.BASE_URL}/api/v1/auth/refresh`,
//       {
//         refresh_token: token.refreshToken, // FIXED: Check your backend API - might need different field name
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'X-Tenant-ID': token.tenant_id || APPLICATION.TENANT_ID,
//         },
//       }
//     );

//     const refreshedTokens = response.data;

//     console.log("Token refreshed successfully");

//     // FIXED: Return updated token with new expiry
//     return {
//       ...token,
//       accessToken: refreshedTokens.access_token, // FIXED: Match your backend response
//       refreshToken: refreshedTokens.refresh_token || token.refreshToken, // FIXED: Keep old refresh token if new one not provided
//       accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour
//       error: undefined, // Clear any previous errors
//     };
//   } catch (error: any) {
//     console.error("Error refreshing access token:", error.response?.data || error.message);

//     // FIXED: Return token with error flag but don't lose the token completely
//     // This allows the user to continue using the app, and they'll be redirected to login
//     // when they make an API call that fails
//     return {
//       ...token,
//       error: "RefreshAccessTokenError",
//       // Keep the old tokens so we can try again later
//     };
//   }
// }