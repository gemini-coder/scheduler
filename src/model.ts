export type TTimeTableTask = {
  fromTime: string;
  action: string;
  toTime: string;
  status: string;
};

export type TType = 'standard' | 'exception' | 'adjusted' | 'adhoc' | 'delete';

export type TTimeTableFormatted = {
  fromTime: string;
  action: string;
  type: TType;
  info?: string;
  importance: number; // 0 least, 10 most
  source: string;
  original?: TTimeTableTask;
};
