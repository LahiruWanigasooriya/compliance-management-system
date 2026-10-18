import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

type TabsOption = {
  label: string;
  name: string;
  content: string | React.ReactNode;
  contentClassName: string;
}

interface TabsContainerProps {
  defaultValue: string;
  options: TabsOption[];
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement | null>; 
}

const TabsContainer = ({
  defaultValue,
  options,
  className,
  containerRef,
}: TabsContainerProps) => {
  return (
    <Tabs defaultValue={defaultValue} className={`w-full flex flex-col gap-5 text-gray-900 ${className}`}>
        <div className="w-full flex flex-col">
            <TabsList className="w-full flex gap-6">
                {options.map((option) => (
                    <TabsTrigger 
                    key={option.name} 
                    value={option.name}
                    className="group flex flex-col gap-3 cursor-pointer text-sm md:text-base font-bold focus:outline-0 dark:text-gray-500 data-[state=active]:text-[#1A5276] dark:data-[state=active]:text-white"
                    >
                        <p className="captialize">{option.label}</p>
                        <Separator className="h-0.5 bg-transparent group-data-[state=active]:bg-[#1A5276] dark:group-data-[state=active]:bg-white"/>
                    </TabsTrigger>
                ))}
            </TabsList>
            <Separator className="bg-gray-300"/>
        </div>
        <div className="no-scrollbar flex flex-col overflow-y-auto" ref={containerRef}>
            {options.map((option) => (
                <TabsContent key={option.name} value={option.name} className={option.contentClassName}>
                    {option.content}
                </TabsContent>
            ))}
        </div>
    </Tabs>
  )
}

export default TabsContainer
