'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  getRepairScheduleForMechanicDate,
  getRepairRequestsForMechanicToday,
  markRepairInProgress,
  updateRepairRequestStatusForMechanic,
  type RepairRequest,
} from "@/src/lib/cars";

export default function MechanicDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [todayRequests, setTodayRequests] = useState<RepairRequest[]>([]);
  const [todayVehicles, setTodayVehicles] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [acceptDates, setAcceptDates] = useState<Record<string, string>>({});
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (user && user.role === "user") {
      router.replace("/dashboard/user");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== "mechanic") return;
    const run = async () => {
      setLoading(true);
      try {
        const requests = await getRepairRequestsForMechanicToday(user.uid);
        setTodayRequests(requests);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "mechanic") return;
    const run = async () => {
      setVehiclesLoading(true);
      try {
        const requests = await getRepairScheduleForMechanicDate(user.uid, todayDate);
        setTodayVehicles(requests);
      } finally {
        setVehiclesLoading(false);
      }
    };
    void run();
  }, [user, todayDate]);

  const pendingCount = useMemo(
    () => todayRequests.filter((r) => r.status === "scheduled").length,
    [todayRequests]
  );
  const scheduledRequests = useMemo(
    () => todayRequests.filter((r) => r.status === "scheduled"),
    [todayRequests]
  );
  const readyForPickupCount = useMemo(
    () => todayVehicles.filter((r) => r.status === "ready_for_pickup").length,
    [todayVehicles]
  );

  const handleStatus = async (
    requestId: string,
    status: "accepted" | "rejected"
  ) => {
    if (!user) return;
    const dropOffDate = acceptDates[requestId];
    if (status === "accepted" && !dropOffDate) {
      alert("Please choose a drop-off date before accepting.");
      return;
    }
    setUpdatingId(requestId);
    try {
      await updateRepairRequestStatusForMechanic(
        user.uid,
        requestId,
        status,
        status === "accepted" ? dropOffDate : undefined
      );
      setTodayRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status,
                dropOffDate:
                  status === "accepted" ? dropOffDate : r.dropOffDate,
              }
            : r
        )
      );
      setTodayVehicles((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status,
                dropOffDate:
                  status === "accepted" ? dropOffDate : r.dropOffDate,
              }
            : r
        )
      );
      setAcceptDates((prev) => ({ ...prev, [requestId]: "" }));
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusPillClass = (status: RepairRequest["status"]) => {
    if (status === "accepted") {
      return "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
    }
    if (status === "rejected") {
      return "border border-rose-400/30 bg-rose-500/10 text-rose-300";
    }
    if (status === "ready_for_pickup") {
      return "border border-sky-400/30 bg-sky-500/10 text-sky-300";
    }
    return "border border-slate-500/30 bg-slate-500/10 text-slate-300";
  };

  const handleStartService = async (request: RepairRequest) => {
    if (!user) return;
    if (request.status === "accepted") {
      await markRepairInProgress(user.uid, request.id);
      setTodayRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "in_progress" } : r))
      );
      setTodayVehicles((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "in_progress" } : r))
      );
    }
    router.push(`/dashboard/mechanic/service/${request.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Mechanic workspace
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage incoming service requests and stay on top of your clients.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>New requests today</CardTitle>
              <CardDescription>Waiting for your decision</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {pendingCount}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Vehicles for today</CardTitle>
              <CardDescription>Drop-off list for {todayDate}</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {todayVehicles.length}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Ready for pickup</CardTitle>
              <CardDescription>Finished and waiting owner</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {readyForPickupCount}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.section
        className="space-y-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Today&apos;s vehicles for repair</CardTitle>
              <CardDescription>
                Work planned for today, including active services and finished pickups.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {vehiclesLoading ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-4 text-sm text-muted-foreground">
                Loading today&apos;s vehicles...
              </div>
            ) : todayVehicles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-4 text-sm text-muted-foreground">
                No vehicles scheduled for today.
              </div>
            ) : (
              todayVehicles.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {request.carLabel || "Vehicle"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Client: {request.ownerName || "Car owner"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{request.note}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(request.status === "accepted" || request.status === "in_progress") && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => void handleStartService(request)}
                      >
                        Start service
                      </Button>
                    )}
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-medium capitalize ${getStatusPillClass(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.section>

      <div className="flex flex-col">
        {(loading || scheduledRequests.length > 0) && (
          <motion.section
            className="space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Requests sent today</CardTitle>
                  <CardDescription>Incoming requests created today</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border border-border/60 bg-background/40">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-muted/60 text-sm uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Client</th>
                        <th className="px-3 py-2">Car</th>
                        <th className="px-3 py-2">Issue</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Drop-off date</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr className="border-t border-border/40 text-sm text-muted-foreground">
                          <td className="px-3 py-4" colSpan={6}>
                            Loading today&apos;s requests...
                          </td>
                        </tr>
                      ) : (
                        scheduledRequests.map((req) => (
                          <tr
                            key={req.id}
                            className="border-t border-border/40 text-sm text-foreground/90"
                          >
                            <td className="px-3 py-2">{req.ownerName || "Car owner"}</td>
                            <td className="px-3 py-2">{req.carLabel || "Vehicle"}</td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {req.note}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-medium capitalize ${getStatusPillClass(
                                  req.status
                                )}`}
                              >
                                {req.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {req.status === "accepted" && req.dropOffDate ? (
                                req.dropOffDate
                              ) : req.status === "scheduled" ? (
                                <input
                                  type="date"
                                  value={acceptDates[req.id] ?? ""}
                                  onChange={(e) =>
                                    setAcceptDates((prev) => ({
                                      ...prev,
                                      [req.id]: e.target.value,
                                    }))
                                  }
                                  className="h-7 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
                                />
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  type="button"
                                  className="py-4 px-2.5 text-md bg-gray-500"
                                  onClick={() => handleStatus(req.id, "rejected")}
                                  disabled={updatingId === req.id || req.status !== "scheduled"}
                                >
                                  {updatingId === req.id ? "Updating..." : "Reject date"}
                                </Button>
                                <Button
                                  type="button"
                                  className="py-4 px-2.5 text-md"
                                  onClick={() => handleStatus(req.id, "accepted")}
                                  disabled={updatingId === req.id || req.status !== "scheduled"}
                                >
                                  {updatingId === req.id ? "Updating..." : "Accept date"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

      </div>
    </div>
  );
}

