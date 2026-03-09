import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, CreditCard, LayoutList, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  type Advance,
  type Attendance,
  type ContractDetails,
  useAdvancesForContract,
  useAllContracts,
  useAllLabours,
  useAttendanceForContract,
  useContractDetails,
} from "../hooks/useQueries";
import {
  calcContractAmounts,
  calcLabourSalaries,
  calcTotalAdvancePerLabour,
  formatCurrency,
} from "../utils/calculations";

// ─── ContractDataLoader ─────────────────────────────────────────────────────

interface ContractData {
  contractId: bigint;
  details: ContractDetails | null;
  attendance: Attendance[];
  advances: Advance[];
  isLoading: boolean;
}

interface ContractDataLoaderProps {
  contractId: bigint;
  onData: (data: ContractData) => void;
}

function ContractDataLoader({ contractId, onData }: ContractDataLoaderProps) {
  const { data: details, isLoading: loadingDetails } =
    useContractDetails(contractId);
  const { data: attendance, isLoading: loadingAttendance } =
    useAttendanceForContract(contractId);
  const { data: advances, isLoading: loadingAdvances } =
    useAdvancesForContract(contractId);

  const isLoading = loadingDetails || loadingAttendance || loadingAdvances;

  const stableOnData = useCallback(onData, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    stableOnData({
      contractId,
      details: details ?? null,
      attendance: attendance ?? [],
      advances: advances ?? [],
      isLoading,
    });
  }, [contractId, details, attendance, advances, isLoading, stableOnData]);

  return null;
}

// ─── Multi-Contract Selector ────────────────────────────────────────────────

interface ContractSelectorProps {
  contracts: Array<{ id: bigint; name: string; isSettled: boolean }>;
  selectedIds: Set<string>;
  onToggle: (idStr: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

function ContractSelector({
  contracts,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: ContractSelectorProps) {
  const [open, setOpen] = useState(false);
  const count = selectedIds.size;

  const triggerLabel =
    count === 0
      ? "Select contracts…"
      : count === 1
        ? `${contracts.find((c) => selectedIds.has(c.id.toString()))?.name ?? "1 contract"}`
        : `${count} contracts selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-ocid="payments.contract.select"
          variant="outline"
          className="w-72 justify-between font-normal"
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Contracts
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={onSelectAll}
            >
              All
            </button>
            <span className="text-xs text-muted-foreground">·</span>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={onDeselectAll}
            >
              None
            </button>
          </div>
        </div>
        <ScrollArea className="max-h-64">
          <div className="p-2 space-y-0.5">
            {contracts.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No contracts available
              </p>
            )}
            {contracts.map((contract, idx) => {
              const idStr = contract.id.toString();
              const checkboxId = `contract-checkbox-${idStr}`;
              const checked = selectedIds.has(idStr);
              return (
                <label
                  key={idStr}
                  htmlFor={checkboxId}
                  className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50 cursor-pointer select-none transition-colors"
                >
                  <Checkbox
                    id={checkboxId}
                    data-ocid={`payments.contract.checkbox.${idx + 1}`}
                    checked={checked}
                    onCheckedChange={() => onToggle(idStr)}
                  />
                  <span className="flex-1 text-sm truncate">
                    {contract.name}
                  </span>
                  {contract.isSettled && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-green-300 text-green-600"
                    >
                      Settled
                    </Badge>
                  )}
                </label>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// ─── Colour palette for per-contract columns ─────────────────────────────────

const CONTRACT_COLORS = [
  { header: "text-blue-600", cell: "text-blue-700" },
  { header: "text-purple-600", cell: "text-purple-700" },
  { header: "text-teal-600", cell: "text-teal-700" },
  { header: "text-rose-600", cell: "text-rose-700" },
  { header: "text-amber-600", cell: "text-amber-700" },
  { header: "text-indigo-600", cell: "text-indigo-700" },
  { header: "text-cyan-600", cell: "text-cyan-700" },
  { header: "text-emerald-600", cell: "text-emerald-700" },
];

// ─── PaymentsTab ─────────────────────────────────────────────────────────────

interface LabourContractBreakdown {
  contractId: string;
  contractName: string;
  netSalary: number;
}

interface LabourAggregated {
  labourId: bigint;
  netSalary: number;
  totalAdvance: number;
  finalPayment: number;
  contractBreakdowns: LabourContractBreakdown[];
}

export function PaymentsTab() {
  const { data: contracts } = useAllContracts();
  const { data: labours } = useAllLabours();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contractDataMap, setContractDataMap] = useState<
    Map<string, ContractData>
  >(new Map());
  const [showBreakdown, setShowBreakdown] = useState(false);

  const allContracts = contracts ?? [];
  const labourList = labours ?? [];

  const handleToggle = (idStr: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) {
        next.delete(idStr);
        setContractDataMap((m) => {
          const nm = new Map(m);
          nm.delete(idStr);
          return nm;
        });
      } else {
        next.add(idStr);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(allContracts.map((c) => c.id.toString())));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
    setContractDataMap(new Map());
  };

  const handleData = useCallback((data: ContractData) => {
    setContractDataMap((prev) => {
      const next = new Map(prev);
      next.set(data.contractId.toString(), data);
      return next;
    });
  }, []);

  const selectedIdArray = Array.from(selectedIds);
  const anyLoading = selectedIdArray.some(
    (id) => contractDataMap.get(id)?.isLoading !== false,
  );

  // ── Ordered list of loaded contracts for column rendering ─────────────────
  // Keep selection order stable so column positions don't shift
  const loadedContracts: Array<{ idStr: string; name: string }> =
    selectedIdArray
      .map((idStr) => {
        const cd = contractDataMap.get(idStr);
        if (!cd || cd.isLoading || !cd.details) return null;
        return { idStr, name: cd.details.contract.name };
      })
      .filter(Boolean) as Array<{ idStr: string; name: string }>;

  // ── Aggregate per labour ──────────────────────────────────────────────────

  const aggregated: LabourAggregated[] = labourList.map((labour) => {
    let netSalary = 0;
    let totalAdvance = 0;
    const contractBreakdowns: LabourContractBreakdown[] = [];

    for (const idStr of selectedIdArray) {
      const cd = contractDataMap.get(idStr);
      if (!cd || cd.isLoading || !cd.details) continue;

      const contract = cd.details.contract;
      const meshColumns = cd.details.meshColumns ?? [];
      const amounts = calcContractAmounts(contract);

      const salaries = calcLabourSalaries(
        labourList.map((l) => l.id),
        cd.attendance,
        meshColumns,
        amounts,
      );

      const labourSalary = salaries.find((s) => s.labourId === labour.id);
      const contractNetSalary = labourSalary?.netSalary ?? 0;

      netSalary += contractNetSalary;
      totalAdvance += calcTotalAdvancePerLabour(cd.advances, labour.id);

      contractBreakdowns.push({
        contractId: idStr,
        contractName: contract.name,
        netSalary: contractNetSalary,
      });
    }

    return {
      labourId: labour.id,
      netSalary,
      totalAdvance,
      finalPayment: netSalary - totalAdvance,
      contractBreakdowns,
    };
  });

  const totalNetSalary = aggregated.reduce((s, a) => s + a.netSalary, 0);
  const totalAdvances = aggregated.reduce((s, a) => s + a.totalAdvance, 0);
  const totalFinalPayment = totalNetSalary - totalAdvances;

  // Per-contract column totals
  const contractColumnTotals = loadedContracts.map(({ idStr }) =>
    aggregated.reduce((sum, agg) => {
      const bd = agg.contractBreakdowns.find((b) => b.contractId === idStr);
      return sum + (bd?.netSalary ?? 0);
    }, 0),
  );

  const hasSelection = selectedIds.size > 0;
  // colSpan for empty rows: slno + labour + (contract columns if breakdown) + net + advance + final
  const colSpanEmpty = showBreakdown ? 2 + loadedContracts.length + 3 : 5;

  return (
    <div className="space-y-6">
      {/* Hidden data loaders */}
      {selectedIdArray.map((idStr) => (
        <ContractDataLoader
          key={idStr}
          contractId={BigInt(idStr)}
          onData={handleData}
        />
      ))}

      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Payments
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select one or more contracts to calculate combined final payments
        </p>
      </div>

      {/* Selector + breakdown toggle */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Contracts</span>
          <ContractSelector
            contracts={allContracts}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />
        </div>

        {hasSelection && !anyLoading && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Options</span>
            <Button
              data-ocid="payments.breakdown.toggle"
              variant={showBreakdown ? "default" : "outline"}
              size="sm"
              onClick={() => setShowBreakdown((prev) => !prev)}
              className={`gap-2 h-10 ${
                showBreakdown ? "bg-primary text-primary-foreground" : ""
              }`}
            >
              {showBreakdown ? (
                <>
                  <X className="w-4 h-4" />
                  Hide Breakdown
                </>
              ) : (
                <>
                  <LayoutList className="w-4 h-4" />
                  Show Breakdown
                </>
              )}
            </Button>
          </div>
        )}

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap gap-2 pt-6">
            {Array.from(selectedIds).map((idStr) => {
              const contract = allContracts.find(
                (c) => c.id.toString() === idStr,
              );
              return contract ? (
                <Badge
                  key={idStr}
                  variant="secondary"
                  className="text-xs gap-1 pr-1 cursor-pointer"
                  onClick={() => handleToggle(idStr)}
                >
                  {contract.name}
                  <span className="opacity-60 hover:opacity-100 text-[10px] ml-0.5">
                    ✕
                  </span>
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Empty states */}
      {!hasSelection && allContracts.length === 0 && (
        <div
          data-ocid="payments.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground mb-2">
            No Contracts Available
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Create a contract first to view payment calculations.
          </p>
        </div>
      )}

      {!hasSelection && allContracts.length > 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CreditCard className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Select one or more contracts to view payment details
          </p>
        </div>
      )}

      {/* Loading */}
      {hasSelection && anyLoading && (
        <div data-ocid="payments.loading_state" className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      )}

      {/* Payments table */}
      {hasSelection && !anyLoading && (
        <>
          {/* Breakdown info banner */}
          {showBreakdown && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary">
              <LayoutList className="w-4 h-4 shrink-0" />
              <span>
                <strong>Salary Breakdown</strong> — net salary per contract is
                shown as individual columns.
              </span>
            </div>
          )}

          <Separator />

          <div className="rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto">
            <Table data-ocid="payments.table">
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Labour</TableHead>
                  {showBreakdown &&
                    loadedContracts.map(({ idStr, name }, colIdx) => {
                      const color =
                        CONTRACT_COLORS[colIdx % CONTRACT_COLORS.length];
                      return (
                        <TableHead
                          key={idStr}
                          className={`text-right whitespace-nowrap ${color.header}`}
                        >
                          {name}
                        </TableHead>
                      );
                    })}
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead className="text-right">Total Advance</TableHead>
                  <TableHead className="text-right">Final Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labourList.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={colSpanEmpty}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No labours found. Add labours from the Labours tab.
                    </TableCell>
                  </TableRow>
                )}
                {labourList.map((labour, idx) => {
                  const agg = aggregated.find((a) => a.labourId === labour.id);
                  const netSalary = agg?.netSalary ?? 0;
                  const totalAdv = agg?.totalAdvance ?? 0;
                  const finalPayment = agg?.finalPayment ?? 0;
                  const isNegative = finalPayment < 0;

                  return (
                    <TableRow
                      key={labour.id.toString()}
                      data-ocid={`payments.item.${idx + 1}`}
                      className="hover:bg-muted/30"
                    >
                      <TableCell className="text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {labour.name}
                      </TableCell>
                      {showBreakdown &&
                        loadedContracts.map(({ idStr }, colIdx) => {
                          const color =
                            CONTRACT_COLORS[colIdx % CONTRACT_COLORS.length];
                          const bd = agg?.contractBreakdowns.find(
                            (b) => b.contractId === idStr,
                          );
                          return (
                            <TableCell
                              key={idStr}
                              className={`text-right font-medium ${color.cell}`}
                            >
                              {formatCurrency(bd?.netSalary ?? 0)}
                            </TableCell>
                          );
                        })}
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(netSalary)}
                      </TableCell>
                      <TableCell className="text-right">
                        {totalAdv > 0 ? (
                          <span className="text-orange-600 font-semibold">
                            {formatCurrency(totalAdv)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-bold text-base ${
                            isNegative
                              ? "text-destructive"
                              : finalPayment === 0
                                ? "text-muted-foreground"
                                : "text-green-600"
                          }`}
                        >
                          {formatCurrency(finalPayment)}
                        </span>
                        {isNegative && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Overpaid
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              {labourList.length > 0 && (
                <TableFooter>
                  <TableRow className="bg-muted/60 font-bold">
                    <TableCell colSpan={2}>
                      Total
                      {selectedIds.size > 1 && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          ({selectedIds.size} contracts)
                        </span>
                      )}
                    </TableCell>
                    {showBreakdown &&
                      loadedContracts.map(({ idStr }, colIdx) => {
                        const color =
                          CONTRACT_COLORS[colIdx % CONTRACT_COLORS.length];
                        return (
                          <TableCell
                            key={idStr}
                            className={`text-right ${color.cell}`}
                          >
                            {formatCurrency(contractColumnTotals[colIdx] ?? 0)}
                          </TableCell>
                        );
                      })}
                    <TableCell className="text-right">
                      {formatCurrency(totalNetSalary)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatCurrency(totalAdvances)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          totalFinalPayment < 0
                            ? "text-destructive"
                            : "text-green-600"
                        }
                      >
                        {formatCurrency(totalFinalPayment)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
