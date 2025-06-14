import { Player } from "@minecraft/server";
import { EventActionManager } from "../../lib/Events/EventActionManager";
import ModalForm from "lib/Forms/ModalForm";
import ActionForm from "lib/Forms/ActionForm";

export class EventActionForm<T extends EventAction> {
    private readonly _player: Player;
    private readonly _manager: EventActionManager<T>;
    private _parentForm: ActionForm | null = null;

    private readonly COLORS = {
        TITLE: "§e§l",
        HEADER: "§6",
        NORMAL: "§f",
        SUCCESS: "§a",
        ERROR: "§c",
        INFO: "§b",
        IMPORTANT: "§d",
        LABEL: "§3",
        VALUE: "§7",
    };

    constructor(player: Player, eventActionManager: EventActionManager<T>) {
        this._player = player;
        this._manager = eventActionManager;
    }

    /**
     * Set the parent form for return navigation
     */
    public setParentForm(parentForm: ActionForm): void {
        this._parentForm = parentForm;
    }

    public get actionManager(): EventActionManager<T> {
        return this._manager;
    }

    /**
     * Displays a form for selecting an action type
     */
    public showActionSelectionForm(action: T, actionOptions: ActionType[], parentForm?: ActionForm | ModalForm): void {
        const form = new ActionForm(this._player, `${this.COLORS.TITLE}Choose Action Type`);

        // Store the parent form for this form
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }

        actionOptions.forEach(actionOption => {
            form.button(`${actionOption}`, () => {
                this.showActionConfigForm({
                    ...action,
                    actionType: actionOption,
                }, false, undefined, form); // Pass form as parent
            });
        });

        form.show();
    }

    /**
     * Displays a form for configuring an action
     */
    public showActionConfigForm(action: T, isEdit: boolean, index?: number, parentForm?: ActionForm): void {
        switch (action.actionType) {
            case 'Summon':
                this.showSummonForm(action, isEdit, index, parentForm);
                break;
            case 'Clear Blocks':
                this.showClearBlocksForm(action, isEdit, index, parentForm);
                break;
            case 'Fill':
                this.showFillForm(action, isEdit, index, parentForm);
                break;
            case 'Play Sound':
                this.showPlaySoundForm(action, isEdit, index, parentForm);
                break;
            case 'Screen Title':
                this.showScreenTitleForm(action, isEdit, index, parentForm);
                break;
            case 'Screen Subtitle':
                this.showScreenSubTitleForm(action, isEdit, index, parentForm);
                break;
            case 'Run Command':
                this.showRunCommandForm(action, isEdit, index, parentForm);
                break;
            case 'Jail':
                this.showJailForm(action, isEdit, index, parentForm);
                break;
            case 'Win Action':
                this.showWinActionForm(action, isEdit, index, parentForm);
                break;
            case 'TNT Rain':
                this.showTntRainForm(action, isEdit, index, parentForm);
                break;
            case 'TNT Rocket':
                this.showTntRocketForm(action, isEdit, index, parentForm);
                break;
        }
    }

    /**
     * Displays detailed information about an action
     */
    public showActionInfo(action: T, index: number, parentForm?: ActionForm): void {
        let formTitle = `${this.COLORS.TITLE}Action ${index + 1} Info`;
        let formBody = '';
        formBody += `${this.COLORS.LABEL}Action Type: ${this.COLORS.VALUE}${action.actionType}\n`;
        if (action.actionType === 'Fill' || action.actionType === 'Clear Blocks') {
            formBody += `${this.COLORS.INFO}This action cannot be edited.\n`;
        }
        if (action.playSound) {
            formBody += `${this.COLORS.LABEL}Play Sound: ${this.COLORS.VALUE}${action.playSound}\n`;
        }
        if (action.screenTitle) {
            formBody += `${this.COLORS.LABEL}Screen Title: ${this.COLORS.VALUE}${action.screenTitle}\n`;
        }
        if (action.screenSubtitle) {
            formBody += `${this.COLORS.LABEL}Screen Subtitle: ${this.COLORS.VALUE}${action.screenSubtitle}\n`;
        }
        if (action.command) {
            formBody += `${this.COLORS.LABEL}Command: ${this.COLORS.VALUE}${action.command}\n`;
        }
        if (action.jailOptions) {
            formBody += `${this.COLORS.HEADER}Jail Options:\n`;
            formBody += `${this.COLORS.LABEL}Duration: ${this.COLORS.VALUE}${action.jailOptions.duration}s\n`;
            formBody += `${this.COLORS.LABEL}Enable Effects: ${this.COLORS.VALUE}${action.jailOptions.enableEffects}\n`;
        }
        if (action.winOptions) {
            formBody += `${this.COLORS.HEADER}Win Options:\n`;
            formBody += `${this.COLORS.LABEL}Operation: ${this.COLORS.VALUE}${action.winOptions.operation}\n`;
            formBody += `${this.COLORS.LABEL}Amount: ${this.COLORS.VALUE}${action.winOptions.amount}\n`;
        }
        if (action.tntRainOptions) {
            formBody += `${this.COLORS.HEADER}TNT Rain Options:\n`;
            formBody += `${this.COLORS.LABEL}Entity Type: ${this.COLORS.VALUE}${action.tntRainOptions.entityType}\n`;
            formBody += `${this.COLORS.LABEL}Duration: ${this.COLORS.VALUE}${action.tntRainOptions.duration}s\n`;
            formBody += `${this.COLORS.LABEL}Intensity: ${this.COLORS.VALUE}${action.tntRainOptions.intensity}x\n`;
            formBody += `${this.COLORS.LABEL}Enable Camera Shake: ${this.COLORS.VALUE}${action.tntRainOptions.enableCameraShake}\n`;
        }
        if (action.summonOptions) {
            const { entityName, amount, locationType, onTop, batchSize, batchDelay } = action.summonOptions;
            formBody += `${this.COLORS.HEADER}Summon Options:\n`;
            formBody += `${this.COLORS.LABEL}Entity Name: ${this.COLORS.VALUE}${entityName}\n`;
            formBody += `${this.COLORS.LABEL}Amount: ${this.COLORS.VALUE}${amount}\n`;
            formBody += `${this.COLORS.LABEL}Location Type: ${this.COLORS.VALUE}${locationType}\n`;
            formBody += `${this.COLORS.LABEL}On Top: ${this.COLORS.VALUE}${onTop}\n`;
            formBody += `${this.COLORS.LABEL}Batch Size: ${this.COLORS.VALUE}${batchSize}\n`;
            formBody += `${this.COLORS.LABEL}Batch Delay: ${this.COLORS.VALUE}${batchDelay}\n`;
            if (action.summonOptions.playSound.playSoundOnSummon) {
                formBody += `${this.COLORS.LABEL}Play Sound on Summon: ${this.COLORS.VALUE}${action.summonOptions.playSound.sound}\n`;
            }
        }
        const form = new ActionForm(this._player, formTitle);
        form.body(formBody);
        if (action.actionType !== 'Fill' && action.actionType !== 'Clear Blocks') {
            form.button(`${this.COLORS.NORMAL}Edit Action`, () => this.showActionConfigForm(action, true, index, form));
        }
        form.button(`${this.COLORS.ERROR}Delete Action`, () => this.showClearActionConfirmationForm(action, index, form));

        // Maintain parent hierarchy for back navigation
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }

        form.show();
    }

    // ----- Action Forms -----

    /**
     * Form for configuring TNT rocket options
     */
    private showTntRocketForm(action: T, isEdit: boolean, index?: number, parentForm?: ActionForm): void {
        if (action.actionType !== 'TNT Rocket') return;
        const tntRocketOptions = action.tntRocketOptions || {
            entityType: 'minecraft:tnt',
            duration: 15,
            amplifier: 10,
        };
        const formTitle = this.createActionFormTitle('TNT Rocket', isEdit, index);
        const form = new ModalForm(this._player, formTitle)
            .textField('string', `${this.COLORS.LABEL}Entity Type`, 'Entity Type (e.g., minecraft:tnt)', tntRocketOptions.entityType)
            .textField('number', `${this.COLORS.LABEL}Duration (seconds)`, 'Flight duration (5-60 seconds)', tntRocketOptions.duration.toString())
            .textField('number', `${this.COLORS.LABEL}Speed`, 'Speed', tntRocketOptions.amplifier.toString())
            .submitButton('Confirm');
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show(response => {
            const entityType = response[0] as string;
            const duration = Math.max(5, Math.min(60, response[1] as number));
            const speed = Math.max(1, Math.min(20, response[2] as number));
            const updatedTntRocketOptions: TntRocketOptions = {
                entityType: entityType.trim(),
                duration: duration,
                amplifier: speed,
                particles: ['minecraft:white_smoke_particle', 'tntcoin:rocket_smoke']
            }
            const updatedAction: T = {
                ...action,
                tntRocketOptions: updatedTntRocketOptions
            };
            this.handleActionSubmission(action, updatedAction, isEdit, index);
        });
    }


    /**
     * Form for configuring TNT rain options
     */
    private showTntRainForm(action: T, isEdit: boolean, index?: number, parentForm?: ActionForm): void {
        if (action.actionType !== 'TNT Rain') return;
        const tntRainOptions = action.tntRainOptions || {
            entityType: 'tnt',
            duration: 30,
            intensity: 2.0,
            enableCameraShake: true,
            rainCoin: true
        };
        const formTitle = this.createActionFormTitle('TNT Coin Rain', isEdit, index);
        const form = new ModalForm(this._player, formTitle)
            .textField('string', `${this.COLORS.LABEL}Entity Type`, 'Entity Type (e.g., tnt)', tntRainOptions.entityType)
            .textField('number', `${this.COLORS.LABEL}Duration (seconds)`, 'Duration (minimum 10 seconds)', tntRainOptions.duration.toString())
            .textField('number', `${this.COLORS.LABEL}Intensity Multiplier`, 'Intensity (1.0 - 2.0)', tntRainOptions.intensity.toString())
            .toggle(`${this.COLORS.LABEL}Enable Camera Shake`, tntRainOptions.enableCameraShake)
            .toggle(`${this.COLORS.LABEL}Rain Coin`, tntRainOptions.rainCoin)
            .submitButton('Confirm');
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show(response => {
            const entityType = response[0] as string;
            const duration = Math.max(10, response[1] as number);
            const intensity = Math.max(1.0, Math.min(2.0, response[2] as number));
            const enableCameraShake = response[3] as boolean;
            const rainCoin = response[4] as boolean;
            const updatedTntRainOptions: TntRainOptions = {
                entityType: entityType,
                duration: duration,
                intensity: intensity,
                enableCameraShake: enableCameraShake,
                rainCoin: rainCoin
            };
            const updatedAction: T = { ...action, tntRainOptions: updatedTntRainOptions, };
            this.handleActionSubmission(action, updatedAction, isEdit, index);
        });
    }

    /**
     * Form for configuring win action options
     */
    private showWinActionForm(action: T, isEdit: boolean, index?: number, parentForm?: ActionForm): void {
        if (action.actionType !== 'Win Action') return;
        const winOptions = action.winOptions || {
            operation: 'increment',
            amount: 1
        };
        const formTitle = this.createActionFormTitle('Win Action', isEdit, index);
        const form = new ModalForm(this._player, formTitle)
            .dropdown(`${this.COLORS.LABEL}Operation`, ['Increment', 'Decrement'], winOptions.operation === 'increment' ? 0 : 1)
            .textField('number', `${this.COLORS.LABEL}Amount`, 'Amount to change', winOptions.amount.toString())
            .submitButton('Confirm');
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show(response => {
            const updatedWinOptions: WinActionOptions = {
                operation: response[0] === 0 ? 'increment' : 'decrement',
                amount: Math.max(1, response[1] as number)
            };
            const updatedAction: T = {
                ...action,
                winOptions: updatedWinOptions,
            };
            this.handleActionSubmission(action, updatedAction, isEdit, index);
        });
    }

    /**
     * Form for configuring jail options
     */
    private showJailForm(action: T, isEdit: boolean, index?: number, parentForm?: ActionForm): void {
        if (action.actionType !== 'Jail') return;
        const jailOptions = action.jailOptions || {
            duration: 30,
            enableEffects: true
        };
        const formTitle = this.createActionFormTitle('Jail', isEdit, index);
        const form = new ModalForm(this._player, formTitle)
            .textField('number', `${this.COLORS.LABEL}Jail Duration (seconds)`, 'Duration in seconds', jailOptions.duration.toString())
            .toggle(`${this.COLORS.LABEL}Enable Jail Effects`, jailOptions.enableEffects)
            .submitButton('Confirm');
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show(response => {
            const updatedJailOptions: JailActionOptions = {
                duration: Math.max(1, response[0] as number),
                enableEffects: response[1] as boolean
            };
            const updatedAction: T = {
                ...action,
                jailOptions: updatedJailOptions,
            };
            this.handleActionSubmission(action, updatedAction, isEdit, index);
        });
    }

    /**
     * Form for configuring summon options
     */
    private showSummonForm(action: T, isEdit: boolean, index?: number, parentForm?: ActionForm): void {
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
        const formTitle = this.createActionFormTitle('Summon', isEdit, index);
        const form = new ModalForm(this._player, formTitle)
            .textField('string', `${this.COLORS.LABEL}Entity Name`, 'Entity Name', summonOptions.entityName)
            .textField('number', `${this.COLORS.LABEL}Amount`, 'Amount', summonOptions.amount.toString())
            .dropdown(`${this.COLORS.LABEL}Location Type`, ['Random', 'Center'], summonOptions.locationType === 'random' ? 0 : 1)
            .toggle(`${this.COLORS.LABEL}On Top`, summonOptions.onTop)
            .textField('number', `${this.COLORS.LABEL}Batch Size`, 'Batch Size', summonOptions.batchSize.toString())
            .textField('number', `${this.COLORS.LABEL}Batch Delay`, 'Batch Delay', summonOptions.batchDelay.toString())
            .toggle(`${this.COLORS.LABEL}Play Sound on Summon`, summonOptions.playSound.playSoundOnSummon)
            .textField('string', `${this.COLORS.LABEL}Sound`, 'Sound', summonOptions.playSound.sound)
            .submitButton('Confirm');
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show(response => {
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
            this.handleActionSubmission(action, updatedAction, isEdit, index);
        });
    }

    /**
     * Form for configuring play sound options
     */
    private showPlaySoundForm(action: T, isEdit: boolean, index?: number, parentForm?: ActionForm): void {
        if (action.actionType !== 'Play Sound') return;
        const playSound = action.playSound || 'kururin';
        const formTitle = this.createActionFormTitle('Play Sound', isEdit, index);
        const form = new ModalForm(this._player, formTitle)
            .textField('string', `${this.COLORS.LABEL}Sound Name`, 'Sound Name', playSound)
            .submitButton('Confirm');
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show(response => {
            const updatedPlaySound = response[0] as string;
            const updatedAction: T = {
                ...action,
                playSound: updatedPlaySound,
            };
            this.handleActionSubmission(action, updatedAction, isEdit, index);
        });
    }

    /**
     * Form for clear blocks action
     */
    private showClearBlocksForm(action: T, isEdit: boolean, index?: number, parentForm?: ActionForm): void {
        if (action.actionType !== 'Clear Blocks') return;
        const form = new ActionForm(this._player, `${this.COLORS.TITLE}Clear Blocks Action`)
            .body(`${this.COLORS.INFO}Confirm adding a Clear Blocks action?`)
            .button('Confirm', () => {
                this._manager.addActionToEvent(action);
                this.showSuccessMessage(`Clear Blocks action added`);
                this._player.playSound('random.orb');
            })
            .button(`${this.COLORS.ERROR}Cancel`);
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show();
    }

    /**
     * Form for fill action
     */
    private showFillForm(action: T, isEdit: boolean, index?: number, parentForm?: ActionForm): void {
        if (action.actionType !== 'Fill') return;
        const form = new ActionForm(this._player, `${this.COLORS.TITLE}Fill Action`)
            .body(`${this.COLORS.INFO}Confirm adding a Fill action?`)
            .button('Confirm', () => {
                this._manager.addActionToEvent(action);
                this.showSuccessMessage(`Fill action added`);
                this._player.playSound('random.orb');
            })
            .button(`${this.COLORS.ERROR}Cancel`);
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show();
    }

    /**
     * Form for screen title action
     */
    private showScreenTitleForm(action: T, isEdit: boolean, index?: number, parentForm?: ActionForm): void {
        if (action.actionType !== 'Screen Title') return;
        const screenTitle = action.screenTitle || 'Title';
        const formTitle = this.createActionFormTitle('Screen Title', isEdit, index);
        const form = new ModalForm(this._player, formTitle)
            .textField('string', `${this.COLORS.LABEL}Title Text`, 'Title Text', screenTitle)
            .submitButton('Confirm');
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show(response => {
            const updatedScreenTitle = response[0] as string;
            const updatedAction: T = {
                ...action,
                screenTitle: updatedScreenTitle,
            };
            this.handleActionSubmission(action, updatedAction, isEdit, index);
        });
    }

    /**
     * Form for screen subtitle action
     */
    private showScreenSubTitleForm(action: T, isEdit: boolean, index?: number, parentForm?: ActionForm): void {
        if (action.actionType !== 'Screen Subtitle') return;
        const screenSubtitle = action.screenSubtitle || 'Subtitle';
        const formTitle = this.createActionFormTitle('Screen Subtitle', isEdit, index);
        const form = new ModalForm(this._player, formTitle)
            .textField('string', `${this.COLORS.LABEL}Subtitle Text`, 'Subtitle Text', screenSubtitle)
            .submitButton('Confirm');
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show(response => {
            const subtitle = response[0] as string;
            const updatedAction: T = {
                ...action,
                screenSubtitle: subtitle,
            };
            this.handleActionSubmission(action, updatedAction, isEdit, index);
        });
    }

    private showRunCommandForm(action: T, isEdit: boolean, index?: number, parentForm?: ActionForm): void {
        if (action.actionType !== 'Run Command') return;
        const command = action.command || 'say Hello';
        const formTitle = this.createActionFormTitle('Run Command', isEdit, index);
        const form = new ModalForm(this._player, formTitle)
            .textField('string', `${this.COLORS.LABEL}Command`, 'Command', command)
            .submitButton('Confirm');
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show(response => {
            const updatedCommand = response[0] as string;
            const updatedAction: T = {
                ...action,
                command: updatedCommand,
            };
            this.handleActionSubmission(action, updatedAction, isEdit, index);
        });
    }

    // ----- Confirmation Forms -----

    /**
     * Form to confirm clearing all actions from an event
     */
    public showClearAllActionsForm(actions: Map<string, T[]>, parentForm?: ActionForm): void {
        const form = new ActionForm(this._player, `${this.COLORS.ERROR}Clear All Actions`)
            .body(`${this.COLORS.IMPORTANT}Are you sure you want to clear all actions?\n${this.COLORS.ERROR}This cannot be undone!`)
            .button(`${this.COLORS.ERROR}Yes, Clear All`, () => {
                actions.forEach(action => {
                    this._manager.clearActionsFromEvent(action[0].eventKey);
                });
                this.showErrorMessage('All actions cleared');
                this._player.playSound('random.orb');
            })
            .button(`${this.COLORS.SUCCESS}No, Keep Actions`);
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show();
    }

    /**
     * Form to confirm clearing a single action
     */
    private showClearActionConfirmationForm(action: T, index: number, parentForm?: ActionForm): void {
        const form = new ActionForm(this._player, `${this.COLORS.TITLE}Delete Action`)
            .body(`${this.COLORS.IMPORTANT}Are you sure you want to delete this action?`)
            .button(`${this.COLORS.ERROR}Yes, Delete`, () => {
                this._manager.removeActionFromEvent(action.eventKey, index);
                this.showErrorMessage(`Action #${index + 1} deleted`);
                this._player.playSound('random.orb');
            })
            .button(`${this.COLORS.SUCCESS}No, Keep Action`);
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show();
    }

    /**
     * Form to confirm clearing all events
     */
    public showConfirmationForm(eventKey: string, parentForm?: ActionForm): void {
        const form = new ActionForm(this._player, `${this.COLORS.TITLE}Clear Events`)
            .body(
                `${this.COLORS.IMPORTANT}Are you sure you want to clear all events?\n${this.COLORS.ERROR}This cannot be undone!`
            )
            .button(`${this.COLORS.ERROR}Yes, Clear All`, () => {
                this._manager.clearActionsFromEvent(eventKey);
                this.showErrorMessage(`All events cleared`);
                this._player.playSound('random.orb');
            })
            .button(`${this.COLORS.SUCCESS}No, Keep Events`);
        if (parentForm) {
            form.setParent(parentForm);
        } else if (this._parentForm) {
            form.setParent(this._parentForm);
        }
        form.show();
    }

    /**
     * Handles action submission for both edit and create modes
     */
    private handleActionSubmission(action: T, updatedAction: T, isEdit: boolean, index?: number): void {
        if (isEdit && index !== undefined) {
            this._manager.updateActionInEvent(action.eventKey, index, updatedAction);
            this.showSuccessMessage(`Action updated successfully`);
        } else {
            this._manager.addActionToEvent(updatedAction);
            this.showSuccessMessage(`New action added successfully`);
        }
        this._player.playSound('random.orb');
    }

    /**
     * Shows a success message with green color
     */
    private showSuccessMessage(message: string): void {
        this._player.sendMessage(`${this.COLORS.SUCCESS}${message}`);
    }

    /**
     * Shows an error message with red color
     */
    private showErrorMessage(message: string): void {
        this._player.sendMessage(`${this.COLORS.ERROR}${message}`);
    }

    /**
     * Creates a form title with proper formatting for action forms
     */
    private createActionFormTitle(baseTitle: string, isEdit: boolean, index?: number): string {
        let title = `${this.COLORS.TITLE}${baseTitle}: ${isEdit ? 'Edit' : 'Create'} Action`;
        if (index !== undefined) {
            title += ` ${index + 1}`;
        }
        return title;
    }
}
