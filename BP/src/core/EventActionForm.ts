import { Player } from "@minecraft/server";
import { EventActionManager } from "./EventActionManager";
import { ActionForm, ModalForm } from "./Form";

export class EventActionForm<T extends EventAction>{

    private readonly _player: Player;
    private readonly _manager: EventActionManager<T>;

    constructor(player: Player, eventActionManager: EventActionManager<T>) {
        this._player = player;
        this._manager = eventActionManager;
    }

    public showCreateActionForm(action: T, actionOptions: ActionType[]): void {
        const form = new ActionForm(this._player, 'Choose Action');

        actionOptions.forEach(actionOption => {
            form.button(actionOption, () => {
                this.showActionTypeForm({
                    ...action,
                    actionType: actionOption,
                }, false);
            });
        });

        form.show();
    }

    public showActionTypeForm(action: T, isEdit: boolean, index?: number): void {
        switch (action.actionType) {
            case 'Summon':
                this.showSummonForm(action, isEdit, index);
                break;
            case 'Clear Blocks':
                this.showClearBlocksForm(action, isEdit, index);
                break;
            case 'Fill':
                this.showFillForm(action, isEdit, index);
                break;
            case 'Play Sound':
                this.showPlaySoundForm(action, isEdit, index);
                break;
            case 'Screen Title':
                this.showScreenTitleForm(action, isEdit, index);
                break;
            case 'Screen Subtitle':
                this.showScreenSubTitleForm(action, isEdit, index);
                break;
        }
    }

    public showActionInfo(action: T, index: number): void {
        let formTitle = `Action ${index + 1}`;
        let formBody = '';
        formBody += `Action Type: ${action.actionType}\n`;
        if (action.actionType === 'Fill' || action.actionType === 'Clear Blocks') {
            formBody += 'This action cannot be edited.\n';
        }
        if (action.playSound) formBody += `Play Sound: ${action.playSound}\n`;
        if (action.screenTitle) formBody += `Screen Title: ${action.screenTitle}\n`;
        if (action.screenSubtitle) formBody += `Screen Subtitle: ${action.screenSubtitle}\n`;
        if (action.summonOptions) {
            const { entityName, amount, locationType, onTop, batchSize, batchDelay } = action.summonOptions;
            formBody += `Entity Name: ${entityName}\n`;
            formBody += `Amount: ${amount}\n`;
            formBody += `Location Type: ${locationType}\n`;
            formBody += `On Top: ${onTop}\n`;
            formBody += `Batch Size: ${batchSize}\n`;
            formBody += `Batch Delay: ${batchDelay}\n`;
            if (action.summonOptions.playSound.playSoundOnSummon) {
                formBody += `Play Sound on Summon: ${action.summonOptions.playSound.sound}\n`;
            }
        }

        const form = new ActionForm(this._player, formTitle)
        form.body(formBody)
        if (action.actionType !== 'Fill' && action.actionType !== 'Clear Blocks') {
            form.button('Edit', () => this.showActionTypeForm(action, true, index));
        }
        form.button('Delete', () => this.showClearActionFromEvent(action, index));
        form.show();
    }

    public showSummonForm(action: T, isEdit: boolean, index?: number): void {
        if (action.actionType !== 'Summon') return;

        const summonOptions = action.summonOptions || {
            entityName: 'tnt_minecart',
            amount: 1,
            locationType: 'random',
            onTop: true,
            batchSize: 10,
            batchDelay: 10,
            playSound: {
                playSoundOnSummon: true,
                sound: 'kururin',
            }
        };

        let formTitle = `Summon: ${isEdit ? 'Edit' : 'Create'} Action`;
        formTitle += index !== undefined ? ` ${index + 1}` : '';

        new ModalForm(this._player, formTitle)
            .textField('string', 'Entity Name', 'Entity Name', summonOptions.entityName)
            .textField('number', 'Amount', 'Amount', summonOptions.amount.toString())
            .dropdown('Location Type', ['Random', 'Center'], summonOptions.locationType === 'random' ? 0 : 1)
            .toggle('On Top', summonOptions.onTop)
            .textField('number', 'Batch Size', 'Batch Size', summonOptions.batchSize.toString())
            .textField('number', 'Batch Delay', 'Batch Delay', summonOptions.batchDelay.toString())
            .toggle('Play Sound on Summon', summonOptions.playSound.playSoundOnSummon)
            .textField('string', 'Sound', 'Sound', summonOptions.playSound.sound)
            .submitButton('Confirm')
            .show(response => {
                const updatedSummonOptions: SummonOptions = {
                    entityName: response[0] as string,
                    amount: Math.max(1, response[1] as number),
                    locationType: response[2] === 0 ? 'random' : 'center',
                    onTop: response[3] as boolean,
                    batchSize: Math.max(1, response[4] as number),
                    batchDelay: Math.max(1, response[5] as number),
                    playSound: {
                        playSoundOnSummon: response[6] as boolean,
                        sound: response[7] as string,
                    }
                };

                const updatedAction: T = {
                    ...action,
                    summonOptions: updatedSummonOptions,
                };

                if (isEdit && index !== undefined) {
                    this._manager.updateActionInEvent(action.eventKey, index, updatedAction);
                    this._player.sendMessage(`§aAction updated.`);
                } else {
                    this._manager.addActionToEvent(updatedAction);
                    this._player.sendMessage(`§aNew action added.`);
                }

                this._player.playSound('random.orb');
            });
    }

    public showPlaySoundForm(action: T, isEdit: boolean, index?: number): void {
        if (action.actionType !== 'Play Sound') return;

        const playSound = action.playSound || 'kururin';
        let formTitle = `Play Sound: ${isEdit ? 'Edit' : 'Create'} Action`;
        formTitle += index !== undefined ? ` ${index + 1}` : '';

        new ModalForm(this._player, formTitle)
            .textField('string', 'Play Sound', 'Play Sound', playSound)
            .submitButton('Confirm')
            .show(response => {
                const updatedPlaySound = response[0] as string;

                const updatedAction: T = {
                    ...action,
                    playSound: updatedPlaySound,
                };

                if (isEdit && index !== undefined) {
                    this._manager.updateActionInEvent(action.eventKey, index, updatedAction);
                    this._player.sendMessage(`§aAction updated.`);
                } else {
                    this._manager.addActionToEvent(updatedAction);
                    this._player.sendMessage(`§aNew action added.`);
                }

                this._player.playSound('random.orb');
            });
    }

    public showClearBlocksForm(action: T, isEdit: boolean, index?: number): void {
        if (action.actionType !== 'Clear Blocks') return;
        if (isEdit) {
            this._player.sendMessage(`§cCannot edit Clear Blocks action.`);
            return;
        }
        new ActionForm(this._player, 'Clear Blocks Action')
            .body('Confirm Clear Blocks Action')
            .button('Confirm', () => {
                this._manager.addActionToEvent(action);
                this._player.sendMessage(`§aNew action added.`);
                this._player.playSound('random.orb');
            })
            .button('Cancel')
            .show();
    }

    public showFillForm(action: T, isEdit: boolean, index?: number): void {
        if (action.actionType !== 'Fill') return;
        if (isEdit) {
            this._player.sendMessage(`§cCannot edit Fill action.`);
            return;
        }
        new ActionForm(this._player, 'Fill Action')
            .body('Confirm Fill Action')
            .button('Confirm', () => {
                this._manager.addActionToEvent(action);
                this._player.sendMessage(`§aNew action added.`);
                this._player.playSound('random.orb');
            })
            .button('Cancel')
            .show();
    }

    public showScreenTitleForm(action: T, isEdit: boolean, index?: number): void {
        if (action.actionType !== 'Screen Title') return;

        const screenTitle = action.screenTitle || 'Title';

        let formTitle = `${isEdit ? 'Edit Screen Title' : 'Screen Title Action'}`;
        formTitle += index !== undefined ? ` ${index + 1}` : '';

        new ModalForm(this._player, formTitle)
            .textField('string', 'Title', 'Title', screenTitle)
            .submitButton('Confirm')
            .show(response => {
                const updatedScreenTitle = response[0] as string;

                const updatedAction: T = {
                    ...action,
                    screenTitle: updatedScreenTitle,
                };

                if (isEdit && index !== undefined) {
                    this._manager.updateActionInEvent(action.eventKey, index, updatedAction);
                    this._player.sendMessage(`§aAction updated.`);
                } else {
                    this._manager.addActionToEvent(updatedAction);
                    this._player.sendMessage(`§aNew action added.`);
                }

                this._player.playSound('random.orb');
            });
    }

    public showScreenSubTitleForm(action: T, isEdit: boolean, index?: number): void {
        if (action.actionType !== 'Screen Subtitle') return;

        const screenTitle = action.screenTitle || 'Subtitle';

        let formTitle = `${isEdit ? 'Edit Screen Subtitle' : 'Screen Subtitle Action'}`;
        formTitle += index !== undefined ? ` ${index + 1}` : '';

        new ModalForm(this._player, formTitle)
            .textField('string', 'Subtitle', 'Subtitle', screenTitle)
            .submitButton('Confirm')
            .show(response => {
                const subtitle = response[0] as string;

                const updatedAction: T = {
                    ...action,
                    screenSubtitle: subtitle,
                };

                if (isEdit && index !== undefined) {
                    this._manager.updateActionInEvent(action.eventKey, index, updatedAction);
                    this._player.sendMessage(`§aAction updated.`);
                } else {
                    this._manager.addActionToEvent(updatedAction);
                    this._player.sendMessage(`§aNew action added.`);
                }

                this._player.playSound('random.orb');
            });
    }

    public continueWithActions(reject: () => void, callback: (actions: Map<string, T[]>) => void): void {
        const actions = this._manager.getAllActions();
        if (actions.size === 0) {
            reject();
        } else {
            callback(actions);
        }
    }

    public showClearAllActionsForm(actions: Map<string, T[]>): void {
        new ActionForm(this._player, 'Clear All Actions')
            .body('Are you sure you want to clear all actions?')
            .button('Yes', () => {
                actions.forEach(action => {
                    this._manager.removeAllActionsFromEvent(action[0].eventKey);
                });
                this._player.sendMessage('§cAll actions cleared.');
                this._player.playSound('random.orb');
            })
            .button('No')
            .show();
    }

    public showClearActionFromEvent(action: T, index: number): void {
        new ActionForm(this._player, 'Clear Action')
            .body(`Are you sure you want to clear this action?`)
            .button('Yes', () => {
                this._manager.removeActionFromEvent(action.eventKey, index);
                this._player.sendMessage(`§cAction deleted.`);
                this._player.playSound('random.orb');
            })
            .button('No')
            .show();
    }

    public showClearAllActionsFromEvent(eventKey: string): void {
        new ActionForm(this._player, 'Clear All Actions')
            .body(`Are you sure you want to clear all actions?`)
            .button('Yes', () => {
                this._manager.removeAllActionsFromEvent(eventKey);
                this._player.sendMessage(`§cAll actions cleared.`);
                this._player.playSound('random.orb');
            })
            .button('No')
            .show();
    }
}