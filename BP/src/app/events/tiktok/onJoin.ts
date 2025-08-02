import { TntCoin } from "app/tntcoin";
import { EventActionManager } from "lib/Events/EventActionManager";
import { executeAction } from "../../actions/executeAction";
import ServiceRegistry from "lib/System/ServiceRegistry";
import { JoinProps, MemberAction } from "types";

/**
 * Handles the member join event from TikTok.
 * @param data The data received from the TikTok event
 */
export function onJoin(tntcoin: TntCoin, data: JoinProps): void {
    try {
        if (tntcoin.settings.eventDisplaySettings.showMemberMessages) {
            screenDisplay(tntcoin, data);
        }
        executeActions(tntcoin, data);
    } catch (error) {
        console.error(`Error in onJoin handler: ${error}`);
        tntcoin.player.sendMessage(`§cError executing join actions: ${error}`);
    }
}

function screenDisplay(tntcoin: TntCoin, data: { nickname: string }): void {
    tntcoin.player.sendMessage(`§e${data.nickname}§r§7 joined the live!`);
    tntcoin.player.playSound('random.pop');
}

function executeActions(tntcoin: TntCoin, data: JoinProps) {
    try {
        const eventManager = ServiceRegistry.getInstance().get<EventActionManager<MemberAction>>("MEMBER_ACTION_MANAGER");
        if (!eventManager) return;
        const joinActions = eventManager.getEvents().get("member");
        if (!joinActions) return;
        joinActions.forEach(action => {
            console.warn(`§7[§a${data.nickname}§7]: Executing '${action.actionType}' action for member event...`);
            executeAction(tntcoin, action);
        });
    } catch (error) {
        throw new Error(`Error while executing member actions: ${error.message}`);
    }
}
