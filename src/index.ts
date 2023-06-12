import { TTimeTableFormatted } from './model';

class TimetableGenerator {
  processedTasks: TTimeTableFormatted[] = [];

  public async processTimetable(
    data: TTimetableRequest,
    options?: {
      removePassedTimes?: boolean;
    }
  ) {
    try {
      const parsedData = await timetableRequest.parseAsync(data);

      const team = this.getTasks(parsedData.team, data.todayDate);
      const branch = this.getTasks(parsedData.branch, data.todayDate);
      const company = this.getTasks(parsedData.company, data.todayDate);
      const tasksToProcess: TTimetableGeneratorTaskList[] = [
        {
          tasks: team.exceptions,
          importance: 10,
          type: 'exception',
          source: 'team',
        },
        {
          tasks: branch.exceptions,
          importance: 9,
          type: 'exception',
          source: 'branch',
        },
        {
          tasks: company.exceptions,
          importance: 8,
          type: 'exception',
          source: 'company',
        },
        {
          tasks: team.standard,
          importance: 5,
          type: 'standard',
          source: 'team',
        },
        {
          tasks: branch.standard,
          importance: 4,
          type: 'standard',
          source: 'branch',
        },
        {
          tasks: company.standard,
          importance: 3,
          type: 'standard',
          source: 'company',
        },
      ];
      let a: TTimeTableTaskALT[] = this.formatTasks(tasksToProcess);

      a = this.removeTasksWithOverrides(a);

      const result = this.processTasks(a);

      if (options?.removePassedTimes) {
        return this.returnTasksAfterNow(result, data.todayDate);
      } else {
        return result;
      }
    } catch (e) {
      throw handleUnknownError(e);
    }
  }

  public returnTasksAfterNow(
    tasks: TTimeTableFormatted[],
    date: string
  ): TTimeTableFormatted[] {
    const toAdd: TTimeTableFormatted[] = [];
    const nowMs = dayjs(`${date} ${dayjs().format('HH:mm:ss')}`).valueOf();

    const addToSet = (data: TTimeTableFormatted) => {
      toAdd.push(data);
    };
    tasks.map((d, i) => {
      if (i + 1 < tasks.length) {
        const toMs = dayjs(`${date} ${tasks[i + 1].fromTime}`).valueOf();
        if (toMs >= nowMs) addToSet(d);
      } else {
        addToSet(d);
      }
    });
    return toAdd;
  }

  public getTasks(
    data: TTimeTable | undefined,
    date: string
  ): { standard: TTimeTableTask[]; exceptions: TTimeTableTask[] } {
    if (!data) return { standard: [], exceptions: [] };

    const _todayDay = dayjs(date).format('dddd').toLowerCase() as TDay;

    const exceptions: TTimeTableTask[] = [];

    ['daily', date].map((d) => {
      exceptions.push(...(data.exceptions?.[d]?.tasks ?? []));
    });

    return {
      standard: data.standardWeek?.[_todayDay]?.tasks ?? [],
      exceptions: exceptions,
    };
  }

  public formatTasks(args: TTimetableGeneratorTaskList[]): TTimeTableTaskALT[] {
    const formatted: TTimeTableTaskALT[] = [];

    // List all tasks in a single array
    args.map((a) => {
      a.tasks.map((task) => {
        formatted.push({
          ...task,
          source: a.source,
          importance: a.importance,
          type: a.type,
        });
      });
    });

    // Filter by SetTeamStatus only
    // TODO: Remove this and make more selective about what we include - make more generic
    formatted.filter((x) => x.action == 'SetTeamStatus');

    return formatted;
  }

  public sortTasks(tasks: TTimeTableTaskALT[]): TTimeTableTaskALT[] {
    tasks.sort((a, b) => {
      if (a.fromTime === b.fromTime)
        return a.importance < b.importance ? 1 : -1;
      return a.fromTime > b.fromTime ? 1 : -1;
    });
    return tasks;
  }

  /**
   * This will remove any tasks from an array of tasks that will be overridden
   * Overrides include
   * 1. A task that starts after and ends before a task with a higher importance
   * @param tasks
   */
  public removeTasksWithOverrides(
    tasks: TTimeTableTaskALT[]
  ): TTimeTableTaskALT[] {
    this.sortTasks(tasks).map((task) => {
      const foundTasks = tasks.filter(
        (searchTask) =>
          task.fromTime <= searchTask.fromTime &&
          task.toTime >= searchTask.toTime &&
          task.importance > searchTask.importance
      );
      foundTasks.map((found) => {
        const i = indexOf(tasks, found);
        tasks.splice(i, 1);
      });
    });
    return this.sortTasks(tasks);
  }

  public processedTasks: TTimeTableFormatted[] = [];
  public runningTime = '00:00';

  public processTasks(tasks: TTimeTableTaskALT[]): TTimeTableFormatted[] {
    // console.log(JSON.stringify(tasks));
    // console.log('----------------');
    // console.log('----------------');
    const defaultStatus = 'closed';

    tasks.map((task, index) => {
      if (index === 0) {
        if (task.fromTime > '00:00') {
          this.processedTasks.push({
            status: defaultStatus,
            fromTime: '00:00',
            action: 'SetTeamStatus',
            type: 'adhoc',
          });
        } else {
          // Starts from 00:00
          this.processedTasks.push({
            status: task.status,
            fromTime: task.fromTime,
            action: task.action,
            type: task.type,
          });
        }
      }
      this.processTaskAlgorithm(tasks, task);
      // console.log('----------------');
    });

    // console.log('----------------');
    // console.log(JSON.stringify(this.processedTasks));

    return this.processedTasks;
  }

  public processTaskAlgorithm(
    allTasks: TTimeTableTaskALT[],
    task: TTimeTableTaskALT
  ): void {
    // This is to stop adding tasks if we have already processed passed this time
    // Useful for if we are dealing with this in the last

    // Find next task
    const nextTask = allTasks.find(
      (x) =>
        x.fromTime > task.fromTime ||
        (x.fromTime == task.fromTime && x.toTime > task.toTime)
    );
    // console.log('ThisTask', JSON.stringify(task));

    /**
     * Works fine!!!
     */
    const taskFollowsOnWithoutAGap = () => {
      if (!nextTask) return;
      // Add this one straight in. The next one is not touched as will be picked up next time
      this.addToTasks({
        status: task.status,
        action: task.action,
        fromTime: task.fromTime,
        type: task.type,
        info: 'original_1',
      });
    };

    const taskEndsAfterNextTaskBegins = () => {
      if (!nextTask) return;

      // We don't have to worry about filling any gaps here as there is an overlap

      /**
       * WORKS FINE!!!
       */
      this.addToTasks({
        status: task.status,
        action: task.action,
        fromTime: task.fromTime,
        type: task.type,
        info: 'original_5',
      });
      if (nextTask.toTime > task.toTime) {
        // The next task ends after this time
        this.addToTasks({
          status: nextTask.status,
          action: nextTask.action,
          fromTime: task.toTime,
          type: nextTask.type,
          info: 'adjusted_5',
        });
      }
    };

    const gapBetweenThisTaskAndNext = () => {
      if (!nextTask) return;
      // Let's see whether there is one that can be popped in between then

      /**
       * Can add this one straight up
       * Either need to
       * Fill in the gap with one that fits existing
       * or; fill in the gap with default: closed
       */

      this.addToTasks({
        status: task.status,
        action: task.action,
        fromTime: task.fromTime,
        type: task.type,
        info: 'original_2',
      });

      const fitIn = allTasks.find(
        (x) => x.fromTime <= task.fromTime && x.toTime > task.toTime
      );
      if (fitIn) {
        // We have found one that can fit in
        this.addToTasks({
          status: fitIn.status,
          action: fitIn.action,
          fromTime: task.toTime,
          type: fitIn.type,
          info: 'fitIn_1',
        });
      } else {
        this.addToTasks({
          status: 'closed',
          action: 'SetTeamStatus',
          fromTime: task.toTime,
          type: 'adhoc',
          info: 'default_1',
        });
      }
    };

    if (nextTask) {
      // console.log('NextTask', JSON.stringify(nextTask));

      // The next task follows directly on from this one. Can just leave this task here as no need to look at next
      if (nextTask.fromTime == task.toTime) return taskFollowsOnWithoutAGap();
      // This task ends after the next starts, we need to modify the end of this one
      else if (nextTask.fromTime < task.toTime) taskEndsAfterNextTaskBegins();
      // There is a gap between the end of this task and the start of the next task
      else gapBetweenThisTaskAndNext();
    } else {
      this.processLastTask(allTasks, task);
    }
  }

  public processLastTask(
    allTasks: TTimeTableTaskALT[],
    task: TTimeTableTaskALT
  ) {
    // This is the last task.
    // Check whether it takes you up to midnight

    this.addToTasks({
      status: task.status,
      action: task.action,
      fromTime: task.fromTime,
      type: task.type,
      info: 'original_4',
    });

    if (task.toTime < '23:59') {
      // See if there is one that can fit in
      const fitIn = allTasks.find(
        (x) =>
          x.fromTime <= task.fromTime && x.toTime >= task.toTime && x !== task
      );
      if (fitIn) {
        if (fitIn.toTime < '23:59') {
          // We have found one, but it doesn't go to the end of day
          this.addToTasks({
            status: fitIn.status,
            action: fitIn.action,
            fromTime: task.toTime,
            type: fitIn.type,
            info: 'fitIn_2',
          });
          this.addToTasks({
            action: 'SetTeamStatus',
            fromTime: fitIn.toTime,
            status: 'closed',
            type: 'adhoc',
            info: 'default_2',
          });
        } else if (fitIn.toTime == '23:59') {
          // We have found one that goes to the end of the day
          this.addToTasks({
            status: fitIn.status,
            action: fitIn.action,
            fromTime: task.toTime,
            type: fitIn.type,
            info: 'fitIn_3',
          });
        } else {
          this.addToTasks({
            action: 'SetTeamStatus',
            fromTime: fitIn.toTime,
            status: 'closed',
            type: 'adhoc',
            info: 'default_3',
          });
        }
      } else {
        this.addToTasks({
          action: 'SetTeamStatus',
          fromTime: task.toTime,
          status: 'closed',
          type: 'adhoc',
          info: 'default_4',
        });
      }
    }
  }

  public addToTasks(task: TTimeTableFormatted): void {
    if (task.fromTime <= this.runningTime) {
      // console.log('Skipping: ', JSON.stringify(task));
      return;
    }
    // console.log('Creating', JSON.stringify(task));
    const i = this.processedTasks.indexOf(task);
    if (i < 0) {
      delete task.info;
      this.processedTasks.push(task);
      this.runningTime = task.fromTime;
    }
  }
}

const start = () => {
  console.log('running');
  new TimetableGenerator().process();
};

export default start();
