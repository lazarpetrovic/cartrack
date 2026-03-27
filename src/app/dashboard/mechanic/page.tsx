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
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import {
  getOpenMaintenanceChangeRequestsForMechanic,
  getRepairScheduleForMechanicDate,
  getRepairRequestsForMechanicToday,
  markRepairInProgress,
  resolveMaintenanceChangeRequestForMechanic,
  softDeleteMaintenanceForMechanic,
  updateMaintenanceForMechanic,
  updateRepairRequestStatusForMechanic,
  type MaintenanceChangeRequest,
  type RepairRequest,
} from "@/src/lib/cars";

export default function MechanicDashboardPage() {
  const { user } = useAuth();
  const { showError, showToast } = useToast();
  const router = useRouter();
  const [todayRequests, setTodayRequests] = useState<RepairRequest[]>([]);
  const [todayVehicles, setTodayVehicles] = useState<RepairRequest[]>([]);
  const [changeRequests, setChangeRequests] = useState<MaintenanceChangeRequest[]>([]);
  const [selectedChangeRequest, setSelectedChangeRequest] = useState<MaintenanceChangeRequest | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");
  const [editServiceDate, setEditServiceDate] = useState("");
  const [editMileage, setEditMileage] = useState("");
  const [editPartsPrice, setEditPartsPrice] = useState("");
  const [editLaborPrice, setEditLaborPrice] = useState("");
  const [editTotalPrice, setEditTotalPrice] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingMaintenanceEdit, setSavingMaintenanceEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [changeRequestsLoading, setChangeRequestsLoading] = useState(true);
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

  useEffect(() => {
    if (!user || user.role !== "mechanic") return;
    const run = async () => {
      setChangeRequestsLoading(true);
      try {
        const requests = await getOpenMaintenanceChangeRequestsForMechanic(user.uid);
        setChangeRequests(requests);
      } finally {
        setChangeRequestsLoading(false);
      }
    };
    void run();
  }, [user]);

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

  const getMaintenanceTypeLabel = (title: string) => {
    const normalized = title.trim().toLowerCase();
    if (normalized.includes("oil")) return "Oil change";
    if (normalized.includes("timing")) return "Timing service";
    if (normalized.includes("brake")) return "Brake service";
    if (normalized.includes("inspection")) return "Inspection";
    return "Other";
  };

  const openEditModal = (request: MaintenanceChangeRequest) => {
    setSelectedChangeRequest(request);
    setEditTitle(request.maintenanceTitle ?? "");
    setEditServiceDate(request.serviceDate ?? "");
    setEditMileage(String(request.mileage ?? 0));
    setEditPartsPrice(String(Number(request.partsPrice ?? 0)));
    setEditLaborPrice(String(Number(request.laborPrice ?? 0)));
    setEditTotalPrice(String(Number(request.totalPrice ?? 0)));
    setEditNotes(request.notes ?? "");
  };

  const closeEditModal = () => {
    setSelectedChangeRequest(null);
    setEditTitle("");
    setEditServiceDate("");
    setEditMileage("");
    setEditPartsPrice("");
    setEditLaborPrice("");
    setEditTotalPrice("");
    setEditNotes("");
  };

  const handleSaveMaintenanceEdit = async () => {
    if (!user || !selectedChangeRequest) return;
    if (!editTitle.trim()) {
      showError("Maintenance title is required.");
      return;
    }
    if (!editServiceDate.trim()) {
      showError("Service date is required.");
      return;
    }
    try {
      setSavingMaintenanceEdit(true);
      await updateMaintenanceForMechanic(user.uid, selectedChangeRequest.maintenanceId, {
        title: editTitle.trim(),
        serviceDate: editServiceDate.trim(),
        mileage: Number(editMileage) || 0,
        notes: editNotes.trim(),
        partsPrice: Number(editPartsPrice) || 0,
        laborPrice: Number(editLaborPrice) || 0,
        totalPrice: Number(editTotalPrice) || 0,
      });
      await resolveMaintenanceChangeRequestForMechanic(
        user.uid,
        selectedChangeRequest.id,
        "resolved"
      );
      setChangeRequests((prev) =>
        prev.filter((request) => request.id !== selectedChangeRequest.id)
      );
      closeEditModal();
      showToast("Maintenance entry updated.", "success");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not update maintenance entry.";
      showError(message);
    } finally {
      setSavingMaintenanceEdit(false);
    }
  };

  const handleSoftDeleteMaintenance = async (request: MaintenanceChangeRequest) => {
    if (!user) return;
    try {
      await softDeleteMaintenanceForMechanic(
        user.uid,
        request.maintenanceId,
        "Deleted after correction request review."
      );
      await resolveMaintenanceChangeRequestForMechanic(user.uid, request.id, "resolved");
      setChangeRequests((prev) => prev.filter((item) => item.id !== request.id));
      showToast("Maintenance entry was soft deleted.", "success");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not soft delete maintenance entry.";
      showError(message);
    }
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

      <Card>
        <CardHeader>
          <CardTitle>Maintenance correction requests</CardTitle>
          <CardDescription>
            Owners can request corrections if a maintenance entry is incomplete or incorrect.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {changeRequestsLoading ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-3 text-xs text-muted-foreground">
              Loading requests...
            </div>
          ) : changeRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-3 text-xs text-muted-foreground">
              No open correction requests.
            </div>
          ) : (
            changeRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {request.maintenanceTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Service date: {request.serviceDate} - Mileage: {request.mileage} km
                    </p>
                    <p className="mt-1 text-xs text-amber-100/90">
                      Owner request: {request.ownerNote}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(request)}
                    >
                      Edit maintenance
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-rose-400/50 text-rose-200 hover:bg-rose-500/15"
                      onClick={() => void handleSoftDeleteMaintenance(request)}
                    >
                      Soft delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Modal
        open={selectedChangeRequest !== null}
        onClose={() => !savingMaintenanceEdit && closeEditModal()}
        title="Edit maintenance"
      >
        {selectedChangeRequest ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-background/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Current entry overview
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex min-h-[74px] flex-col justify-between rounded-md border border-border/50 bg-background/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Repair type
                  </p>
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {getMaintenanceTypeLabel(selectedChangeRequest.maintenanceTitle)}
                  </p>
                </div>
                <div className="flex min-h-[74px] flex-col justify-between rounded-md border border-border/50 bg-background/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Original title
                  </p>
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {selectedChangeRequest.maintenanceTitle}
                  </p>
                </div>
                <div className="flex min-h-[74px] flex-col justify-between rounded-md border border-border/50 bg-background/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Original date
                  </p>
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {selectedChangeRequest.serviceDate}
                  </p>
                </div>
                <div className="flex min-h-[74px] flex-col justify-between rounded-md border border-border/50 bg-background/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Original mileage
                  </p>
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {selectedChangeRequest.mileage} km
                  </p>
                </div>
              </div>
              <div className="mt-2 rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-amber-200">
                  Owner correction note
                </p>
                <p className="text-sm text-amber-100/90">{selectedChangeRequest.ownerNote}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Maintenance title</p>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Maintenance title"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Service date</p>
                <Input
                  value={editServiceDate}
                  onChange={(e) => setEditServiceDate(e.target.value)}
                  type="date"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Mileage (km)</p>
                <Input
                  value={editMileage}
                  onChange={(e) => setEditMileage(e.target.value)}
                  type="number"
                  min={0}
                  placeholder="Mileage"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Parts price (EUR)</p>
                <Input
                  value={editPartsPrice}
                  onChange={(e) => setEditPartsPrice(e.target.value)}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Parts"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Labor price (EUR)</p>
                <Input
                  value={editLaborPrice}
                  onChange={(e) => setEditLaborPrice(e.target.value)}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Labor"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Total price (EUR)</p>
                <Input
                  value={editTotalPrice}
                  onChange={(e) => setEditTotalPrice(e.target.value)}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Total"
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Maintenance notes</p>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
                placeholder="Maintenance notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditModal}
                disabled={savingMaintenanceEdit}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleSaveMaintenanceEdit()}
                disabled={savingMaintenanceEdit}
              >
                {savingMaintenanceEdit ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

