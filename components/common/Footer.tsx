import React from "react";

const Footer = () => {
  return (
    <footer className="text-center text-xs text-gray-500 py-2  border-gray-200 bg-background transition-all duration-200 dark:border-[#1B2A27] dark:bg-[#01120F] dark:text-[#9fb5a9] ">
      <div className=" ">
      {/* <p>
        AML Compliance Management Platform v3.2.1 • {new Date().getFullYear()} •
        FATF Compliant • ISO 27001 Certified
      </p> */}
      <p className="mt-0.5">
        Last System Update: January 19, {new Date().getFullYear()}
      </p>
      </div>
    </footer>
  );
};

export default Footer;
