import { PASSWORD_REGEX } from "@/constants/auth.constants";
import { z } from "zod";

export const AddUserFormSchema = z.object({
    firstName: z.string().min(1, "First name is required.")
        .max(20, "First name must be at most 20 characters")
        .regex(/^[A-Za-z\s]+$/, "First name can only contain letters & spaces"),
    lastName: z.string().min(1, "Last name is required")
        .max(20, "Last name must be at most 20 characters")
        .regex(/^[A-Za-z\s]+$/, "Last name can only contain letters & spaces"),
    email: z.email().min(1, "Email is required")   
        .regex(
        /^[a-z][a-z0-9._%+-]*@[a-z0-9.-]+\.[a-z]{2,}$/,
        "Please enter a valid email address",
        ),
    password: z.string().regex(PASSWORD_REGEX, "Password must be 8–12 characters long, include uppercase & lowercase letters, a number, and a special character."),
    role: z.string().min(1, "Role is required"),
})

export const EditUserFormSchema = z.object({
    firstName: z.string().min(1, "First name is required.")
        .max(20, "First name must be at most 20 characters")
        .regex(/^[A-Za-z\s]+$/, "First name can only contain letters & spaces"),
    lastName: z.string().min(1, "Last name is required")
        .max(20, "Last name must be at most 20 characters")
        .regex(/^[A-Za-z\s]+$/, "Last name can only contain letters & spaces"),
    role: z.string().min(1, "Role is required"),
    status: z.enum(["active", "inactive"], {error: "Status is required"}),
})