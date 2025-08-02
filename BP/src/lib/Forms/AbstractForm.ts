import { Player, RawMessage } from "@minecraft/server";
import ActionForm from "./ActionForm";
import { FormComponent } from "types";

export default abstract class AbstractForm {
    protected components: FormComponent[];
    protected player: Player;
    protected title: string | RawMessage;
    protected parentForm: AbstractForm | null = null;

    constructor(player: Player, title: string | RawMessage) {
        this.player = player;
        this.title = title;
        this.components = [];
    }

    abstract show(): Promise<void> | void;

    protected addComponent(component: FormComponent): void {
        this.components.push(component);
    }

    /**
     * Sets a parent form for return navigation
     * @param parent The parent form to return to
     * @returns The form instance for chaining
     */
    public setParent(parent: AbstractForm): this {
        this.parentForm = parent;
        return this;
    }

    /**
     * Returns to the parent form if one exists
     */
    protected showParentForm(): void {
        if (this.parentForm) {
            this.parentForm.show();
        }
    }

    /**
     * Adds a header to the form
     * @param text Header text
     * @returns The form instance for chaining
     */
    public header(text: string | RawMessage): this {
        this.addComponent({ type: 'header', label: text });
        return this;
    }

    /**
     * Adds a label to the form
     * @param text Label text
     * @returns The form instance for chaining
     */
    public label(text: string | RawMessage): this {
        this.addComponent({ type: 'label', label: text });
        return this;
    }

    /**
     * Adds a divider to the form
     * @returns The form instance for chaining
     */
    public divider(): this {
        this.addComponent({ type: 'divider' });
        return this;
    }
}
