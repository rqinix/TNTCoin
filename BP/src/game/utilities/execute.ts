
/**
 * Execute a callback a specified number of times.
 * @param count The number of times to execute the callback.
 * @param callback The callback to execute.
 */
export function execute(count: number, callback: (i: number) => void) {
    for (let i = 0; i < count; i++) callback(i);
}