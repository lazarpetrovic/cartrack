'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { useToast } from "@/src/context/ToastContext";
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
  const { showError } = useToast();
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

  const scheduledRequests = useMemo(
    () => todayRequests.filter((r) => r.status === "scheduled"),
    [todayRequests]
  );
  const pendingCount = scheduledRequests.length;
  const activeVehicles = useMemo(
    () => todayVehicles.filter((r) => r.status === "dropped_off" || r.status === "in_progress"),
    [todayVehicles]
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
      showError("Please choose a drop-off date before accepting.");
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

  const getStatusText = (status: RepairRequest["status"]) => {
    if (status === "scheduled") return "New request";
    if (status === "accepted") return "Awaiting drop-off";
    if (status === "dropped_off") return "Dropped off";
    if (status === "in_progress") return "In service";
    if (status === "ready_for_pickup") return "Ready for pickup";
    if (status === "rejected") return "Rejected";
    return status.replace("_", " ");
  };

  const handleStartService = async (request: RepairRequest) => {
    if (!user) return;
    if (request.status === "dropped_off") {
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Mechanic - today overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Two things: process new requests and start services for today's vehicles.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>New requests today</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{pendingCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active vehicles today</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{activeVehicles.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ready for pickup</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{readyForPickupCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New requests (today)</CardTitle>
          <CardDescription>Accept or reject with one click.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-background/40 px-4 py-5 text-sm text-muted-foreground">
              Loading requests...
            </div>
          ) : scheduledRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-background/40 px-4 py-5 text-sm text-muted-foreground">
              No new requests today.
            </div>
          ) : (
            scheduledRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-border/70 bg-background/40 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {req.ownerName || "Owner"} - {req.carLabel || "Vehicle"}
                    </p>
                    <p className="text-sm text-muted-foreground">{req.note}</p>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{getStatusText(req.status)}</p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={acceptDates[req.id] ?? ""}
                    onChange={(e) =>
                      setAcceptDates((prev) => ({
                        ...prev,
                        [req.id]: e.target.value,
                      }))
                    }
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleStatus(req.id, "rejected")}
                    disabled={updatingId === req.id}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleStatus(req.id, "accepted")}
                    disabled={updatingId === req.id}
                  >
                    {updatingId === req.id ? "Saving..." : "Accept"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicles for service (today)</CardTitle>
          <CardDescription>Click Start service and finish through the maintenance form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {vehiclesLoading ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-background/40 px-4 py-5 text-sm text-muted-foreground">
              Loading vehicles...
            </div>
          ) : activeVehicles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-background/40 px-4 py-5 text-sm text-muted-foreground">
              No active vehicles for today.
            </div>
          ) : (
            activeVehicles.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/40 px-4 py-3"
              >
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {request.carLabel || "Vehicle"} - {request.ownerName || "Owner"}
                  </p>
                  <p className="text-sm text-muted-foreground">{getStatusText(request.status)}</p>
                </div>
                <Button type="button" onClick={() => void handleStartService(request)}>
                  {request.status === "in_progress" ? "Continue service" : "Start service"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

