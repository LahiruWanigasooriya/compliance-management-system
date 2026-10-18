// import Settings from "@/components/Settings";

// export default function ConfigPage() {
//   return <Settings />;
// }

import Footer from "@/components/common/Footer";
import Settings from "@/components/Settings";

const page = () => {
  return (
    <div className="flex  flex-col gap-4">
      <div>
        <Settings />
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default page;
