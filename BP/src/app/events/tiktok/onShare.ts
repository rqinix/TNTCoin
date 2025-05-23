import { EventActionManager } from "lib/Events/EventActionManager";
import { executeAction } from "../../actions/executeAction";
import { TntCoin } from "app/game/index";
import ServiceRegistry from "lib/System/ServiceRegistry";

/**
 * Handles the share event from TikTok.
 * @param data The data received from the TikTok event
 */
export function onShare(tntcoin: TntCoin, data: ShareProps): void {
    try {
        screenDisplay(tntcoin, data);
        executeActions(tntcoin, data);
    } catch (error) {
        console.error(`Error in onShare handler: ${error.message}`);
        tntcoin.player.sendMessage(`§cError executing share actions: ${error.message}`);
    }
}

function screenDisplay(tntcoin: TntCoin, data: { nickname: string }): void {
    tntcoin.player.sendMessage(`§7[§aShare§7]: §bThank you for sharing, §e${data.nickname}§r§b!`);
    tntcoin.player.playSound('random.pop');
}

function executeActions(tntcoin: TntCoin, data: ShareProps) {
    try {
        const eventManager = ServiceRegistry.getInstance().get<EventActionManager<ShareAction>>("SHARE_ACTION_MANAGER");
        if (!eventManager) return;
        const shareActions = eventManager.getEvents().get("share");
        if (!shareActions) return;
        shareActions.forEach(action => {
            console.warn(`§7[§a${data.nickname}§7]: Executing '${action.actionType}' action for share event...`);
            executeAction(tntcoin, action);
        });
    } catch (error) {
        throw new Error(`Error while executing share actions: ${error.message}`);
    }
}