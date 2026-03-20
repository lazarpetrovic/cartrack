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
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import {
  addMaintenanceForCar,
  getRepairScheduleForMechanicDate,
  getRepairRequestsForMechanicToday,
  updateRepairRequestStatusForMechanic,
  type RepairRequest,
} from "@/src/lib/cars";

export default function MechanicDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [todayRequests, setTodayRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [acceptDates, setAcceptDates] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [scheduledForDate, setScheduledForDate] = useState<RepairRequest[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<RepairRequest | null>(null);
  const [maintenanceType, setMaintenanceType] = useState<
    "oil_change" | "timing_service" | "brake_service" | "inspection" | "other"
  >("oil_change");
  const [maintenanceDate, setMaintenanceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [maintenanceMileage, setMaintenanceMileage] = useState("");
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  // Oil change inputs
  const [oilViscosity, setOilViscosity] = useState("");
  const [oilBrand, setOilBrand] = useState("");
  const [oilFilterChanged, setOilFilterChanged] = useState("yes");
  // Timing service inputs
  const [timingKitBrand, setTimingKitBrand] = useState("");
  const [waterPumpChanged, setWaterPumpChanged] = useState("yes");
  const [nextTimingKm, setNextTimingKm] = useState("");
  // Brake service inputs
  const [brakeAxle, setBrakeAxle] = useState("front");
  const [padBrand, setPadBrand] = useState("");
  const [brakeFluidChanged, setBrakeFluidChanged] = useState("no");
  // Inspection inputs
  const [inspectionResult, setInspectionResult] = useState("pass");
  const [inspectionValidUntil, setInspectionValidUntil] = useState("");
  // Other inputs
  const [otherTitle, setOtherTitle] = useState("");
  const [otherDetails, setOtherDetails] = useState("");
  // Pricing inputs
  const [partsPrice, setPartsPrice] = useState("");
  const [laborPrice, setLaborPrice] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      setScheduleLoading(true);
      try {
        const requests = await getRepairScheduleForMechanicDate(
          user.uid,
          selectedDate
        );
        setScheduledForDate(requests);
      } finally {
        setScheduleLoading(false);
      }
    };
    void run();
  }, [user, selectedDate]);

  const uniqueClients = useMemo(() => {
    const map = new Map<string, { id: string; name: string; requests: number }>();
    for (const req of todayRequests) {
      const existing = map.get(req.ownerId);
      if (existing) {
        existing.requests += 1;
      } else {
        map.set(req.ownerId, {
          id: req.ownerId,
          name: req.ownerName || "Car owner",
          requests: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [todayRequests]);

  const pendingCount = useMemo(
    () => todayRequests.filter((r) => r.status === "scheduled").length,
    [todayRequests]
  );
  const actionableRequests = useMemo(
    () => todayRequests.filter((r) => r.status === "scheduled"),
    [todayRequests]
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
    return "border border-slate-500/30 bg-slate-500/10 text-slate-300";
  };

  const openMaintenanceModal = (request: RepairRequest) => {
    setSelectedRepair(request);
    setMaintenanceType("oil_change");
    setMaintenanceDate(new Date().toISOString().slice(0, 10));
    setMaintenanceMileage("");
    setOilViscosity("");
    setOilBrand("");
    setOilFilterChanged("yes");
    setTimingKitBrand("");
    setWaterPumpChanged("yes");
    setNextTimingKm("");
    setBrakeAxle("front");
    setPadBrand("");
    setBrakeFluidChanged("no");
    setInspectionResult("pass");
    setInspectionValidUntil("");
    setOtherTitle("");
    setOtherDetails("");
    setPartsPrice("");
    setLaborPrice("");
    setTotalPrice("");
    setMaintenanceModalOpen(true);
  };

  const handleAddMaintenance = async () => {
    if (!selectedRepair) return;
    const mileageNumber = Number(maintenanceMileage) || 0;
    const minMileage = selectedRepair.carMileage ?? 0;
    if (mileageNumber < minMileage) {
      alert(`Mileage must be at least ${minMileage} km.`);
      return;
    }
    const parts = Number(partsPrice) || 0;
    const labor = Number(laborPrice) || 0;
    const total = Number(totalPrice) || parts + labor;

    let title = "";
    let notes = "";
    if (maintenanceType === "oil_change") {
      title = "Oil change";
      notes = `Oil viscosity: ${oilViscosity || "-"}; Oil brand: ${
        oilBrand || "-"
      }; Oil filter changed: ${oilFilterChanged}.`;
    } else if (maintenanceType === "timing_service") {
      title = "Timing service";
      notes = `Timing kit brand: ${timingKitBrand || "-"}; Water pump changed: ${waterPumpChanged}; Next timing at: ${
        nextTimingKm || "-"
      } km.`;
    } else if (maintenanceType === "brake_service") {
      title = "Brake service";
      notes = `Axle: ${brakeAxle}; Pad brand: ${padBrand || "-"}; Brake fluid changed: ${brakeFluidChanged}.`;
    } else if (maintenanceType === "inspection") {
      title = "Inspection";
      notes = `Result: ${inspectionResult}; Valid until: ${inspectionValidUntil || "-"}.`;
    } else {
      title = otherTitle || "Other maintenance";
      notes = otherDetails || "No details provided.";
    }

    setSavingMaintenance(true);
    try {
      await addMaintenanceForCar(selectedRepair.ownerId, selectedRepair.carId, user?.uid ?? "", {
        title,
        status: "completed",
        serviceDate: maintenanceDate,
        mileage: mileageNumber,
        notes,
        partsPrice: parts,
        laborPrice: labor,
        totalPrice: total,
      });
      setMaintenanceModalOpen(false);
      setSelectedRepair(null);
      setToastMessage("Maintenance record added successfully.");
    } finally {
      setSavingMaintenance(false);
    }
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 2800);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

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
              <CardTitle>Open requests</CardTitle>
              <CardDescription>Needing attention</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {pendingCount}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Active clients</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {uniqueClients.length}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s schedule</CardTitle>
              <CardDescription>Requests sent today</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {todayRequests.length}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Schedule by date</CardTitle>
                <CardDescription>
                  Cars expected for drop-off on the selected date.
                </CardDescription>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {scheduleLoading ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-4 text-sm text-muted-foreground">
                Loading scheduled cars...
              </div>
            ) : scheduledForDate.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-4 text-sm text-muted-foreground">
                No cars are scheduled for this date.
              </div>
            ) : (
              scheduledForDate.map((request) => (
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
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => openMaintenanceModal(request)}
                    >
                      Add maintenance
                    </Button>
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
        {(loading || actionableRequests.length > 0) && (
          <motion.section
            className="space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Service requests</CardTitle>
                  <CardDescription>New and in-progress work</CardDescription>
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
                        actionableRequests.map((req) => (
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

        {/*}<motion.section
          className="space-y-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Clients</CardTitle>
                <CardDescription>People you&apos;re working with</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {uniqueClients.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-4 text-xs text-muted-foreground">
                  No clients with requests today.
                </div>
              ) : (
              uniqueClients.map((client) => (
                <motion.div
                  key={client.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs"
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.12 }}
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {client.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {client.requests} request
                      {client.requests !== 1 ? "s" : ""} today
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-1 text-[0.72rem] font-medium text-slate-300">
                    Today
                  </span>
                </motion.div>
              ))
              )}
            </CardContent>
          </Card>
        </motion.section>
        */}
      </div>

      <Modal
        open={maintenanceModalOpen}
        onClose={() => !savingMaintenance && setMaintenanceModalOpen(false)}
        title={`Add maintenance${
          selectedRepair?.carLabel ? ` - ${selectedRepair.carLabel}` : ""
        }`}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={maintenanceType}
              onChange={(e) =>
                setMaintenanceType(
                  e.target.value as
                    | "oil_change"
                    | "timing_service"
                    | "brake_service"
                    | "inspection"
                    | "other"
                )
              }
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
            >
              <option value="oil_change">Oil change</option>
              <option value="timing_service">Timing service</option>
              <option value="brake_service">Brake service</option>
              <option value="inspection">Inspection</option>
              <option value="other">Other</option>
            </select>
            <Input
              value={maintenanceDate}
              onChange={(e) => setMaintenanceDate(e.target.value)}
              type="date"
            />
          </div>

          <Input
            value={maintenanceMileage}
            onChange={(e) => setMaintenanceMileage(e.target.value)}
            type="number"
            min={selectedRepair?.carMileage ?? 0}
            placeholder="Mileage at service"
          />
          <p className="text-xs text-muted-foreground">
            Minimum allowed mileage: {selectedRepair?.carMileage ?? 0} km
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              value={partsPrice}
              onChange={(e) => setPartsPrice(e.target.value)}
              type="number"
              min={0}
              step="0.01"
              placeholder="Parts price"
            />
            <Input
              value={laborPrice}
              onChange={(e) => setLaborPrice(e.target.value)}
              type="number"
              min={0}
              step="0.01"
              placeholder="Labor price"
            />
            <Input
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              type="number"
              min={0}
              step="0.01"
              placeholder="Total price"
            />
          </div>

          {maintenanceType === "oil_change" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                value={oilViscosity}
                onChange={(e) => setOilViscosity(e.target.value)}
                placeholder="Oil viscosity"
              />
              <Input
                value={oilBrand}
                onChange={(e) => setOilBrand(e.target.value)}
                placeholder="Oil brand"
              />
              <select
                value={oilFilterChanged}
                onChange={(e) => setOilFilterChanged(e.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
              >
                <option value="yes">Oil filter changed: Yes</option>
                <option value="no">Oil filter changed: No</option>
              </select>
            </div>
          )}

          {maintenanceType === "timing_service" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                value={timingKitBrand}
                onChange={(e) => setTimingKitBrand(e.target.value)}
                placeholder="Timing kit brand"
              />
              <select
                value={waterPumpChanged}
                onChange={(e) => setWaterPumpChanged(e.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
              >
                <option value="yes">Water pump changed: Yes</option>
                <option value="no">Water pump changed: No</option>
              </select>
              <Input
                value={nextTimingKm}
                onChange={(e) => setNextTimingKm(e.target.value)}
                type="number"
                min={0}
                placeholder="Next timing at km"
              />
            </div>
          )}

          {maintenanceType === "brake_service" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select
                value={brakeAxle}
                onChange={(e) => setBrakeAxle(e.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
              >
                <option value="front">Front axle</option>
                <option value="rear">Rear axle</option>
                <option value="all">All wheels</option>
              </select>
              <Input
                value={padBrand}
                onChange={(e) => setPadBrand(e.target.value)}
                placeholder="Pad brand"
              />
              <select
                value={brakeFluidChanged}
                onChange={(e) => setBrakeFluidChanged(e.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
              >
                <option value="yes">Brake fluid changed: Yes</option>
                <option value="no">Brake fluid changed: No</option>
              </select>
            </div>
          )}

          {maintenanceType === "inspection" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                value={inspectionResult}
                onChange={(e) => setInspectionResult(e.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
              >
                <option value="pass">Pass</option>
                <option value="advisory">Pass with advisories</option>
                <option value="fail">Fail</option>
              </select>
              <Input
                value={inspectionValidUntil}
                onChange={(e) => setInspectionValidUntil(e.target.value)}
                type="date"
                placeholder="Valid until"
              />
            </div>
          )}

          {maintenanceType === "other" && (
            <div className="grid grid-cols-1 gap-3">
              <Input
                value={otherTitle}
                onChange={(e) => setOtherTitle(e.target.value)}
                placeholder="Maintenance title"
              />
              <Input
                value={otherDetails}
                onChange={(e) => setOtherDetails(e.target.value)}
                placeholder="Details"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => !savingMaintenance && setMaintenanceModalOpen(false)}
              disabled={savingMaintenance}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddMaintenance}
              disabled={savingMaintenance || !selectedRepair}
            >
              {savingMaintenance ? "Saving..." : "Save maintenance"}
            </Button>
          </div>
        </div>
      </Modal>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 shadow-lg backdrop-blur">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

