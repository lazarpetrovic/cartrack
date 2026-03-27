'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { useToast } from "@/src/context/ToastContext";
import {
  changePassword,
  deleteCurrentAccount,
  getUserSettings,
  updateCommonSettings,
  updateMechanicOnlySettings,
  updateUserOnlySettings,
  updateUserProfile,
  type CommonSettings,
  type MechanicOnlySettings,
  type UserOnlySettings,
} from "@/src/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

interface SettingsPageProps {
  role: "user" | "mechanic";
}

export function SettingsPage({ role }: SettingsPageProps) {
  const { user } = useAuth();
  const { showError, showToast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCommon, setSavingCommon] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [common, setCommon] = useState<CommonSettings>({
    appearance: { theme: "system" },
  });
  const [userOnly, setUserOnly] = useState<UserOnlySettings>({
    preferences: {
      mileageUnit: "km",
      serviceReminder: true,
      registrationReminder: true,
    },
  });
  const [mechanicOnly, setMechanicOnly] = useState<MechanicOnlySettings>({
    workshop: {
      serviceName: "",
      address: "",
      phone: "",
      workingHours: "",
      specializations: "",
    },
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    if (!user) return;

    if (user.role !== role) {
      router.replace(user.role === "mechanic" ? "/dashboard/mechanic/settings" : "/dashboard/user/settings");
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const bundle = await getUserSettings(user.uid);
        if (!bundle) {
          showError("Profile settings not found.");
          return;
        }
        setFirstName(bundle.profile.firstName);
        setLastName(bundle.profile.lastName);
        setEmail(bundle.profile.email);
        setCommon(bundle.common);
        setUserOnly(bundle.userOnly);
        setMechanicOnly(bundle.mechanicOnly);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user, role, router, showError]);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!firstName.trim() || !lastName.trim()) {
      showError("First name and last name are required.");
      return;
    }
    try {
      setSavingProfile(true);
      await updateUserProfile(user.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      showToast("Profile info updated.", "success");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not save profile info.";
      showError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveCommonSettings = async () => {
    if (!user) return;
    try {
      setSavingCommon(true);
      await updateCommonSettings(user.uid, common);
      showToast("Appearance settings saved.", "success");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not save settings.";
      showError(message);
    } finally {
      setSavingCommon(false);
    }
  };

  const handleSaveRoleSettings = async () => {
    if (!user) return;
    try {
      setSavingRole(true);
      if (role === "user") {
        await updateUserOnlySettings(user.uid, userOnly);
      } else {
        await updateMechanicOnlySettings(user.uid, mechanicOnly);
      }
      showToast("Role-specific settings saved.", "success");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not save role settings.";
      showError(message);
    } finally {
      setSavingRole(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError("Fill all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      showError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("New password and confirmation do not match.");
      return;
    }
    try {
      setChangingPassword(true);
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed successfully.", "success");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not change password.";
      showError(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      showError("Enter current password to delete account.");
      return;
    }
    const confirmed = window.confirm(
      "Delete account permanently? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeletingAccount(true);
      await deleteCurrentAccount(deletePassword.trim());
      showToast("Account deleted.", "success");
      router.replace("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not delete account.";
      showError(message);
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Loading profile and preferences...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse rounded-lg bg-muted/40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage profile, security, and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile info</CardTitle>
          <CardDescription>Update your name and review your account identity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">First name</p>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Last name</p>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Email</p>
              <Input value={email} disabled />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Role</p>
              <Input value={role === "mechanic" ? "mechanic" : "user"} disabled />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={() => void handleSaveProfile()} disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {role === "mechanic" ? (
        <Card>
          <CardHeader>
            <CardTitle>Appearance and preferences</CardTitle>
            <CardDescription>Choose basic app behavior and display preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Theme</p>
              <select
                value={common.appearance.theme}
                onChange={(e) =>
                  setCommon((prev) => ({
                    ...prev,
                    appearance: {
                      ...prev.appearance,
                      theme: e.target.value as "system" | "light" | "dark",
                    },
                  }))
                }
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="space-y-3 rounded-md border border-border/60 bg-background/30 p-3">
              <p className="text-sm font-medium text-foreground">Mechanic profile settings</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Workshop name</p>
                  <Input
                    value={mechanicOnly.workshop.serviceName}
                    onChange={(e) =>
                      setMechanicOnly((prev) => ({
                        workshop: { ...prev.workshop, serviceName: e.target.value },
                      }))
                    }
                    placeholder="Workshop name"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Phone</p>
                  <Input
                    value={mechanicOnly.workshop.phone}
                    onChange={(e) =>
                      setMechanicOnly((prev) => ({
                        workshop: { ...prev.workshop, phone: e.target.value },
                      }))
                    }
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Address</p>
                <Input
                  value={mechanicOnly.workshop.address}
                  onChange={(e) =>
                    setMechanicOnly((prev) => ({
                      workshop: { ...prev.workshop, address: e.target.value },
                    }))
                  }
                  placeholder="Workshop address"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Working hours</p>
                  <Input
                    value={mechanicOnly.workshop.workingHours}
                    onChange={(e) =>
                      setMechanicOnly((prev) => ({
                        workshop: { ...prev.workshop, workingHours: e.target.value },
                      }))
                    }
                    placeholder="Mon-Fri 08:00-17:00"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Specializations / services
                  </p>
                  <Input
                    value={mechanicOnly.workshop.specializations}
                    onChange={(e) =>
                      setMechanicOnly((prev) => ({
                        workshop: { ...prev.workshop, specializations: e.target.value },
                      }))
                    }
                    placeholder="Oil, Timing, Brakes..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSaveCommonSettings()}
                disabled={savingCommon}
              >
                {savingCommon ? "Saving..." : "Save common settings"}
              </Button>
              <Button type="button" onClick={() => void handleSaveRoleSettings()} disabled={savingRole}>
                {savingRole ? "Saving..." : "Save role settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Account and security</CardTitle>
          <CardDescription>Change password or permanently delete your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border/60 bg-background/30 p-3 space-y-3">
            <p className="text-sm font-medium text-foreground">Change password</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Current password</p>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">New password</p>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Confirm new password</p>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => void handleChangePassword()}
                disabled={changingPassword}
              >
                {changingPassword ? "Changing..." : "Change password"}
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-rose-400/40 bg-rose-500/10 p-3 space-y-3">
            <p className="text-sm font-medium text-rose-100">Delete account</p>
            <p className="text-xs text-rose-100/85">
              This action is permanent. Enter your current password to confirm.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-1">
                <p className="text-xs font-medium text-rose-200/90">Current password</p>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="border-rose-400/60 text-rose-100 hover:bg-rose-500/20"
                onClick={() => void handleDeleteAccount()}
                disabled={deletingAccount}
              >
                {deletingAccount ? "Deleting..." : "Delete account"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
