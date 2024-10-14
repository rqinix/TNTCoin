import { Player } from "@minecraft/server";
import { EventActionForm } from "../../core/EventActionForm";

export abstract class EventActionFormBase<T extends EventAction> {
    protected readonly _player: Player;
    protected readonly _eventActionForm: EventActionForm<T>;
    protected readonly _actionOptions: ActionType[] = [
        'Summon', 'Play Sound', 'Fill', 'Clear Blocks', 'Screen Title', 'Screen Subtitle'
    ];

    constructor(player: Player, eventActionForm: EventActionForm<T>) {
        this._player = player;
        this._eventActionForm = eventActionForm;
    }

    public abstract show(): void;
}
