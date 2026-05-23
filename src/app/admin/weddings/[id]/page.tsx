import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/utils";
import {
  WEDDING_STATUS_LABELS,
  TASK_STATUS_LABELS,
  VENDOR_STATUS_LABELS,
  RSVP_STATUS_LABELS,
  VENDOR_CATEGORIES,
  BUDGET_CATEGORIES,
  MILESTONE_TEMPLATES,
} from "@/lib/wedding-planning";
import {
  updateWedding,
  generateTimeline,
  addTask,
  updateTaskStatus,
  deleteTask,
  addVendor,
  updateVendorStatus,
  deleteVendor,
  addBudgetItem,
  deleteBudgetItem,
  addGuest,
  updateGuestRsvp,
  deleteGuest,
  postMessage,
} from "./actions";
import type {
  TaskStatus,
  VendorStatus,
  RSVPStatus,
  WeddingStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

const TASK_STATUSES: TaskStatus[] = ["PENDING", "IN_PROGRESS", "DONE", "SKIPPED"];
const VENDOR_STATUSES: VendorStatus[] = ["CONSIDERING", "CONTACTED", "PROPOSAL", "BOOKED", "PAID", "DECLINED"];
const RSVP_STATUSES: RSVPStatus[] = ["PENDING", "YES", "NO", "MAYBE"];
const WEDDING_STATUSES: WeddingStatus[] = ["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"];

function fmtMoney(v: number | null | undefined): string {
  if (v == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v));
}

function dateToInput(d: Date | null | undefined, withTime = false): string {
  if (!d) return "";
  const dt = new Date(d);
  if (withTime) return dt.toISOString().slice(0, 16);
  return dt.toISOString().slice(0, 10);
}

export default async function WeddingWorkspacePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const wedding = await prisma.wedding.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, email: true, phone: true } },
      tasks: { orderBy: [{ sortOrder: "asc" }, { dueDate: "asc" }] },
      vendors: { orderBy: { createdAt: "desc" } },
      budgetItems: { orderBy: { category: "asc" } },
      guests: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });
  if (!wedding) notFound();

  const couple = wedding.partner2Name
    ? `${wedding.partner1Name} & ${wedding.partner2Name}`
    : wedding.partner1Name;

  // ── Aggregates ────────────────────────────────────────────────────────────

  const totalEstimated = wedding.budgetItems.reduce((s, b) => s + Number(b.estimated), 0);
  const totalActual = wedding.budgetItems.reduce((s, b) => s + Number(b.actual ?? 0), 0);
  const totalPaid = wedding.budgetItems.reduce((s, b) => s + Number(b.paid), 0);
  const budgetTotal = wedding.budgetTotal ? Number(wedding.budgetTotal) : null;

  const taskDone = wedding.tasks.filter((t) => t.status === "DONE").length;
  const taskTotal = wedding.tasks.length;

  const guestsAttending = wedding.guests.filter((g) => g.rsvp === "YES").length;
  const guestsDeclined = wedding.guests.filter((g) => g.rsvp === "NO").length;
  const guestsPending = wedding.guests.filter((g) => g.rsvp === "PENDING").length;

  // Bind server actions to this wedding's id
  const updateWeddingHere = updateWedding.bind(null, id);
  const generateTimelineHere = generateTimeline.bind(null, id);
  const addTaskHere = addTask.bind(null, id);
  const addVendorHere = addVendor.bind(null, id);
  const addBudgetItemHere = addBudgetItem.bind(null, id);
  const addGuestHere = addGuest.bind(null, id);
  const postMessageHere = postMessage.bind(null, id);

  // Group tasks by milestone for display
  const tasksByMilestone = wedding.tasks.reduce<Record<string, typeof wedding.tasks>>((acc, t) => {
    const key = t.milestone ?? "OTHER";
    (acc[key] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <Link href="/admin/weddings" className="font-sans text-xs text-gray-400 hover:text-brand-orange-700">
          ← All weddings
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-3 mt-2">
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700 break-words">{couple}</h1>
          <p className="font-sans text-xs sm:text-sm text-gray-500">
            {wedding.weddingDate ? formatShortDate(wedding.weddingDate) : "Date TBD"} ·{" "}
            {WEDDING_STATUS_LABELS[wedding.status]}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Tasks" value={`${taskDone} / ${taskTotal}`} subtitle="done" />
        <StatCard
          label="Budget"
          value={fmtMoney(totalActual || totalEstimated)}
          subtitle={budgetTotal ? `of ${fmtMoney(budgetTotal)}` : `${wedding.budgetItems.length} items`}
        />
        <StatCard label="Vendors" value={String(wedding.vendors.length)} subtitle={`${wedding.vendors.filter((v) => v.status === "BOOKED" || v.status === "PAID").length} booked`} />
        <StatCard
          label="Guests"
          value={String(wedding.guests.length)}
          subtitle={`${guestsAttending} yes · ${guestsDeclined} no · ${guestsPending} TBD`}
        />
      </div>

      {/* Section nav (horizontal scroll on mobile) */}
      <div className="flex gap-2 text-xs font-sans border-b border-gray-100 pb-3 sticky top-14 bg-gray-50 z-10 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {[
          ["Overview", "#overview"],
          ["Timeline", "#tasks"],
          ["Vendors", "#vendors"],
          ["Budget", "#budget"],
          ["Guests", "#guests"],
          ["Messages", "#messages"],
        ].map(([label, hash]) => (
          <a key={hash} href={hash} className="shrink-0 px-3 py-2 bg-white rounded hover:bg-brand-orange-50">
            {label}
          </a>
        ))}
      </div>

      {/* ── Overview ────────────────────────────────────────────────────────── */}
      <section id="overview" className="bg-white p-4 sm:p-6 scroll-mt-32">
        <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-4">Overview</h2>
        <form action={updateWeddingHere} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Partner 1 Name">
            <input name="partner1Name" defaultValue={wedding.partner1Name} className="input-field" />
          </Field>
          <Field label="Partner 2 Name">
            <input name="partner2Name" defaultValue={wedding.partner2Name ?? ""} className="input-field" />
          </Field>
          <Field label="Wedding Date">
            <input type="date" name="weddingDate" defaultValue={dateToInput(wedding.weddingDate)} className="input-field" />
          </Field>
          <Field label="Guest Count">
            <input type="number" name="guestCount" defaultValue={wedding.guestCount ?? ""} className="input-field" />
          </Field>
          <Field label="Venue">
            <input name="venue" defaultValue={wedding.venue ?? ""} className="input-field" />
          </Field>
          <Field label="Venue Address">
            <input name="venueAddress" defaultValue={wedding.venueAddress ?? ""} className="input-field" />
          </Field>
          <Field label="Ceremony Time">
            <input type="datetime-local" name="ceremonyTime" defaultValue={dateToInput(wedding.ceremonyTime, true)} className="input-field" />
          </Field>
          <Field label="Reception Time">
            <input type="datetime-local" name="receptionTime" defaultValue={dateToInput(wedding.receptionTime, true)} className="input-field" />
          </Field>
          <Field label="Package">
            <input name="packageType" defaultValue={wedding.packageType ?? ""} className="input-field" />
          </Field>
          <Field label="Total Budget">
            <input type="number" step="0.01" name="budgetTotal" defaultValue={wedding.budgetTotal ? String(wedding.budgetTotal) : ""} className="input-field" />
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={wedding.status} className="input-field">
              {WEDDING_STATUSES.map((s) => (
                <option key={s} value={s}>{WEDDING_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Notes (visible to couple in their portal)">
              <textarea name="notes" defaultValue={wedding.notes ?? ""} rows={2} className="input-field resize-none" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Admin notes (planner-only)">
              <textarea name="adminNotes" defaultValue={wedding.adminNotes ?? ""} rows={2} className="input-field resize-none" />
            </Field>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="bg-brand-orange-700 text-white text-sm font-sans px-4 py-2 rounded hover:bg-brand-orange-800">
              Save overview
            </button>
          </div>
        </form>
        {wedding.lead && (
          <p className="mt-4 text-xs text-gray-400 font-sans">
            Original lead: <Link href={`/admin/wedding-planning-leads/${wedding.lead.id}`} className="text-brand-orange-700 hover:underline">{wedding.lead.email}</Link>
          </p>
        )}
      </section>

      {/* ── Timeline / Tasks ──────────────────────────────────────────────── */}
      <section id="tasks" className="bg-white p-4 sm:p-6 scroll-mt-32">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400">Timeline ({taskTotal})</h2>
          {taskTotal === 0 && (
            <form action={generateTimelineHere}>
              <button className="text-xs font-sans text-brand-orange-700 hover:underline">
                Generate from template →
              </button>
            </form>
          )}
        </div>

        <form action={addTaskHere} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4 text-xs">
          <input name="title" required placeholder="Task title…" className="input-field md:col-span-2" />
          <select name="milestone" defaultValue="" className="input-field">
            <option value="">No milestone</option>
            {MILESTONE_TEMPLATES.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          <input name="category" placeholder="Category" className="input-field" />
          <input type="date" name="dueDate" className="input-field" />
          <label className="flex items-center gap-1 text-xs col-span-1">
            <input type="checkbox" name="visibleToCouple" defaultChecked />
            Couple sees
          </label>
          <button type="submit" className="bg-brand-orange-700 text-white px-3 py-1.5 rounded text-xs md:col-span-5">
            Add task
          </button>
        </form>

        {taskTotal === 0 ? (
          <p className="text-xs text-gray-400 font-sans">No tasks yet — generate from template or add one.</p>
        ) : (
          <div className="space-y-6">
            {MILESTONE_TEMPLATES.concat([{ key: "OTHER", label: "Other / Custom", monthsBefore: 0, tasks: [] }]).map((m) => {
              const tasks = tasksByMilestone[m.key];
              if (!tasks?.length) return null;
              return (
                <div key={m.key}>
                  <p className="font-sans text-xs text-gray-500 mb-2 font-semibold">{m.label}</p>
                  <ul className="space-y-1">
                    {tasks.map((t) => {
                      const updateAction = async (formData: FormData) => {
                        "use server";
                        await updateTaskStatus(id, t.id, formData.get("status") as TaskStatus);
                      };
                      const deleteAction = async () => {
                        "use server";
                        await deleteTask(id, t.id);
                      };
                      return (
                        <li key={t.id} className="flex items-center gap-3 text-sm font-sans py-1.5 border-b border-gray-50">
                          <form action={updateAction}>
                            <select
                              name="status"
                              defaultValue={t.status}
                              className="text-xs border border-gray-200 rounded px-1.5 py-1"
                              onChange={(e) => e.currentTarget.form?.requestSubmit()}
                            >
                              {TASK_STATUSES.map((s) => (
                                <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                          </form>
                          <span className={`flex-1 ${t.status === "DONE" ? "line-through text-gray-400" : ""}`}>
                            {t.title}
                          </span>
                          {t.category && (
                            <span className="text-xs text-gray-400">{t.category}</span>
                          )}
                          {t.dueDate && (
                            <span className="text-xs text-gray-500">{formatShortDate(t.dueDate)}</span>
                          )}
                          {!t.visibleToCouple && (
                            <span className="text-xs text-brand-orange-700 bg-brand-orange-50 px-1.5 py-0.5 rounded">internal</span>
                          )}
                          <form action={deleteAction}>
                            <button className="text-gray-300 hover:text-red-500 text-xs">×</button>
                          </form>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Vendors ──────────────────────────────────────────────────────── */}
      <section id="vendors" className="bg-white p-4 sm:p-6 scroll-mt-32">
        <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-4">
          Vendors ({wedding.vendors.length})
        </h2>

        <form action={addVendorHere} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4 text-xs">
          <input name="name" required placeholder="Vendor name" className="input-field" />
          <select name="category" required className="input-field" defaultValue="">
            <option value="">Category…</option>
            {VENDOR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input name="email" type="email" placeholder="Email" className="input-field" />
          <input name="phone" placeholder="Phone" className="input-field" />
          <input name="contact" placeholder="Contact person" className="input-field" />
          <input name="website" placeholder="Website" className="input-field" />
          <input name="cost" type="number" step="0.01" placeholder="Cost" className="input-field" />
          <input name="deposit" type="number" step="0.01" placeholder="Deposit" className="input-field" />
          <input name="notes" placeholder="Notes" className="input-field md:col-span-4" />
          <button className="bg-brand-orange-700 text-white px-3 py-1.5 rounded text-xs md:col-span-4">
            Add vendor
          </button>
        </form>

        {wedding.vendors.length === 0 ? (
          <p className="text-xs text-gray-400 font-sans">No vendors yet.</p>
        ) : (
          <ul className="space-y-2">
            {wedding.vendors.map((v) => {
              const updateAction = async (formData: FormData) => {
                "use server";
                await updateVendorStatus(id, v.id, formData.get("status") as VendorStatus);
              };
              const deleteAction = async () => {
                "use server";
                await deleteVendor(id, v.id);
              };
              return (
                <li key={v.id} className="border border-gray-100 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-sans text-sm font-semibold">{v.name}</p>
                      <p className="text-xs font-sans text-gray-400">{v.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={updateAction}>
                        <select
                          name="status"
                          defaultValue={v.status}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                          onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        >
                          {VENDOR_STATUSES.map((s) => (
                            <option key={s} value={s}>{VENDOR_STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </form>
                      <form action={deleteAction}>
                        <button className="text-gray-300 hover:text-red-500 text-xs">×</button>
                      </form>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs font-sans text-gray-600">
                    {v.email && <span>📧 {v.email}</span>}
                    {v.phone && <span>📞 {v.phone}</span>}
                    {v.contact && <span>👤 {v.contact}</span>}
                    {v.website && <span>🔗 {v.website}</span>}
                    {v.cost && <span>Cost: {fmtMoney(Number(v.cost))}</span>}
                    {v.deposit && <span>Deposit: {fmtMoney(Number(v.deposit))}</span>}
                    {Number(v.paid) > 0 && <span>Paid: {fmtMoney(Number(v.paid))}</span>}
                  </div>
                  {v.notes && <p className="text-xs text-gray-500 mt-2 font-sans">{v.notes}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Budget ───────────────────────────────────────────────────────── */}
      <section id="budget" className="bg-white p-4 sm:p-6 scroll-mt-32">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400">
            Budget ({wedding.budgetItems.length} items)
          </h2>
          <p className="text-xs font-sans text-gray-500">
            Estimated: <strong>{fmtMoney(totalEstimated)}</strong> ·{" "}
            Actual: <strong>{fmtMoney(totalActual)}</strong> ·{" "}
            Paid: <strong>{fmtMoney(totalPaid)}</strong>
          </p>
        </div>

        <form action={addBudgetItemHere} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4 text-xs">
          <select name="category" required className="input-field" defaultValue="">
            <option value="">Category…</option>
            {BUDGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input name="description" required placeholder="Description" className="input-field md:col-span-2" />
          <input name="estimated" type="number" step="0.01" required placeholder="Estimated $" className="input-field" />
          <input name="actual" type="number" step="0.01" placeholder="Actual $" className="input-field" />
          <button className="bg-brand-orange-700 text-white px-3 py-1.5 rounded text-xs md:col-span-5">
            Add line item
          </button>
        </form>

        {wedding.budgetItems.length === 0 ? (
          <p className="text-xs text-gray-400 font-sans">No budget items yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-xs font-sans min-w-[520px]">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left py-2 px-4 sm:px-0">Category</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Est.</th>
                  <th className="text-right py-2">Actual</th>
                  <th className="text-right py-2">Paid</th>
                  <th className="px-4 sm:px-0"></th>
                </tr>
              </thead>
              <tbody>
                {wedding.budgetItems.map((b) => {
                  const deleteAction = async () => {
                    "use server";
                    await deleteBudgetItem(id, b.id);
                  };
                  return (
                    <tr key={b.id} className="border-b border-gray-50">
                      <td className="py-2 px-4 sm:px-0">{b.category}</td>
                      <td className="py-2">{b.description}</td>
                      <td className="text-right py-2">{fmtMoney(Number(b.estimated))}</td>
                      <td className="text-right py-2">{b.actual ? fmtMoney(Number(b.actual)) : "—"}</td>
                      <td className="text-right py-2">{fmtMoney(Number(b.paid))}</td>
                      <td className="text-right py-2 px-4 sm:px-0">
                        <form action={deleteAction}>
                          <button className="text-gray-300 hover:text-red-500 p-1">×</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Guests ───────────────────────────────────────────────────────── */}
      <section id="guests" className="bg-white p-4 sm:p-6 scroll-mt-32">
        <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-4">
          Guests ({wedding.guests.length}) · {guestsAttending} attending · {guestsDeclined} declined · {guestsPending} pending
        </h2>

        <form action={addGuestHere} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4 text-xs">
          <input name="firstName" required placeholder="First name" className="input-field" />
          <input name="lastName" placeholder="Last name" className="input-field" />
          <input name="email" type="email" placeholder="Email" className="input-field" />
          <input name="partyName" placeholder='Party (e.g. "Smith family")' className="input-field" />
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" name="plusOne" />
            +1
          </label>
          <input name="dietary" placeholder="Dietary notes" className="input-field md:col-span-5" />
          <button className="bg-brand-orange-700 text-white px-3 py-1.5 rounded text-xs md:col-span-5">
            Add guest
          </button>
        </form>

        {wedding.guests.length === 0 ? (
          <p className="text-xs text-gray-400 font-sans">No guests yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-xs font-sans min-w-[640px]">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left py-2 px-4 sm:px-0">Name</th>
                  <th className="text-left py-2">Party</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">RSVP</th>
                  <th className="text-left py-2">Dietary</th>
                  <th className="px-4 sm:px-0"></th>
                </tr>
              </thead>
              <tbody>
              {wedding.guests.map((g) => {
                const updateAction = async (formData: FormData) => {
                  "use server";
                  await updateGuestRsvp(id, g.id, formData.get("rsvp") as RSVPStatus);
                };
                const deleteAction = async () => {
                  "use server";
                  await deleteGuest(id, g.id);
                };
                return (
                  <tr key={g.id} className="border-b border-gray-50">
                    <td className="py-2 px-4 sm:px-0">
                      {g.firstName} {g.lastName ?? ""}
                      {g.plusOne && <span className="ml-1 text-brand-orange-700">+1</span>}
                    </td>
                    <td className="py-2 text-gray-500">{g.partyName ?? "—"}</td>
                    <td className="py-2 text-gray-500">{g.email ?? "—"}</td>
                    <td className="py-2">
                      <form action={updateAction}>
                        <select
                          name="rsvp"
                          defaultValue={g.rsvp}
                          className="border border-gray-200 rounded px-2 py-1 text-xs"
                          onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        >
                          {RSVP_STATUSES.map((s) => (
                            <option key={s} value={s}>{RSVP_STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </form>
                    </td>
                    <td className="py-2 text-gray-500">{g.dietary ?? "—"}</td>
                    <td className="py-2 text-right px-4 sm:px-0">
                      <form action={deleteAction}>
                        <button className="text-gray-300 hover:text-red-500 p-1">×</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <section id="messages" className="bg-white p-4 sm:p-6 scroll-mt-32">
        <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-4">
          Messages with couple
        </h2>

        <form action={postMessageHere} className="space-y-2 mb-6">
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Write a message that will appear in the couple's portal…"
            className="w-full input-field resize-none"
          />
          <div className="flex justify-end">
            <button className="bg-brand-orange-700 text-white px-4 py-1.5 rounded text-xs">
              Send message
            </button>
          </div>
        </form>

        {wedding.messages.length === 0 ? (
          <p className="text-xs text-gray-400 font-sans">No messages yet.</p>
        ) : (
          <ul className="space-y-3">
            {wedding.messages.map((m) => (
              <li key={m.id} className="border-l-2 border-brand-orange-100 pl-4">
                <p className="text-xs font-sans text-gray-400 mb-1">
                  {m.author?.name ?? m.author?.email ?? "Unknown"} · {formatShortDate(m.createdAt)}
                </p>
                <p className="text-sm whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="bg-white p-4">
      <p className="font-sans text-xs uppercase tracking-wider text-gray-400">{label}</p>
      <p className="font-serif text-2xl text-brand-orange-700 mt-1">{value}</p>
      {subtitle && <p className="font-sans text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-sans text-xs uppercase tracking-wider text-gray-400 block mb-1">{label}</span>
      {children}
    </label>
  );
}
