import { Player, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

class FormComponentBuilder {
    static createComponent(component: FormComponent, form: ActionFormData | ModalFormData): void {
        switch (component.type) {
            case 'button':
                (form as ActionFormData).button(component.label, component.iconPath);
                break;
            case 'textField':
                (form as ModalFormData).textField(component.label, component.placeholder!, component.defaultValue as string);
                break;
            case 'dropdown':
                (form as ModalFormData).dropdown(component.label, component.options!, component.defaultValue as number);
                break;
            case 'slider':
                (form as ModalFormData).slider(component.label, component.min!, component.max!, component.step!, component.defaultValue as number);
                break;
            case 'toggle':
                (form as ModalFormData).toggle(component.label, component.defaultValue as boolean);
                break;
            default:
                throw new Error(`Unknown form component type: ${component.type}`);
        }
    }
}

/**
 * Abstract class representing a form for Minecraft UI.
 */
abstract class Form {
    protected components: FormComponent[];
    protected player: Player;
    protected title: string;

    constructor(player: Player, title: string) {
        this.player = player;
        this.title = title;
        this.components = [];
    }

    abstract show(): Promise<void> | void;

    protected addComponent(component: FormComponent): void {
        this.components.push(component);
    }
}

/**
 * Class representing an action form.
 */
class ActionForm extends Form {
    private _body: string;

    public button(label: string, callback?: () => Promise<void> | void, iconPath?: string): ActionForm {
        this.addComponent({ type: 'button', label, iconPath, callback });
        return this;
    }

    public body(body: string): ActionForm {
        this._body = body;
        return this;
    }

    public show(): void {
        const form = new ActionFormData().title(this.title);
        if (this._body) {
            form.body(this._body);
        }
        this.components.forEach(component => {
            FormComponentBuilder.createComponent(component, form);
        });
        system.run(async () => {
            const response = await form.show(this.player);
            if (!response.canceled && this.components[response.selection]?.callback) {
                await Promise.resolve(this.components[response.selection].callback!(response.selection));
            }
        })
    }
}

/**
 * Class representing a modal form.
 */
class ModalForm extends Form {
    public textField(textfieldType: 'string' | 'number', label: string, placeholder: string, defaultValue: string, callback?: (updatedValue: string | number) => void): ModalForm {
        this.addComponent({ type: 'textField', label, placeholder, defaultValue, callback, textfieldType });
        return this;
    }

    public dropdown(label: string, options: string[], defaultValue: number, callback?: (updatedValue: number) => void): ModalForm {
        this.addComponent({ type: 'dropdown', label, options, defaultValue, callback });
        return this;
    }

    public slider(label: string, min: number, max: number, step: number, defaultValue: number, callback?: (updatedValue: number) => void): ModalForm {
        this.addComponent({ type: 'slider', label, min, max, step, defaultValue, callback });
        return this;
    }

    public toggle(label: string, defaultValue: boolean, callback?: (updatedValue: boolean) => void): ModalForm {
        this.addComponent({ type: 'toggle', label, defaultValue, callback });
        return this;
    }

    public show(onSubmit: (values: (string | number | boolean)[]) => void = () => {}): void {
        const form = new ModalFormData().title(this.title);
        this.components.forEach(component => {
            FormComponentBuilder.createComponent(component, form);
        });
        system.run(async () => {
            const response = await form.show(this.player);
            if (!response.canceled && onSubmit) {
                try {
                    const validatedValues = this.components.map((component, index) => {
                        const value = response.formValues[index];
                        return component.type === 'textField'
                            ? this.validateTextField(component.textfieldType!, value as string)
                            : value;
                    });
    
                    this.components.forEach((component, index) => {
                        if (component.callback) {
                            component.callback(validatedValues[index]);
                        }
                    });
                    onSubmit(validatedValues);
                } catch (error) {
                    console.error('Error in form validation: ', error);
                    this.player.sendMessage(`§c${error.message}`);
                    this.player.playSound('item.shield.block');
                }
            }
        });
    }

    private validateTextField(valueType: 'string' | 'number', value: any): string | number | boolean {
        switch (valueType) {
            case 'number':
                const numberValue = Number(value);
                if (isNaN(numberValue)) {
                    throw new Error(`Invalid number value: ${value}`);
                }
                return numberValue;
            case 'string':
                if (/^\d+$/.test(value) || value === '') {
                    throw new Error(`Invalid string value: ${value}`);
                }
                return value;
            default:
                throw new Error(`Unknown value type: ${valueType}`);
        }
    }
}

export { ActionForm, ModalForm, FormComponentBuilder };
