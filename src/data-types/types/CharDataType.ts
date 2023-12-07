import DataType from "../DataType.ts";
import TableSchema from "../../table/TableSchema.ts";
import { RawRecord } from "../../record/RawRecord.ts";
import { NATIVE_DATA_TYPES } from "../../core/NativeDataType.ts";
import { ColumnDefinition } from "../../table/definitions/ColumnDefinition.ts";

export default class StringFieldType extends DataType {
  constructor() {
    super(NATIVE_DATA_TYPES.CHAR);
  }

  getName(): string {
    return "char";
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
    return value;
  }

  async validateValue(
    _schema: TableSchema,
    _fieldName: string,
    _record: RawRecord
  ) {}
}
