import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";

const CARS_COLLECTION = "cars";
const MAINTENANCE_COLLECTION = "maintenance";
const REPAIR_REQUESTS_COLLECTION = "repairRequests";

export interface Car {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  mileage: number;
  year: number;
  fuelType: string;
  drivetrain: string;
  transmission: string;
  vin: string;
}

export interface MaintenanceEntry {
  id: string;
  ownerId: string;
  carId: string;
  title: string;
  status: "pending" | "completed";
  serviceDate: string;
  mileage: number;
  notes: string;
}

export interface RepairRequest {
  id: string;
  ownerId: string;
  carId: string;
  mechanicId: string;
  mechanicName: string;
  ownerName: string;
  carLabel: string;
  note: string;
  preferredDate: string;
  status:
    | "scheduled"
    | "accepted"
    | "rejected"
    | "in_progress"
    | "completed"
    | "cancelled";
  createdAtMs: number;
}

export async function addCarForUser(
  ownerId: string,
  data: Omit<Car, "id" | "ownerId">
): Promise<string> {
  const ref = await addDoc(collection(db, CARS_COLLECTION), {
    ownerId,
    ...data,
  });
  return ref.id;
}

export async function getCarsForUser(ownerId: string): Promise<Car[]> {
  const q = query(
    collection(db, CARS_COLLECTION),
    where("ownerId", "==", ownerId)
  );
  const snapshot = await getDocs(q);
  const cars: Car[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    cars.push({
      id: docSnap.id,
      ownerId: data.ownerId,
      make: data.make,
      model: data.model,
      mileage: data.mileage,
      year: data.year,
      fuelType: data.fuelType,
      drivetrain: data.drivetrain,
      transmission: data.transmission,
      vin: data.vin,
    });
  });
  return cars;
}

export async function getCarByIdForUser(
  ownerId: string,
  carId: string
): Promise<Car | null> {
  const carRef = doc(db, CARS_COLLECTION, carId);
  const snapshot = await getDoc(carRef);
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as DocumentData;
  if (data.ownerId !== ownerId) return null;

  return {
    id: snapshot.id,
    ownerId: data.ownerId,
    make: data.make,
    model: data.model,
    mileage: data.mileage,
    year: data.year,
    fuelType: data.fuelType,
    drivetrain: data.drivetrain,
    transmission: data.transmission,
    vin: data.vin,
  };
}

export async function getMaintenanceForCar(
  ownerId: string,
  carId: string
): Promise<MaintenanceEntry[]> {
  const q = query(
    collection(db, MAINTENANCE_COLLECTION),
    where("ownerId", "==", ownerId),
    where("carId", "==", carId)
  );
  const snapshot = await getDocs(q);
  const entries: MaintenanceEntry[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    entries.push({
      id: docSnap.id,
      ownerId: data.ownerId,
      carId: data.carId,
      title: data.title,
      status: data.status,
      serviceDate: data.serviceDate,
      mileage: data.mileage,
      notes: data.notes ?? "",
    });
  });

  entries.sort((a, b) => (a.serviceDate < b.serviceDate ? 1 : -1));
  return entries;
}

export async function addMaintenanceForCar(
  ownerId: string,
  carId: string,
  data: Omit<MaintenanceEntry, "id" | "ownerId" | "carId">
): Promise<string> {
  const ref = await addDoc(collection(db, MAINTENANCE_COLLECTION), {
    ownerId,
    carId,
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function scheduleRepairForCar(
  ownerId: string,
  carId: string,
  data: Omit<RepairRequest, "id" | "ownerId" | "carId" | "status" | "createdAtMs">
): Promise<string> {
  const ref = await addDoc(collection(db, REPAIR_REQUESTS_COLLECTION), {
    ownerId,
    carId,
    ...data,
    status: "scheduled",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getRepairRequestsForCar(
  ownerId: string,
  carId: string
): Promise<RepairRequest[]> {
  const q = query(
    collection(db, REPAIR_REQUESTS_COLLECTION),
    where("ownerId", "==", ownerId),
    where("carId", "==", carId)
  );
  const snapshot = await getDocs(q);
  const requests: RepairRequest[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    requests.push({
      id: docSnap.id,
      ownerId: data.ownerId,
      carId: data.carId,
      mechanicId: data.mechanicId,
      mechanicName: data.mechanicName,
      ownerName: data.ownerName ?? "",
      carLabel: data.carLabel ?? "",
      note: data.note ?? "",
      preferredDate: data.preferredDate,
      status: data.status ?? "scheduled",
      createdAtMs: data.createdAt?.toMillis?.() ?? 0,
    });
  });

  requests.sort((a, b) => (a.preferredDate < b.preferredDate ? 1 : -1));
  return requests;
}

export async function getRepairRequestsForMechanicToday(
  mechanicId: string
): Promise<RepairRequest[]> {
  const q = query(
    collection(db, REPAIR_REQUESTS_COLLECTION),
    where("mechanicId", "==", mechanicId)
  );
  const snapshot = await getDocs(q);
  const requests: RepairRequest[] = [];
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    const createdAtMs = data.createdAt?.toMillis?.() ?? 0;
    const isToday = createdAtMs >= todayStart && createdAtMs < tomorrowStart;
    if (!isToday) return;

    requests.push({
      id: docSnap.id,
      ownerId: data.ownerId,
      carId: data.carId,
      mechanicId: data.mechanicId,
      mechanicName: data.mechanicName,
      ownerName: data.ownerName ?? "",
      carLabel: data.carLabel ?? "",
      note: data.note ?? "",
      preferredDate: data.preferredDate,
      status: data.status ?? "scheduled",
      createdAtMs,
    });
  });

  requests.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return requests;
}

export async function updateRepairRequestStatusForMechanic(
  mechanicId: string,
  requestId: string,
  status: "accepted" | "rejected"
): Promise<void> {
  const requestRef = doc(db, REPAIR_REQUESTS_COLLECTION, requestId);
  const snapshot = await getDoc(requestRef);
  if (!snapshot.exists()) {
    throw new Error("Repair request not found.");
  }

  const data = snapshot.data() as DocumentData;
  if (data.mechanicId !== mechanicId) {
    throw new Error("Not allowed to update this request.");
  }

  await updateDoc(requestRef, { status });
}

export async function updateCarForUser(
  ownerId: string,
  carId: string,
  data: Omit<Car, "id" | "ownerId">
): Promise<void> {
  const carRef = doc(db, CARS_COLLECTION, carId);
  const snapshot = await getDoc(carRef);
  if (!snapshot.exists()) {
    throw new Error("Car not found.");
  }

  const existing = snapshot.data() as DocumentData;
  if (existing.ownerId !== ownerId) {
    throw new Error("Not allowed to update this vehicle.");
  }

  await updateDoc(carRef, data);
}

export async function deleteCarForUser(
  ownerId: string,
  carId: string
): Promise<void> {
  const carRef = doc(db, CARS_COLLECTION, carId);
  const snapshot = await getDoc(carRef);
  if (!snapshot.exists()) {
    throw new Error("Car not found.");
  }

  const existing = snapshot.data() as DocumentData;
  if (existing.ownerId !== ownerId) {
    throw new Error("Not allowed to delete this vehicle.");
  }

  await deleteDoc(carRef);

  // Clean up maintenance entries owned by this user for the deleted car.
  const maintenanceQuery = query(
    collection(db, MAINTENANCE_COLLECTION),
    where("ownerId", "==", ownerId),
    where("carId", "==", carId)
  );
  const maintenanceSnapshot = await getDocs(maintenanceQuery);
  const deletions = maintenanceSnapshot.docs.map((entry) => deleteDoc(entry.ref));
  await Promise.all(deletions);
}

