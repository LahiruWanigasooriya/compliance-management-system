export interface FilterProps {
  id: string;
  type: any;
  label: string;
  value: string | string[];
  displayValue: string;
}

export interface GetDownloadReportParams {
  format: string;
}