import DataType from "../DataType.ts";
import TableSchema from "../../table/TableSchema.ts";
import { ColumnDefinition } from "../../table/definitions/ColumnDefinition.ts";
import { RawRecord } from "../../record/RawRecord.ts";
import { NATIVE_DATA_TYPES } from "../../core/NativeDataType.ts";

export default class IntegerDataType extends DataType {
  constructor() {
    super(NATIVE_DATA_TYPES.INTEGER);
  }

  getName(): string {
    return "integer";
  }

  validateDefinition(_definition: ColumnDefinition): boolean {
    return true;
  }

  setValueIntercept(
    _schema: TableSchema,
    _fieldName: string,
    value: any,
    _record: RawRecord
  ): any {
    if (typeof value === "string") {
      // @ts-ignore
      return value * 1;
    }
    return value;
  }

  async validateValue(
    _schema: TableSchema,
    _fieldName: string,
    _record: RawRecord
  ) {}
}
