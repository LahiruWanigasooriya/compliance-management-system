'use client';

import { useState, useCallback, useEffect, useId, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, Controller, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Upload, X, CheckCircle, XCircle, Loader2, FileText, Camera, MapPin, Shield, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { AxiosError } from 'axios';
import axiosInstance from '@/utils/axios';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Loader from '../ui/loader/Loader';

// Types
interface ImageUpload {
  base64: string | null;
  preview: string | null;
  fileName: null | string;
}

interface SubmissionResult {
  success: boolean;
  message: string;
}

interface KYCPreferences {
  isFaceVerificationRequired: boolean;
  isAddressVerificationRequired: boolean;
  requiredDocumentCount: number;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

// Constants
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPES = 'image/jpeg,image/jpg,image/png';

const DOCUMENT_TYPES = [
  { value: 'id_card', label: 'ID Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
] as const;

const STEPS = [
  { label: 'Documents', icon: FileText },
  { label: 'Address', icon: MapPin },
  { label: 'Face', icon: Camera },
  { label: 'Complete', icon: CheckCircle },
] as const;

const EMPTY_IMAGE_STATE: ImageUpload = {
  base64: null,
  preview: null,
  fileName: null,
};

const DEFAULT_PREFERENCES: KYCPreferences = {
  isFaceVerificationRequired: true,
  isAddressVerificationRequired: true,
  requiredDocumentCount: 2,
};

// Schema
const kycFormSchema = z.object({
  documentType: z.string().min(1, 'Please select a document type'),
});

type KycFormData = z.infer<typeof kycFormSchema>;
type DocumentType = (typeof DOCUMENT_TYPES)[number]['value'];

export default function KycSubmitForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const reference = searchParams.get('reference');
  const redirectUrl = searchParams.get('redirect_url');

  const [preferences, setPreferences] = useState<KYCPreferences | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [documentFront, setDocumentFront] = useState<ImageUpload>(EMPTY_IMAGE_STATE);
  const [documentBack, setDocumentBack] = useState<ImageUpload>(EMPTY_IMAGE_STATE);
  const [faceProof, setFaceProof] = useState<ImageUpload>(EMPTY_IMAGE_STATE);
  const [addressProof, setAddressProof] = useState<ImageUpload>(EMPTY_IMAGE_STATE);

  const {
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<KycFormData>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      documentType: 'id_card',
    },
  });

  const selectedDocumentType = watch('documentType') as DocumentType;
  const isPassport = selectedDocumentType === 'passport';

  // Derived values
  const documentLabel = useMemo(() => {
    if (selectedDocumentType === 'driving_license') return 'driving license';
    if (selectedDocumentType === 'id_card') return 'ID card';
    return 'passport';
  }, [selectedDocumentType]);

  const effectivePreferences = preferences ?? DEFAULT_PREFERENCES;

  // Clear back side image when switching to passport
  useEffect(() => {
    if (isPassport) {
      setDocumentBack(EMPTY_IMAGE_STATE);
    }
  }, [isPassport]);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/kyc/preferences');
        const data = response.data?.data || response.data;
        setPreferences({
          isFaceVerificationRequired: data.is_face_verification_required ?? true,
          isAddressVerificationRequired: data.is_address_verification_required ?? true,
          requiredDocumentCount: data.required_document_count ?? 2,
        });
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
        setPreferences(DEFAULT_PREFERENCES);
      }
    };
    fetchPreferences();
  }, []);

  const handleFileChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<ImageUpload>>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setImage({
        base64,
        preview: result,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback((setImage: React.Dispatch<React.SetStateAction<ImageUpload>>) => {
    setImage(EMPTY_IMAGE_STATE);
  }, []);

  const handleFormError = useCallback((formErrors: FieldErrors<KycFormData>) => {
    const firstError = Object.values(formErrors)[0];
    if (firstError?.message) {
      toast.error(firstError.message);
    }
  }, []);

  const handlePreviousStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  const handleNextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const handleStepClick = useCallback((index: number) => {
    if (index < currentStep) {
      setCurrentStep(index);
    }
  }, [currentStep]);

  const handleRetry = useCallback(() => {
    setSubmissionResult(null);
    setCurrentStep(0);
  }, []);

  const onSubmit = useCallback(async (data: KycFormData) => {
    const isPassportDoc = data.documentType === 'passport';

    if (!documentFront.base64) {
      toast.error(isPassportDoc ? 'Please upload your passport' : 'Please upload the document front side');
      return;
    }

    const requiredDocs = effectivePreferences.requiredDocumentCount;

    if (!isPassportDoc && requiredDocs >= 2 && !documentBack.base64) {
      toast.error('Please upload the document back side');
      return;
    }

    if (effectivePreferences.isAddressVerificationRequired && !addressProof.base64) {
      toast.error('Please upload address proof');
      return;
    }

    if (effectivePreferences.isFaceVerificationRequired && !faceProof.base64) {
      toast.error('Please upload face/selfie image');
      return;
    }

    if (!token) {
      toast.error('Invalid submission link. Token is missing.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        token,
        reference,
        address_proof: addressProof.base64 || undefined,
        document: {
          proof: documentFront.base64,
          additional_proof: isPassportDoc ? undefined : (documentBack.base64 || undefined),
          selected_type: data.documentType,
        },
        ...(faceProof.base64 && { face: { proof: faceProof.base64 } }),
      };

      const response = await axiosInstance.post('/api/v1/kyc/submit', payload);

      const message = response.data?.message || response.data?.data?.message || 'KYC verification submitted successfully';
      setSubmissionResult({ success: true, message });
      setCurrentStep(3); // Move to step 4 (Complete)
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Failed to submit KYC';
      setSubmissionResult({ success: false, message: errorMessage });
      setCurrentStep(3); // Move to step 4 (Complete) even on error

      const formattedMessage = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);
      toast.error("Submission Cannot Proceed!", {
        description: (
          <span style={{ color: "#00000080" }}>{formattedMessage}</span>
        ),
        style: {
          color: "black",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [token, reference, documentFront, documentBack, addressProof, faceProof, effectivePreferences]);

  // Handle redirect after successful submission
  useEffect(() => {
    if (submissionResult?.success && redirectUrl && !isRedirecting) {
      setIsRedirecting(true);
      // Redirect after 3 seconds
      const timer = setTimeout(() => {
        window.location.href = redirectUrl;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submissionResult, redirectUrl, isRedirecting]);

  // Manual redirect handler
  const handleRedirectNow = useCallback(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Premium Header Card */}
        <div className="relative bg-linear-to-br from-primary to-secondary dark:from-blue-600 dark:to-blue-800 rounded-t-3xl p-8 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          {/* Logo - Hidden on mobile, shown on tablet and up */}
          <Image src="/logo.svg" alt="Logo" width={150} height={150} className="absolute top-6 right-6 z-10 hidden md:block" />
          <Image src="/logo.svg" alt="Logo" width={80} height={80} className="absolute top-4 right-4 z-10 md:hidden" />

          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Identity Verification
              </h1>
              <p className="text-white/80 mt-1">
                Secure document verification process
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <nav className="relative mt-6 sm:mt-8 flex items-center justify-between px-2 sm:px-0" aria-label="KYC verification steps">
            {/* Progress line background */}
            <div className="absolute top-4 sm:top-5 left-[12%] right-[12%] sm:left-[8%] sm:right-[8%] h-0.5 sm:h-1 bg-white/20 rounded-full" aria-hidden="true" />
            {/* Progress line active */}
            <div
              className="absolute top-4 sm:top-5 left-[12%] sm:left-[8%] h-0.5 sm:h-1 bg-white rounded-full transition-all duration-500"
              style={{ width: `${currentStep * 28}%` }}
              aria-hidden="true"
            />
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isClickable = isCompleted;

              return (
                <button
                  key={step.label}
                  type="button"
                  className="relative flex flex-col items-center gap-1.5 sm:gap-2 cursor-pointer bg-transparent border-none"
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${step.label} - ${isCompleted ? 'completed' : isCurrent ? 'current step' : 'upcoming'}`}
                >
                  <div className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isCompleted
                      ? 'bg-white border-white text-primary'
                      : isCurrent
                        ? 'bg-white/30 backdrop-blur-sm border-white text-white sm:scale-110'
                        : 'bg-white/10 backdrop-blur-sm border-white/30 text-white/50'
                    }
                  `}>
                    {isCompleted ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium transition-colors ${
                    index <= currentStep ? 'text-white' : 'text-white/50'
                  }`}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Form Card */}
        <div className="relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-b-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 md:p-8">
          {currentStep < 3 ? (
            <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-8">
              {/* Step 1: Document Information Section */}
              {currentStep === 0 && (
                <section className="group animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-linear-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-6 border border-gray-200/80 dark:border-gray-600/50">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2.5 bg-primary/10 dark:bg-blue-500/20 rounded-xl shrink-0">
                          <FileText className="w-5 h-5 text-primary dark:text-blue-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Document Information
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Upload your identification documents</p>
                        </div>
                      </div>
                      <span className="self-start sm:self-auto px-3 py-1 text-xs font-medium bg-primary/10 text-primary dark:bg-blue-500/20 dark:text-blue-400 rounded-full whitespace-nowrap">
                        Step 1 of 4
                      </span>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Document Type
                        </label>
                        <Controller
                          name="documentType"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary dark:hover:border-blue-400 transition-colors">
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                              <SelectContent>
                                {DOCUMENT_TYPES.map((doc) => (
                                  <SelectItem key={doc.value} value={doc.value}>
                                    {doc.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.documentType?.message && (
                          <p className="text-sm text-red-500">{errors.documentType.message}</p>
                        )}
                      </div>

                      {isPassport ? (
                        <ImageUploadField
                          label="Passport"
                          description="Upload the main page of your passport"
                          image={documentFront}
                          onChange={(e) => handleFileChange(e, setDocumentFront)}
                          onClear={() => clearImage(setDocumentFront)}
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ImageUploadField
                            label="Document Front Side"
                            description={`Upload the front of your ${documentLabel}`}
                            image={documentFront}
                            onChange={(e) => handleFileChange(e, setDocumentFront)}
                            onClear={() => clearImage(setDocumentFront)}
                          />

                          <ImageUploadField
                            label="Document Back Side"
                            description={`Upload the back of your ${documentLabel}`}
                            image={documentBack}
                            onChange={(e) => handleFileChange(e, setDocumentBack)}
                            onClear={() => clearImage(setDocumentBack)}
                            disabled={effectivePreferences.requiredDocumentCount < 2}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Step 2: Address Proof Section */}
              {currentStep === 1 && (
                <section className="group animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-linear-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-6 border border-gray-200/80 dark:border-gray-600/50">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2.5 bg-primary/10 dark:bg-blue-500/20 rounded-xl shrink-0">
                          <MapPin className="w-5 h-5 text-primary dark:text-blue-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Address Verification
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Proof of your current address</p>
                        </div>
                      </div>
                      <span className={`self-start sm:self-auto px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        effectivePreferences.isAddressVerificationRequired
                          ? 'bg-primary/10 text-primary dark:bg-blue-500/20 dark:text-blue-400'
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
                      }`}>
                        {effectivePreferences.isAddressVerificationRequired ? 'Step 2 of 4' : 'Optional'}
                      </span>
                    </div>

                    <ImageUploadField
                      label="Address Proof"
                      description="Upload utility bill, bank statement, or similar document"
                      image={addressProof}
                      onChange={(e) => handleFileChange(e, setAddressProof)}
                      onClear={() => clearImage(setAddressProof)}
                    />
                  </div>
                </section>
              )}

              {/* Step 3: Face Verification Section */}
              {currentStep === 2 && (
                <section className="group animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-linear-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-6 border border-gray-200/80 dark:border-gray-600/50">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2.5 bg-primary/10 dark:bg-blue-500/20 rounded-xl shrink-0">
                          <Camera className="w-5 h-5 text-primary dark:text-blue-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Face Verification
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Take a selfie for identity confirmation</p>
                        </div>
                      </div>
                      <span className={`self-start sm:self-auto px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        effectivePreferences.isFaceVerificationRequired
                          ? 'bg-primary/10 text-primary dark:bg-blue-500/20 dark:text-blue-400'
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
                      }`}>
                        {effectivePreferences.isFaceVerificationRequired ? 'Step 3 of 4' : 'Optional'}
                      </span>
                    </div>

                    <ImageUploadField
                      label="Face / Selfie"
                      description="Upload a clear photo of your face"
                      image={faceProof}
                      onChange={(e) => handleFileChange(e, setFaceProof)}
                      onClear={() => clearImage(setFaceProof)}
                    />
                  </div>
                </section>
              )}

              {/* Form Actions */}
              <div className="pt-4 sm:pt-6">
                <div className="flex gap-2 sm:gap-4">
                  {/* Previous Button */}
                  {currentStep > 0 && (
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      aria-label="Go to previous step"
                      className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Back</span>
                    </button>
                  )}

                  {/* Next Button (Steps 0 and 1) */}
                  {currentStep < 2 && (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      aria-label="Continue to next step"
                      className="group relative flex-1 bg-linear-to-r from-primary to-secondary dark:from-blue-600 dark:to-blue-700 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 dark:hover:shadow-blue-500/30 cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
                      <span className="relative flex items-center justify-center gap-1.5 sm:gap-2">
                        <span className="hidden sm:inline">Continue</span>
                        <span className="sm:hidden">Next</span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  )}

                  {/* Submit Button (Step 2 only) */}
                  {currentStep === 2 && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-label={isSubmitting ? 'Submitting verification' : 'Submit verification'}
                      aria-busy={isSubmitting}
                      className="group relative flex-1 bg-linear-to-r from-primary to-secondary dark:from-blue-600 dark:to-blue-700 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 dark:hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />

                      {isSubmitting ? (
                        <span className="relative flex items-center justify-center gap-2 sm:gap-3">
                           <Loader size="28" stroke="4" speed="3.5" />
                        </span>
                      ) : (
                        <span className="relative flex items-center justify-center gap-1.5 sm:gap-2">
                          <span className="hidden sm:inline">Submit Verification</span>
                          <span className="sm:hidden">Submit</span>
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <Shield className="w-4 h-4" />
                  <span>Your data is encrypted and secure</span>
                </div>
              </div>
            </form>
          ) : (
            /* Step 4: Submission Result */
            <section className="group animate-in fade-in slide-in-from-right-4 duration-300 ">
              <div className="relative overflow-hidden  p-10">
                {/* Decorative gradient orbs */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 ${submissionResult?.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className={`absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-20 ${submissionResult?.success ? 'bg-primary' : 'bg-red-400'}`} />

                <div className="relative text-center">
                  {/* Icon with animated ring */}
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${submissionResult?.success ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ animationDuration: '2s' }} />
                    <div className={`relative p-4 rounded-full ${submissionResult?.success ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      {submissionResult?.success ? (
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                      ) : (
                        <XCircle className="w-12 h-12 text-red-500" />
                      )}
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                    {submissionResult?.success ? 'Verification Submitted!' : 'Submission Failed'}
                  </h2>
                  <p className={`text-base leading-relaxed ${submissionResult?.success ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'}`}>
                    {submissionResult?.message}
                  </p>

                  {submissionResult?.success && (
                    <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        Your documents are being reviewed. You will be notified once the verification is complete.
                      </p>
                    </div>
                  )}

                  {/* Redirect section for successful submissions with redirect URL */}
                  {submissionResult?.success && redirectUrl && (
                    <div className="mt-6 ">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <Loader size="28" stroke="4" speed="3.5" />
                      </div>
                      <button
                        type="button"
                        onClick={handleRedirectNow}
                        aria-label="Return to merchant site"
                        className="w-full bg-linear-to-br from-primary to-secondary dark:from-blue-600 dark:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 dark:hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-300 cursor-pointer"
                      >
                        Continue Now
                      </button>
                    </div>
                  )}

                  {!submissionResult?.success && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      aria-label="Try submitting verification again"
                      className="mt-8 w-full bg-linear-to-br from-primary to-secondary dark:from-blue-600 dark:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 dark:hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-300 cursor-pointer"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// Image Upload Field Component
interface ImageUploadFieldProps {
  label: string;
  description: string;
  image: ImageUpload;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  disabled?: boolean;
}

function ImageUploadField({ label, description, image, onChange, onClear, disabled = false }: ImageUploadFieldProps) {
  const id = useId();
  const inputId = `${id}-file-input`;
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const handleContainerClick = useCallback(() => {
    if (!disabled) {
      document.getElementById(inputId)?.click();
    }
  }, [disabled, inputId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      document.getElementById(inputId)?.click();
    }
  }, [disabled, inputId]);

  const handleClearClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClear();
  }, [onClear]);

  return (
    <div className={`w-full ${disabled ? 'opacity-50' : ''}`}>
      <label
        id={labelId}
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        {label}
      </label>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        aria-disabled={disabled}
        onClick={handleContainerClick}
        onKeyDown={handleKeyDown}
        className={`
          group relative rounded-2xl transition-all duration-300 overflow-hidden
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${image.preview
            ? 'bg-linear-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-2 border-emerald-400 dark:border-emerald-500/50'
            : 'bg-linear-to-r from-gray-50 to-white dark:from-gray-700/30 dark:to-gray-800/30 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-blue-400 hover:shadow-lg hover:shadow-primary/10 dark:hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
          }
        `}
      >
        <input
          id={inputId}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          onChange={onChange}
          className="sr-only"
          disabled={disabled}
          aria-describedby={descriptionId}
        />

        {image.preview ? (
          <div className="relative p-4">
            {/* Success indicator */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full shadow-lg">
              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Uploaded</span>
            </div>

            <img
              src={image.preview}
              alt={`Preview of ${label}`}
              className="w-full h-44 object-contain rounded-xl bg-white dark:bg-gray-800"
            />

            <button
              type="button"
              onClick={handleClearClick}
              aria-label={`Remove ${label}`}
              className="absolute top-3 right-3 p-2 bg-red-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-red-600 transition-all duration-200 hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>

            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span className="truncate max-w-40 sm:max-w-50">{image.fileName}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 min-h-45">
            {/* Upload icon with animated ring */}
            <div className="relative mb-4">
              <div
                className="absolute inset-0 bg-primary/20 dark:bg-blue-500/20 rounded-full animate-ping opacity-0 group-hover:opacity-100"
                style={{ animationDuration: '2s' }}
                aria-hidden="true"
              />
              <div className="relative p-4 bg-primary/10 dark:bg-blue-500/20 rounded-2xl group-hover:bg-primary/20 dark:group-hover:bg-blue-500/30 transition-colors">
                <Upload className="w-8 h-8 text-primary dark:text-blue-400" aria-hidden="true" />
              </div>
            </div>

            <p className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Click to upload
            </p>
            <p id={descriptionId} className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">
              {description}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              JPG, PNG (max {MAX_FILE_SIZE_MB}MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}