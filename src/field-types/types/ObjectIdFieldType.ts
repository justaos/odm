import DataType from "../../core/data-types/dataType.interface";
import FieldType from "../FieldType.interface";
import ObjectIdDataType from "../../core/data-types/types/objectIdDataType";
import {ObjectId} from "mongodb";
import Schema from "../../collection/Schema";

export default class ObjectIdFieldType implements FieldType {

    #dataType: DataType = new ObjectIdDataType();

    getDataType(): DataType {
        return this.#dataType;
    }

    getType(): string {
        return "objectId"
    }

    async validateValue(fieldDefinition: any, value: any) {
        if (fieldDefinition.required && value === null)
            throw new Error("REQUIRED");
    }

    validateDefinition(fieldDefinition: any): boolean {
        return !!fieldDefinition.name
    }

    async getDisplayValue(schema: any, fieldDefinition: any, value: any) {
        return this.#dataType.toJSON(value);
    }

    getValueIntercept(schema: Schema, fieldDefinition: any, value: any): any {
        return value;
    }

    setValueIntercept(schema: Schema, fieldDefinition: any, value: any): any {
        if (typeof value === "string" && ObjectId.isValid(value))
            return new ObjectId(value);
        return value;
    }
}
