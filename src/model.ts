type TimeTableSource = 'team' | 'branch' | 'company' | 'adhoc';

type TimeTableType = 'standard' | 'exception' | 'adjusted' | 'adhoc' | 'delete';

type Day =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type KnownTaskActions = 'SetStatus' | 'SendEmail';

export type Status = 'open' | 'closed' | 'quiet' | 'busy';

export type TimeTableTask = {
  from: string;
  action: KnownTaskActions;
  totime: string;
  status: Status;
};

export type TTimeTableTaskALT = {
  fromTime: string;
  action: string;
  toTime: string;
  status: string;
  importance: number;
  source: string;
  type: TimeTableType;
};

export type TTimeTableFormatted = {
  fromTime: string;
  action: string;
  status: string;
  info?: string;
  type: TimeTableType;
};

export type TTimetableGeneratorTaskList = {
  tasks: TimeTableTask[];
  source: TimeTableSource;
  type: TimeTableType;
  importance: number;
};
