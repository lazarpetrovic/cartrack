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
import {
  getMaintenanceForMechanicDate,
  getRepairRequestsForMechanic,
  getRepairScheduleForMechanicDate,
  type MaintenanceEntry,
  type RepairRequest,
} from "@/src/lib/cars";

export default function MechanicAppointmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [todayMaintenance, setTodayMaintenance] = useState<MaintenanceEntry[]>([]);
  const [dateMaintenance, setDateMaintenance] = useState<MaintenanceEntry[]>([]);
  const [dateVehicles, setDateVehicles] = useState<RepairRequest[]>([]);
  const [allRequests, setAllRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
        const [todayEntries, selectedEntries, vehicles, requests] = await Promise.all([
          getMaintenanceForMechanicDate(user.uid, todayDate),
          getMaintenanceForMechanicDate(user.uid, selectedDate),
          getRepairScheduleForMechanicDate(user.uid, selectedDate),
          getRepairRequestsForMechanic(user.uid),
        ]);
        setTodayMaintenance(todayEntries);
        setDateMaintenance(selectedEntries);
        setDateVehicles(vehicles);
        setAllRequests(requests);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user, selectedDate, todayDate]);

  const repairedCarsToday = useMemo(
    () => new Set(todayMaintenance.map((entry) => entry.carId)).size,
    [todayMaintenance]
  );
  const oilServicesToday = useMemo(
    () =>
      todayMaintenance.filter((entry) =>
        entry.title.toLowerCase().includes("oil")
      ).length,
    [todayMaintenance]
  );
  const timingServicesToday = useMemo(
    () =>
      todayMaintenance.filter((entry) =>
        entry.title.toLowerCase().includes("timing")
      ).length,
    [todayMaintenance]
  );

  const requestByCarId = useMemo(() => {
    const map = new Map<string, RepairRequest>();
    for (const request of allRequests) {
      if (!map.has(request.carId)) {
        map.set(request.carId, request);
      }
    }
    return map;
  }, [allRequests]);

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
    if (status === "in_progress") {
      return "border border-amber-400/30 bg-amber-500/10 text-amber-200";
    }
    if (status === "completed") {
      return "border border-indigo-400/30 bg-indigo-500/10 text-indigo-300";
    }
    return "border border-slate-500/30 bg-slate-500/10 text-slate-300";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Appointments and history
        </h1>
        <p className="text-xs text-muted-foreground">
          View completed work and planned vehicles by date.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Cars repaired today</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {repairedCarsToday}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Oil services today</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {oilServicesToday}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Timing services today</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {timingServicesToday}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Selected date overview</CardTitle>
              <CardDescription>
                Everything planned and completed on the selected date.
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
        <CardContent className="space-y-4">
          {loading ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-4 text-sm text-muted-foreground">
              Loading date data...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Vehicles scheduled</p>
                {dateVehicles.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-3 text-xs text-muted-foreground">
                    No scheduled vehicles for this date.
                  </div>
                ) : (
                  dateVehicles.map((request) => (
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
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-medium capitalize ${getStatusPillClass(
                          request.status
                        )}`}
                      >
                        {request.status.replace("_", " ")}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Completed services</p>
                {dateMaintenance.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-3 text-xs text-muted-foreground">
                    No maintenance entries for this date.
                  </div>
                ) : (
                  dateMaintenance.map((entry) => {
                    const request = requestByCarId.get(entry.carId);
                    return (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {entry.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request?.carLabel || "Vehicle"} -{" "}
                          {request?.ownerName || "Car owner"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.serviceDate} - {entry.mileage} km
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

