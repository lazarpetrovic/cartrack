"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/src/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Modal } from "@/src/components/ui/modal";
import { Input } from "@/src/components/ui/input";
import {
  addCarForUser,
  getCarsForUser,
  getMaintenanceForOwner,
  type Car,
  type MaintenanceEntry,
} from "@/src/lib/cars";

export default function UserCarsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [maintenanceEntries, setMaintenanceEntries] = useState<MaintenanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState("");
  const [year, setYear] = useState("");
  const [fuelType, setFuelType] = useState("petrol");
  const [drivetrain, setDrivetrain] = useState("fwd");
  const [transmission, setTransmission] = useState("manual");
  const [vin, setVin] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user.role === "mechanic") {
      router.replace("/dashboard/mechanic");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      setLoading(true);
      try {
        const [carResult, maintenanceResult] = await Promise.all([
          getCarsForUser(user.uid),
          getMaintenanceForOwner(user.uid),
        ]);
        setCars(carResult);
        setMaintenanceEntries(maintenanceResult);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user]);

  const getEntryCost = (entry: MaintenanceEntry) => {
    const total = Number(entry.totalPrice ?? 0);
    if (total > 0) return total;
    return Number(entry.partsPrice ?? 0) + Number(entry.laborPrice ?? 0);
  };

  const spendByCarId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of maintenanceEntries) {
      const cost = getEntryCost(entry);
      map[entry.carId] = (map[entry.carId] ?? 0) + cost;
    }
    return map;
  }, [maintenanceEntries]);

  const totalSpent = useMemo(
    () => maintenanceEntries.reduce((sum, entry) => sum + getEntryCost(entry), 0),
    [maintenanceEntries]
  );

  const formatMoney = (value: number) => `${value.toFixed(2)} EUR`;

  const handleAddCar = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const mileageNumber = Number(mileage) || 0;
      const yearNumber = Number(year) || new Date().getFullYear();
      const id = await addCarForUser(user.uid, {
        make,
        model,
        mileage: mileageNumber,
        year: yearNumber,
        fuelType,
        drivetrain,
        transmission,
        vin,
      });
      setCars((prev) => [
        ...prev,
        {
          id,
          ownerId: user.uid,
          make,
          model,
          mileage: mileageNumber,
          year: yearNumber,
          fuelType,
          drivetrain,
          transmission,
          vin,
        },
      ]);
      setAddOpen(false);
      setMake("");
      setModel("");
      setMileage("");
      setYear("");
      setVin("");
      setFuelType("petrol");
      setDrivetrain("fwd");
      setTransmission("manual");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Your cars</h1>
          <p className="text-xs text-muted-foreground">
            Manage vehicles and track spend by car.
          </p>
        </div>
        <Button type="button" size="sm" className="w-full sm:w-auto" onClick={() => setAddOpen(true)}>
          Add car
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total cars</CardTitle>
            <CardDescription>Active vehicles</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{cars.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total spent</CardTitle>
            <CardDescription>Across all cars</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(totalSpent)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All cars</CardTitle>
          <CardDescription>Open a car to view details and service flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-4 text-sm text-muted-foreground">
              Loading cars...
            </div>
          ) : cars.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-4 text-sm text-muted-foreground">
              No cars yet. Add your first car.
            </div>
          ) : (
            cars.map((car) => (
              <motion.div
                key={car.id}
                className="flex cursor-pointer flex-col items-start gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.12 }}
                onClick={() => router.push(`/dashboard/user/cars/${car.id}`)}
              >
                <div>
                  <p className="font-medium text-foreground">
                    {car.make} {car.model}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {car.year} • {car.mileage} km
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Spent:{" "}
                    <span className="font-medium text-foreground">
                      {formatMoney(spendByCarId[car.id] ?? 0)}
                    </span>
                  </p>
                </div>
                <Badge variant="outline">Active</Badge>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      <Modal open={addOpen} onClose={() => !saving && setAddOpen(false)} title="Add car">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="Make (e.g. Volkswagen)"
              required
            />
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Model (e.g. Golf 7)"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="Mileage (km)"
              type="number"
              min={0}
            />
            <Input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              type="number"
              min={1950}
              max={new Date().getFullYear() + 1}
            />
            <Input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="VIN" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs text-muted-foreground">
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
            >
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
            </select>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
              value={drivetrain}
              onChange={(e) => setDrivetrain(e.target.value)}
            >
              <option value="fwd">FWD</option>
              <option value="rwd">RWD</option>
              <option value="awd">AWD / 4WD</option>
            </select>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
              <option value="cvt">CVT</option>
            </select>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => !saving && setAddOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddCar}
              disabled={saving || !make || !model}
            >
              {saving ? "Saving..." : "Save car"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
