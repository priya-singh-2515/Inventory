import { CounterModel } from "@/lib/models";

export async function getNextCounterValue(counterName: string, prefix = ""): Promise<string> {
  const counter = await CounterModel.findOneAndUpdate(
    { name: counterName },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const numString = String(counter.value).padStart(3, "0");
  return prefix ? `${prefix}-${numString}` : numString;
}
