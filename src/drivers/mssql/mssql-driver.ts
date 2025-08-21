import { ColumnType } from "@outerbase/sdk-transform";
import {
  ColumnTypeSelector,
  DatabaseResultSet,
  DatabaseSchemaItem,
  DatabaseSchemas,
  DatabaseTableColumn,
  DatabaseTableColumnConstraint,
  DatabaseTableSchema,
  DatabaseTableSchemaChange,
  DatabaseTriggerSchema,
  DatabaseViewSchema,
  DriverFlags,
  QueryableBaseDriver,
} from "../base-driver";
import CommonSQLImplement from "../common-sql-imp";
import { escapeSqlValue } from "../sqlite/sql-helper";
import { generateMSSQLSchemaChange } from "./generate-schema";
import {
  MSSQL_COLLATION_LIST,
  MSSQL_DATA_TYPE_SUGGESTION,
} from "./mssql-data-type";

interface MSSQLSchemaRow {
  schema_name: string;
}

interface MSSQLTableRow {
  table_catalog: string;
  table_schema: string;
  table_name: string;
  table_type: string;
}

interface MSSQLColumnRow {
  table_catalog: string;
  table_schema: string;
  table_name: string;
  column_name: string;
  ordinal_position: number;
  column_default: string | null;
  is_nullable: "YES" | "NO";
  data_type: string;
  character_maximum_length: number;
  numeric_precision: number;
  numeric_scale: number;
  datetime_precision: number;
  character_set_name: string;
  collation_name: string;
  is_identity: "YES" | "NO";
}

interface MSSQLConstraintRow {
  constraint_name: string;
  table_schema: string;
  table_name: string;
  constraint_type: string;
  column_name: string;
  reference_table_schema: string;
  reference_table_name: string;
  reference_column_name: string;
}

export default class MSSQLDriver extends CommonSQLImplement {
  constructor(protected _db: QueryableBaseDriver) {
    super();
  }

  query(stmt: string): Promise<DatabaseResultSet> {
    return this._db.query(stmt);
  }

  transaction(stmts: string[]): Promise<DatabaseResultSet[]> {
    return this._db.transaction(stmts);
  }

  batch(stmts: string[]): Promise<DatabaseResultSet[]> {
    return this._db.batch ? this._db.batch(stmts) : super.batch(stmts);
  }

  close(): void {
    // Do nothing
  }

  columnTypeSelector: ColumnTypeSelector = MSSQL_DATA_TYPE_SUGGESTION;

  escapeId(id: string) {
    return `[${id.replace(/]/g, "]]")}]`;
  }

  escapeValue(value: unknown): string {
    return escapeSqlValue(value);
  }

  getFlags(): DriverFlags {
    return {
      defaultSchema: "dbo",
      dialect: "mssql",
      optionalSchema: false,
      supportRowId: false,
      supportBigInt: true,
      supportModifyColumn: true,
      supportCreateUpdateTable: true,
      supportCreateUpdateDatabase: false,
      supportInsertReturning: true,
      supportUpdateReturning: true,
      supportCreateUpdateTrigger: true,
      supportUseStatement: true,
    };
  }

  getCollationList(): string[] {
    return MSSQL_COLLATION_LIST;
  }

  async getCurrentSchema(): Promise<string | null> {
    const result = (await this.query("SELECT SCHEMA_NAME() AS current_schema")) as unknown as {
      rows: { current_schema?: string | null }[];
    };

    return result.rows[0].current_schema || "dbo";
  }

  async schemas(): Promise<DatabaseSchemas> {
    const schemaSql = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('sys', 'INFORMATION_SCHEMA', 'guest', 'db_owner', 'db_accessadmin', 'db_securityadmin', 'db_ddladmin', 'db_backupoperator', 'db_datareader', 'db_datawriter', 'db_denydatareader', 'db_denydatawriter')
    `;
    
    const tableSql = `
      SELECT 
        table_catalog,
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('sys', 'INFORMATION_SCHEMA')
    `;
    
    const columnSql = `
      SELECT 
        c.table_catalog,
        c.table_schema,
        c.table_name,
        c.column_name,
        c.ordinal_position,
        c.column_default,
        c.is_nullable,
        c.data_type,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.datetime_precision,
        c.character_set_name,
        c.collation_name,
        CASE WHEN ic.is_identity = 1 THEN 'YES' ELSE 'NO' END as is_identity
      FROM information_schema.columns c
      LEFT JOIN sys.identity_columns ic ON ic.object_id = OBJECT_ID(c.table_schema + '.' + c.table_name) 
        AND ic.name = c.column_name
      WHERE c.table_schema NOT IN ('sys', 'INFORMATION_SCHEMA')
    `;
    
    const constraintSql = `
      SELECT 
        tc.constraint_name,
        tc.table_schema,
        tc.table_name,
        tc.constraint_type,
        kcu.column_name,
        ISNULL(fk.referenced_table_schema, '') AS reference_table_schema,
        ISNULL(fk.referenced_table_name, '') AS reference_table_name,
        ISNULL(fk.referenced_column_name, '') AS reference_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name 
        AND tc.table_schema = kcu.table_schema
        AND tc.table_name = kcu.table_name
      LEFT JOIN (
        SELECT 
          rc.constraint_name,
          kcu2.table_schema AS referenced_table_schema,
          kcu2.table_name AS referenced_table_name,
          kcu2.column_name AS referenced_column_name
        FROM information_schema.referential_constraints rc
        JOIN information_schema.key_column_usage kcu2 
          ON rc.unique_constraint_name = kcu2.constraint_name
      ) fk ON tc.constraint_name = fk.constraint_name
      WHERE tc.table_schema NOT IN ('sys', 'INFORMATION_SCHEMA')
    `;

    const result = await this.batch([
      schemaSql,
      tableSql,
      columnSql,
      constraintSql,
    ]);

    const schemaResult = result[0].rows as unknown as MSSQLSchemaRow[];
    const tableResult = result[1].rows as unknown as MSSQLTableRow[];
    const columnsResult = result[2].rows as unknown as MSSQLColumnRow[];
    const constraintResult = result[3].rows as unknown as MSSQLConstraintRow[];

    const schemas: DatabaseSchemas = {};

    for (const schema of schemaResult) {
      schemas[schema.schema_name] = [];
    }

    const tableRecord: Record<string, DatabaseSchemaItem> = {};
    for (const table of tableResult) {
      const key = table.table_schema + "." + table.table_name;

      const tableItem: DatabaseSchemaItem = {
        name: table.table_name,
        schemaName: table.table_schema,
        type: table.table_type === "BASE TABLE" ? "table" : "view",
        tableName: table.table_name,
        tableSchema: {
          columns: [],
          constraints: [],
          pk: [],
          autoIncrement: false,
          schemaName: table.table_schema,
          tableName: table.table_name,
        },
      };

      tableRecord[key] = tableItem;

      if (schemas[table.table_schema]) {
        schemas[table.table_schema].push(tableItem);
      }
    }

    // Add columns to table schema
    const columnRecord: Record<string, DatabaseTableColumn> = {};
    for (const column of columnsResult) {
      const key =
        column.table_schema +
        "." +
        column.table_name +
        "." +
        column.column_name;

      const columnItem: DatabaseTableColumn = {
        name: column.column_name,
        type: column.data_type,
        constraint: {
          notNull: column.is_nullable === "NO",
          defaultValue: column.column_default,
          autoIncrement: column.is_identity === "YES",
        },
      };

      columnRecord[key] = columnItem;

      const tableKey = column.table_schema + "." + column.table_name;
      const tableSchema = tableRecord[tableKey]?.tableSchema;
      if (tableSchema) {
        tableSchema.columns.push(columnItem);
        if (column.is_identity === "YES") {
          tableSchema.autoIncrement = true;
        }
      }
    }

    // Add constraints to table schema
    const constraintRecord: Record<string, DatabaseTableColumnConstraint> = {};

    for (const constraint of constraintResult.filter(c => c.column_name)) {
      const tableKey = constraint.table_schema + "." + constraint.table_name;
      const constraintKey = tableKey + "." + constraint.constraint_name;

      const constraintItem = constraintRecord[constraintKey] || {
        name: constraint.constraint_name,
        primaryKey: false,
        notNull: false,
        unique: false,
        checkExpression: "",
        defaultValue: null,
      };

      if (constraint.constraint_type === "PRIMARY KEY") {
        constraintItem.primaryKey = true;
        constraintItem.primaryColumns = [
          ...(constraintItem?.primaryColumns ?? []),
          constraint.column_name,
        ];
      } else if (constraint.constraint_type === "FOREIGN KEY") {
        constraintItem.foreignKey = {
          foreignSchemaName: constraint.reference_table_schema,
          foreignTableName: constraint.reference_table_name,
          foreignColumns: [
            ...(constraintItem?.foreignKey?.foreignColumns ?? []),
            constraint.reference_column_name,
          ],
          columns: [constraint.column_name],
        };
      } else if (constraint.constraint_type === "UNIQUE") {
        constraintItem.unique = true;
        constraintItem.uniqueColumns = [constraint.column_name];
      }

      constraintRecord[constraintKey] = constraintItem;
      const tableSchema = tableRecord[tableKey]?.tableSchema;
      if (tableSchema) {
        if (!tableSchema.constraints) {
          tableSchema.constraints = [];
        }
        const existingConstraintIndex = tableSchema.constraints.findIndex(
          c => c.name === constraintItem.name
        );
        if (existingConstraintIndex >= 0) {
          tableSchema.constraints[existingConstraintIndex] = constraintItem;
        } else {
          tableSchema.constraints.push(constraintItem);
        }
      }
    }

    // Building PK
    for (const tableKey in tableRecord) {
      const table = tableRecord[tableKey];
      if (table.tableSchema?.constraints) {
        const pk = table.tableSchema.constraints.find(
          (c) => c.primaryKey
        ) as DatabaseTableColumnConstraint;
        if (pk) {
          table.tableSchema.pk = pk.primaryColumns ?? [];
        }
      }
    }

    return schemas;
  }

  async tableSchema(
    schemaName: string,
    tableName: string
  ): Promise<DatabaseTableSchema> {
    const columnsResult = (
      await this.query(`
        SELECT 
          c.table_catalog,
          c.table_schema,
          c.table_name,
          c.column_name,
          c.ordinal_position,
          c.column_default,
          c.is_nullable,
          c.data_type,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale,
          c.datetime_precision,
          c.character_set_name,
          c.collation_name,
          CASE WHEN ic.is_identity = 1 THEN 'YES' ELSE 'NO' END as is_identity
        FROM information_schema.columns c
        LEFT JOIN sys.identity_columns ic ON ic.object_id = OBJECT_ID(c.table_schema + '.' + c.table_name) 
          AND ic.name = c.column_name
        WHERE c.table_schema = ${this.escapeValue(schemaName)} 
          AND c.table_name = ${this.escapeValue(tableName)}
        ORDER BY c.ordinal_position
      `)
    ).rows as unknown as MSSQLColumnRow[];

    const constraintResult = (
      await this.query(`
        SELECT 
          tc.constraint_name,
          tc.table_schema,
          tc.table_name,
          tc.constraint_type,
          kcu.column_name,
          ISNULL(fk.referenced_table_schema, '') AS reference_table_schema,
          ISNULL(fk.referenced_table_name, '') AS reference_table_name,
          ISNULL(fk.referenced_column_name, '') AS reference_column_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name 
          AND tc.table_schema = kcu.table_schema
          AND tc.table_name = kcu.table_name
        LEFT JOIN (
          SELECT 
            rc.constraint_name,
            kcu2.table_schema AS referenced_table_schema,
            kcu2.table_name AS referenced_table_name,
            kcu2.column_name AS referenced_column_name
          FROM information_schema.referential_constraints rc
          JOIN information_schema.key_column_usage kcu2 
            ON rc.unique_constraint_name = kcu2.constraint_name
        ) fk ON tc.constraint_name = fk.constraint_name
        WHERE tc.table_schema = ${this.escapeValue(schemaName)} 
          AND tc.table_name = ${this.escapeValue(tableName)}
          AND kcu.column_name IS NOT NULL
      `)
    ).rows as unknown as MSSQLConstraintRow[];

    const constraintRecord: Record<string, DatabaseTableColumnConstraint> = {};
    for (const constraint of constraintResult) {
      const key = constraint.constraint_name;
      const constraintItem = constraintRecord[key] || {
        name: constraint.constraint_name,
        primaryKey: false,
        notNull: false,
        unique: false,
        checkExpression: "",
        defaultValue: null,
      };

      if (constraint.constraint_type === "PRIMARY KEY") {
        constraintItem.primaryKey = true;
        constraintItem.primaryColumns = [
          ...(constraintItem?.primaryColumns ?? []),
          constraint.column_name,
        ];
      } else if (constraint.constraint_type === "FOREIGN KEY") {
        constraintItem.foreignKey = {
          foreignSchemaName: constraint.reference_table_schema,
          foreignTableName: constraint.reference_table_name,
          foreignColumns: [
            ...(constraintItem?.foreignKey?.foreignColumns ?? []),
            constraint.reference_column_name,
          ],
          columns: [constraint.column_name],
        };
      } else if (constraint.constraint_type === "UNIQUE") {
        constraintItem.unique = true;
        constraintItem.uniqueColumns = [constraint.column_name];
      }

      constraintRecord[key] = constraintItem;
    }

    const pkColumn =
      Object.values(constraintRecord).find((c) => c.primaryKey)
        ?.primaryColumns ?? [];

    const tableSchema: DatabaseTableSchema = {
      columns: columnsResult.map((column) => ({
        name: column.column_name,
        type: column.data_type,
        constraint: {
          notNull: column.is_nullable === "NO",
          defaultValue: column.column_default,
          primaryKey: pkColumn.includes(column.column_name),
          autoIncrement: column.is_identity === "YES",
        },
      })),
      constraints: Object.values(constraintRecord),
      pk: pkColumn,
      autoIncrement: columnsResult.some(c => c.is_identity === "YES"),
      schemaName,
      tableName,
    };

    return tableSchema;
  }

  trigger(): Promise<DatabaseTriggerSchema> {
    throw new Error("MSSQL trigger support not implemented yet");
  }

  createUpdateTableSchema(change: DatabaseTableSchemaChange): string[] {
    return generateMSSQLSchemaChange(this, change);
  }

  createUpdateDatabaseSchema(): string[] {
    throw new Error("Database schema updates not supported for MSSQL");
  }

  createTrigger(): string {
    throw new Error("MSSQL trigger creation not implemented yet");
  }

  dropTrigger(): string {
    throw new Error("MSSQL trigger dropping not implemented yet");
  }

  async view(schemaName: string, name: string): Promise<DatabaseViewSchema> {
    const sql = `
      SELECT view_definition 
      FROM information_schema.views 
      WHERE table_schema = ${this.escapeValue(schemaName)} 
        AND table_name = ${this.escapeValue(name)}
    `;
    const result = await this.query(sql);

    const viewRow = result.rows[0] as { view_definition: string } | undefined;
    if (!viewRow) throw new Error("View does not exist");

    const statement = viewRow.view_definition.trim();

    return {
      schemaName,
      name,
      statement,
    };
  }

  createView(view: DatabaseViewSchema): string {
    return `CREATE VIEW ${this.escapeId(view.schemaName)}.${this.escapeId(view.name)} AS ${view.statement}`;
  }

  dropView(schemaName: string, name: string): string {
    return `DROP VIEW IF EXISTS ${this.escapeId(schemaName)}.${this.escapeId(name)}`;
  }

  inferTypeFromHeader(): ColumnType | undefined {
    return undefined;
  }
}