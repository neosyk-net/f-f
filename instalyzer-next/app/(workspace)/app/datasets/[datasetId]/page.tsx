import { DatasetWorkspaceRoute } from "@/components/workspace/dataset-workspace-route";

type DatasetWorkspacePageProps = {
  params: Promise<{
    datasetId: string;
  }>;
};

export default async function DatasetWorkspacePage({
  params,
}: DatasetWorkspacePageProps) {
  const { datasetId } = await params;

  return <DatasetWorkspaceRoute datasetId={datasetId} />;
}
