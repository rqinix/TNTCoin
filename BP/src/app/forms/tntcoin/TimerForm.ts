import ModalForm from "lib/Forms/ModalForm";
import ActionForm from "lib/Forms/ActionForm";
import { BaseForm } from "./BaseForm";

export class TimerForm extends BaseForm {
    show(): void {
        new ActionForm(this.player, 'Timer')
            .button('Start Timer', this.tntcoin.timer.start.bind(this.tntcoin.timer))
            .button('Stop Timer', this.tntcoin.timer.stop.bind(this.tntcoin.timer))
            .button('Restart Timer', this.tntcoin.timer.restart.bind(this.tntcoin.timer))
            .button('Edit Timer', this.showTimerEditForm.bind(this))
            .setParent(this.parentForm)
            .show();
    }

    private showTimerEditForm(): void {
        if (this.tntcoin.timer.isTimerRunning) {
            this.feedback.error('Cannot change timer settings while timer is running.', { sound: 'item.shield.block' });
            return;
        }
        new ModalForm(this.player, 'Timer Configuration')
            .textField(
                'number',
                'Time in Seconds:',
                'Enter the time in seconds',
                this.tntcoin.timer.getTimerDuration().toString(),
                (updatedValue) => {
                    const newDuration = updatedValue as number;
                    if (newDuration < 1) {
                        this.feedback.error('Time must be at least 1 second.', { sound: 'item.shield.block' });
                        return;
                    }
                    this.tntcoin.timer.setTimerDuration(newDuration);
                    this.feedback.success(
                        'Timer settings have been updated.',
                        { sound: 'random.levelup' }
                    );
                    this.tntcoin.settings.getTntCoinSettings().timerDuration = newDuration;
                }
            )
            .submitButton('Update Timer')
            .show();
    }
}
