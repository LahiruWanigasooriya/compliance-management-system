import { Column } from "@/components/common/table/DataTable";
import { ActionButtons } from "@/components/common/table/SharedColumns";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role:
    | {
        _id: string;
        roleName: string;
      }
    | string;
  status: string;
}

export const createUserColumns = (
  handleStatusToggle: (user: User) => void,
  handleViewUser: (user: User) => void,
  handleEditUser: (user: User) => void
): Column<User>[] => {
  return [
    {
      key: "firstName",
      label: "First Name",
      className: "min-w-fit",
      sortable: true,
      render: (value: any) => <div className="text-foreground">{value}</div>,
    },
    {
      key: "lastName",
      label: "Last Name",
      className: "min-w-fit",
      sortable: true,
      render: (value: any) => <div className="text-foreground">{value}</div>,
    },
    {
      key: "email",
      label: "Email",
      className: "min-w-fit",
      sortable: true,
      render: (value: any) => <div className="text-foreground">{value}</div>,
    },
    {
      key: "role",
      label: "Role",
      className: "min-w-fit",
      sortable: true,
      render: (value: any, row: User) => (
        <div className="text-foreground">{value}</div>
      ),
    },
    {
      key: "id",
      label: "Actions",
      className: "text-right",
      sortable: false,
      render: (_value: any, row: User) => (
        <ActionButtons
          className="gap-4 md:gap-3"
          onToggle={() => handleStatusToggle(row)}
          onView={() => handleViewUser(row)}
          onEdit={() => handleEditUser?.(row)}
          isActive={row?.status === "active"}
        />
      ),
    },
  ];
};
