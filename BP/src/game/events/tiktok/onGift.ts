import { TNTCoin } from "../../TNTCoin";
import { DEFAULT_GIFT, TIKTOK_GIFT } from "../../../lang/tiktokGifts";
import { executeAction } from "../../actions/executeAction";

/**
 * Handles the gift event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message the message sent by TikTokLiveMCBE
 */
export async function onGift(game: TNTCoin, message: string): Promise<void> {
    const { uniqueId, nickname, giftName, giftId, giftCount } = JSON.parse(message);

    let matchedGift = Object.values(TIKTOK_GIFT).find(gift => gift.id === giftId) || TIKTOK_GIFT[giftName];
    const giftEmoji = (matchedGift && matchedGift.emoji) ? matchedGift.emoji : DEFAULT_GIFT;

    const coloredNickName = `§e${nickname}§r`;
    const title = `${giftEmoji}\n§d${coloredNickName}§f`;
    const subtitle = `§asent§f §g${giftName}§f §o§c x${giftCount}!`;
    const chatMessage = `§7[§aGift§7]: §aThank you for §c§o${giftCount} ${giftEmoji}§d${giftName}§r, §b${coloredNickName}§a!`;

    const actions = game.giftActionManager.getActionsForEvent(giftId.toString()) || game.giftActionManager.getActionsForEvent(giftName);

    handleGiftGoal(game, giftId, giftName, giftCount);

    if (actions && actions.length > 0) {
        actions.forEach((action: GiftAction) => executeGiftAction(game, action, coloredNickName, giftCount));
    }

    game.feedback.showFeedbackScreen({ title, subtitle });
    game.player.sendMessage(chatMessage);
    game.player.playSound('random.orb');
}

/**
 * Handles the goal-related functionality when a gift is received.
 * @param {TNTCoin} game - The TNT Coin game instance.
 * @param {number} giftId - The ID of the gift.
 * @param {string} giftName - The name of the gift.
 * @param {number} giftCount - The number of gifts sent.
 */
function handleGiftGoal(game: TNTCoin, giftId: number, giftName: string, giftCount: number): void {
    const goalGiftName = game.giftGoal.getGiftName();
    const goalGiftId = game.giftGoal.getGiftId();
    const isGoalActive = game.giftGoal.isActive();

    if (isGoalActive && (goalGiftName === giftName || goalGiftId === giftId)) {
        game.giftGoal.addGifts(giftCount);
    }
}

/**
 * Executes a gift action.
 * @param {TNTCoin} game - The TNT Coin game instance.
 * @param {GiftAction} action - The action to execute.
 * @param {string} coloredNickName - The colored nickname of the sender.
 * @param {number} giftCount - The number of gifts sent.
 */
function executeGiftAction(game: TNTCoin, action: GiftAction, coloredNickName: string, giftCount: number): void {
    if (action.actionType !== 'Summon' && action.playSound) {
        game.feedback.playSound(action.playSound);
    }

    if (action.actionType === 'Summon' && action.summonOptions) {
        const { entityName, amount } = action.summonOptions;
        const amountToSummon = amount * giftCount;

        executeAction(game, {
            ...action,
            summonOptions: {
                ...action.summonOptions,
                amount: amountToSummon,
                newNameTag: coloredNickName,
            },
        });

        game.player.sendMessage(`${coloredNickName} §asummoned §e${amountToSummon} §c${entityName.toUpperCase()}§f!`);
    } else {
        executeAction(game, action);
    }
}
