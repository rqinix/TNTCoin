import { TNTCoin } from "../../TNTCoin";
import { DEFAULT_GIFT, TIKTOK_GIFT } from "../../../lang/tiktokGifts";

/**
 * Handles the gift event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message the message received from WebSocket Server.
 */
export async function onGift(game: TNTCoin, message: string): Promise<void> {
    // Parse the message received from the WebSocket server (TNTCoin extension)
    const parsedMessage = JSON.parse(message);
    const { gifterUniqueId, gifterNickName, giftName, giftId, giftCount } = parsedMessage;

    let matchedGift = Object.values(TIKTOK_GIFT).find(gift => gift.id === giftId);
    if (!matchedGift) matchedGift = TIKTOK_GIFT[giftName];
    const giftEmoji = (!matchedGift || matchedGift?.emoji === '') ? DEFAULT_GIFT : matchedGift.emoji;

    const coloredNickName = `§e${gifterNickName}§r`;
    const title = `${giftEmoji}\n§d${coloredNickName}§f`;
    const subtitle = `§asent§f §g${giftName}§f §o§c x${giftCount}!`;
    const chatMessage = `§aThank you for §c§o${giftCount} ${giftEmoji}§d${giftName}§r, §b${coloredNickName}§a!`;
    const actions = game.giftActionManager.getActionsForGift(giftId?.toString()) || game.giftActionManager.getActionsForGift(giftName);

    const goalGiftName = game.giftGoal.getGiftName();
    const goalGiftId = game.giftGoal.getGiftId();
    const isGoalActive = game.giftGoal.isActive();

    if (isGoalActive && (goalGiftName === giftName || goalGiftId === giftId)) {
        game.giftGoal.addGifts(giftCount);
    }

    if (actions && actions.length > 0) {
        actions.forEach((action: GiftAction) => {
            if (action.actionType !== 'Summon' && action?.playSound) {
                game.feedback.playSound(action.playSound);
            }

            switch (action.actionType) {
                case 'Summon':
                    game.feedback.showFeedbackScreen({
                        title,
                        subtitle: `${subtitle}§r\n§asent§f §d${action.summonOptions.entityName.toUpperCase()}§f §o§c x${action.summonOptions.amount}!`
                    });
                    game.summonEntities({
                        entityName: action.summonOptions.entityName,
                        amount: action.summonOptions.amount,
                        locationType: action.summonOptions.locationType,
                        onTop: action.summonOptions.onTop,
                        batchSize: action.summonOptions.batchSize,
                        batchDelay: action.summonOptions.batchDelay,
                        onSummon: () => game.feedback.playSound(action.playSound),
                    });
                    break;
                case 'Clear Blocks':
                    game.feedback.showFeedbackScreen({
                        title,
                        subtitle: `${subtitle}§r\n§c!!!Cleared the Blocks!!!`
                    });
                    game.structure.clearFilledBlocks();
                    break;
                case 'Fill':
                    game.feedback.showFeedbackScreen({
                        title,
                        subtitle: `${subtitle}§r\n§b!!!Filled the Structure!!!`
                    });
                    game.structure.fill();
                    break;
                case 'Play Sound':
                    game.feedback.playSound(action.playSound);
                    break;
            }
        });
    } else {
        game.feedback.showFeedbackScreen({ title, subtitle });
    }

    game.player.sendMessage(chatMessage);
    game.feedback.playSound('random.orb');
}
