"use client"
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const BackButton = () => {
  const router = useRouter();

  return (
    <ChevronLeft
    className="h-8 w-8 shrink-0 cursor-pointer dark:text-white"
    onClick={() => router.back()}
    />
  )
}

export default BackButton
