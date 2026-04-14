import type { CalendarConnection } from "@prisma/client";
import { addDays, setHours, setMinutes } from "date-fns";

export type AvailabilitySlot = {
  label: string;
  startsAt: string;
  endsAt: string;
};

export function buildAvailabilitySlots(
  connections: CalendarConnection[],
  preferredTone: string,
) {
  const base = new Date();
  const slots: AvailabilitySlot[] = [1, 2, 3].map((offset, index) => {
    const day = addDays(base, offset + 1);
    const start = setMinutes(setHours(day, index === 2 ? 15 : 13 + index), 0);
    const end = setMinutes(setHours(day, index === 2 ? 16 : 14 + index), 0);

    return {
      label: `${start.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })} at ${start.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
    };
  });

  return {
    connectedProviders: connections.map((connection) => connection.providerType),
    preferredTone,
    slots,
  };
}
