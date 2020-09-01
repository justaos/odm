import FieldType from "../field-types/FieldType.interface";
import Schema from "./Schema";

export default class Field {

    #schema: Schema;

    #fieldDefinition: any;

    #fieldType: FieldType | undefined;

    constructor(schema: Schema, fieldDefinition: any, fieldType?: FieldType) {
        this.#fieldDefinition = fieldDefinition;
        this.#fieldType = fieldType;
        this.#schema = schema;
    }

    getName(): string {
        return this.#fieldDefinition.name;
    }

    getDefinition(): any {
        return this.#fieldDefinition;
    }

    getType(): string {
        return this.#fieldDefinition.type;
    }

    getFieldType(): FieldType {
        if (!this.#fieldType)
            throw new Error("Field type not found");
        return this.#fieldType;
    }

    validate() {
        if (!this.#fieldDefinition || !this.getType())
            throw new Error(`field type not provided`);
        if (!this.#fieldType)
            throw new Error(`[Field :: ${this.getName()}] [Type :: ${this.getType()}] No such field type`);
        if (!this.#fieldType.validateDefinition(this.#fieldDefinition))
            throw new Error(`[Field :: ${this.getName()}] [Type :: ${this.getType()}] Invalid field definition`);
    }

    async validateValue(recordObject: any, context: any) {
        if (!this.#fieldType?.getDataType().validateType(recordObject[this.getName()]))
            throw new Error(`${this.getName()} should be a ${this.getType()}`);

        try {
            await this.#fieldType?.validateValue(this.#schema, this, recordObject, context);
        } catch (e) {
            if (e.message === 'REQUIRED')
                throw new Error(`"${this.getName()}" is required field`);
            else
                throw new Error(`[field :: ${this.getName()} - value :: ${recordObject[this.getName()]}] ${e.message}`);
        }

    }

}