import { TntCoin } from "app/tntcoin/index";
import { executeAction } from "app/actions/executeAction";
import { EventActionManager } from "lib/Events/EventActionManager";
import ServiceRegistry from "lib/System/ServiceRegistry";
import { taskManager } from "lib/Managers/TaskManager";

const userLikesMap = new Map<string, {
    totalLikes: number,
    executedCounts: Map<number, number>,
    timeoutId: string
}>();

/**
 * Handles the like event from TikTok.
 * @param data The data received from the TikTok event
 */
export function onLike(tntcoin: TntCoin, data: LikeProps): void {
    try {
        const totalLikes = trackUserLikes(data);
        if (tntcoin.settings.eventDisplaySettings.showLikeMessages) {
            screenDisplay(tntcoin, data, totalLikes);
        }
        executeActions(tntcoin, data, totalLikes);
    } catch (error) {
        console.error(`Error in onLike handler: ${error}`);
        tntcoin.player.sendMessage(`§cError executing like actions: ${error}`);
    }
}

function screenDisplay(tntcoin: TntCoin, data: LikeProps, totalLikes: number): void {
    const { nickname } = data;
    tntcoin.player.sendMessage(`§7[§aLike§7]: §aThank you for §d${totalLikes} §alikes! §e${nickname}§a!`);
    tntcoin.player.playSound('random.pop');
}

function executeActions(tntcoin: TntCoin, data: LikeProps, totalLikes: number) {
    try {
        const eventManager = ServiceRegistry.getInstance().get<EventActionManager<LikeAction>>("LIKE_ACTION_MANAGER");
        if (!eventManager) return;

        const likeEvents = eventManager.getEvents();
        if (likeEvents.size === 0) return;

        const user = userLikesMap.get(data.username);
        if (!user) return;

        likeEvents.forEach((actions, eventKey) => {
            const likeThreshold = parseInt(eventKey);
            const timesThresholdReached = Math.floor(totalLikes / likeThreshold);
            const timesExecuted = user.executedCounts.get(likeThreshold) || 0;
            const newExecutions = timesThresholdReached - timesExecuted;
            if (newExecutions > 0) {
                user.executedCounts.set(likeThreshold, timesThresholdReached);
                for (let i = 0; i < newExecutions; i++) {
                    actions.forEach(action => {
                        console.warn(`§7[§a${data.nickname}§7]: Executing '${action.actionType}' actions for ${likeThreshold} likes (executed: ${timesExecuted + i + 1}, total: ${totalLikes})...`);
                        executeAction(tntcoin, action);
                    });
                }
            }
        });
    } catch (error) {
        throw new Error(`Error while executing like actions: ${error.message}`);
    }
}

/**
 * Tracks cumulative likes per user and manages inactivity timeouts
 * @param data The like event data
 * @returns The total likes for this user
 */
function trackUserLikes(data: LikeProps): number {
    const { username, likeCount } = data;

    let user = userLikesMap.get(username);
    if (user) {
        taskManager.clearTask(user.timeoutId);
        user.totalLikes += likeCount;
        user.timeoutId = setUserTimeout(username);
    } else {
        user = {
            totalLikes: likeCount,
            executedCounts: new Map(),
            timeoutId: setUserTimeout(username)
        };
        userLikesMap.set(username, user);
    }

    return user.totalLikes;
}

/**
 * Sets a timeout to remove the user from the likes map after inactivity
 * @param username The unique identifier for the user
 * @returns The timeout ID for the user
 */
function setUserTimeout(username: string): string {
    const inactivityTimeout = 200;
    const timeoutId = `like_user_${username}`;
    taskManager.addTask(timeoutId, () => {
        userLikesMap.delete(username);
    }, inactivityTimeout);
    return timeoutId;
}
