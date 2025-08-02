import { TntCoin } from "../tntcoin/TntCoin";
import { TntRainService } from "../tntcoin/services/TntRainService";
import ServiceRegistry from "lib/System/ServiceRegistry";
import { EventAction } from "types";

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
        case 'TNT Rain':
            if (action.tntRainOptions) {
                try {
                    const serviceRegistry = ServiceRegistry.getInstance();
                    let rainService = serviceRegistry.get('TntRainService') as TntRainService;
                    if (!rainService) {
                        rainService = new TntRainService(tntcoin.player, tntcoin, tntcoin.structure, tntcoin.actionbar);
                        serviceRegistry.register('TntRainService', rainService);
                    }

                    if (rainService.isRainActive) {
                        tntcoin.feedback.error('TNT Rain is already active!', { sound: 'item.shield.block' });
                        return;
                    }

                    // Start the rain
                    rainService.startRain(
                        action.tntRainOptions.duration, 
                        action.tntRainOptions.intensity, 
                        action.tntRainOptions.entityType,
                        action.tntRainOptions.enableCameraShake, 
                        action.tntRainOptions.rainCoin
                    );
                } catch (error) {
                    tntcoin.feedback.error(`Failed to start TNT Rain: ${error}`, { sound: 'item.shield.block' });
                }
            }
            break;
        case 'TNT Rocket':
            if (action.tntRocketOptions) {
                tntcoin.tntRocketService.launch(tntcoin.player, tntcoin);
            }
            break;
    }
}
