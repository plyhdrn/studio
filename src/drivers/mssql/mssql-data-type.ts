import { ColumnTypeSelector } from "../base-driver";

// SQL Server data types
// https://docs.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql
export const MSSQL_DATA_TYPE_SUGGESTION: ColumnTypeSelector = {
  type: "text",
  idTypeName: "INT",
  textTypeName: "NVARCHAR(255)",
  typeSuggestions: [
    {
      name: "Integer",
      suggestions: [
        {
          name: "int",
          description: "4-byte integer data from -2^31 (-2,147,483,648) to 2^31-1 (2,147,483,647)",
        },
        {
          name: "bigint",
          description: "8-byte integer data from -2^63 (-9,223,372,036,854,775,808) to 2^63-1 (9,223,372,036,854,775,807)",
        },
        {
          name: "smallint",
          description: "2-byte integer data from -2^15 (-32,768) to 2^15-1 (32,767)",
        },
        {
          name: "tinyint",
          description: "1-byte integer data from 0 to 255",
        },
        {
          name: "bit",
          description: "Integer data with either a 1 or 0 value",
        },
      ],
    },
    {
      name: "Decimal",
      suggestions: [
        {
          name: "decimal",
          parameters: [
            {
              name: "precision",
              description: "Total number of digits",
              default: "18",
            },
            {
              name: "scale",
              description: "Number of digits after the decimal point",
              default: "2",
            },
          ],
          description: decimalDescription,
        },
        {
          name: "numeric",
          parameters: [
            {
              name: "precision",
              description: "Total number of digits",
              default: "18",
            },
            {
              name: "scale",
              description: "Number of digits after the decimal point",
              default: "2",
            },
          ],
          description: "Functionally equivalent to decimal",
        },
        {
          name: "money",
          description: "Monetary data values from -2^63 (-922,337,203,685,477.5808) to 2^63-1 (+922,337,203,685,477.5807)",
        },
        {
          name: "smallmoney",
          description: "Monetary data values from -214,748.3648 to +214,748.3647",
        },
        {
          name: "float",
          parameters: [
            {
              name: "n",
              description: "Number of bits used to store the mantissa",
              default: "53",
            },
          ],
          description: "Approximate-number data type for use with floating point numeric data",
        },
        {
          name: "real",
          description: "Approximate-number data type for use with floating point numeric data",
        },
      ],
    },
    {
      name: "Text",
      suggestions: [
        {
          name: "char",
          parameters: [{ name: "n", default: "1" }],
          description: "Fixed-size string data",
        },
        {
          name: "varchar",
          parameters: [{ name: "n", default: "255" }],
          description: "Variable-size string data",
        },
        {
          name: "nchar",
          parameters: [{ name: "n", default: "1" }],
          description: "Fixed-size Unicode string data",
        },
        {
          name: "nvarchar",
          parameters: [{ name: "n", default: "255" }],
          description: "Variable-size Unicode string data",
        },
        {
          name: "text",
          description: "Variable-length non-Unicode data with a maximum length of 2^31-1 (2,147,483,647) characters",
        },
        {
          name: "ntext",
          description: "Variable-length Unicode data with a maximum length of 2^30 - 1 (1,073,741,823) characters",
        },
      ],
    },
    {
      name: "Binary",
      suggestions: [
        {
          name: "binary",
          parameters: [{ name: "n", default: "1" }],
          description: "Fixed-length binary data with a length of n bytes",
        },
        {
          name: "varbinary",
          parameters: [{ name: "n", default: "255" }],
          description: "Variable-length binary data",
        },
        {
          name: "image",
          description: "Variable-length binary data from 0 through 2^31-1 (2,147,483,647) bytes",
        },
      ],
    },
    {
      name: "Date/Time",
      suggestions: [
        {
          name: "date",
          description: "Date from January 1, 0001 through December 31, 9999",
        },
        {
          name: "time",
          parameters: [{ name: "fractional_seconds_precision", default: "7" }],
          description: "Time of day based on a 24-hour clock",
        },
        {
          name: "datetime",
          description: "Date and time from January 1, 1753 through December 31, 9999",
        },
        {
          name: "datetime2",
          parameters: [{ name: "fractional_seconds_precision", default: "7" }],
          description: "Date and time with larger date range and default fractional precision",
        },
        {
          name: "smalldatetime",
          description: "Date and time from January 1, 1900 through June 6, 2079",
        },
        {
          name: "datetimeoffset",
          parameters: [{ name: "fractional_seconds_precision", default: "7" }],
          description: "Date and time with time zone awareness",
        },
        {
          name: "timestamp",
          description: "Automatically generated binary numbers, which are guaranteed to be unique within a database",
        },
      ],
    },
    {
      name: "Other",
      suggestions: [
        {
          name: "uniqueidentifier",
          description: "A 16-byte GUID",
        },
        {
          name: "sql_variant",
          description: "Stores values of various SQL Server-supported data types",
        },
        {
          name: "xml",
          description: "Stores XML data",
        },
        {
          name: "geography",
          description: "Spatial data type for storing ellipsoidal (round-earth) data",
        },
        {
          name: "geometry",
          description: "Spatial data type for storing planar (flat-earth) data",
        },
      ],
    },
  ],
};

export const MSSQL_COLLATION_LIST = [
  "SQL_Latin1_General_CP1_CI_AS",
  "SQL_Latin1_General_CP1_CS_AS",
  "SQL_Latin1_General_CP1_CI_AI",
  "SQL_Latin1_General_CP1_CS_AI",
  "Latin1_General_CI_AS",
  "Latin1_General_CS_AS",
  "Latin1_General_CI_AI",
  "Latin1_General_CS_AI",
  "SQL_Latin1_General_CP1250_CI_AS",
  "SQL_Latin1_General_CP1251_CI_AS",
  "SQL_Latin1_General_CP1253_CI_AS",
  "SQL_Latin1_General_CP1254_CI_AS",
  "SQL_Latin1_General_CP1255_CI_AS",
  "SQL_Latin1_General_CP1256_CI_AS",
  "SQL_Latin1_General_CP1257_CI_AS",
  "SQL_Latin1_General_CP874_CI_AS",
  "Chinese_PRC_CI_AS",
  "Chinese_Taiwan_Stroke_CI_AS",
  "Japanese_CI_AS",
  "Korean_Wansung_CI_AS",
];

function decimalDescription(_: string, parameters?: string[]) {
  const precision = Number(parameters?.[0]);
  const scale = Number(parameters?.[1] ?? 0);

  if (
    Number.isFinite(precision) &&
    Number.isFinite(scale) &&
    Number.isInteger(precision) &&
    Number.isInteger(scale) &&
    precision > 0 &&
    precision <= 38 &&
    scale <= precision
  ) {
    const exampleNumber = "12345678901234567890123456789012345678".substring(0, precision);
    const exampleBeforeDot = exampleNumber.substring(0, precision - scale);
    const exampleAfterDot = exampleNumber.substring(precision - scale);

    return `<div>
    <div class="mb-2">Fixed-precision number</div>
    <div class='inline-block'>
      <div class="text-sm">Precision (${precision})</div>
      <div class="inline-block border-t-4 border-t-primary font-mono text-lg">
        <span>${exampleBeforeDot}</span><strong>.</strong><span class="inline-block border-b-4 border-b-primary">${exampleAfterDot}</span>
      </div>
      <div class="text-sm text-right">Scale (${scale})</div>
    </div>
  </div>`;
  }

  return `<div>Fixed-precision number (precision: ${precision || "18"}, scale: ${scale || "2"})</div>`;
}