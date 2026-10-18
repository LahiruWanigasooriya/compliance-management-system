export const USER_PROFILE = {
  image: "", // Empty to demonstrate fallback to initials
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  role: "Senior Compliance Officer",
  phone: "+1 (555) 123-4567",
  status: "active", // 'active' | 'inactive' | 'pending'
};

export const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  active: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    dot: "bg-emerald-500",
    label: "Active",
  },
  inactive: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    dot: "bg-red-500",
    label: "Inactive",
  },
  pending: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-500",
    dot: "bg-yellow-500",
    label: "Pending",
  },
};