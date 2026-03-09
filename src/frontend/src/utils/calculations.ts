import type {
  Advance,
  Attendance,
  ColumnType,
  Contract,
  MeshColumn,
} from "../hooks/useQueries";

export interface ContractAmounts {
  bedAmount: number;
  paperAmount: number;
  meshAmount: number;
}

export function calcContractAmounts(contract: Contract): ContractAmounts {
  const bedAmount = (contract.bedRate ?? 11000) * contract.multiplier;
  const paperAmount = (contract.paperRate ?? 7000) * contract.multiplier;
  const meshAmount =
    contract.contractAmount - bedAmount - paperAmount - contract.machineExp;
  return { bedAmount, paperAmount, meshAmount };
}

export interface LabourSalary {
  labourId: bigint;
  bedSalary: number;
  paperSalary: number;
  meshSalaries: Record<string, number>; // key: meshColumnId.toString()
  netSalary: number;
}

function getAttendanceValue(
  attendance: Attendance[],
  labourId: bigint,
  columnType: ColumnType,
): number {
  const entry = attendance.find((a) => {
    if (a.labourId !== labourId) return false;
    if (a.columnType.__kind__ !== columnType.__kind__) return false;
    if (columnType.__kind__ === "Mesh") {
      return (
        a.columnType.__kind__ === "Mesh" &&
        a.columnType.Mesh ===
          (columnType as { __kind__: "Mesh"; Mesh: bigint }).Mesh
      );
    }
    return true;
  });
  return entry?.value ?? 0;
}

export function calcLabourSalaries(
  labourIds: bigint[],
  attendance: Attendance[],
  meshColumns: MeshColumn[],
  amounts: ContractAmounts,
): LabourSalary[] {
  // Sum of bed column
  const bedSum = labourIds.reduce((sum, lid) => {
    return (
      sum + getAttendanceValue(attendance, lid, { __kind__: "Bed", Bed: null })
    );
  }, 0);

  // Sum of paper column
  const paperSum = labourIds.reduce((sum, lid) => {
    return (
      sum +
      getAttendanceValue(attendance, lid, { __kind__: "Paper", Paper: null })
    );
  }, 0);

  // Total mesh attendance = sum of ALL mesh columns combined (across all labours)
  // Mesh amount per labour = (labour's total mesh attendance across all columns) / (sum of all mesh attendance) * meshAmount
  const totalMeshSum = meshColumns.reduce((colSum, col) => {
    return (
      colSum +
      labourIds.reduce((labSum, lid) => {
        return (
          labSum +
          getAttendanceValue(attendance, lid, {
            __kind__: "Mesh",
            Mesh: col.id,
          })
        );
      }, 0)
    );
  }, 0);

  return labourIds.map((labourId) => {
    const bedVal = getAttendanceValue(attendance, labourId, {
      __kind__: "Bed",
      Bed: null,
    });
    const paperVal = getAttendanceValue(attendance, labourId, {
      __kind__: "Paper",
      Paper: null,
    });

    const bedSalary = bedSum > 0 ? (bedVal / bedSum) * amounts.bedAmount : 0;
    const paperSalary =
      paperSum > 0 ? (paperVal / paperSum) * amounts.paperAmount : 0;

    // Sum this labour's attendance across all mesh columns
    const labourTotalMesh = meshColumns.reduce((sum, col) => {
      return (
        sum +
        getAttendanceValue(attendance, labourId, {
          __kind__: "Mesh",
          Mesh: col.id,
        })
      );
    }, 0);

    // Mesh salary = (labour total mesh / total all-labour mesh) * total mesh amount
    const totalMeshSalary =
      totalMeshSum > 0
        ? (labourTotalMesh / totalMeshSum) * amounts.meshAmount
        : 0;

    // Build per-column mesh salaries proportionally (for display purposes)
    const meshSalaries: Record<string, number> = {};
    for (const col of meshColumns) {
      const meshVal = getAttendanceValue(attendance, labourId, {
        __kind__: "Mesh",
        Mesh: col.id,
      });
      // Proportion of this labour's mesh salary that came from this column
      meshSalaries[col.id.toString()] =
        labourTotalMesh > 0 ? (meshVal / labourTotalMesh) * totalMeshSalary : 0;
    }

    const netSalary = bedSalary + paperSalary + totalMeshSalary;

    return {
      labourId,
      bedSalary,
      paperSalary,
      meshSalaries,
      netSalary,
    };
  });
}

export function calcTotalAdvancePerLabour(
  advances: Advance[],
  labourId: bigint,
): number {
  return advances
    .filter((a) => a.labourId === labourId)
    .reduce((sum, a) => sum + a.amount, 0);
}

export const ATTENDANCE_OPTIONS = [
  { label: "Absent", value: "0" },
  { label: "Present", value: "1" },
  { label: "0.33", value: "0.33" },
  { label: "0.4", value: "0.4" },
  { label: "0.5", value: "0.5" },
  { label: "0.66", value: "0.66" },
  { label: "0.7", value: "0.7" },
  { label: "0.8", value: "0.8" },
  { label: "0.9", value: "0.9" },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
