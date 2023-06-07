import { log } from 'console';
import { input } from './data';
import { TTimeTableFormatted } from './model';

class TimetableGenerator {
  processedTasks: TTimeTableFormatted[] = [];

  process() {
    const tasks: TTimeTableFormatted[] = input;

    const defaultStatus = 'closed';

    tasks.map((task, index) => {
      if (index === 0) {
        if (task.fromTime > '00:00') {
          this.processedTasks.push({
            importance: 0,
            source: 'adhoc',
            status: defaultStatus,
            fromTime: '00:00',
            toTime: task.fromTime,
            action: 'SetTeamStatus',
            type: 'adhoc',
          });
        }
      }
      this.ap(tasks, task);
      console.log('----------------');
    });

    console.log(this.processedTasks);

    return this.processedTasks;
  }

  /**
   * This should work. Can create some test cases against them
   * @param allTasks
   * @param task
   * @returns
   */
  ap(allTasks: TTimeTableFormatted[], task: TTimeTableFormatted): void {
    // Find next task
    const nextTask = allTasks.find((x) => x.fromTime > task.fromTime);
    console.log('ThisTask', task);

    if (nextTask) {
      console.log('NextTask', nextTask);
      if (nextTask.fromTime == task.toTime) {
        // The next task follows directly on from this one
        // Send back as normal
        this.addToTasks({ ...task });
        return;
      } else if (nextTask.fromTime < task.toTime) {
        // This task ends after the next starts, we need to modify the end of this one
        this.addToTasks({
          ...task,
          toTime: nextTask.fromTime,
          type: 'adjusted',
        });
      } else {
        // Next task does not fit directly on the end
        // Let's see whether there is one that can be popped in between then
        const fitIn = allTasks.find(
          (x) => x.fromTime <= task.fromTime && x.toTime > task.toTime
        );
        if (fitIn) {
          // We have found one that can fit in
          this.addToTasks({ ...task });
          this.addToTasks({
            ...fitIn,
            fromTime: task.toTime,
            toTime: nextTask.fromTime,
            type: 'fitin_1',
          });
        } else {
          // We need to add the default values as an inbetween
          this.addToTasks({ ...task });
          this.addToTasks({
            action: 'SetTeamStatus',
            importance: 0,
            source: 'adhoc',
            fromTime: task.toTime,
            toTime: nextTask.fromTime,
            status: 'closed',
            type: 'default_1',
          });
        }
      }
    } else {
      // This is the last task.
      // Check whether it takes you up to midnight
      this.addToTasks({ ...task });
      if (task.toTime < '23:59') {
        // See if there is one that can fit in
        const fitIn = allTasks.find(
          (x) => x.fromTime <= task.fromTime && task.toTime >= task.toTime
        );
        if (fitIn) {
          if (fitIn.toTime < '23:59') {
            // We have found one, but it doesn't go to the end of day
            this.addToTasks({
              ...fitIn,
              fromTime: task.toTime,
              toTime: fitIn.toTime,
              type: 'fitIn_2',
            });
            this.addToTasks({
              action: 'SetTeamStatus',
              importance: 0,
              source: 'adhoc',
              fromTime: fitIn.toTime,
              toTime: '23:59',
              status: 'closed',
              type: 'default_2',
            });
          } else if (fitIn.toTime == '23:59') {
            // We have found one that goes to the end of the day
            this.addToTasks({
              ...fitIn,
              fromTime: task.toTime,
              type: 'fitIn_3',
            });
          } else {
            this.addToTasks({
              action: 'SetTeamStatus',
              importance: 0,
              source: 'adhoc',
              fromTime: fitIn.toTime,
              toTime: '23:59',
              status: 'closed',
              type: 'default_3',
            });
          }
        } else {
          this.addToTasks({
            action: 'SetTeamStatus',
            importance: 0,
            source: 'adhoc',
            fromTime: task.toTime,
            toTime: '23:59',
            status: 'closed',
            type: 'default_4',
          });
        }
      }
    }
  }

  addToTasks(task: TTimeTableFormatted): void {
    console.log('Creating', task);
    this.processedTasks.push(task);
  }
}

const start = () => {
  console.log('running');
  new TimetableGenerator().process();
};

export default start();
