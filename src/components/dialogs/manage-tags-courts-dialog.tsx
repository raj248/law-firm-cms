"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { useState } from "react";

type Props = {
  open: boolean;
  setOpen: (val: boolean) => void;
};

export const ManageTagsCourtsDialog = ({ open, setOpen }: Props) => {
  const {
    tags, courts,
    addTag, addCourt,
    removeTag, removeCourt,
  } = useSettingsStore();

  const [inputTag, setInputTag] = useState("");
  const [inputCourt, setInputCourt] = useState("");

  const handleAdd = (type: "tags" | "courts") => {
    const trimmed = (type === "tags" ? inputTag : inputCourt).trim();
    if (!trimmed) return;
    if (type === "tags") {
      if (tags.includes(trimmed)) return;
      addTag(trimmed);
      setInputTag("");
    } else {
      if (courts.includes(trimmed)) return;
      addCourt(trimmed);
      setInputCourt("");
    }
  };

  const renderContent = (
    items: string[],
    type: "tags" | "courts",
    input: string,
    setInput: (val: string) => void
  ) => (
    <>
      <div className="max-h-60 overflow-y-auto flex flex-wrap gap-2 px-1">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No {type} found.</p>
        ) : (
          items.map(item => (
            <Badge
              key={item}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="truncate max-w-[100px]">{item}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 p-0"
                onClick={() => type === "tags" ? removeTag(item) : removeCourt(item)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Add ${type.slice(0, -1)}`}
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd(type);
            }
          }}
        />
        <Button onClick={() => handleAdd(type)}>Add</Button>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md w-full p-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">
            Manage Tags & Courts
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="tags" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
          </TabsList>

          <TabsContent value="tags">
            {renderContent([...tags].sort((a, b) => a.localeCompare(b)), "tags", inputTag, setInputTag)}
          </TabsContent>

          <TabsContent value="courts">
            {renderContent([...courts].sort((a, b) => a.localeCompare(b)), "courts", inputCourt, setInputCourt)}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
