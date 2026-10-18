import React from "react";
import { Modal } from "antd";
import Loader from "@/components/ui/loader/Loader";

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  headerContent: React.ReactNode;
  bodyContent: React.ReactNode;
  width?: number;
  className?: string;
  maskClosable?: boolean;
}

const CustomModal = ({
  open,
  onClose,
  loading,
  headerContent,
  bodyContent,
  width = 1000,
  className = "dark:[&_.ant-modal-close]:!text-[#747780] [&_.ant-modal-close]:!text-[#ffffff] [&_.ant-modal-container]:!p-0 [&_.ant-modal-body]:bg-white dark:[&_.ant-modal-body]:bg-[#011613] border dark:border-[#373c4a] rounded-md border-gray-200",
  maskClosable = true,
}: CustomModalProps) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnHidden
      maskClosable={maskClosable}
      width={width}
      className={className}
      styles={{
        body: {
          padding: 10,
          borderRadius: 7,
          overflow: "hidden",
        },
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center px-6 py-16">
          <Loader size="28" stroke="4" speed="3.5" />
        </div>
      ) : (
        <div className="bg-white space-y-2 dark:bg-[#011613] dark:text-slate-100">
          {/* Header */}
          <div className="bg-[#3d5a5c] px-6 py-5 flex items-start rounded-md justify-between dark:bg-[#243a3b]">
            {headerContent}
          </div>

          {/* Content */}
          <div className="space-y-4">{bodyContent}</div>
        </div>
      )}
    </Modal>
  );
};

export default CustomModal;
