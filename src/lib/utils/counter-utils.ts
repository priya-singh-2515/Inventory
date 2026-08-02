import { CounterModel } from "@/lib/models";

/**
 * Returns the next document number in a series, scoped to one company.
 *
 * The counter is keyed on (companyId, counterName), so each company runs its
 * own INV-001, PUR-001 … sequence rather than sharing one global run. The
 * single atomic findOneAndUpdate keeps concurrent requests from colliding.
 */
export async function getNextCounterValue(
  companyId: string,
  counterName: string,
  prefix = ""
): Promise<string> {
  const counter = await CounterModel.findOneAndUpdate(
    { companyId, name: counterName },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const numString = String(counter.value).padStart(3, "0");
  return prefix ? `${prefix}-${numString}` : numString;
}
