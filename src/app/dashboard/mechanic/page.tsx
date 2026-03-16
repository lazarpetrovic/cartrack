'use client';

import { useEffect } from "react";
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

const mockRequests = [
  {
    id: "r1",
    client: "Marko Markovic",
    car: "Volkswagen Golf 7",
    issue: "Strange noise from engine",
    status: "In progress",
  },
  {
    id: "r2",
    client: "Ana Petrovic",
    car: "Audi A4",
    issue: "Brake check",
    status: "Pending",
  },
];

const mockClients = [
  {
    id: "c1",
    name: "Marko Markovic",
    cars: 1,
    lastService: "2025-12-10",
  },
  {
    id: "c2",
    name: "Ana Petrovic",
    cars: 1,
    lastService: "2026-02-03",
  },
];

export default function MechanicDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role === "user") {
      router.replace("/dashboard/user");
    }
  }, [user, router]);

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
              {mockRequests.length}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Active clients</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {mockClients.length}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s schedule</CardTitle>
              <CardDescription>Manual data for now</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">4</CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
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
                  <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Client</th>
                      <th className="px-3 py-2">Car</th>
                      <th className="px-3 py-2">Issue</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-t border-border/40 text-[11px] text-foreground/90"
                      >
                        <td className="px-3 py-2">{req.client}</td>
                        <td className="px-3 py-2">{req.car}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {req.issue}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline">{req.status}</Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="subtle"
                              className="h-7 px-2 text-[11px]"
                            >
                              Details
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 px-2 text-[11px]"
                            >
                              Mark done
                            </Button>
                          </div>
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
                <CardTitle>Clients</CardTitle>
                <CardDescription>People you&apos;re working with</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockClients.map((client) => (
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
                      {client.cars} car
                      {client.cars !== 1 ? "s" : ""} • last service{" "}
                      {client.lastService}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                  >
                    View history
                  </Button>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}

'use client';

import { useAuth } from "@/src/hooks/useAuth";

const mockRequests = [
  {
    id: "r1",
    client: "Marko Markovic",
    car: "Volkswagen Golf 7",
    issue: "Strange noise from engine",
    status: "In progress",
  },
  {
    id: "r2",
    client: "Ana Petrovic",
    car: "Audi A4",
    issue: "Brake check",
    status: "Pending",
  },
];

const mockClients = [
  {
    id: "c1",
    name: "Marko Markovic",
    cars: 1,
    lastService: "2025-12-10",
  },
  {
    id: "c2",
    name: "Ana Petrovic",
    cars: 1,
    lastService: "2026-02-03",
  },
];

export default function MechanicDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Mechanic Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Welcome{user?.email ? `, ${user.email}` : ""}. Manage service
          requests and clients.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Service Requests</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Car</th>
                <th className="px-4 py-2">Issue</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockRequests.map((req) => (
                <tr key={req.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">{req.client}</td>
                  <td className="px-4 py-2">{req.car}</td>
                  <td className="px-4 py-2 text-xs text-zinc-600">
                    {req.issue}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-200"
                      >
                        Mark done
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-200"
                      >
                        View details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Clients</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {mockClients.map((client) => (
            <div
              key={client.id}
              className="rounded-lg border border-zinc-200 bg-white p-4"
            >
              <h3 className="text-sm font-semibold">{client.name}</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Cars: {client.cars}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Last service: {client.lastService}
              </p>
              <button
                type="button"
                className="mt-3 inline-flex rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
              >
                View history
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

