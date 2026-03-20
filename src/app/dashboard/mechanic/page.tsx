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
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
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

  const handleStatus = async (
    requestId: string,
    status: "accepted" | "rejected"
  ) => {
    if (!user) return;
    setUpdatingId(requestId);
    try {
      await updateRepairRequestStatusForMechanic(user.uid, requestId, status);
      setTodayRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r))
      );
    } finally {
      setUpdatingId(null);
    }
  };

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
                    {loading ? (
                      <tr className="border-t border-border/40 text-[11px] text-muted-foreground">
                        <td className="px-3 py-4" colSpan={5}>
                          Loading today&apos;s requests...
                        </td>
                      </tr>
                    ) : todayRequests.length === 0 ? (
                      <tr className="border-t border-border/40 text-[11px] text-muted-foreground">
                        <td className="px-3 py-4" colSpan={5}>
                          No repair requests were sent today.
                        </td>
                      </tr>
                    ) : (
                    todayRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-t border-border/40 text-[11px] text-foreground/90"
                      >
                        <td className="px-3 py-2">{req.ownerName || "Car owner"}</td>
                        <td className="px-3 py-2">{req.carLabel || "Vehicle"}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {req.note}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={
                              req.status === "accepted"
                                ? "success"
                                : req.status === "rejected"
                                ? "outline"
                                : "warning"
                            }
                          >
                            {req.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="subtle"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => handleStatus(req.id, "rejected")}
                              disabled={updatingId === req.id || req.status !== "scheduled"}
                            >
                              {updatingId === req.id ? "Updating..." : "Reject date"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 px-2 text-[11px]"
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
                  <Badge variant="outline">Today</Badge>
                </motion.div>
              ))
              )}
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}

