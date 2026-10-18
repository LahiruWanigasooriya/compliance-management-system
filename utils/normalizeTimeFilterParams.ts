export function normalizeTimeFilterParams({
  time_filter,
  start_date,
  end_date,
}: {
  time_filter?: string;
  start_date?: string | null;
  end_date?: string | null;
}) {
  if (time_filter === "custom") {
    return {
      time_filter: "",
      start_date: start_date ?? "",
      end_date: end_date ?? "",
    };
  }

  return {
    time_filter: time_filter ?? "",
    start_date: "",
    end_date: "",
  };
}
