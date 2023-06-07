import { input } from "./data";

type Task = {
    from: string;
    to: string;
    action: string;
    status?: string
}

const processedTasks: Task[] = []

function process(){
    
    const tasks: Task[] = input

    const defaultTask = {
        action: "closed"
    }

    const getNextChronologicalTask = (time: string) => {
        return tasks.find((x) => x.from > time)
    }

    tasks.map((task, index) => {
        if(index === 0){
            if(task.from > '00:00'){
                processedTasks.push({
                    from: '00:00',
                    to: task.from,
                    action: defaultTask.action,
                    status: "adhoc"
             
                })
            }
        }
        const whattodo = ap(tasks, task);
        console.log('----------------');
            

    })
    console.log(processedTasks);
}

/**
 * This should work. Can create some test cases against them
 * @param allTasks 
 * @param task 
 * @returns 
 */
function ap(allTasks: Task[], task: Task): void {
    // Find next task
    const nextTask = allTasks.find((x) => x.from > task.from)
    console.log('ThisTask', task);
    
    if(nextTask){
        console.log('NextTask', nextTask);
        if(nextTask.from == task.to){
            // The next task follows directly on from this one
            // Send back as normal
            addToTasks( {...task, status: 'original_1'})
            return;
        } else if (nextTask.from < task.to){
            // This task ends after the next starts, we need to modify the end of this one
            addToTasks({...task, to: nextTask.from, status: 'adjusted_2'})
        } else {
            // Next task does not fit directly on the end
            // Let's see whether there is one that can be popped in between then
            const fitIn = allTasks.find((x) => x.from <= task.from && x.to > task.to)
            if(fitIn){
                // We have found one that can fit in
                addToTasks( {...task, status: 'original_2'})
                addToTasks( {...fitIn, from: task.to, to: nextTask.from, status: 'fitin_1'})
            } else {
                // We need to add the default values as an inbetween
                addToTasks({...task, status: 'original_3'})
                addToTasks({from: task.to, to: nextTask.from, action: 'closed', status: "default_1"})
            }
            
        }
    } else {
        // This is the last task.
        // Check whether it takes you up to midnight
        addToTasks({...task, status: 'original_4'})
        if(task.to < '23:59'){
            // See if there is one that can fit in
            const fitIn = allTasks.find((x) => x.from <= task.from && task.to >= task.to)
            if(fitIn){
                if(fitIn.to < "23:59"){
                    // We have found one, but it doesn't go to the end of day
                    addToTasks({...fitIn, from: task.to, to: fitIn.to, status: 'fitIn_2'})
                    addToTasks({from: fitIn.to, to: '23:59', action: 'closed', status: 'default_2'})
                } else if(fitIn.to == "23:59"){
                    // We have found one that goes to the end of the day
                    addToTasks({...fitIn, from: task.to, status: 'fitIn_3'})
                } else {
                    addToTasks({from: fitIn.to, to: '23:59', action: 'closed', status: 'default_3'})
                }
            } else {
                addToTasks({from: task.to, to: '23:59', action: 'closed', status: 'default_4'})
            }
            
        }
    }
}

function addToTasks(task: Task): void {
    console.log('Creating', task);
    processedTasks.push(task)
}

export default process()


