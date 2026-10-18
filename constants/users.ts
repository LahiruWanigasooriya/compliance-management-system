import { User } from "@/app/(dashboard)/user/tables/UserColumns"

export const users: User[] = [
    {_id: "1", firstName: "Mary", lastName: "Jane", email: "mary@gmail.com", role: "admin", status: "active"},
    {_id: "2", firstName: "John", lastName: "Doe", email: "john@gmail.com", role: "admin_role", status: "inactive"},
    {_id: "3", firstName: "Test", lastName: "One", email: "test@gmail.com", role: "admin", status: "active"}
]

export const roles = [
    {_id: "1", roleName: "Super Admin"},
    {_id: "2", roleName: "IT Support"},
    {_id: "3", roleName: "Financial Executive"},
    {_id: "4", roleName: "Customer"},
]