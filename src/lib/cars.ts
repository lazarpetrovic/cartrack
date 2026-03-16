import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";

const CARS_COLLECTION = "cars";

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

