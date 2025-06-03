import ModalForm from "lib/Forms/ModalForm";
import { BaseForm } from "./BaseForm";

export class TntCoinRocketForm extends BaseForm {
    show(): void {
        if (this.tntcoin.isTntRocketFlying) {
            this.abort();
        } else {
            this.showRocketConfigForm();
        }
    }

    private showRocketConfigForm(): void {
        if (this.tntcoin.isTntRocketFlying) {
            this.feedback.error('TNT Rocket is already active!', { sound: 'item.shield.block' });
            return;
        }
        const currentConfig = this.tntcoin.tntRocketService.getConfig();
        new ModalForm(this.player, '§c§lTNT ROCKET Configuration')
            .textField(
                'string',
                'Entity Type:',
                'Entity to spawn (e.g., minecraft:tnt, minecraft:creeper)',
                currentConfig.entityType
            )
            .textField(
                'number',
                'Duration (seconds):',
                'Enter flight duration (5-60 seconds)',
                currentConfig.duration.toString()
            )
            .textField(
                'number',
                'Speed:',
                'Speed (1-50):',
                currentConfig.levitationLevel.toString()
            )
            .submitButton('§c§lLaunch')
            .show((response, isCanceled) => {
                if (isCanceled) return;

                const entityType = response[0] as string;
                const duration = response[1] as number;
                const fastLevitationLevel = response[2] as number;
                
                // --- validation ---
                if (duration < 5 || duration > 60) {
                    this.feedback.error('Duration must be between 5 and 60 seconds!', { sound: 'item.shield.block' });
                    return;
                }
                if (fastLevitationLevel < 1 || fastLevitationLevel > 50) {
                    this.feedback.error('Fast levitation level must be between 1 and 50!', { sound: 'item.shield.block' });
                    return;
                }
                if (!entityType || entityType.trim() === '') {
                    this.feedback.error('Entity type cannot be empty!', { sound: 'item.shield.block' });
                    return;
                }

                // --- launch the player ---
                this.launch(entityType.trim(), duration, fastLevitationLevel);
            });
    }

    private launch(entityType: string, duration: number, speed: number): void {
        try {
            this.tntcoin.tntRocketService.setConfig({
                entityType,
                duration,
                levitationLevel: speed,
                particles: ['minecraft:white_smoke_particle', 'tntcoin:rocket_smoke']
            });
            const success = this.tntcoin.tntRocketService.launch(this.player, this.tntcoin);
            if (success) {
                this.feedback.success('TNT Rocket launched!', { sound: 'firework.launch' });
                this.feedback.playSound('firework.launch');
            } else {
                this.feedback.error('Failed to launch TNT Rocket!', { sound: 'item.shield.block' });
            }
        } catch (error) {
            this.feedback.error(`Failed to launch TNT Rocket: ${error}`, { sound: 'item.shield.block' });
        }
    }

    private abort(): void {
        try {
            const success = this.tntcoin.tntRocketService.abort();
            if (success) {
                this.feedback.success('TNT Rocket aborted!', { sound: 'random.break' });
            } else {
                this.feedback.error('No TNT Rocket is currently active!', { sound: 'item.shield.block' });
            }
        } catch (error) {
            this.feedback.error(`Failed to abort TNT Rocket: ${error}`, { sound: 'item.shield.block' });
        }
    }
}
