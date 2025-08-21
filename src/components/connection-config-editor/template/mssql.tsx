import { ConnectionTemplateList } from "@/app/(outerbase)/base-template";
import { CommonConnectionConfigTemplate } from "..";

const template: CommonConnectionConfigTemplate = [
  {
    columns: [
      {
        name: "host",
        label: "Server",
        type: "text",
        required: true,
        placeholder: "Hostname or IP address",
      },
      {
        name: "port",
        label: "Port",
        type: "text",
        required: true,
        placeholder: "1433",
        size: "max-w-[100px]",
      },
    ],
  },
  {
    columns: [
      {
        name: "username",
        label: "Username",
        type: "text",
        required: true,
        placeholder: "Database username",
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        required: true,
        placeholder: "Database password",
      },
    ],
  },
  {
    columns: [
      {
        name: "database",
        label: "Database",
        type: "text",
        required: true,
        placeholder: "Database name",
      },
    ],
  },
  {
    columns: [
      {
        name: "ssl",
        label: "Use SSL/TLS",
        type: "checkbox",
      },
      {
        name: "trustServerCertificate",
        label: "Trust Server Certificate",
        type: "checkbox",
      },
    ],
  },
];

export const MSSQLConnectionTemplate: ConnectionTemplateList = {
  template,
  localFrom: (value) => {
    // Parse MSSQL connection string if provided as host
    if (value.url && value.url.startsWith("mssql://")) {
      const url = new URL(value.url);
      return {
        name: value.name,
        host: url.hostname,
        port: url.port || "1433",
        username: decodeURIComponent(url.username || ""),
        password: decodeURIComponent(url.password || ""),
        database: url.pathname.substring(1) || "", // Remove leading slash
        ssl: url.searchParams.get("encrypt") === "true",
        trustServerCertificate: url.searchParams.get("trustServerCertificate") === "true",
      };
    }

    return {
      name: value.name,
      host: value.host || "",
      port: value.port?.toString() || "1433",
      username: value.username || "",
      password: value.password || "",
      database: value.database || "",
      ssl: value.ssl !== undefined ? value.ssl : true,
      trustServerCertificate: value.trust_server_certificate || false,
    };
  },
  localTo: (value) => {
    // Build MSSQL connection URL
    const protocol = "mssql://";
    const auth = `${encodeURIComponent(value.username)}:${encodeURIComponent(value.password)}`;
    const host = `${value.host}:${value.port || 1433}`;
    const database = value.database;
    
    const params = new URLSearchParams();
    if (value.ssl) {
      params.set("encrypt", "true");
    }
    if (value.trustServerCertificate) {
      params.set("trustServerCertificate", "true");
    }
    
    const queryString = params.toString();
    const url = `${protocol}${auth}@${host}/${database}${queryString ? `?${queryString}` : ""}`;

    return {
      name: value.name,
      driver: "mssql",
      url,
      host: value.host,
      port: parseInt(value.port as string) || 1433,
      username: value.username,
      password: value.password,
      database: value.database,
      ssl: value.ssl,
      trust_server_certificate: value.trustServerCertificate,
    };
  },
  remoteFrom: (value) => {
    return {
      name: value.name,
      host: value.source.host,
      port: value.source.port?.toString() || "1433",
      username: value.source.user,
      database: value.source.database,
      ssl: value.source.ssl,
    };
  },
  remoteTo: (value) => {
    return {
      name: value.name,
      source: {
        host: value.host,
        port: parseInt(value.port as string) || 1433,
        user: value.username,
        password: value.password,
        database: value.database,
        ssl: value.ssl,
        type: "mssql",
        base_id: "",
      },
    };
  },
};