import { RawMessage, system } from "@minecraft/server";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import AbstractForm from "./AbstractForm";
import FormComponentBuilder from "./FormComponentBuilder";

export default class ActionForm extends AbstractForm {
    private _body: string | RawMessage | undefined;

    /**
     * Adds a button to the ActionForm
     * @param label Button label
     * @param callback Callback when button is pressed
     * @param iconPath Optional icon path
     * @returns The form instance for chaining
     */
    public button(label: string | RawMessage, callback?: () => Promise<void> | void, iconPath?: string): ActionForm {
        this.addComponent({ type: 'button', label, iconPath, callback });
        return this;
    }

    /**
     * Sets the body text of the ActionForm
     * @param body Body text
     * @returns The form instance for chaining
     */
    public body(body: string | RawMessage): ActionForm {
        this._body = body;
        return this;
    }

    /**
     * Shows the ActionForm to the player
     */
    public show(onClick: (response: ActionFormResponse) => void = () => { }): void {
        const form = new ActionFormData().title(this.title);
        if (this._body) {
            form.body(this._body);
        }
        this.components.forEach(component => {
            FormComponentBuilder.createComponent(component, form);
        });
        system.run(async () => {
            try {
                const response = await form.show(this.player);
                if (response.canceled) {
                    this.parentForm?.show();
                    return;
                }
                onClick(response);
                if (response && !response.canceled && this.components[response.selection]?.callback) {
                    await Promise.resolve(this.components[response.selection].callback!(response.selection));
                }
            } catch (error) {
                console.error('Error showing action form:', error);
                this.player.sendMessage(`§cError showing form: ${error.message}`);
            }
        });
    }
}
