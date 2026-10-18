'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createCase } from '@/actions/cases.actions';
import { CreateCasePayload } from '@/types/cases.types';
import { NewCaseModal } from '@/components/case';

interface NewCaseWrapperProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const NewCaseWrapper = ({
  userId,
  isOpen,
  onClose,
}: NewCaseWrapperProps) => {
  const router = useRouter();

  const handleCreateCase = async (payload: CreateCasePayload) => {
    try {
      if (!payload?.user_id){
        throw Error("case must have a risk profile associated with it")
      }
      await createCase(payload);
      onClose();
      toast.success('Case created successfully');
      router.refresh(); // Revalidate server component data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create case';
      toast.error(errorMessage);
    }
  };

  return (
    <NewCaseModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleCreateCase}
      userId={userId}
    />
  );
};
