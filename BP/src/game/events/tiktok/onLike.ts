import { taskManager } from "../../../core/TaskManager";
import { executeAction } from "../../actions/executeAction";
import { TNTCoin } from "../../TNTCoin";

const userLikesMap = new Map<string, { 
    totalLikes: number, 
    executedThresholds: Set<number>, 
    timeoutId: number 
}>();

/**
 * Handles the Like event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message the message sent by TikTokLiveMCBE
 */
export function onLike(game: TNTCoin, message: string): void {
    const { nickname, uniqueId, count } = JSON.parse(message);

    let user = userLikesMap.get(uniqueId);
    if (user) {
        taskManager.clearTask(uniqueId);
        user.totalLikes += count;
        user.timeoutId = setUserTimeout(uniqueId);
    } else {
        user = {
            totalLikes: count,
            executedThresholds: new Set(),
            timeoutId: setUserTimeout(uniqueId)
        };
        userLikesMap.set(uniqueId, user);
    }

    const totalLikes = user.totalLikes;

    const likeActions = game.likeActionManager.getAllEvents();
    if (likeActions.size > 0) {
        likeActions.forEach((actions, likeKey) => {
            const likeThreshold = parseInt(likeKey);
            if (totalLikes >= likeThreshold && !user.executedThresholds.has(likeThreshold)) {
                user.executedThresholds.add(likeThreshold);
                actions.forEach(action => executeAction(game, action));
            }
        });
    }

    game.player.sendMessage(`§7[§aLike§7]: §aThank you for §d${totalLikes} §alikes! §e${nickname}§a!`);
}

/**
 * Sets a timeout to remove the user from the likes map after 10 seconds.
 * @param {string} uniqueId The unique identifier for the user.
 * @returns {number} The timeout ID for the user.
 */
function setUserTimeout(uniqueId: string): number {
    const inactivityTimeout = 200;
    taskManager.clearTask(uniqueId);
    return taskManager.addTimeout(uniqueId, () => userLikesMap.delete(uniqueId), inactivityTimeout);
}
