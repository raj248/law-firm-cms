import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useCaseStore } from "@/stores/case-store";
import { AddCaseDialog } from "../add/add-case-dialog";
import { CaseDetailDialog } from "./case-detail-dialog";

type Props = {
  id: string; // client ID
};

export const CaseSection = ({ id }: Props) => {
  const allCases = useCaseStore((s) => s.cases);
  const clientCases = useMemo(() => allCases.filter(c => c.client_id === id), [allCases, id]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  return (
    <>
      {/* Floating on desktop next to dialog */}
      <div
        className="
          hidden md:block
          absolute top-1/2 left-full -translate-y-1/2 ml-6
          bg-background/80 backdrop-blur-sm
          shadow-lg rounded-xl border
          max-w-sm w-[22rem] p-4
          max-h-[80vh] overflow-y-auto scrollbar-custom
          z-40
        "
      >
        <div className="flex justify-between items-center mb-2 sticky top-0 bg-background/80 backdrop-blur-sm z-10 pb-2">
          <h3 className="text-lg font-semibold">Cases</h3>
          <AddCaseDialog id={id} />
        </div>

        {clientCases.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">No cases found for this client.</p>
        ) : (
          <div className="grid gap-3">
            {clientCases.map((c) => (
              <Card
                key={c.file_id}
                className="cursor-pointer hover:ring-2 hover:ring-ring/20 transition"
                onClick={() => {
                  setSelectedCaseId(c.file_id);
                  setOpenDialog(true);
                }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{c.title}</CardTitle>
                    <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p className="line-clamp-2 break-words">{c.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {c.court}
                    </Badge>
                    {c.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {c.updated_at && (
                    <div className="text-xs italic">
                      Last updated {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Inline fallback on mobile */}
      <div className="md:hidden mt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Cases</h3>
          <AddCaseDialog id={id} />
        </div>

        <div className="max-h-[300px] overflow-y-auto pr-1">
          {clientCases.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">No cases found for this client.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {clientCases.map((c) => (
                <Card
                  key={c.file_id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedCaseId(c.file_id);
                    setOpenDialog(true);
                  }}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{c.title}</CardTitle>
                      <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p className="line-clamp-2 break-words">{c.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                        {c.court}
                      </Badge>
                      {c.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {c.updated_at && (
                      <div className="text-xs italic">
                        Last updated {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCaseId && (
        <CaseDetailDialog
          open={openDialog}
          setOpen={setOpenDialog}
          file_id={selectedCaseId}
        />
      )}
    </>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Open":
      return "bg-green-100 text-green-800 font-medium rounded-sm";
    case "Pending":
      return "bg-yellow-100 text-yellow-800 font-medium rounded-sm";
    case "Closed":
      return "bg-red-100 text-red-800 font-medium rounded-sm";
    default:
      return "bg-gray-100 text-gray-800 font-medium rounded-sm";
  }
};
