import { Player } from "@minecraft/server";
import { EventActionManager } from "../../core/EventActionManager";
import { EventActionForm } from "../../core/EventActionForm";
import { ActionForm } from "../../core/Form";
import { EventActionFormBase } from "./EventActionFormBase";

export class ShareActionForm extends EventActionFormBase<ShareAction> {
    private readonly _eventKey: string = 'share';

    constructor(player: Player, shareActionManager: EventActionManager<ShareAction>) {
        super(player, new EventActionForm(player, shareActionManager));
    }

    public show(): void {
        const shareActions = this._eventActionForm.actionManager.getAllEvents().get(this._eventKey);
        const form = new ActionForm(this._player, 'Share Actions');

        if (shareActions) {
            form.body(`§2§kii§r§fTotal Actions: §d${shareActions?.length ?? 0}§2§kii§r\nExecuted when viewer shares your live!`);

            shareActions.forEach((action, index) => {
                form.button(`§2§kii§r§8${index + 1}. ${action.actionType}§2§kii§r`, () => {
                    this._eventActionForm.showActionInfo(action, index);
                });
            });
        }
        
        form.button('Create New Share Action', () => {
            this._eventActionForm.showCreateActionForm({
                eventKey: this._eventKey,
            }, this._actionOptions);
        });

        form.button('Clear All Actions', () => {
            this._eventActionForm.showClearAllActionsForm(this._eventActionForm.actionManager.getAllEvents())
        });

        form.show();
    }
}