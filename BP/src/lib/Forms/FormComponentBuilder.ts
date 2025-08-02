import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { FormComponent } from "types";

export default class FormComponentBuilder {
    /**
     * Creates a component on the form
     * @param component The component to create
     * @param form The form to add the component to
     */
    static createComponent(component: FormComponent, form: ActionFormData | ModalFormData): void {
        switch (component.type) {
            case 'button':
                (form as ActionFormData).button(component.label!, component.iconPath);
                break;
            case 'textField':
                const defaultTextFieldValue = component.defaultValue as string;
                (form as ModalFormData).textField(component.label!, component.placeholder!, defaultTextFieldValue);
                break;
            case 'dropdown':
                const defaultValueIndex = component.defaultValue as number;
                (form as ModalFormData).dropdown(component.label!, component.options!, defaultValueIndex);
                break;
            case 'slider':
                const defaultSliderValue = component.defaultValue as number;
                const step = component.step!;
                (form as ModalFormData).slider(component.label!, component.min!, component.max!, step, defaultSliderValue);
                break;
            case 'toggle':
                const defaultToggleValue = component.defaultValue as boolean;
                (form as ModalFormData).toggle(component.label!, defaultToggleValue);
                break;
            case 'submitButton':
                (form as ModalFormData).submitButton(component.label!);
                break;

            /*
            | ------------------
            | Minecraft Preview
            | ------------------
            */
            // case 'divider':
            //     if (form instanceof ActionFormData) {
            //         form.divider();
            //     } else {
            //         (form as ModalFormData).divider();
            //     }
            //     break;
            // case 'header':
            //     if (form instanceof ActionFormData) {
            //         form.header(component.label!);
            //     } else {
            //         (form as ModalFormData).header(component.label!);
            //     }
            //     break;
            // case 'label':
            //     if (form instanceof ActionFormData) {
            //         form.label(component.label!);
            //     } else {
            //         (form as ModalFormData).label(component.label!);
            //     }
            //     break;
            default:
                throw new Error(`Unknown form component type: ${component.type}`);
        }
    }
}
