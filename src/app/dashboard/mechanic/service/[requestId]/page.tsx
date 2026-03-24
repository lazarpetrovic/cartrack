'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import {
  addMaintenanceForCar,
  getCarById,
  markRepairInProgress,
  getRepairRequestByIdForMechanic,
  markRepairReadyForPickup,
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

type MaintenanceType =
  | "oil_change"
  | "timing_service"
  | "brake_service"
  | "inspection"
  | "other";

export default function MechanicServicePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const requestId = useMemo(() => params?.requestId ?? "", [params]);

  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [latestVehicleMileage, setLatestVehicleMileage] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>("oil_change");
  const [maintenanceDate, setMaintenanceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [maintenanceMileage, setMaintenanceMileage] = useState("");
  const [partsPrice, setPartsPrice] = useState(0);
  const [laborPrice, setLaborPrice] = useState(0);
  const totalPrice = useMemo(() => partsPrice + laborPrice, [partsPrice, laborPrice]);

  const [oilViscosity, setOilViscosity] = useState("");
  const [oilBrand, setOilBrand] = useState("");
  const [oilFilterChanged, setOilFilterChanged] = useState("yes");
  const [timingKitBrand, setTimingKitBrand] = useState("");
  const [waterPumpChanged, setWaterPumpChanged] = useState("yes");
  const [nextTimingKm, setNextTimingKm] = useState("");
  const [brakeAxle, setBrakeAxle] = useState("front");
  const [padBrand, setPadBrand] = useState("");
  const [brakeFluidChanged, setBrakeFluidChanged] = useState("no");
  const [inspectionResult, setInspectionResult] = useState("pass");
  const [inspectionValidUntil, setInspectionValidUntil] = useState("");
  const [otherTitle, setOtherTitle] = useState("");
  const [otherDetails, setOtherDetails] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.role !== "mechanic") {
      router.replace("/dashboard/user");
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        let result = await getRepairRequestByIdForMechanic(user.uid, requestId);
        if (result?.status === "dropped_off") {
          await markRepairInProgress(user.uid, result.id);
          result = { ...result, status: "in_progress" };
        }
        setRequest(result);
        if (!result) {
          setLatestVehicleMileage(0);
          return;
        }

        // Pull latest mileage from the actual car document for this request.
        let mileageFromCar = result.carMileage ?? 0;
        try {
          const car = await getCarById(result.carId);
          if (car) mileageFromCar = car.mileage;
        } catch {
          // If car fetch fails because of rules, keep request snapshot mileage.
        }

        setLatestVehicleMileage(mileageFromCar);
        setMaintenanceMileage(String(mileageFromCar));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user, requestId, router]);

  const handleSaveMaintenance = async () => {
    if (!user || !request) return;

    const latestMileage = latestVehicleMileage;
    const mileageNumber = Number(maintenanceMileage) || 0;
    if (mileageNumber < latestMileage) {
      alert(`Mileage must be at least latest mileage (${latestMileage} km).`);
      return;
    }

    const parts = Number(partsPrice) || 0;
    const labor = Number(laborPrice) || 0;
    const total = Number(totalPrice) || 0;

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

    setSaving(true);
    try {
      await addMaintenanceForCar(request.ownerId, request.carId, user.uid, {
        title,
        status: "completed",
        serviceDate: maintenanceDate,
        mileage: mileageNumber,
        notes,
        partsPrice: parts,
        laborPrice: labor,
        totalPrice: total,
      });
      await markRepairReadyForPickup(user.uid, request.id);
      router.push("/dashboard/mechanic");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border/60 bg-background/40 px-4 py-8 text-sm text-muted-foreground">
        Loading service details...
      </div>
    );
  }

  if (!request) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service request not found</CardTitle>
          <CardDescription>
            The request does not exist or is not assigned to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => router.push("/dashboard/mechanic")}>
            Back to mechanic dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (request.status === "accepted") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Start service
            </h1>
            <p className="text-xs text-muted-foreground">
              Wait for the owner to confirm the vehicle drop-off before starting work.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/mechanic")}>
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle not dropped off yet</CardTitle>
            <CardDescription>
              The appointment is accepted for {request.dropOffDate || "the selected date"}, but the
              owner has not marked the car as dropped off yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Car: <span className="font-medium text-foreground">{request.carLabel || "Vehicle"}</span>
            </p>
            <p>
              Owner:{" "}
              <span className="font-medium text-foreground">
                {request.ownerName || "Car owner"}
              </span>
            </p>
            <p>Ask the owner to use the drop-off confirmation button from their dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Start service
          </h1>
          <p className="text-xs text-muted-foreground">
            Add maintenance for selected vehicle and finish the service.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/mechanic")}>
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle and owner</CardTitle>
          <CardDescription>Information about the currently assigned request.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Car:</span>{" "}
            <span className="font-medium">{request.carLabel || "Vehicle"}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Owner:</span>{" "}
            <span className="font-medium">{request.ownerName || "Car owner"}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Request note:</span>{" "}
            <span className="font-medium">{request.note}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Latest mileage:</span>{" "}
            <span className="font-medium">{latestVehicleMileage} km</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add maintenance</CardTitle>
          <CardDescription>After save, service will be marked ready for pickup.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Maintenance type</p>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value as MaintenanceType)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
              >
                <option value="oil_change">Oil change</option>
                <option value="timing_service">Timing service</option>
                <option value="brake_service">Brake service</option>
                <option value="inspection">Inspection</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Service date</p>
              <Input value={maintenanceDate} onChange={(e) => setMaintenanceDate(e.target.value)} type="date" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Mileage at service</p>
            <Input
              value={maintenanceMileage}
              onChange={(e) => setMaintenanceMileage(e.target.value)}
              type="number"
              min={latestVehicleMileage}
              placeholder="Mileage at service"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Mileage must be greater than or equal to latest value ({latestVehicleMileage} km).
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Parts price</p>
              <div className="relative">
                <Input value={partsPrice} onChange={(e) => setPartsPrice(Number(e.target.value) || 0)} type="text" placeholder="Parts price" />
                <span className="text-md absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Labor price</p>
              <div className="relative">
                <Input value={laborPrice} onChange={(e) => setLaborPrice(Number(e.target.value) || 0)} type="text" placeholder="Labor price" />
                <span className="text-md absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Total price</p>
              <div className="relative">
                <Input value={totalPrice} disabled type="text" placeholder="Total price" />
                <span className="text-md absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
            </div>
          </div>

          {maintenanceType === "oil_change" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Oil viscosity</p>
                <Input value={oilViscosity} onChange={(e) => setOilViscosity(e.target.value)} placeholder="Oil viscosity" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Oil brand</p>
                <Input value={oilBrand} onChange={(e) => setOilBrand(e.target.value)} placeholder="Oil brand" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Oil filter changed</p>
                <select value={oilFilterChanged} onChange={(e) => setOilFilterChanged(e.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          )}

          {maintenanceType === "timing_service" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Timing kit brand</p>
                <Input value={timingKitBrand} onChange={(e) => setTimingKitBrand(e.target.value)} placeholder="Timing kit brand" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Water pump changed</p>
                <select value={waterPumpChanged} onChange={(e) => setWaterPumpChanged(e.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Next timing at km</p>
                <Input value={nextTimingKm} onChange={(e) => setNextTimingKm(e.target.value)} type="number" min={0} placeholder="Next timing at km" />
              </div>
            </div>
          )}

          {maintenanceType === "brake_service" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Brake axle</p>
                <select value={brakeAxle} onChange={(e) => setBrakeAxle(e.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2">
                  <option value="front">Front axle</option>
                  <option value="rear">Rear axle</option>
                  <option value="all">All wheels</option>
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Pad brand</p>
                <Input value={padBrand} onChange={(e) => setPadBrand(e.target.value)} placeholder="Pad brand" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Brake fluid changed</p>
                <select value={brakeFluidChanged} onChange={(e) => setBrakeFluidChanged(e.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          )}

          {maintenanceType === "inspection" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Inspection result</p>
                <select value={inspectionResult} onChange={(e) => setInspectionResult(e.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2">
                  <option value="pass">Pass</option>
                  <option value="advisory">Pass with advisories</option>
                  <option value="fail">Fail</option>
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Inspection valid until</p>
                <Input value={inspectionValidUntil} onChange={(e) => setInspectionValidUntil(e.target.value)} type="date" />
              </div>
            </div>
          )}

          {maintenanceType === "other" && (
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Maintenance title</p>
                <Input value={otherTitle} onChange={(e) => setOtherTitle(e.target.value)} placeholder="Maintenance title" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Details</p>
                <Input value={otherDetails} onChange={(e) => setOtherDetails(e.target.value)} placeholder="Details" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/mechanic")} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveMaintenance} disabled={saving}>
              {saving ? "Saving..." : "Save maintenance & finish service"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

