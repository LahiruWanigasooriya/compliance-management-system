import { swapSnakeAndKebab } from "../swapSnakeAndKebab";

export const getNameByCode = (
  dataset: { name?: string; code?: string; value?: string; label?: string }[],
  code: string
) => {
  if (code === '') return code
  
  const filter = dataset.find(
    (filter) => filter?.code === code || filter?.value === code || swapSnakeAndKebab(filter?.code) === code || swapSnakeAndKebab(filter?.value) === code
  );
  return filter ? filter?.name || filter?.label : code;
};
