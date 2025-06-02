import { TntCoin } from "../tntcoin/TntCoin";

export function executeAction<T extends EventAction>(tntcoin: TntCoin, action: T): void {
    switch(action.actionType) {
        case 'Summon':
            tntcoin.summonEntities({
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
                        tntcoin.feedback.playSound(action.summonOptions.playSound.sound);
                    }
                },
            });
            break;
        case 'Clear Blocks':
            tntcoin.structure.clearBlocks();
            break;
        case 'Fill':
            tntcoin.structure.fill();
            break;
        case 'Play Sound':
            tntcoin.feedback.playSound(action.playSound);
            break;
        case 'Screen Title':
            tntcoin.feedback.setTitle(action.screenTitle);
            break;
        case 'Screen Subtitle':
            tntcoin.feedback.setSubtitle(action.screenSubtitle);
            break;
        case 'Run Command':
            tntcoin.player.runCommand(action.command);
            break;
        case 'Jail':
            if (action.jailOptions) {
                tntcoin.jailPlayer(action.jailOptions.duration, action.jailOptions.enableEffects);
            }
            break;
        case 'Win Action':
            if (action.winOptions) {
                if (action.winOptions.operation === 'increment') {
                    tntcoin.wins.incrementBy(action.winOptions.amount);
                } else if (action.winOptions.operation === 'decrement') {
                    tntcoin.wins.decrementBy(action.winOptions.amount);
                }
            }
            break;
    }
}
