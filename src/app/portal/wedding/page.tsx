import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatShortDate } from "@/lib/utils";
import {
  TASK_STATUS_LABELS,
  VENDOR_STATUS_LABELS,
  MILESTONE_TEMPLATES,
  WEDDING_STATUS_LABELS,
} from "@/lib/wedding-planning";
import type { TaskStatus } from "@prisma/client";
import { AutoSubmitSelect } from "@/components/admin/AutoSubmitSelect";

export const dynamic = "force-dynamic";

const TASK_STATUSES: TaskStatus[] = ["PENDING", "IN_PROGRESS", "DONE", "SKIPPED"];

function fmtMoney(v: number | null | undefined): string {
  if (v == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v));
}

export default async function MyWeddingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");
  const userId = (session.user as { id: string }).id;
  const email = session.user.email ?? "";

  const wedding = await prisma.wedding.findFirst({
    where: {
      OR: [
        { primaryClientId: userId },
        { partnerClientId: userId },
        ...(email ? [{ lead: { email } }] : []),
      ],
    },
    include: {
      tasks: {
        where: { visibleToCouple: true },
        orderBy: [{ sortOrder: "asc" }, { dueDate: "asc" }],
      },
      vendors: {
        where: { status: { in: ["BOOKED", "PAID", "PROPOSAL"] } },
        orderBy: { category: "asc" },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { author: { select: { name: true, email: true, role: true } } },
      },
    },
  });

  if (!wedding) {
    return (
      <div className="bg-white p-8 text-center">
        <p className="font-sans text-sm text-gray-500">
          We couldn&apos;t find a wedding tied to your account yet. If you&apos;ve recently booked,
          your planner will set this up shortly.
        </p>
      </div>
    );
  }

  const couple = wedding.partner2Name
    ? `${wedding.partner1Name} & ${wedding.partner2Name}`
    : wedding.partner1Name;

  const tasksByMilestone = wedding.tasks.reduce<Record<string, typeof wedding.tasks>>((acc, t) => {
    const key = t.milestone ?? "OTHER";
    (acc[key] ??= []).push(t);
    return acc;
  }, {});

  const tasksDone = wedding.tasks.filter((t) => t.status === "DONE").length;
  const upcomingTasks = wedding.tasks
    .filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS")
    .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
    .slice(0, 5);

  // Server actions
  async function updateMyTaskStatus(formData: FormData) {
    "use server";
    const taskId = formData.get("taskId") as string;
    const status = formData.get("status") as TaskStatus;
    const inner = await getServerSession(authOptions);
    if (!inner?.user) return;
    const uid = (inner.user as { id: string }).id;
    const userEmail = inner.user.email ?? "";
    // Verify the task belongs to a wedding the user owns.
    const task = await prisma.weddingTask.findUnique({
      where: { id: taskId },
      include: { wedding: { include: { lead: { select: { email: true } } } } },
    });
    if (!task || !task.visibleToCouple) return;
    const ok =
      task.wedding.primaryClientId === uid ||
      task.wedding.partnerClientId === uid ||
      (userEmail && task.wedding.lead?.email === userEmail);
    if (!ok) return;
    await prisma.weddingTask.update({ where: { id: taskId }, data: { status } });
    revalidatePath("/portal/wedding");
  }

  async function postMyMessage(formData: FormData) {
    "use server";
    const body = (formData.get("body") as string)?.trim();
    if (!body) return;
    const inner = await getServerSession(authOptions);
    if (!inner?.user) return;
    const uid = (inner.user as { id: string }).id;
    const userEmail = inner.user.email ?? "";
    const w = await prisma.wedding.findFirst({
      where: {
        OR: [
          { primaryClientId: uid },
          { partnerClientId: uid },
          ...(userEmail ? [{ lead: { email: userEmail } }] : []),
        ],
      },
      select: { id: true },
    });
    if (!w) return;
    await prisma.weddingMessage.create({
      data: { weddingId: w.id, body, authorId: uid },
    });
    revalidatePath("/portal/wedding");
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 sm:p-8">
        <p className="font-sans text-xs uppercase tracking-widest text-brand-pink-500 mb-1">
          Your Wedding
        </p>
        <h1 className="font-serif text-3xl text-brand-orange-700">{couple}</h1>
        <p className="font-sans text-sm text-gray-500 mt-1">
          {wedding.weddingDate ? formatShortDate(wedding.weddingDate) : "Date TBD"}
          {wedding.venue && ` · ${wedding.venue}`}
          {" · "}
          {WEDDING_STATUS_LABELS[wedding.status]}
        </p>
        {wedding.notes && (
          <p className="font-sans text-sm text-gray-600 mt-4 whitespace-pre-wrap">
            {wedding.notes}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Tasks" value={`${tasksDone} / ${wedding.tasks.length}`} subtitle="done" />
        <StatCard label="Booked vendors" value={String(wedding.vendors.length)} />
        <StatCard
          label="Days to go"
          value={
            wedding.weddingDate
              ? String(
                  Math.max(
                    0,
                    Math.ceil((wedding.weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                  ),
                )
              : "—"
          }
        />
      </div>

      {/* Upcoming tasks */}
      {upcomingTasks.length > 0 && (
        <section className="bg-white p-6">
          <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-4">
            Next up
          </h2>
          <ul className="space-y-2">
            {upcomingTasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm font-sans">
                <span>{t.title}</span>
                {t.dueDate && (
                  <span className="text-xs text-gray-500">{formatShortDate(t.dueDate)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Full timeline */}
      <section className="bg-white p-6">
        <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-4">
          Wedding Timeline
        </h2>
        {wedding.tasks.length === 0 ? (
          <p className="text-xs text-gray-400 font-sans">
            Your planner will add tasks here as they're built out.
          </p>
        ) : (
          <div className="space-y-6">
            {MILESTONE_TEMPLATES.concat([{ key: "OTHER", label: "Other", monthsBefore: 0, tasks: [] }]).map((m) => {
              const tasks = tasksByMilestone[m.key];
              if (!tasks?.length) return null;
              return (
                <div key={m.key}>
                  <p className="font-sans text-xs font-semibold text-gray-500 mb-2">{m.label}</p>
                  <ul className="space-y-1.5">
                    {tasks.map((t) => (
                      <li key={t.id} className="flex items-center gap-3 text-sm font-sans py-1 border-b border-gray-50">
                        <form action={updateMyTaskStatus}>
                          <input type="hidden" name="taskId" value={t.id} />
                          <AutoSubmitSelect
                            name="status"
                            defaultValue={t.status}
                            className="text-xs border border-gray-200 rounded px-1.5 py-1"
                          >
                            {TASK_STATUSES.map((s) => (
                              <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
                            ))}
                          </AutoSubmitSelect>
                        </form>
                        <span className={`flex-1 ${t.status === "DONE" ? "line-through text-gray-400" : ""}`}>
                          {t.title}
                        </span>
                        {t.dueDate && (
                          <span className="text-xs text-gray-500">{formatShortDate(t.dueDate)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Vendors */}
      {wedding.vendors.length > 0 && (
        <section className="bg-white p-6">
          <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-4">
            Your Vendor Team
          </h2>
          <ul className="space-y-3">
            {wedding.vendors.map((v) => (
              <li key={v.id} className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm font-semibold">{v.name}</p>
                  <p className="text-xs font-sans text-gray-400">{v.category}</p>
                </div>
                <div className="text-right text-xs font-sans">
                  <p className="text-brand-orange-700">{VENDOR_STATUS_LABELS[v.status]}</p>
                  {v.cost != null && (
                    <p className="text-gray-500 mt-0.5">{fmtMoney(Number(v.cost))}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Messages with planner */}
      <section className="bg-white p-6">
        <h2 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-4">
          Messages with your planner
        </h2>

        <form action={postMyMessage} className="space-y-2 mb-6">
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Send a message to your planner…"
            className="w-full input-field resize-none"
          />
          <div className="flex justify-end">
            <button className="bg-brand-orange-700 text-white px-4 py-1.5 rounded text-xs">
              Send
            </button>
          </div>
        </form>

        {wedding.messages.length === 0 ? (
          <p className="text-xs text-gray-400 font-sans">No messages yet.</p>
        ) : (
          <ul className="space-y-3">
            {wedding.messages.map((m) => {
              const fromPlanner = m.author?.role === "ADMIN";
              return (
                <li
                  key={m.id}
                  className={`border-l-2 pl-4 ${
                    fromPlanner ? "border-brand-pink-200" : "border-brand-orange-200"
                  }`}
                >
                  <p className="text-xs font-sans text-gray-400 mb-1">
                    {fromPlanner ? "Your planner" : "You"} · {formatShortDate(m.createdAt)}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                </li>
              );
            })}
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
