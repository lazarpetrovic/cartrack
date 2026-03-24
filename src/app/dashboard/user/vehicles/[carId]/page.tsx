
'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/src/hooks/useAuth";
import { getMechanics, type MechanicProfile } from "@/src/lib/auth";
import {
  deleteCarForUser,
  getCarByIdForUser,
  getMaintenanceForCar,
  markRepairCompletedForOwner,
  getRepairRequestsForCar,
  scheduleRepairForCar,
  subscribeMaintenanceForCar,
  updateCarForUser,
  type Car,
  type MaintenanceEntry,
  type RepairRequest,
} from "@/src/lib/cars";
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

export default function VehicleDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ carId: string }>();
  const carId = useMemo(() => params?.carId ?? "", [params]);

  const [car, setCar] = useState<Car | null>(null);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceEntry[]>([]);
  const [mechanics, setMechanics] = useState<MechanicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCar, setEditingCar] = useState(false);
  const [savingCar, setSavingCar] = useState(false);
  const [deletingCar, setDeletingCar] = useState(false);
  const [schedulingRepair, setSchedulingRepair] = useState(false);
  const [confirmingPickupId, setConfirmingPickupId] = useState<string | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceEntry | null>(null);
  const [carForm, setCarForm] = useState<Omit<Car, "id" | "ownerId">>({
    make: "",
    model: "",
    mileage: 0,
    year: new Date().getFullYear(),
    fuelType: "",
    drivetrain: "",
    transmission: "",
    vin: "",
  });

  const [selectedMechanicId, setSelectedMechanicId] = useState("");
  const [repairNote, setRepairNote] = useState("");

  const formatMoney = (value?: number) => {
    const safe = Number(value ?? 0);
    return `${safe.toFixed(2)} EUR`;
  };
  const getMaintenanceTotal = (entry: MaintenanceEntry) => {
    const total = Number(entry.totalPrice ?? 0);
    if (total > 0) return total;
    return Number(entry.partsPrice ?? 0) + Number(entry.laborPrice ?? 0);
  };

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

  const awaitingRequests = useMemo(
    () => repairRequests.filter((request) => request.status === "scheduled"),
    [repairRequests]
  );
  const acceptedRequests = useMemo(
    () => repairRequests.filter((request) => request.status === "accepted"),
    [repairRequests]
  );
  const rejectedRequests = useMemo(
    () => repairRequests.filter((request) => request.status === "rejected"),
    [repairRequests]
  );
  const inServiceRequests = useMemo(
    () => repairRequests.filter((request) => request.status === "in_progress"),
    [repairRequests]
  );
  const pickupRequests = useMemo(
    () => repairRequests.filter((request) => request.status === "ready_for_pickup"),
    [repairRequests]
  );
  useEffect(() => {
    if (!user) return;
    if (user.role === "mechanic") {
      router.replace("/dashboard/mechanic");
      return;
    }

    const run = async () => {
      setLoading(true);
      const [carResult, mechanicsResult] = await Promise.all([
        getCarByIdForUser(user.uid, carId),
        getMechanics(),
      ]);

      if (!carResult) {
        setCar(null);
        setRepairRequests([]);
        setMaintenance([]);
        setMechanics(mechanicsResult);
        setLoading(false);
        return;
      }

      const [requests, maintenanceEntries] = await Promise.all([
        getRepairRequestsForCar(user.uid, carId),
        getMaintenanceForCar(user.uid, carId),
      ]);
      setCar(carResult);
      setCarForm({
        make: carResult.make,
        model: carResult.model,
        mileage: carResult.mileage,
        year: carResult.year,
        fuelType: carResult.fuelType,
        drivetrain: carResult.drivetrain,
        transmission: carResult.transmission,
        vin: carResult.vin,
      });
      setMechanics(mechanicsResult);
      setSelectedMechanicId(mechanicsResult[0]?.uid ?? "");
      setRepairRequests(requests);
      setMaintenance(maintenanceEntries);
      setLoading(false);
    };

    void run();
  }, [user, carId, router]);

  useEffect(() => {
    if (!user || !carId) return;
    const unsubscribe = subscribeMaintenanceForCar(user.uid, carId, (entries) => {
      setMaintenance(entries);
    });
    return () => unsubscribe();
  }, [user, carId]);

  const handleScheduleRepair = async () => {
    if (!user || !car || !selectedMechanicId || !repairNote.trim()) return;
    const mechanic = mechanics.find((m) => m.uid === selectedMechanicId);
    if (!mechanic) return;

    setSchedulingRepair(true);
    try {
      const mechanicName = `${mechanic.firstName} ${mechanic.lastName}`.trim() || mechanic.email;
      const ownerName =
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
        user.email ||
        "Car owner";
      const carLabel = `${car.make} ${car.model}`.trim();
      const carMileage = car.mileage;

      const id = await scheduleRepairForCar(user.uid, car.id, {
        mechanicId: mechanic.uid,
        mechanicName,
        ownerName,
        carLabel,
        carMileage,
        note: repairNote.trim(),
      });

      setRepairRequests((prev) => [
        {
          id,
          ownerId: user.uid,
          carId: car.id,
          mechanicId: mechanic.uid,
          mechanicName,
          ownerName,
          carLabel,
          carMileage,
          note: repairNote.trim(),
          status: "scheduled",
          createdAtMs: Date.now(),
        },
        ...prev,
      ]);

      setRepairNote("");
    } finally {
      setSchedulingRepair(false);
    }
  };

  const handleSaveCar = async () => {
    if (!user || !car) return;
    setSavingCar(true);
    try {
      await updateCarForUser(user.uid, car.id, carForm);
      setCar({
        ...car,
        ...carForm,
      });
      setEditingCar(false);
    } finally {
      setSavingCar(false);
    }
  };

  const handleDeleteCar = async () => {
    if (!user || !car) return;
    const confirmed = window.confirm(
      "Delete this vehicle and all maintenance records for it? This cannot be undone."
    );
    if (!confirmed) return;

    setDeletingCar(true);
    try {
      await deleteCarForUser(user.uid, car.id);
      router.push("/dashboard/user/cars");
    } finally {
      setDeletingCar(false);
    }
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        <Card className="h-40 animate-pulse bg-muted/40" />
      </div>
    );
  }

  if (!car) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle not found</CardTitle>
          <CardDescription>
            This vehicle does not exist or is not part of your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => router.push("/dashboard/user/cars")}>
            Back to cars
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {car.make} {car.model}
          </h1>
          <p className="text-xs text-muted-foreground">
            Vehicle details and repair scheduling
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/user/cars")}
        >
          Back
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Vehicle information</CardTitle>
              <div className="flex gap-2">
                {editingCar ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCar(false);
                        setCarForm({
                          make: car.make,
                          model: car.model,
                          mileage: car.mileage,
                          year: car.year,
                          fuelType: car.fuelType,
                          drivetrain: car.drivetrain,
                          transmission: car.transmission,
                          vin: car.vin,
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveCar}
                      disabled={savingCar || !carForm.make || !carForm.model}
                    >
                      {savingCar ? "Saving..." : "Save"}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCar(true)}
                  >
                    Edit vehicle
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteCar}
                  disabled={deletingCar}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  {deletingCar ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Make</p>
              {editingCar ? (
                <Input
                  value={carForm.make}
                  onChange={(e) =>
                    setCarForm((prev) => ({ ...prev, make: e.target.value }))
                  }
                  placeholder="Make"
                />
              ) : (
                <p className="font-medium">{car.make}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Model</p>
              {editingCar ? (
                <Input
                  value={carForm.model}
                  onChange={(e) =>
                    setCarForm((prev) => ({ ...prev, model: e.target.value }))
                  }
                  placeholder="Model"
                />
              ) : (
                <p className="font-medium">{car.model}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Mileage</p>
              {editingCar ? (
                <Input
                  value={String(carForm.mileage)}
                  type="number"
                  min={0}
                  onChange={(e) =>
                    setCarForm((prev) => ({
                      ...prev,
                      mileage: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder="Mileage"
                />
              ) : (
                <p className="font-medium">{car.mileage} km</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Year</p>
              {editingCar ? (
                <Input
                  value={String(carForm.year)}
                  type="number"
                  min={1950}
                  max={new Date().getFullYear() + 1}
                  onChange={(e) =>
                    setCarForm((prev) => ({
                      ...prev,
                      year: Number(e.target.value) || prev.year,
                    }))
                  }
                  placeholder="Year"
                />
              ) : (
                <p className="font-medium">{car.year}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Fuel type</p>
              {editingCar ? (
                <Input
                  value={carForm.fuelType}
                  onChange={(e) =>
                    setCarForm((prev) => ({ ...prev, fuelType: e.target.value }))
                  }
                  placeholder="Fuel type"
                />
              ) : (
                <p className="font-medium">{car.fuelType}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Drivetrain</p>
              {editingCar ? (
                <Input
                  value={carForm.drivetrain}
                  onChange={(e) =>
                    setCarForm((prev) => ({ ...prev, drivetrain: e.target.value }))
                  }
                  placeholder="Drivetrain"
                />
              ) : (
                <p className="font-medium uppercase">{car.drivetrain}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Transmission</p>
              {editingCar ? (
                <Input
                  value={carForm.transmission}
                  onChange={(e) =>
                    setCarForm((prev) => ({
                      ...prev,
                      transmission: e.target.value,
                    }))
                  }
                  placeholder="Transmission"
                />
              ) : (
                <p className="font-medium capitalize">{car.transmission}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">VIN</p>
              {editingCar ? (
                <Input
                  value={carForm.vin}
                  onChange={(e) =>
                    setCarForm((prev) => ({ ...prev, vin: e.target.value }))
                  }
                  placeholder="VIN"
                />
              ) : (
                <p className="font-medium uppercase">{car.vin || "-"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule repair</CardTitle>
            <CardDescription>
              Choose a mechanic and leave a note about the issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
              value={selectedMechanicId}
              onChange={(e) => setSelectedMechanicId(e.target.value)}
            >
              {mechanics.length === 0 ? (
                <option value="">No mechanics available</option>
              ) : (
                mechanics.map((mechanic) => (
                  <option key={mechanic.uid} value={mechanic.uid}>
                    {`${mechanic.firstName} ${mechanic.lastName}`.trim() || mechanic.email}
                  </option>
                ))
              )}
            </select>
            <Input
              value={repairNote}
              onChange={(e) => setRepairNote(e.target.value)}
              placeholder="Describe the issue"
            />
            <Button
              type="button"
              onClick={handleScheduleRepair}
              disabled={
                schedulingRepair ||
                mechanics.length === 0 ||
                !selectedMechanicId ||
                !repairNote.trim()
              }
            >
              {schedulingRepair ? "Scheduling..." : "Schedule repair"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled repairs</CardTitle>
          <CardDescription>
            Repair requests for this vehicle grouped by status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {repairRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No repair requests yet. Schedule the first one above.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Awaiting response</p>
                {awaitingRequests.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-3 text-xs text-muted-foreground">
                    No pending requests.
                  </div>
                ) : (
                  awaitingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                    >
                      <p className="text-sm font-medium">{request.mechanicName}</p>
                      <p className="text-xs text-muted-foreground">
                        Waiting for mechanic confirmation
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{request.note}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Accepted - drop off</p>
                {acceptedRequests.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-3 text-xs text-muted-foreground">
                    No accepted requests.
                  </div>
                ) : (
                  acceptedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-lg border border-emerald-400/25 bg-emerald-500/5 px-3 py-2"
                    >
                      <p className="text-sm font-medium">{request.mechanicName}</p>
                      <p className="text-xs text-emerald-200/90">
                        Drop-off date:{" "}
                        {request.dropOffDate || "awaiting mechanic confirmation"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{request.note}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">In service</p>
                {inServiceRequests.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-3 text-xs text-muted-foreground">
                    No cars in service right now.
                  </div>
                ) : (
                  inServiceRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-lg border border-amber-400/25 bg-amber-500/5 px-3 py-2"
                    >
                      <p className="text-sm font-medium">{request.mechanicName}</p>
                      <p className="text-xs text-amber-100/90">
                        Your car is currently being serviced.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{request.note}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Ready for pickup
                </p>
                {pickupRequests.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-3 text-xs text-muted-foreground">
                    No cars are waiting for pickup.
                  </div>
                ) : (
                  pickupRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-lg border border-sky-400/25 bg-sky-500/5 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{request.mechanicName}</p>
                        <div className="flex items-center gap-2">
                          {request.status === "ready_for_pickup" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px]"
                              disabled={confirmingPickupId === request.id}
                              onClick={() => void handleConfirmPickup(request.id)}
                            >
                              {confirmingPickupId === request.id
                                ? "Confirming..."
                                : "Confirm pickup"}
                            </Button>
                          )}
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${getRequestStatusPillClass(
                              request.status
                            )}`}
                          >
                            {request.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-sky-100/90">
                        Your car is ready for pickup.
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-semibold text-foreground">Rejected</p>
                {rejectedRequests.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-3 text-xs text-muted-foreground">
                    No rejected requests.
                  </div>
                ) : (
                  rejectedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-start justify-between rounded-lg border border-rose-400/25 bg-rose-500/5 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{request.mechanicName}</p>
                        <p className="text-xs text-rose-100/90">
                          Request rejected. Please schedule with another mechanic.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{request.note}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-medium capitalize ${getRequestStatusPillClass(
                          request.status
                        )}`}
                      >
                        {request.status.replace("_", " ")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance history</CardTitle>
          <CardDescription>
            Work completed and planned by your mechanic(s).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {maintenance.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No maintenance records yet for this vehicle.
            </div>
          ) : (
            maintenance.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 transition hover:border-primary/40 hover:bg-background/60"
              >
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.serviceDate} • {item.mileage} km
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Parts: {formatMoney(item.partsPrice)} • Labor:{" "}
                    {formatMoney(item.laborPrice)} • Total:{" "}
                    <span className="font-medium text-foreground">
                      {formatMoney(item.totalPrice)}
                    </span>
                  </p>
                  {item.notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.notes}
                    </p>
                  ) : null}
                </div>
                <span
                  className="flex items-center gap-2"
                >
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-medium capitalize ${
                      item.status === "completed"
                        ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                        : "border border-slate-500/30 bg-slate-500/10 text-slate-300"
                    }`}
                  >
                    {item.status}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setSelectedMaintenance(item)}
                  >
                    Details
                  </Button>
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Modal
        open={selectedMaintenance !== null}
        onClose={() => setSelectedMaintenance(null)}
        title={selectedMaintenance ? selectedMaintenance.title : "Maintenance details"}
      >
        {selectedMaintenance ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-border/60 bg-background/40 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {selectedMaintenance.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Service date: {selectedMaintenance.serviceDate}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-medium capitalize ${
                    selectedMaintenance.status === "completed"
                      ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                      : "border border-slate-500/30 bg-slate-500/10 text-slate-300"
                  }`}
                >
                  {selectedMaintenance.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-border/60 bg-background/40 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Mileage at service
                </p>
                <p className="font-medium text-foreground">{selectedMaintenance.mileage} km</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/40 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Entry ID
                </p>
                <p className="truncate font-mono text-xs text-foreground">
                  {selectedMaintenance.id}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/40 p-3">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                Cost breakdown
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-md border border-border/60 bg-background/50 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Parts</p>
                  <p className="font-medium text-foreground">
                    {formatMoney(selectedMaintenance.partsPrice)}
                  </p>
                </div>
                <div className="rounded-md border border-border/60 bg-background/50 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Labor</p>
                  <p className="font-medium text-foreground">
                    {formatMoney(selectedMaintenance.laborPrice)}
                  </p>
                </div>
                <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2">
                  <p className="text-[11px] text-primary/80">Total</p>
                  <p className="font-semibold text-foreground">
                    {formatMoney(getMaintenanceTotal(selectedMaintenance))}
                  </p>
                </div>
              </div>
              {Number(selectedMaintenance.totalPrice ?? 0) <= 0 ? (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Total is calculated from parts + labor.
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-border/60 bg-background/40 p-3">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                Mechanic notes
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {selectedMaintenance.notes?.trim()
                  ? selectedMaintenance.notes
                  : "No additional notes were provided for this service."}
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedMaintenance(null)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

