import { CommonUtils } from "../../deps.ts";
import Registry from "../core/Registry.ts";
import ColumnSchema from "./ColumnSchema.ts";
import DataType from "../data-types/DataType.ts";
import {
  TableDefinition,
  TableDefinitionRaw
} from "./definitions/TableDefinition.ts";
import { ColumnDefinition } from "./definitions/ColumnDefinition.ts";
import TableDefinitionError from "../errors/TableDefinitionError.ts";

export default class TableSchema {
  readonly #definition: TableDefinition;

  readonly #fieldTypeRegistry: Registry<DataType>;

  readonly #tableDefinitionRegistry: Registry<TableDefinition>;

  constructor(
    tableDefinition: TableDefinitionRaw,
    fieldTypeRegistry: Registry<DataType>,
    tableDefinitionRegistry: Registry<TableDefinition>
  ) {
    this.#fieldTypeRegistry = fieldTypeRegistry;
    this.#tableDefinitionRegistry = tableDefinitionRegistry;
    this.#definition = TableSchema.setDefaults(tableDefinition);
  }

  static setDefaults(tableDefinition: TableDefinitionRaw): TableDefinition {
    tableDefinition = {
      final: false,
      columns: [],
      schema: "public",
      ...tableDefinition
    };

    if (tableDefinition.columns) {
      for (let i = 0; i < tableDefinition.columns.length; i++) {
        tableDefinition.columns[i] = ColumnSchema.setDefaults(
          tableDefinition.columns[i]
        );
      }
    }

    return <TableDefinition>tableDefinition;
  }

  getName(): string {
    return this.#definition.name;
  }

  getSchemaName(): string {
    return this.#definition.schema;
  }

  getFullName(): string {
    return `${this.getSchemaName()}.${this.getName()}`;
  }

  getInherits(): string | undefined {
    if (this.#definition.inherits)
      return TableSchema.getSchemaAndTableName(this.#definition.inherits);
  }

  static getSchemaAndTableName(fullName: string): string {
    const parts = fullName.split(".");
    let schemaName = "public";
    let tableName = fullName;
    if (parts.length == 2) {
      schemaName = parts[0];
      tableName = parts[1];
    }
    return `${schemaName}.${tableName}`;
  }

  isFinal(): boolean {
    if (this.#definition.final === undefined) return false;
    return this.#definition.final;
  }

  getDefinition(): TableDefinition {
    return {
      ...this.#definition,
      columns: this.#definition.columns?.map((column: ColumnDefinition) => {
        return {
          ...column
        };
      })
    };
  }

  getExtendedTables(): string[] {
    let extendedTables = [this.getName()];
    const extendsTableName = this.getInherits();
    if (extendsTableName) {
      extendedTables = extendedTables.concat(
        this.#getTableSchema(extendsTableName).getExtendedTables()
      );
    }
    return extendedTables;
  }

  getBaseName(): string {
    let hostName = this.getName();
    const extendsTableName = this.getInherits();
    if (extendsTableName) {
      const extendedSchema = this.#getTableSchema(extendsTableName);
      hostName = extendedSchema.getBaseName();
    }
    return hostName;
  }

  getDataType(name: string): DataType | undefined {
    return this.#fieldTypeRegistry.get(name);
  }

  getOwnColumnSchemas(): ColumnSchema[] {
    const columns: ColumnSchema[] = [];
    const extendsTableName = this.getInherits();
    if (!extendsTableName) {
      columns.push(
        new ColumnSchema(this, {
          name: "id",
          type: "string",
          not_null: true,
          unique: true
        }),
        new ColumnSchema(this, {
          name: "_table",
          type: "string",
          not_null: true,
          unique: false
        })
      );
    }
    columns.push(
      ...this.#definition.columns.map((column: ColumnDefinition) => {
        return new ColumnSchema(this, column);
      })
    );
    return columns;
  }

  getAllColumnSchemas(): ColumnSchema[] {
    const allFields: ColumnSchema[] = this.getOwnColumnSchemas();

    const extendsTableName = this.getInherits();
    if (
      extendsTableName &&
      this.#tableDefinitionRegistry.has(extendsTableName)
    ) {
      const extendedSchema = this.#getTableSchema(extendsTableName);
      allFields.push(...extendedSchema.getAllColumnSchemas());
    }
    return allFields;
  }

  getColumnSchema(name: string): ColumnSchema | undefined {
    return this.getAllColumnSchemas().find((field) => field.getName() === name);
  }

  validate() {
    let errorMessages: string[] = [];

    /*
     * Validate table name
     */
    if (!this.getName() || typeof this.getName() !== "string") {
      errorMessages.push(`Invalid table name provided`);
    } else if (!/^[a-z0-9_]+$/i.test(this.getName())) {
      errorMessages.push(`Table name should be alphanumeric`);
    } else if (this.#tableDefinitionRegistry.has(this.getName())) {
      errorMessages.push(`Table name already exists`);
    }

    /*
     * Validate extends
     */
    const extendsTableName = this.getInherits();
    if (typeof extendsTableName === "string") {
      if (!this.#tableDefinitionRegistry.has(extendsTableName)) {
        errorMessages.push(
          `${this.getName()} cannot extend '${extendsTableName}'. '${this.getInherits()}' does not exists.`
        );
      } else {
        const extendsCol: TableSchema = this.#getTableSchema(extendsTableName);
        if (extendsCol.isFinal()) {
          errorMessages.push(
            `${this.getName()} cannot extend '${extendsTableName}'. '${this.getInherits()}' is final table schema.`
          );
        }
      }
    }

    /*
     * Validate columns
     */
    const columnSchemas = this.getOwnColumnSchemas();
    for (const columnSchema of columnSchemas) {
      errorMessages = errorMessages.concat(columnSchema.validate());
    }

    const allColumnNames: string[] = this.getAllColumnSchemas().map((f) =>
      f.getName()
    );
    const duplicates = CommonUtils.findDuplicates(allColumnNames);
    if (duplicates.length) {
      errorMessages.push(`Duplicate fields -> ${duplicates.join(",")}`);
    }

    if (errorMessages.length) {
      throw new TableDefinitionError(this.#definition, errorMessages);
    }
  }

  #getTableSchema(fullName: string): TableSchema {
    const schema = this.#tableDefinitionRegistry.get(fullName);
    if (!schema)
      throw Error(`[Schema::_getSchema] Schema not found :: ${fullName}`);
    return new TableSchema(
      schema,
      this.#fieldTypeRegistry,
      this.#tableDefinitionRegistry
    );
  }
}