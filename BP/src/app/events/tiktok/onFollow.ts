import { TntCoin } from "app/tntcoin/index";
import { EventActionManager } from "lib/Events/EventActionManager";
import { executeAction } from "app/actions/executeAction";
import ServiceRegistry from "lib/System/ServiceRegistry";
import { FollowAction, FollowProps } from "types";

/**
 * Handles the follow event from TikTok.
 * @param data The data received from the TikTok event
 */
export function onFollow(tntcoin: TntCoin, data: FollowProps): void {
    try {
        if (tntcoin.settings.eventDisplaySettings.showFollowMessages) {
            screenDisplay(tntcoin, data);
        }
        executeActions(tntcoin, data);
    } catch (error) {
        console.error(`Error in onFollow handler: ${error}`);
        tntcoin.player.sendMessage(`§cError executing follow actions: ${error}`);
    }
}

function screenDisplay(tntcoin: TntCoin, data: FollowProps): void {
    tntcoin.player.sendMessage(`§7[§aFollow§7]: §bThank you for following, §e${data.nickname}§r§b!`);
    tntcoin.player.playSound('random.pop');
}

function executeActions(tntcoin: TntCoin, data: FollowProps) {
    try {
        const eventManager = ServiceRegistry.getInstance().get<EventActionManager<FollowAction>>("FOLLOW_ACTION_MANAGER");
        if (!eventManager) return;
        const followActions = eventManager.getEvents().get("follow");
        if (!followActions) return;
        followActions.forEach(action => {
            console.warn(`§7[§a${data.nickname}§7]: Executing '${action.actionType}' action for follow event...`);
            executeAction(tntcoin, action);
        });
    } catch (error) {
        throw new Error(`Error while executing follow actions: ${error.message}`);
    }
}
