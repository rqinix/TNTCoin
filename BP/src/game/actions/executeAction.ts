import { TNTCoin } from "../TNTCoin";

export function executeAction<T extends EventAction>(game: TNTCoin, action: T): void {
    switch(action.actionType) {
        case 'Summon':
            game.summonEntities({
                entityName: action.summonOptions.entityName,
                amount: action.summonOptions.amount,
                locationType: action.summonOptions.locationType,
                onTop: action.summonOptions.onTop,
                batchSize: action.summonOptions.batchSize,
                batchDelay: action.summonOptions.batchDelay,
                playSound: {
                    playSoundOnSummon: action.summonOptions.playSound.playSoundOnSummon,
                    sound: action.summonOptions.playSound.sound,
                },
                onSummon: () => {
                    if (action.summonOptions.playSound.playSoundOnSummon) {
                        game.feedback.playSound(action.summonOptions.playSound.sound);
                    }
                },
            });
            break;
        case 'Clear Blocks':
            game.structure.clearFilledBlocks();
            break;
        case 'Fill':
            game.structure.fill();
            break;
        case 'Play Sound':
            game.feedback.playSound(action.playSound);
            break;
        case 'Screen Title':
            game.feedback.setTitle(action.screenTitle);
            break;
        case 'Screen Subtitle':
            game.feedback.setSubtitle(action.screenSubtitle);
    }
}