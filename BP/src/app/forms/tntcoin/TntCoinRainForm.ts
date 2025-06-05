import ModalForm from "lib/Forms/ModalForm";
import ActionForm from "lib/Forms/ActionForm";
import { BaseForm } from "./BaseForm";
import { TntRainService } from "app/tntcoin/services/TntRainService";
import ServiceRegistry from "lib/System/ServiceRegistry";

export class TntCoinRainForm extends BaseForm {
    public show(): void {
        const isActive = this.isActive();
        if (!isActive) {
            this.showRainConfigForm();
        } else {
            this.stopRain();
        }
    }

    public isActive(): boolean {
        const rainService = ServiceRegistry.getInstance().get<TntRainService>('TntRainService');
        return rainService ? rainService.isRainActive : false;
    }

    private showRainConfigForm(): void {
        const serviceRegistry = ServiceRegistry.getInstance();
        const rainService = serviceRegistry.get('TntRainService') as TntRainService;
        if (rainService?.isRainActive) {
            this.feedback.error('Entity Rain is already active!', { sound: 'item.shield.block' });
            return;
        }
        new ModalForm(this.player, '§c§lTNT COIN RAIN Configuration')
            .textField(
                'string',
                'Entity Type:',
                'Entity to spawn (e.g., minecraft:tnt, minecraft:creeper)',
                'minecraft:tnt'
            )
            .textField(
                'number',
                'Duration (seconds):',
                'Enter duration (minimum 10 seconds)',
                '30'
            )
            .textField(
                'number',
                'Intensity Multiplier:',
                'Multiplier for bombard phase (1.0 - 2.0)',
                '2.0'
            )
            .toggle('Enable Camera Shake', true)
            .toggle('Enable Rain Coin', true)
            .submitButton('§c§lStart Entity Rain')
            .show((response, isCanceled) => {
                if (isCanceled) {
                    return;
                }

                const entityType = response[0] as string;
                const duration = response[1] as number;
                const intensity = response[2] as number;
                const enableCameraShake = response[3] as boolean;
                const rainCoin = response[4] as boolean;
                
                // Validation
                if (duration < 10) {
                    this.feedback.error('Duration must be at least 10 seconds!', { sound: 'item.shield.block' });
                    return;
                }
                
                if (duration > 300) {
                    this.feedback.error('Duration cannot exceed 300 seconds (5 minutes)!', { sound: 'item.shield.block' });
                    return;
                }

                if (intensity < 1.0 || intensity > 2.0) {
                    this.feedback.error('Intensity must be between 1.0 and 2.0!', { sound: 'item.shield.block' });
                    return;
                }

                if (!entityType || entityType.trim() === '') {
                    this.feedback.error('Entity type cannot be empty!', { sound: 'item.shield.block' });
                    return;
                }

                // entity validation
                const cleanEntityType = entityType.trim();
                if (!this.isValidEntityType(cleanEntityType)) {
                    this.feedback.error('Invalid entity type! Use format like "minecraft:tnt" or "tnt"', { sound: 'item.shield.block' });
                    return;
                }

                this.startRain(duration, intensity, cleanEntityType, enableCameraShake, rainCoin);
            });
    }

    private startRain(
        duration: number, 
        intensity: number = 2.0, 
        entityType: string = 'minecraft:tnt', 
        enableCameraShake: boolean = true, 
        rainCoin: boolean = true
    ): void {
        try {
            const serviceRegistry = ServiceRegistry.getInstance();
            let rainService = serviceRegistry.get('TntRainService') as TntRainService;
            if (!rainService) {
                rainService = new TntRainService(this.player, this.tntcoin, this.structure, this.tntcoin.actionbar);
                serviceRegistry.register('TntRainService', rainService);
            }
            rainService.startRain(duration, intensity, entityType, enableCameraShake, rainCoin);
            this.feedback.playSound('random.explode');
        } catch (error) {
            this.feedback.error(`Failed to start TNT Rain: ${error}`, { sound: 'item.shield.block' });
        }
    }

    public stopRain(): void {
        try {
            const serviceRegistry = ServiceRegistry.getInstance();
            const rainService = serviceRegistry.get('TntRainService') as TntRainService;
            if (!rainService) {
                this.feedback.error('No TNT Rain service found!', { sound: 'item.shield.block' });
                return;
            }

            if (!rainService.isRainActive) {
                this.feedback.error('No TNT Rain is currently active!', { sound: 'item.shield.block' });
                return;
            }

            rainService.stopRain();
        } catch (error) {
            this.feedback.error(`Failed to stop TNT Rain: ${error}`, { sound: 'item.shield.block' });
        }
    }

    /**
     * Basic validation for entity type format
     */
    private isValidEntityType(entityType: string): boolean {
        const pattern = /^([a-z_]+:)?[a-z_]+$/;
        return pattern.test(entityType);
    }
}
