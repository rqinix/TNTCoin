import { EventActionManager } from "lib/Events/EventActionManager";
import { executeAction } from "../../actions/executeAction";
import { DEFAULT_GIFT, TIKTOK_GIFT } from "../../../lang/tiktokGifts";
import { TntCoin } from "app/tntcoin/index";
import ServiceRegistry from "lib/System/ServiceRegistry";

/**
 * Handles the gift event from TikTok.
 * @param data The data received from the TikTok event
 */
export function onGift(tntcoin: TntCoin, data: GiftProps): void {
    try {
        if (tntcoin.settings.eventDisplaySettings.showGiftMessages) {
            screenDisplay(tntcoin, data);
        }
        updateGiftGoals(tntcoin, data);
        executeActions(tntcoin, data);
    } catch (error) {
        console.error(`Error in onGift handler: ${error}`);
        tntcoin.player.sendMessage(`§cError executing gift actions: ${error}`);
    }
}

/**
 * Display feedback for the gift in the game
 */
function screenDisplay(tntCoinInstance: TntCoin, data: GiftProps): void {
    const { nickname, giftName, giftId, repeatCount } = data;
    let matchedGift = Object.values(TIKTOK_GIFT).find(gift => gift.id === giftId) || TIKTOK_GIFT[giftName];
    const giftEmoji = (matchedGift && matchedGift.emoji) ? matchedGift.emoji : DEFAULT_GIFT;
    const coloredNickName = `§e${nickname}§r`;
    tntCoinInstance.feedback.displayScreen({ 
        title: `${giftEmoji}\n§d${coloredNickName}§f`, 
        subtitle: `§asent§f §g${giftName}§f §o§c x${repeatCount}!`
    });
    tntCoinInstance.player.sendMessage(`§7[§aGift§7]: §aThank you for §c§o${repeatCount} ${giftEmoji}§d${giftName}§r, §b${coloredNickName}§a!`);
    tntCoinInstance.player.playSound('random.orb');
}

function executeActions(tntcoin: TntCoin, data: GiftProps): void {
    try {
        const giftActionManager = ServiceRegistry.getInstance().get<EventActionManager<GiftAction>>("GIFT_ACTION_MANAGER");
        if (!giftActionManager) return;

        const eventKeyById = data.giftId.toString();
        const eventKeyByName = data.giftName;

        let actions = giftActionManager.getActionsForEvent(eventKeyById);
        if (!actions || actions.length === 0) {
            actions = giftActionManager.getActionsForEvent(eventKeyByName);
        }

        if (actions && actions.length > 0) {
            const coloredNickName = `§e${data.nickname}§r`;
            actions.forEach(action => {
                console.warn(`§7[§a${data.nickname}§7]: Executing '${action.actionType}' action for gift: ${eventKeyById} (${eventKeyByName})`);
                executeGiftAction(tntcoin, action, coloredNickName, data.repeatCount);
            });
        }
    } catch (error) {
        throw new Error(`Error while executing gift actions: ${error.message}`);
    }
}

function updateGiftGoals(tntcoin: TntCoin, data: GiftProps): void {
    const { giftName, giftId, repeatCount: giftCount } = data;
    const goalGiftName = tntcoin.giftGoal.getGiftName();
    const goalGiftId = tntcoin.giftGoal.getGiftId();
    const isGoalActive = tntcoin.giftGoal.isActive();
    if (isGoalActive && (goalGiftName === giftName || goalGiftId === giftId)) {
        tntcoin.giftGoal.addGifts(giftCount);
    }
}

function executeGiftAction(tntCoinInstance: TntCoin, action: GiftAction, coloredNickName: string, giftCount: number): void {
    if (action.actionType !== 'Summon' && action.playSound) {
        tntCoinInstance.feedback.playSound(action.playSound);
    }

    if (action.actionType === 'Summon' && action.summonOptions) {
        const { entityName, amount } = action.summonOptions;
        const amountToSummon = amount * giftCount;
        executeAction(tntCoinInstance, {
            ...action,
            summonOptions: {
                ...action.summonOptions,
                amount: amountToSummon,
                newNameTag: coloredNickName,
            },
        });
        tntCoinInstance.player.sendMessage(`${coloredNickName} §asummoned §e${amountToSummon} §c${entityName.toUpperCase()}§f!`);
    } else {
        executeAction(tntCoinInstance, action);
    }
}
