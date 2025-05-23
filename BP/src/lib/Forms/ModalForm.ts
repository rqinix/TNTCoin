import { RawMessage, system } from "@minecraft/server";
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import AbstractForm from "./AbstractForm";
import FormComponentBuilder from "./FormComponentBuilder";

export default class ModalForm extends AbstractForm {
    /**
     * Adds a text field to the form
     * @param textfieldType Type of text field ('string' or 'number')
     * @param label Field label
     * @param placeholder Placeholder text
     * @param defaultValue Default value
     * @param callback Callback when value changes
     * @returns The form instance for chaining
     */
    public textField(
        textfieldType: 'string' | 'number',
        label: string | RawMessage,
        placeholder: string | RawMessage,
        defaultValue: string = "",
        callback?: (updatedValue: string | number) => void
    ): ModalForm {
        this.addComponent({
            type: 'textField',
            label,
            placeholder,
            defaultValue,
            callback,
            textfieldType
        });
        return this;
    }

    /**
     * Adds a dropdown to the form
     * @param label Dropdown label
     * @param options Dropdown options
     * @param defaultValue Default selected index
     * @param callback Callback when selection changes
     * @returns The form instance for chaining
     */
    public dropdown(
        label: string | RawMessage,
        options: string[] | RawMessage[],
        defaultValue: number = 0,
        callback?: (updatedValue: number) => void
    ): ModalForm {
        this.addComponent({
            type: 'dropdown',
            label,
            options,
            defaultValue,
            callback
        });
        return this;
    }

    /**
     * Adds a slider to the form
     * @param label Slider label
     * @param min Minimum value
     * @param max Maximum value
     * @param step Step value
     * @param defaultValue Default value
     * @param callback Callback when value changes
     * @returns The form instance for chaining
     */
    public slider(
        label: string | RawMessage,
        min: number,
        max: number,
        step: number = 1,
        defaultValue: number = min,
        callback?: (updatedValue: number) => void
    ): ModalForm {
        this.addComponent({
            type: 'slider',
            label,
            min,
            max,
            step,
            defaultValue,
            callback
        });
        return this;
    }

    /**
     * Adds a toggle switch to the form
     * @param label Toggle label
     * @param defaultValue Default state
     * @param callback Callback when state changes
     * @returns The form instance for chaining
     */
    public toggle(
        label: string | RawMessage,
        defaultValue: boolean = false,
        callback?: (updatedValue: boolean) => void
    ): ModalForm {
        this.addComponent({
            type: 'toggle',
            label,
            defaultValue,
            callback
        });
        return this;
    }

    /**
     * Sets the submit button text
     * @param label Button label
     * @returns The form instance for chaining
     */
    public submitButton(label: string | RawMessage): ModalForm {
        this.addComponent({ type: 'submitButton', label: `§2${label}§r` });
        return this;
    }

    /**
     * Shows the form to the player
     * @param onSubmit Callback for when the form is submitted
     */
    public show(onSubmit: (values: (string | number | boolean)[], isCanceled: boolean) => void = () => { }): void {
        const form = new ModalFormData().title(this.title);
        this.components.forEach(component => {
            FormComponentBuilder.createComponent(component, form);
        });
        system.run(async () => {
            try {
                const response = await form.show(this.player);
                if (response.canceled) {
                    if (this.parentForm) {
                        this.showParentForm();
                    }
                    return;
                }
                if (response && !response.canceled && onSubmit) {
                    try {
                        const validatedValues = this.validateFormValues(response);
                        this.components.forEach((component, index) => {
                            if (component.callback && response.formValues) {
                                component.callback(validatedValues[index]);
                            }
                        });
                        onSubmit(validatedValues, response.canceled);
                    } catch (error) {
                        console.error('Error in form validation:', error);
                        this.player.sendMessage(`§c${error.message}`);
                        this.player.playSound('item.shield.block');
                    }
                }
            } catch (error) {
                console.error('Error showing modal form:', error);
                this.player.sendMessage(`§cError showing form: ${error.message}`);
            }
        });
    }

    /**
     * Validates the form values
     * @param response Form response
     * @returns Validated form values
     */
    private validateFormValues(response: ModalFormResponse): (string | number | boolean)[] {
        if (!response.formValues) return [];
        return this.components.map((component, index) => {
            if (component.type !== 'textField' || !component.textfieldType) {
                return response.formValues?.[index];
            }
            const value = response.formValues[index];
            return this.validateTextField(component.textfieldType, value as string);
        });
    }

    /**
     * Validates a text field value
     * @param valueType Type of value ('string' or 'number')
     * @param value The value to validate
     * @returns Validated value
     */
    private validateTextField(valueType: 'string' | 'number', value: any): string | number {
        switch (valueType) {
            case 'number':
                const numberValue = Number(value);
                if (isNaN(numberValue)) {
                    throw new Error(`Invalid number value: ${value}`);
                }
                return numberValue;
            case 'string':
                return String(value);
            default:
                throw new Error(`Unknown value type: ${valueType}`);
        }
    }
}
