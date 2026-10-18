import AlertDetailClient from "./sections/AlertDetailClient";

interface AlertDetailsPageProps {
  params: {
    id: string;
  };
}

const GeolocationAlertDetailsPage = async({ params }: AlertDetailsPageProps) => {
  const {id} = await params;

  return (
    <AlertDetailClient alertId={id}/>
  )
}

export default GeolocationAlertDetailsPage;