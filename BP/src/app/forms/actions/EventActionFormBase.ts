import { Player } from "@minecraft/server";
import { EventActionForm } from "app/forms/EventActionForm";
import ModalForm from "lib/Forms/ModalForm";
import ActionForm from "lib/Forms/ActionForm";
import { ActionType, EventAction } from "types";

export abstract class EventActionFormBase<T extends EventAction> {
    protected readonly _player: Player;
    protected readonly _eventActionForm: EventActionForm<T>;
    protected readonly _actionOptions: ActionType[] = [
        'Summon', 'Play Sound', 'Fill', 'Clear Blocks', 
        'Screen Title', 'Screen Subtitle', 'Run Command', 'Jail', 'Win Action',
        'TNT Rain', 'TNT Rocket'
    ];
    protected _parentForm: ActionForm | ModalForm | null = null;

    constructor(player: Player, eventActionForm: EventActionForm<T>) {
        this._player = player;
        this._eventActionForm = eventActionForm;
    }

    /**
     * Sets the parent form for this action form
     * @param parentForm The parent form to return to
     */
    public setParentForm(parentForm: ActionForm): this {
        this._parentForm = parentForm;
        this._eventActionForm.setParentForm(parentForm);
        return this;
    }
    
    /**
     * Creates a modal form
     * @param title The title of the modal form
     * @returns A new ModalForm with parent form set for navigation when canceled
     */    
    protected createModalForm(title: string): ModalForm {
        const modalForm = new ModalForm(this._player, title);
        if (this._parentForm) {
            modalForm.setParent(this._parentForm);
        }
        return modalForm;
    }
    
    /**
     * Creates an action form
     * @param title The title of the action form
     * @returns A new ActionForm with parent form set for navigation when canceled
     */
    protected createActionForm(title: string): ActionForm {
        const actionForm = new ActionForm(this._player, title);
        if (this._parentForm) {
            actionForm.setParent(this._parentForm);
        }
        return actionForm;
    }

    public abstract show(): void;
}
