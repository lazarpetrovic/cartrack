"use client";

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
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  getCarsForUser,
  markRepairCompletedForOwner,
  getRepairRequestsForOwner,
  type Car,
  type RepairRequest,
} from "@/src/lib/cars";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [confirmingPickupId, setConfirmingPickupId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === "mechanic") {
      router.replace("/dashboard/mechanic");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [carResult, requestResult] = await Promise.all([
        getCarsForUser(user.uid),
        getRepairRequestsForOwner(user.uid),
      ]);
      setCars(carResult);
      setRepairRequests(requestResult);
    })();
  }, [user]);

  const acceptedRequests = useMemo(
    () => repairRequests.filter((r) => r.status === "accepted"),
    [repairRequests]
  );
  const rejectedRequests = useMemo(
    () => repairRequests.filter((r) => r.status === "rejected"),
    [repairRequests]
  );
  const inServiceRequests = useMemo(
    () => repairRequests.filter((r) => r.status === "in_progress"),
    [repairRequests]
  );
  const readyForPickupRequests = useMemo(
    () => repairRequests.filter((r) => r.status === "ready_for_pickup"),
    [repairRequests]
  );
  const finishedRequests = useMemo(
    () => repairRequests.filter((r) => r.status === "completed"),
    [repairRequests]
  );
  const awaitingDecisionRequests = useMemo(
    () => repairRequests.filter((r) => r.status === "scheduled"),
    [repairRequests]
  );

  const getRequestStatusPillClass = (status: RepairRequest["status"]) => {
    if (status === "accepted") {
      return "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
    }
    if (status === "rejected") {
      return "border border-rose-400/30 bg-rose-500/10 text-rose-300";
    }
    if (status === "ready_for_pickup") {
      return "border border-sky-400/30 bg-sky-500/10 text-sky-300";
    }
    if (status === "in_progress") {
      return "border border-amber-400/30 bg-amber-500/10 text-amber-200";
    }
    if (status === "completed") {
      return "border border-indigo-400/30 bg-indigo-500/10 text-indigo-300";
    }
    return "border border-slate-500/30 bg-slate-500/10 text-slate-300";
  };

  const handleConfirmPickup = async (requestId: string) => {
    if (!user) return;
    setConfirmingPickupId(requestId);
    try {
      await markRepairCompletedForOwner(user.uid, requestId);
      setRepairRequests((prev) =>
        prev.map((request) =>
          request.id === requestId ? { ...request, status: "completed" } : request
        )
      );
    } finally {
      setConfirmingPickupId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Welcome back{user?.email ? `, ${user.email}` : ""}.
        </h1>
        <p className="text-xs text-muted-foreground">
          Here&apos;s what&apos;s happening with your cars today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Total cars</CardTitle>
              <Badge variant="outline">{cars.length}</Badge>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {cars.length}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                active
              </span>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Need drop-off</CardTitle>
              <CardDescription>Accepted by mechanic</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {acceptedRequests.length}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Ready for pickup</CardTitle>
              <CardDescription>Cars waiting for you</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {readyForPickupRequests.length}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <motion.section
          className="space-y-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Repair request flow</CardTitle>
                <CardDescription>
                  Track approvals, drop-off dates, service progress and pickup.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border/60 bg-background/40">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Car</th>
                      <th className="px-3 py-2">Mechanic</th>
                      <th className="px-3 py-2">Next step</th>
                      <th className="px-3 py-2">Drop-off</th>
                      <th className="px-3 py-2 text-right">Status</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairRequests.length === 0 ? (
                      <tr className="border-t border-border/40 text-[11px] text-muted-foreground">
                        <td className="px-3 py-3" colSpan={6}>
                          No repair requests yet. Open a vehicle to schedule one.
                        </td>
                      </tr>
                    ) : (
                      repairRequests.map((request) => {
                        const requestCar = cars.find((c) => c.id === request.carId);
                        const carLabel =
                          request.carLabel ||
                          (requestCar ? `${requestCar.make} ${requestCar.model}` : "Vehicle");
                        const nextStep =
                          request.status === "scheduled"
                            ? "Waiting for mechanic response"
                            : request.status === "accepted"
                              ? "Drop-off your car"
                              : request.status === "in_progress"
                                ? "Car is being serviced"
                                : request.status === "ready_for_pickup"
                                  ? "Pick up your car"
                                  : request.status === "completed"
                                    ? "Service finished"
                                    : request.status === "rejected"
                                      ? "Choose another mechanic"
                                      : "-";
                        return (
                          <tr
                            key={request.id}
                            className="border-t border-border/40 text-[11px] text-foreground/90"
                          >
                            <td className="px-3 py-2">{carLabel}</td>
                            <td className="px-3 py-2">{request.mechanicName}</td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {nextStep}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {request.dropOffDate || "-"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-medium capitalize ${getRequestStatusPillClass(
                                  request.status
                                )}`}
                              >
                                {request.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              {request.status === "ready_for_pickup" ? (
                                <Button
                                  type="button"
                                  size="md"
                                  variant="outline"
                                  className="py-4 px-2.5 text-md"
                                  disabled={confirmingPickupId === request.id}
                                  onClick={() => void handleConfirmPickup(request.id)}
                                >
                                  {confirmingPickupId === request.id
                                    ? "Confirming..."
                                    : "Confirm pickup"}
                                </Button>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          className="space-y-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Request status groups</CardTitle>
                <CardDescription>What needs action right now</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                <p className="font-medium text-foreground">Awaiting response</p>
                <p className="text-muted-foreground">
                  {awaitingDecisionRequests.length} request
                  {awaitingDecisionRequests.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2">
                <p className="font-medium text-emerald-200">Accepted</p>
                <p className="text-emerald-100/80">
                  {acceptedRequests.length} accepted - check drop-off date
                </p>
              </div>
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                <p className="font-medium text-amber-200">In service</p>
                <p className="text-amber-100/80">
                  {inServiceRequests.length} currently being worked on
                </p>
              </div>
              <div className="rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2">
                <p className="font-medium text-sky-200">Ready for pickup</p>
                <p className="text-sky-100/80">
                  {readyForPickupRequests.length} waiting for pickup (confirm to move to history)
                </p>
              </div>
              <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2">
                <p className="font-medium text-rose-200">Rejected</p>
                <p className="text-rose-100/80">
                  {rejectedRequests.length} rejected - schedule another request
                </p>
              </div>
              <div className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-2">
                <p className="font-medium text-indigo-200">Finished</p>
                <p className="text-indigo-100/80">
                  {finishedRequests.length} completed requests
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}

