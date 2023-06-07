export type TTimeTableTask = {
  fromTime: string;
  action: string;
  toTime: string;
  status: string;
};

export type TType =
  | 'standard'
  | 'exception'
  | 'adjusted'
  | 'adhoc'
  | 'delete'
  | string;

export type TTimeTableFormatted = TTimeTableTask & {
  type: TType;
  info?: string;
  importance: number; // 0 least, 10 most
  source: string;
  original?: TTimeTableTask;
};
