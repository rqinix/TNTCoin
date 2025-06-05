import { RawMessage } from '@minecraft/server';

/**
 * Interface for form component types
 */
export interface FormComponent {
    type: 'button' | 'textField' | 'dropdown' | 'slider' | 'toggle' | 'submitButton' | 'divider' | 'header' | 'label';
    label?: string | RawMessage;
    iconPath?: string;
    placeholder?: string | RawMessage;
    defaultValue?: string | number | boolean;
    options?: string[] | RawMessage[];
    min?: number;
    max?: number;
    step?: number;
    callback?: (value: any) => Promise<void> | void;
    textfieldType?: 'string' | 'number';
}
