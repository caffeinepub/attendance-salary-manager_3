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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Advance,
  useAdvancesForContract,
  useAllContracts,
  useAllLabours,
  useCreateAdvance,
  useDeleteAdvance,
  useUpdateAdvance,
} from "../hooks/useQueries";
import { useUserRole } from "../hooks/useUserRole";
import { formatCurrency, formatDate } from "../utils/calculations";

export function AdvancesTab() {
  const { data: contracts } = useAllContracts();
  const { data: labours } = useAllLabours();
  const { isGuest } = useUserRole();

  const [selectedContractId, setSelectedContractId] = useState<bigint | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ labourId: "", amount: "", note: "" });

  // Edit state
  const [editTarget, setEditTarget] = useState<Advance | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", note: "" });

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Advance | null>(null);

  const { data: advances, isLoading: loadingAdvances } =
    useAdvancesForContract(selectedContractId);
  const createAdvance = useCreateAdvance();
  const updateAdvance = useUpdateAdvance();
  const deleteAdvance = useDeleteAdvance();

  const activeContracts = contracts?.filter((c) => !c.isSettled) ?? [];
  const selectedContract = activeContracts.find(
    (c) => c.id.toString() === selectedContractId?.toString(),
  );

  async function handleSubmit() {
    if (!selectedContractId) return;
    if (!form.labourId) {
      toast.error("Select a labour");
      return;
    }
    const amount = Number.parseFloat(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await createAdvance.mutateAsync({
        contractId: selectedContractId,
        labourId: BigInt(form.labourId),
        amount,
        note: form.note.trim() || null,
      });
      toast.success("Advance recorded");
      setForm({ labourId: "", amount: "", note: "" });
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save advance");
    }
  }

  function openEdit(adv: Advance) {
    setEditTarget(adv);
    setEditForm({ amount: adv.amount.toString(), note: adv.note ?? "" });
  }

  async function handleUpdate() {
    if (!editTarget || !selectedContractId) return;
    const amount = Number.parseFloat(editForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await updateAdvance.mutateAsync({
        id: editTarget.id,
        contractId: selectedContractId,
        amount,
        note: editForm.note.trim() || null,
      });
      toast.success("Advance updated");
      setEditTarget(null);
    } catch {
      toast.error("Failed to update advance");
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !selectedContractId) return;
    try {
      await deleteAdvance.mutateAsync({
        advanceId: deleteTarget.id,
        contractId: selectedContractId,
      });
      toast.success("Advance deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete advance");
    }
  }

  // Group advances by labour
  const advancesByLabour: Record<string, { name: string; total: number }> = {};
  if (advances && labours) {
    for (const adv of advances) {
      const key = adv.labourId.toString();
      const labour = labours.find((l) => l.id === adv.labourId);
      if (!advancesByLabour[key]) {
        advancesByLabour[key] = { name: labour?.name ?? "Unknown", total: 0 };
      }
      advancesByLabour[key].total += adv.amount;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Advances
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track advance payments per contract
          </p>
        </div>
        {selectedContractId && !isGuest && (
          <Button
            data-ocid="advances.add_button"
            onClick={() => setDialogOpen(true)}
            className="gap-2 bg-amber text-yellow-950 hover:bg-amber-dim font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Advance
          </Button>
        )}
      </div>

      {/* Contract selector */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium whitespace-nowrap">
          Contract:
        </Label>
        <Select
          value={selectedContractId?.toString() ?? ""}
          onValueChange={(v) => setSelectedContractId(v ? BigInt(v) : null)}
        >
          <SelectTrigger data-ocid="advances.contract.select" className="w-64">
            <SelectValue placeholder="Select a contract..." />
          </SelectTrigger>
          <SelectContent>
            {activeContracts.map((c) => (
              <SelectItem key={c.id.toString()} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedContract && (
          <Badge
            variant="outline"
            className="text-xs border-amber/40 text-amber-dim"
          >
            ×{selectedContract.multiplier}
          </Badge>
        )}
      </div>

      {!selectedContractId && (
        <div
          data-ocid="advances.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground mb-2">
            Select a Contract
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Choose a contract above to view and manage advance payments.
          </p>
        </div>
      )}

      {selectedContractId && loadingAdvances && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      )}

      {selectedContractId && !loadingAdvances && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Labour summary */}
          {Object.keys(advancesByLabour).length > 0 && (
            <div className="lg:col-span-1">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Summary by Labour
              </h3>
              <div className="space-y-2">
                {Object.entries(advancesByLabour).map(([, data]) => (
                  <div
                    key={data.name}
                    className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="font-medium truncate">{data.name}</span>
                    <span className="font-semibold text-orange-600 ml-2 shrink-0">
                      {formatCurrency(data.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advances table */}
          <div
            className={
              Object.keys(advancesByLabour).length > 0
                ? "lg:col-span-2"
                : "lg:col-span-3"
            }
          >
            {advances && advances.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No advances recorded for this contract.
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                <Table data-ocid="advances.table">
                  <TableHeader>
                    <TableRow className="bg-muted/60">
                      <TableHead>#</TableHead>
                      <TableHead>Labour</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Date</TableHead>
                      {!isGuest && (
                        <TableHead className="text-center">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advances?.map((adv, idx) => {
                      const labour = labours?.find(
                        (l) => l.id === adv.labourId,
                      );
                      return (
                        <TableRow
                          key={adv.id.toString()}
                          className="hover:bg-muted/30"
                        >
                          <TableCell className="text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {labour?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-orange-600">
                            {formatCurrency(adv.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {adv.note ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(adv.createdAt)}
                          </TableCell>
                          {!isGuest && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0"
                                  data-ocid={`advances.edit_button.${idx + 1}`}
                                  onClick={() => openEdit(adv)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 w-7 p-0"
                                  data-ocid={`advances.delete_button.${idx + 1}`}
                                  onClick={() => setDeleteTarget(adv)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Advance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="advance.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Record Advance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Labour *</Label>
              <Select
                value={form.labourId}
                onValueChange={(v) => setForm((f) => ({ ...f, labourId: v }))}
              >
                <SelectTrigger data-ocid="advance.labour.select">
                  <SelectValue placeholder="Select labour..." />
                </SelectTrigger>
                <SelectContent>
                  {labours?.map((l) => (
                    <SelectItem key={l.id.toString()} value={l.id.toString()}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adv-amount">Amount *</Label>
              <Input
                id="adv-amount"
                data-ocid="advance.amount.input"
                type="number"
                min="0"
                placeholder="e.g. 2000"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adv-note">Note</Label>
              <Input
                id="adv-note"
                data-ocid="advance.note.input"
                placeholder="Optional note..."
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              data-ocid="advance.submit_button"
              onClick={handleSubmit}
              disabled={createAdvance.isPending}
              className="bg-amber text-yellow-950 hover:bg-amber-dim font-semibold"
            >
              {createAdvance.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Record Advance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Advance Dialog */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent data-ocid="advances.edit.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Advance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-adv-amount">Amount *</Label>
              <Input
                id="edit-adv-amount"
                data-ocid="advances.edit.amount.input"
                type="number"
                min="0"
                placeholder="e.g. 2000"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-adv-note">Note</Label>
              <Input
                id="edit-adv-note"
                data-ocid="advances.edit.note.input"
                placeholder="Optional note..."
                value={editForm.note}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, note: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="advances.edit.cancel_button"
              onClick={() => setEditTarget(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="advances.edit.save_button"
              onClick={handleUpdate}
              disabled={updateAdvance.isPending}
              className="bg-amber text-yellow-950 hover:bg-amber-dim font-semibold"
            >
              {updateAdvance.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Advance confirm */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advance?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this advance of{" "}
              <strong>
                {deleteTarget ? formatCurrency(deleteTarget.amount) : ""}
              </strong>
              ? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="advances.delete.cancel_button"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="advances.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteAdvance.isPending}
            >
              {deleteAdvance.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
