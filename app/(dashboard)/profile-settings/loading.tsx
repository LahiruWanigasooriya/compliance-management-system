import LoadingOverlay from '@/components/layout/LoadingOverlay'

const loading = () => {
  return (
    <div className='flex items-center justify-center'>
      <LoadingOverlay className="-inset-4!" loadingText="Loading Profile Settings..."/>
    </div>
  )
}

export default loading
