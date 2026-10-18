"use client";
import { Button } from "@/components/ui/button";
import FormSelect from "@/components/ui/form-inputs/form-select";
import FormStatusShift from "@/components/ui/form-inputs/form-status-shift";
import { FormTextInput } from "@/components/ui/form-inputs/form-textinput";
import { Input } from "@/components/ui/input";
import { EditUserFormContent, UserFormContent } from "@/constants/formContent";
import { roles } from "@/constants/users";
import {
  AddUserFormSchema,
  EditUserFormSchema,
} from "@/validations/userFormSchema";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Separator } from "@/components/ui/separator";

interface UserFormProps {
  mode: "add" | "edit";
}

const UserForm = ({ mode }: UserFormProps) => {
  const isEditing = mode === "edit";
  const schema = isEditing ? EditUserFormSchema : AddUserFormSchema;
  type UserFormSchemaType = z.infer<typeof schema>;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: isEditing
      ? {
          firstName: "",
          lastName: "",
          role: "",
          status: "inactive",
        }
      : {
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "",
        },
  });

  const onSubmit = () => {};

  const handleGeneratePassword = () => {};

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-panel-border flex flex-col gap-4 md:gap-6 p-4 md:p-6 rounded-2xl">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-foreground">
            {isEditing ? "Edit User" : "Add User"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Enter the details below to edit the user information."
              : "Enter below details to add a new user."}
          </p>
        </div>
        <Separator className="bg-panel-border dark:bg-slate-700" />
        {isEditing && (
          <div className="flex flex-col gap-5">
            <div className="w-full flex gap-4 items-center justify-start">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400 text-white text-2xl font-bold">
                JD
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-18 font-bold text-foreground capitalize">
                  John Doily{" "}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Joined Date:{" "}
                  <span className="text-muted-foreground">2025/12/22</span>
                </p>
                <div className="flex flex-col gap-0.5 md:flex-row md:gap-4 text-foreground text-sm">
                  <p>
                    Admin ID: <span className="text-muted-foreground">123</span>
                  </p>
                  <p>
                    Email:{" "}
                    <span className="text-muted-foreground">
                      admin@gmail.com
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <hr className="border-t border-panel-border dark:border-slate-700" />
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            {isEditing &&
              EditUserFormContent.map((content) => (
                <FormTextInput
                  key={content.id}
                  label={content.title}
                  className="text-sm h-12 w-full p-3 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-muted/20 text-muted-foreground placeholder:text-muted-foreground pointer-events-none cursor-not-allowed"
                />
              ))}
            {UserFormContent.map((content) => {
              if (isEditing && content.isShowingOnEdit === false) return null;
              return (
                <FormTextInput
                  key={content.id}
                  label={content.title}
                  {...register(content.name as keyof UserFormSchemaType)}
                  placeholder={content.placeholder}
                  className="text-sm text-foreground placeholder:text-muted-foreground h-12 w-full border border-panel-border p-3 focus-visible:ring-0 focus-visible:ring-offset-0 bg-card"
                  error={
                    errors[content.name as keyof UserFormSchemaType]?.message
                  }
                />
              );
            })}
            {!isEditing && (
              <div className="flex flex-col gap-2">
                <p className="text-md font-bold text-foreground">Password*</p>
                <Controller
                  name="password"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-2">
                      <div
                        className={`w-full ${
                          fieldState.error
                            ? "border-red-500"
                            : "border-panel-border"
                        } flex justify-between items-center gap-1 rounded-md border pl-3 pr-2 py-1.5 h-12 bg-card`}
                      >
                        <Input
                          placeholder=""
                          type="password"
                          {...field}
                          outerClassName="!gap-0"
                          className="text-sm placeholder:text-muted-foreground h-auto border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-foreground"
                          icon={true}
                        />
                        <Button
                          variant="ghost"
                          className="text-xs font-bold cursor-pointer w-20 sm:w-26 h-9 border-none bg-emerald-600 dark:hover:bg-emerald-700 px-6 py-2 text-white hover:bg-emerald-700 hover:text-white"
                          onClick={handleGeneratePassword}
                          type="button"
                        >
                          Generate
                        </Button>
                      </div>
                      {fieldState.error && (
                        <p className="text-sm text-red-500">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            )}
            <FormSelect
              label="Role*"
              name="role"
              control={control}
              placeholderValue="Select role type"
              selectTypes={roles}
              getOptionKey={(role) => role._id}
              getOptionLabel={(role) => role.roleName}
              getOptionValue={(role) => role._id}
            />
            {isEditing && (
              <FormStatusShift label="Status" name="status" control={control} />
            )}
          </div>
          <Button
            variant="ghost"
            type="submit"
            className="flex-1 bg-gray-300 dark:bg-gray-700 dark:text-white text-sm font-bold h-auto cursor-pointer gap-2 rounded-lg border-none px-3 md:px-4 py-2.5 hover:bg-gray-400 dark:hover:bg-gray-900 md:flex-none md:w-30"
          >
            {isEditing ? "Update User" : "Add User"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
