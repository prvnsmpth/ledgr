
type Task = {
    handler: Function,
    data: any
}

window.requestIdleCallback = 
    window.requestIdleCallback || 
        function (cb: Function) {
            let start = Date.now()
            return setTimeout(() => {
                cb({
                    didTimeout: false,
                    timeRemaining() {
                        return Math.max(0, 50 - (Date.now() - start))
                    }
                })
            }, 1)
        };

export class TaskManager {
    private taskList: Task[] = []
    private totalTaskCount = 0
    private numTasksProcessed = 0
    private taskHandle: number | null = null

    enqueueTask(taskHandler: Function, taskData: any) {
        this.taskList.push({
            handler: taskHandler, 
            data: taskData
        })
        this.totalTaskCount++

        if (!this.taskHandle) {
            this.taskHandle = window.requestIdleCallback(this.runTaskQueue.bind(this), { timeout: 1000 })
        }
    }

    runTaskQueue(deadline: IdleDeadline) {
        while (
            (deadline.timeRemaining() > 0 || deadline.didTimeout) &&
            this.taskList.length > 0
        ) {
            const task = this.taskList.shift()
            this.numTasksProcessed++

            task?.handler(task.data)
            this.scheduleStatusRefresh()
        }

        if (this.taskList.length > 0) {
            this.taskHandle = window.requestIdleCallback(this.runTaskQueue.bind(this), { timeout: 1000 })
        } else {
            this.taskHandle = null
        }
    }

    scheduleStatusRefresh() {

    }
}