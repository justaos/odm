import DataType from "../../core/data-types/dataType.interface";
import FieldType from "../FieldType.interface";
import IntegerDataType from "../../core/data-types/types/integerDataType";
import Schema from "../../collection/Schema";

export default class IntegerFieldType implements FieldType {

    #dataType: DataType = new IntegerDataType();

    getDataType(): DataType {
        return this.#dataType;
    }

    getType(): string {
        return "integer"
    }

    async validateValue(fieldDefinition: any, value: any) {
        if (fieldDefinition.required && value === null)
            throw new Error("REQUIRED");
        else {
            if (Number.isInteger(fieldDefinition.maximum) && fieldDefinition.maximum < value)
                throw new Error(`should be less than ${fieldDefinition.maximum}`);
            if (Number.isInteger(fieldDefinition.minimum) && fieldDefinition.minimum > value)
                throw new Error(`should be more than ${fieldDefinition.minimum}`);
        }
    }

    validateDefinition(fieldDefinition: any): boolean {
        return !!fieldDefinition.name
    }

    async getDisplayValue(schema: Schema, fieldDefinition: any, value: any) {
        return value
    }

    getValueIntercept(schema: Schema, fieldDefinition: any, value: any): any {
        return value;
    }

    setValueIntercept(schema: Schema, fieldDefinition: any, value: any): any {
        return value;
    }
}
