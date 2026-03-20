'use client';

import { useEffect, useState } from "react";
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
import { Modal } from "@/src/components/ui/modal";
import { Input } from "@/src/components/ui/input";
import { addCarForUser, getCarsForUser, type Car } from "@/src/lib/cars";

const mockHistory = [
  {
    id: "h1",
    car: "Volkswagen Golf 7",
    service: "Oil change & filter",
    date: "2025-12-10",
    status: "Completed",
  },
  {
    id: "h2",
    car: "Audi A4",
    service: "Brake pads replacement",
    date: "2026-02-03",
    status: "Completed",
  },
];

const mockUpcoming = [
  {
    id: "u1",
    car: "Volkswagen Golf 7",
    service: "Regular inspection",
    dueDate: "2026-04-01",
  },
  {
    id: "u2",
    car: "Audi A4",
    service: "Tire rotation",
    dueDate: "2026-05-15",
  },
];

export default function UserDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
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
    (async () => {
      const result = await getCarsForUser(user.uid);
      setCars(result);
    })();
  }, [user]);

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
              <CardTitle>Upcoming services</CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {mockUpcoming.length}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Completed this year</CardTitle>
              <CardDescription>Based on your history</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {mockHistory.length}
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
                <CardTitle>Service history</CardTitle>
                <CardDescription>Recent work on your cars</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border/60 bg-background/40">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Car</th>
                      <th className="px-3 py-2">Service</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockHistory.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-border/40 text-[11px] text-foreground/90"
                      >
                        <td className="px-3 py-2">{item.car}</td>
                        <td className="px-3 py-2">{item.service}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {item.date}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Badge variant="success">{item.status}</Badge>
                        </td>
                      </tr>
                    ))}
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
                <CardTitle>Your cars</CardTitle>
                <CardDescription>Quick overview</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="solid"
                onClick={() => setAddOpen(true)}
              >
                Add car
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {cars.map((car) => (
                <motion.div
                  key={car.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs"
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => router.push(`/dashboard/user/vehicles/${car.id}`)}
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {car.make} {car.model}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {car.year} • {car.mileage} km
                    </p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Upcoming maintenance</CardTitle>
                <CardDescription>Stay ahead of issues</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockUpcoming.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-50"
                >
                  <p className="font-medium">{item.car}</p>
                  <p className="mt-0.5 text-[11px] opacity-80">
                    {item.service}
                  </p>
                  <p className="mt-1 text-[11px]">
                    Due by{" "}
                    <span className="font-semibold">{item.dueDate}</span>
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.section>
      </div>

      <Modal
        open={addOpen}
        onClose={() => !saving && setAddOpen(false)}
        title="Add car"
      >
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
            <Input
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="VIN"
            />
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

