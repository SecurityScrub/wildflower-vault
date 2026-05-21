"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { isWithinInterval, startOfDay, addDays } from "date-fns";
import Link from "next/link";
import "react-day-picker/style.css";

interface Props {
  rentalItemId: string;
  bookedDates: Array<{ start: string; end: string }>;
}

export function BookingCalendar({ rentalItemId, bookedDates }: Props) {
  const [selected, setSelected] = useState<Date | undefined>();

  const booked = bookedDates.map((d) => ({
    start: startOfDay(new Date(d.start)),
    end: startOfDay(new Date(d.end)),
  }));

  function isBooked(date: Date): boolean {
    return booked.some((range) =>
      isWithinInterval(startOfDay(date), { start: range.start, end: range.end })
    );
  }

  const isSelectedAvailable = selected && !isBooked(selected);

  return (
    <div className="bg-brand-cream p-8 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={setSelected}
            disabled={[{ before: addDays(new Date(), 1) }, isBooked]}
            modifiers={{ booked: isBooked }}
            modifiersStyles={{
              booked: {
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                textDecoration: "line-through",
              },
            }}
            styles={{
              root: { fontFamily: "Inter, sans-serif", fontSize: "14px" },
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-4 h-4 bg-brand-orange-700 rounded-sm" />
            <span className="text-gray-600">Selected date</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded-sm" />
            <span className="text-gray-600">Already booked</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-4 h-4 bg-white border border-gray-200 rounded-sm" />
            <span className="text-gray-600">Available</span>
          </div>

          {selected && (
            <div className="mt-6 p-4 bg-white border border-brand-orange-200">
              <p className="font-sans text-sm text-gray-600 mb-3">
                {isSelectedAvailable ? (
                  <>
                    <span className="text-brand-orange-700 font-semibold">
                      ✓ Available on{" "}
                      {selected.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </>
                ) : (
                  <span className="text-red-600">
                    This date is already booked. Please choose another date.
                  </span>
                )}
              </p>
              {isSelectedAvailable && (
                <Link
                  href={`/book?item=${rentalItemId}&date=${selected.toISOString().split("T")[0]}`}
                  className="btn-primary text-center block text-xs"
                >
                  Book This Date
                </Link>
              )}
            </div>
          )}

          {!selected && (
            <p className="text-sm text-gray-400 mt-4">
              Click a date to check availability and start your booking.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
