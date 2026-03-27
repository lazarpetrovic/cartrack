"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  markRepairCompletedForOwner,
  getRepairRequestsForOwner,
  type RepairRequest,
} from "@/src/lib/cars";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
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
      const requestResult = await getRepairRequestsForOwner(user.uid);
      setRepairRequests(requestResult);
    })();
  }, [user]);

  const activeRequests = useMemo(
    () =>
      repairRequests.filter((r) =>
        ["scheduled", "accepted", "dropped_off", "in_progress", "ready_for_pickup"].includes(
          r.status
        )
      ),
    [repairRequests]
  );
  const readyForPickupCount = useMemo(
    () => activeRequests.filter((r) => r.status === "ready_for_pickup").length,
    [activeRequests]
  );
  const inServiceCount = useMemo(
    () => activeRequests.filter((r) => r.status === "in_progress").length,
    [activeRequests]
  );
  const waitingMechanicCount = useMemo(
    () => activeRequests.filter((r) => r.status === "scheduled").length,
    [activeRequests]
  );
  const closedCount = useMemo(
    () => repairRequests.filter((r) => ["completed", "rejected", "cancelled"].includes(r.status)).length,
    [repairRequests]
  );

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

  const statusText = (status: RepairRequest["status"]) => {
    if (status === "scheduled") return "Waiting for mechanic confirmation";
    if (status === "accepted") return "Accepted - drop off your car";
    if (status === "dropped_off") return "Car has been dropped off";
    if (status === "in_progress") return "Car is in service";
    if (status === "ready_for_pickup") return "Ready for pickup";
    if (status === "completed") return "Completed";
    if (status === "rejected") return "Rejected";
    return status.replace("_", " ");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            User overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Everything important in one place: service status and next step.
          </p>
        </div>
        <Button type="button" onClick={() => router.push("/dashboard/user/cars")}>
          Go to my cars
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Waiting response</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{waitingMechanicCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>In service</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{inServiceCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ready for pickup</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{readyForPickupCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Closed requests</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{closedCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active requests</CardTitle>
          <CardDescription>
            Only ongoing requests. Open the specific car for full details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-background/40 px-4 py-5 text-sm text-muted-foreground">
              You have no active requests.
            </div>
          ) : (
            activeRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/40 px-4 py-3"
              >
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {request.carLabel || "Vehicle"} - {request.mechanicName}
                  </p>
                  <p className="text-sm text-muted-foreground">{statusText(request.status)}</p>
                  {request.dropOffDate ? (
                    <p className="text-sm text-muted-foreground">
                      Drop-off date: {request.dropOffDate}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/user/cars/${request.carId}`)}
                  >
                    Open car
                  </Button>
                  {request.status === "ready_for_pickup" ? (
                    <Button
                      type="button"
                      disabled={confirmingPickupId === request.id}
                      onClick={() => void handleConfirmPickup(request.id)}
                    >
                      {confirmingPickupId === request.id ? "Confirming..." : "Confirm pickup"}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

