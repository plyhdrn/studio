"use client";

import {
  CommonConnectionConfig,
  ConnectionConfigEditor,
  validateTemplate,
} from "@/components/connection-config-editor";
import { ConnectionTemplateDictionary } from "@/components/connection-config-editor/template";
import { Button } from "@/components/orbit/button";
import { getDatabaseFriendlyName } from "@/components/resource-card/utils";
import { ArrowLeft, ArrowRight, FloppyDisk } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { mutate } from "swr";
import { createLocalConnection } from "../../hooks";

export const runtime = "edge";

export default function LocalMSSQLNewBasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<CommonConnectionConfig>({
    name: "",
    host: searchParams.get("host") || "",
    port: searchParams.get("port") || "1433",
    username: searchParams.get("username") || "",
    password: "",
    database: searchParams.get("database") || "",
    ssl: true,
    trustServerCertificate: false,
  });
  const [loading, setLoading] = useState(false);
  const [validateErrors, setValidateErrors] = useState<Record<string, string>>(
    {}
  );

  const template = useMemo(() => {
    return ConnectionTemplateDictionary["mssql"];
  }, []);

  const onSave = useCallback(async () => {
    if (!template?.localTo) return;

    const errors = validateTemplate(value, template);
    setValidateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await createLocalConnection(template.localTo(value));
      router.push("/local");
    } catch (error) {
      console.error("Failed to save MSSQL connection:", error);
      setValidateErrors({ general: `Failed to save connection: ${error instanceof Error ? error.message : "Unknown error"}` });
    } finally {
      setLoading(false);
    }
  }, [template, value, router]);

  const onConnect = useCallback(async () => {
    if (!template?.localTo) return;

    const errors = validateTemplate(value, template);
    setValidateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const newConnection = await createLocalConnection(template.localTo(value));

      // Redirect to the connection page
      mutate("/local/bases");
      router.replace(`/client/s/mssql?p=${newConnection.id}`);
    } catch (error) {
      console.error("Failed to connect to MSSQL:", error);
      setValidateErrors({ general: `Failed to connect: ${error instanceof Error ? error.message : "Unknown error"}` });
      setLoading(false);
    }
  }, [template, value, router]);

  if (!template?.localTo || !template?.localFrom) {
    return <div>Invalid driver</div>;
  }

  return (
    <>
      <div className="container">
        <div className="my-8 flex">
          <Button variant="secondary" size="lg" href="/local" as="link">
            <ArrowLeft />
            Back
          </Button>

          <div className="flex-1"></div>
        </div>

        <div className="mb-8 text-2xl font-bold">
          <div>Connect to {getDatabaseFriendlyName("mssql")} database</div>
        </div>

        {validateErrors.general && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {validateErrors.general}
          </div>
        )}

        <ConnectionConfigEditor
          template={template}
          value={value}
          onChange={setValue}
          errors={validateErrors}
        />
      </div>

      <div className="bg-background sticky bottom-0 mt-12 border-t px-2 py-6">
        <div className="container flex gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={onConnect}
            disabled={loading}
          >
            <ArrowRight />
            Connect
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onSave}
            disabled={loading}
          >
            <FloppyDisk />
            Save
          </Button>
        </div>
      </div>
    </>
  );
}