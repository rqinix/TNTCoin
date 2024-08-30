import { TNTCoin } from "../../TNTCoin";
import { DEFAULT_GIFT, TIKTOK_GIFT, TikTokGifts } from "../../../lang/tiktokGifts";

/**
 * Handles the gift event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message
 */
export async function onGift(game: TNTCoin, message: string): Promise<void> { 
    const data = JSON.parse(message);
    const { giftName, giftCount, gifterNickName, gifterUniqueId, gifterRank } = data;
    
    const formattedGifterNickName = `§e${gifterNickName}§a`;
    const giftEmoji = TIKTOK_GIFT[giftName].icon || DEFAULT_GIFT;

    const goalGiftName = game.giftGoal.getGiftName();
    const isGoalActive = game.giftGoal.isActive();

    game.feedback.showFeedbackScreen({ 
        title: `${giftEmoji}\n§d${formattedGifterNickName}§f`, 
        subtitle: `§asent§f §g${giftName}§f §o§c x${giftCount}!` 
    });

    game.player.sendMessage(`§aThank you for §c§ox${giftCount} §d${giftName}§f${giftEmoji}, §b${formattedGifterNickName}§a!`);

    if (isGoalActive && goalGiftName === giftName) {
        game.giftGoal.addGifts(giftCount);
        game.player.playSound('random.orb');
        game.saveGameState();
    }

    const actions = {
        summonTNT: (amount: number) => {
            const TITLE = `${giftEmoji}\n§d${formattedGifterNickName}§f`;
            const SUBTITLE = `§asent §cTNT §d§ox${amount}§f`;
            const MESSAGE = `${giftEmoji} ${formattedGifterNickName} sent §cTNT §d§ox${amount}§f!`

            game.summonEntities(
                'tnt_minecart', 
                { 
                    amount: amount, 
                    locationType: 'random', 
                    onTop: true, 
                    batchSize: 5, 
                    delayBetweenBatches: 5,
                    onSummon: () => game.player.playSound('kururin')
                }
            );
            game.feedback.showFeedbackScreen({ title: TITLE, subtitle: SUBTITLE });
            game.player.sendMessage(MESSAGE);
        },
        summonLightning: (amount: number) => {
            const TITLE = `${giftEmoji}\n§d${formattedGifterNickName}§f`;
            const SUBTITLE = `§asent §cLightning Bolts §d§ox${amount}§f!`;
            const MESSAGE = `${giftEmoji} ${formattedGifterNickName} sent §cLightning Bolts §d§ox${amount}§f!`;

            game.summonLightningBolt(amount);
            game.feedback.showFeedbackScreen({ title: TITLE, subtitle: SUBTITLE });
            game.player.sendMessage(MESSAGE);
        },
        clearBlocks: () => {
            const TITLE = `${giftEmoji}\n§d${formattedGifterNickName}§f`;
            const SUBTITLE = `§acleared the blocks!`;
            const MESSAGE = `${giftEmoji} ${formattedGifterNickName} cleared the blocks!`;
            const SOUND_ON_CLEAR = 'cat_laughing'; 

            game.structure.clearFilledBlocks();
            game.feedback.showFeedbackScreen({ title: TITLE, subtitle: SUBTITLE });
            game.player.playSound(SOUND_ON_CLEAR);
            game.player.sendMessage(MESSAGE);
        },
        fillStructure: () => {
            const TITLE = `${giftEmoji}\n§d${formattedGifterNickName}§f`;
            const SUBTITLE = `§afilled the structure!`;
            const SOUND_ON_FILL = 'wait_wait_wait';
            
            game.feedback.showFeedbackScreen({
                title: TITLE,
                subtitle: SUBTITLE
            });
            game.player.playSound(SOUND_ON_FILL);
            game.structure.fill();
        },
        // ... Add your own actions here
    };

    // TikTok may change the gift names, so we need to update this list and the gift names in the lang folder
    // For example, TikTok changed the gift name 'Friendship Necklace' to 'BFF Necklace'
    const giftActions: { [key in TikTokGifts]?: () => Promise<void> | void } = {
        'Rose': () => actions.summonTNT(giftCount * 10),
        'Community Fest': () => actions.summonTNT(giftCount * 15),
        'GG': () => actions.summonLightning(giftCount * 3),
        'I Love You': () => actions.summonTNT(giftCount * 1),
        'Rosa': actions.clearBlocks,
        'BFF Necklace': actions.fillStructure,
        'Finger Heart': () => actions.summonTNT(giftCount * 4),
        'Doughnut': () => actions.summonLightning(giftCount * 5),
        'Corgi': () => actions.summonTNT(giftCount * 1000),
        // ... add more gifts 
        // See gift names in 'lang' folder
    };

    // Execute the action for the gift
    const giftAction = giftActions[giftName];
    if (giftAction) {
        await giftAction();
    } else {
        console.warn(`No action defined for gift: ${giftName}`);
    }
}
