"use client";

import {
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { TemplateForm } from "@/components/forms/template-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-search";
import {
  deleteTemplate,
  duplicateTemplate,
  getUserTemplates,
} from "@/lib/server-actions/template-actions";
import { SortOrder } from "@/lib/types";
import {
  TemplateSortBy,
  type TemplateWithMeta,
} from "@/lib/types/template-types";

export function TemplateList() {
  const [templates, setTemplates] = useState<TemplateWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [editing, setEditing] = useState<TemplateWithMeta | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<TemplateWithMeta | null>(null);
  const [isWorking, startWork] = useTransition();

  const load = useCallback(async (term: string) => {
    const result = await getUserTemplates({
      searchTerm: term || undefined,
      sortBy: TemplateSortBy.NAME,
      sortOrder: SortOrder.ASC,
    });
    if (result.success) {
      setTemplates(result.data ?? []);
    } else {
      toast.error("Your templates didn't load. Try refreshing.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(debouncedSearch);
  }, [debouncedSearch, load]);

  const duplicate = (template: TemplateWithMeta) => {
    startWork(async () => {
      const result = await duplicateTemplate(template.id);
      if (!result.success) {
        toast.error(result.error || "That template didn't copy. Try again.");
        return;
      }
      toast.success("Template copied");
      await load(debouncedSearch);
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    startWork(async () => {
      const result = await deleteTemplate(target.id);
      if (!result.success) {
        toast.error(result.error || "That template didn't delete. Try again.");
        return;
      }
      toast.success("Template deleted");
      setDeleting(null);
      setTemplates((current) =>
        current.filter((item) => item.id !== target.id),
      );
    });
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
  };

  const onSaved = () => {
    closeForm();
    load(debouncedSearch);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates"
            aria-label="Search templates"
            className="h-11 w-full rounded-control border-2 border-input bg-card pr-4 pl-11 text-base outline-none sm:text-body focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25"
          />
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus />
          New template
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={`template-row-skeleton-${index}`}
              className="h-16 w-full"
            />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <p className="rounded-control bg-card px-4 py-6 text-center text-muted-foreground">
          {search
            ? "No templates match that."
            : "No templates yet. Make one for notes you write often, like what you changed or how long it really took."}
        </p>
      ) : (
        <ul
          className="divide-y-2 divide-background overflow-hidden rounded-tile bg-card"
          aria-busy={isWorking}
        >
          {templates.map((template) => (
            <li key={template.id} className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => setEditing(template)}
                className="min-w-0 flex-1 rounded-sm text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <span className="block truncate font-extrabold">
                  {template.name}
                </span>
                <span className="block truncate text-meta font-normal text-muted-foreground">
                  <span className="capitalize">{template.category}</span>
                  {template.usageCount > 0 &&
                    ` · used ${template.usageCount} ${template.usageCount === 1 ? "time" : "times"}`}
                  {template.description ? ` · ${template.description}` : ""}
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Options for ${template.name}`}
                  className="grid size-9 place-items-center rounded-full outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditing(template)}>
                    <Pencil />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => duplicate(template)}>
                    <Copy />
                    Make a copy
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleting(template)}
                  >
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={editing !== null || creating}
        onOpenChange={(open) => !open && closeForm()}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto p-6 sm:max-w-xl"
        >
          <SheetTitle>{editing ? "Edit template" : "New template"}</SheetTitle>
          <SheetDescription>
            Templates fill in the note box so you don't retype the same things.
          </SheetDescription>
          {(editing !== null || creating) && (
            <TemplateForm
              key={editing?.id ?? "new-template"}
              template={editing ?? undefined}
              onSuccess={onSaved}
              onCancel={closeForm}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Notes you already wrote with it stay as they are.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
              disabled={isWorking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
