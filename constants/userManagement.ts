import { User } from "../types/user.types";

export const users: User[] = [
  {
    id: "user-1",
    name: "Sarah Mitchell",
    status: "active",
    role: "Compliance Officer",
    mfaEnabled: true,
    email: "sarah.mitchell@example.com",
    lastLogin: "2025-10-10 14:30:00",
    permissions: [
      { resource: "cases", actions: ["view"] },
      { resource: "sar", actions: ["file"] },
      { resource: "transactions", actions: ["approve"] },
    ],
  },
  {
    id: "user-2",
    name: "John Anderson",
    status: "active",
    role: "Risk Manager",
    mfaEnabled: true,
    email: "john.anderson@example.com",
    lastLogin: "2025-10-10 13:45:00",
    permissions: [
      { resource: "cases", actions: ["view"] },
      { resource: "sar", actions: ["file"] },
      { resource: "alerts", actions: ["override"] },
      { resource: "users", actions: ["manage"] },
    ],
  },
  {
    id: "user-3",
    name: "Maria Rodriguez",
    status: "active",
    role: "Auditor",
    mfaEnabled: false,
    email: "maria.rodriguez@example.com",
    lastLogin: "2025-10-09 16:20:00",
    permissions: [
      { resource: "cases", actions: ["view"] },
      { resource: "reports", actions: ["view"] },
      { resource: "*", actions: ["read"] },
    ],
  },
];
