import { DatabaseConfiguration, DatabaseConnection } from "./core/connection/index.ts";
import Registry from "./core/Registry.ts";
import DataType from "./data-types/DataType.ts";

import StringDataType from "./data-types/types/StringDataType.ts";
import ODMConnection from "./ODMConnection.ts";
import { TableDefinition } from "./table/definitions/TableDefinition.ts";
import DatabaseOperationInterceptorService from "./operation-interceptor/DatabaseOperationInterceptorService.ts";
import IntegerDataType from "./data-types/types/IntegerDataType.ts";
import NumberDataType from "./data-types/types/NumberDataType.ts";
import JSONDataType from "./data-types/types/JSONDataType.ts";
import BooleanDataType from "./data-types/types/BooleanDataType.ts";
import DateDataType from "./data-types/types/DateDataType.ts";
import DateTimeDataType from "./data-types/types/DateTimeDataType.ts";
import { Logger } from "https://deno.land/x/justaos_utils@v1.6.0/packages/logger-utils/mod.ts";
import UUIDDataType from "./data-types/types/UUIDDataType.ts";
import DatabaseOperationInterceptor from "./operation-interceptor/DatabaseOperationInterceptor.ts";

/**
 * JUSTAOS's ODM (Object Document Mapper) is built for Deno and provides transparent persistence for JavaScript objects to Postgres database.
 * - Supports all primitive data types (string, integer, float, boolean, date, object, array, etc).
 * - Supports custom data types.
 * - Supports table with multi-level inheritance.
 * - Also supports interception on operations (create, read, update and delete).
 *
 * @example
 * Get connection to database
 * ```ts
 * import {ODM} from "https://deno.land/x/justaos_odm@$VERSION/mod.ts";
 * const odm = new ODM({
 *  hostname: "localhost",
 *  port: 5432,
 *  username: "postgres",
 *  password: "postgres"
 * });
 * odm.connect();
 * ```
 *
 * @param config Database configuration
 */
export default class ODM {
  readonly #logger = Logger.createLogger({ label: ODM.name });
  readonly #config: DatabaseConfiguration;
  readonly #dataTypeRegistry: Registry<DataType> = new Registry<DataType>(
    function (dataType) {
      return dataType.getName();
    }
  );
  readonly #tableDefinitionRegistry: Registry<TableDefinition> =
    new Registry<TableDefinition>(function (tableDefinition) {
      return `${tableDefinition.schema}.${tableDefinition.name}`;
    });
  readonly #schemaRegistry: Map<string, null> = new Map<string, null>();
  readonly #operationInterceptorService =
    new DatabaseOperationInterceptorService();

  constructor(config: DatabaseConfiguration) {
    this.#loadBuildInFieldTypes();
    this.#config = config;
  }

  async connect(createDatabaseIfNotExists?: boolean): Promise<ODMConnection> {
    try {
      const conn = new ODMConnection(
        this.#logger,
        this.#config,
        this.#dataTypeRegistry,
        this.#tableDefinitionRegistry,
        this.#schemaRegistry,
        this.#operationInterceptorService
      );
      await conn.connect();
      return conn;
    } catch (error) {
      if (
        error.name === "PostgresError" &&
        error.code === "3D000" &&
        this.#config.database &&
        createDatabaseIfNotExists
      ) {
        const tempConn = new DatabaseConnection({
          ...this.#config,
          database: "postgres"
        });
        await tempConn.connect();
        await tempConn.createDatabase(this.#config.database);
        await tempConn.closeConnection();
        return await this.connect(false);
      } else {
        throw error;
      }
    }
  }

  isTableDefined(tableName: string): boolean {
    return this.#tableDefinitionRegistry.has(tableName);
  }

  addDataType(dataType: DataType): void {
    this.#dataTypeRegistry.add(dataType);
  }

  addInterceptor(operationInterceptor: DatabaseOperationInterceptor): void {
    this.#operationInterceptorService.addInterceptor(operationInterceptor);
  }

  deleteInterceptor(operationInterceptorName: string): void {
    this.#operationInterceptorService.deleteInterceptor(
      operationInterceptorName
    );
  }

  #loadBuildInFieldTypes(): void {
    this.addDataType(new StringDataType());
    this.addDataType(new IntegerDataType());
    this.addDataType(new NumberDataType());
    this.addDataType(new JSONDataType());
    this.addDataType(new BooleanDataType());
    this.addDataType(new DateDataType());
    this.addDataType(new UUIDDataType());
    this.addDataType(new DateTimeDataType());
  }
}
