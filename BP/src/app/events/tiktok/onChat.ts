import { TntCoin } from "app/tntcoin";
import { executeAction } from "app/actions/executeAction";
import { EventActionManager } from "lib/Events/EventActionManager";
import ServiceRegistry from "lib/System/ServiceRegistry";
import { ChatAction, ChatProps } from "types";

/**
 * Handles the chat event from TikTok.
 * @param data The data received from the TikTok event
 */
export function onChat(tntcoin: TntCoin, data: ChatProps): void {
    try {
        if (tntcoin.settings.eventDisplaySettings.showChatMessages) {
            screenDisplay(tntcoin, data);
        }
        executeActions(tntcoin, data);
    } catch (error) {
        console.error(`Error in onChat handler: ${error}`);
        tntcoin.player.sendMessage(`§cError executing chat actions: ${error}`);
    }
}

function screenDisplay(tntcoin: TntCoin, data: ChatProps): void {
    tntcoin.player.sendMessage(`§7[§bChat§7]: §e${data.nickname}§f: ${data.comment}`);
    tntcoin.player.playSound('random.pop');
}

function executeActions(tntcoin: TntCoin, data: ChatProps): void {
    try {
        const eventManager = ServiceRegistry.getInstance().get<EventActionManager<ChatAction>>("CHAT_ACTION_MANAGER");
        if (!eventManager) return;
        const chatEvents = eventManager.getEvents();
        if (chatEvents.size === 0) return;

        const matchedKeywords: string[] = [];
        const chat = data.comment.toLowerCase();
        chatEvents.forEach((_, keyword) => {
            if (chat.includes(keyword.toLowerCase())) {
                matchedKeywords.push(keyword);
            }
        });
        matchedKeywords.forEach(keyword => {
            const actions = eventManager.getActionsForEvent(keyword);
            if (actions && actions.length > 0) {
                actions.forEach(action => {
                    console.warn(`§7[§a${data.nickname}§7]: Executing '${action.actionType}' action for chat: ${keyword}`);
                    executeAction(tntcoin, action);
                });
            }
        });
    } catch (error) {
        throw new Error(`Error while executing chat actions: ${error.message}`);
    }
}
