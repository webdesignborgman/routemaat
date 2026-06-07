"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Mail, Shield, Trash2, UserPlus, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/useAuth";
import { canManageMembers } from "@/features/members/memberPermissions";
import {
  addMemberByEmail,
  cancelTripInvite,
  getTripMember,
  listPendingTripInvites,
  listTripMembers,
  removeTripMember,
  updateTripMemberRole,
} from "@/features/members/memberService";
import {
  tripRoleLabels,
  type TripInvite,
  type TripMember,
  type TripRole,
} from "@/features/members/memberTypes";
import { useTripLookup } from "@/features/trips/useTripLookup";

type MembersRouteClientProps = {
  tripId: string;
};

const inviteRoles: TripRole[] = ["viewer", "editor", "admin"];
const allRoles: TripRole[] = ["owner", "admin", "editor", "viewer"];
const roleDescriptions: Array<{ role: TripRole; description: string }> = [
  {
    role: "owner",
    description: "Mag alles beheren, inclusief leden en rollen.",
  },
  {
    role: "admin",
    description: "Mag leden beheren en de reisinhoud bewerken.",
  },
  {
    role: "editor",
    description: "Mag ideeën en planning bewerken, maar geen leden beheren.",
  },
  {
    role: "viewer",
    description: "Kan alleen meekijken en niets aanpassen.",
  },
];

export function MembersRouteClient({ tripId }: MembersRouteClientProps) {
  const { user } = useAuth();
  const { trip, isLoading: isTripLoading, errorMessage } = useTripLookup(tripId);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [invites, setInvites] = useState<TripInvite[]>([]);
  const [currentMember, setCurrentMember] = useState<TripMember | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TripRole>("viewer");
  const [memberToRemove, setMemberToRemove] = useState<TripMember | null>(null);
  const [inviteToCancel, setInviteToCancel] = useState<TripInvite | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = canManageMembers(currentMember?.role);
  const ownerCount = useMemo(
    () => members.filter((member) => member.role === "owner").length,
    [members]
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadMembers() {
      if (!trip || !user) {
        setIsLoadingMembers(false);
        return;
      }

      setIsLoadingMembers(true);
      setError(null);

      try {
        const [loadedMembers, loadedInvites, loadedCurrentMember] =
          await Promise.all([
            listTripMembers(trip.id),
            listPendingTripInvites(trip.id),
            getTripMember(trip.id, user.uid),
          ]);

        if (!isCancelled) {
          setMembers(loadedMembers);
          setInvites(loadedInvites);
          setCurrentMember(loadedCurrentMember);
        }
      } catch (loadError) {
        console.error("Leden laden mislukt", loadError);

        if (!isCancelled) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMembers(false);
        }
      }
    }

    void loadMembers();

    return () => {
      isCancelled = true;
    };
  }, [trip, user]);

  async function refreshMembers() {
    if (!trip || !user) {
      return;
    }

    const [loadedMembers, loadedInvites, loadedCurrentMember] =
      await Promise.all([
        listTripMembers(trip.id),
        listPendingTripInvites(trip.id),
        getTripMember(trip.id, user.uid),
      ]);

    setMembers(loadedMembers);
    setInvites(loadedInvites);
    setCurrentMember(loadedCurrentMember);
  }

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trip || !user || !canManage) {
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Vul een geldig e-mailadres in.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setStatusMessage(null);

    try {
      const result = await addMemberByEmail(trip.id, trimmedEmail, role, user);

      setEmail("");
      setRole("viewer");
      setStatusMessage(
        result === "added"
          ? "Lid toegevoegd aan deze reis."
          : "Uitnodiging klaargezet. Dit lid wordt toegevoegd zodra die met dit e-mailadres inlogt."
      );
      await refreshMembers();
    } catch (saveError) {
      console.error("Lid uitnodigen mislukt", saveError);
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRoleChange(member: TripMember, nextRole: TripRole) {
    if (!trip || !canManage || member.role === nextRole) {
      return;
    }

    if (member.role === "owner" && ownerCount <= 1 && nextRole !== "owner") {
      setError("Er moet minimaal één eigenaar overblijven.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setStatusMessage(null);

    try {
      await updateTripMemberRole(trip.id, member.userId, nextRole);
      await refreshMembers();
      setStatusMessage("Rol bijgewerkt.");
    } catch (saveError) {
      console.error("Rol bijwerken mislukt", saveError);
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmRemoveMember() {
    if (!trip || !memberToRemove || !canManage) {
      return;
    }

    if (memberToRemove.role === "owner" && ownerCount <= 1) {
      setError("Je kunt de laatste eigenaar niet verwijderen.");
      setMemberToRemove(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setStatusMessage(null);

    try {
      await removeTripMember(trip.id, memberToRemove.userId);
      setMemberToRemove(null);
      await refreshMembers();
      setStatusMessage("Lid verwijderd uit deze reis.");
    } catch (saveError) {
      console.error("Lid verwijderen mislukt", saveError);
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmCancelInvite() {
    if (!trip || !inviteToCancel || !canManage) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setStatusMessage(null);

    try {
      await cancelTripInvite(trip.id, inviteToCancel.id);
      setInviteToCancel(null);
      await refreshMembers();
      setStatusMessage("Uitnodiging ingetrokken.");
    } catch (saveError) {
      console.error("Uitnodiging intrekken mislukt", saveError);
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  if (isTripLoading) {
    return <RouteState title="Leden laden" description="We halen deze reis op." />;
  }

  if (errorMessage) {
    return <RouteState title="Reis laden lukt niet" description={errorMessage} />;
  }

  if (!trip) {
    return (
      <RouteState
        title="Reis niet gevonden"
        description="Open eerst een bekende reis voordat je leden bekijkt."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leden"
        description={`Beheer wie toegang heeft tot ${trip.title}.`}
        backHref={`/trips/${trip.id}`}
        action={
          <Button
            asChild
            variant="outline"
            className="w-full border-cyan-100 bg-white sm:w-auto"
          >
            <Link href={`/trips/${trip.id}`}>Terug naar reis</Link>
          </Button>
        }
      />

      {error ? <InlineMessage tone="error" message={error} /> : null}
      {statusMessage ? <InlineMessage tone="success" message={statusMessage} /> : null}

      {isLoadingMembers ? (
        <RouteState title="Leden laden" description="We halen de leden op uit Firestore." />
      ) : (
        <>
          <Card className="border-cyan-100 bg-white/95 shadow-[0_14px_35px_rgba(14,165,233,0.10)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="size-4 text-cyan-700" aria-hidden="true" />
                Wat betekenen de rollen?
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {roleDescriptions.map((roleDescription) => (
                <div
                  key={roleDescription.role}
                  className="rounded-xl border border-cyan-100 bg-cyan-50/50 px-3 py-3"
                >
                  <Badge className="bg-white text-cyan-800 hover:bg-white">
                    {tripRoleLabels[roleDescription.role]}
                  </Badge>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {roleDescription.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {canManage ? (
            <Card className="border-cyan-100 bg-white/95 shadow-[0_14px_35px_rgba(14,165,233,0.10)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="size-4 text-cyan-700" aria-hidden="true" />
                  Lid uitnodigen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto]" onSubmit={handleInviteSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="member-email">E-mailadres</Label>
                    <Input
                      id="member-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="naam@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="member-role">Rol</Label>
                    <Select
                      value={role}
                      onValueChange={(nextRole: TripRole) => setRole(nextRole)}
                    >
                      <SelectTrigger id="member-role" className="w-full sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {inviteRoles.map((roleOption) => (
                          <SelectItem key={roleOption} value={roleOption}>
                            {tripRoleLabels[roleOption]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="self-end bg-slate-950 text-white hover:bg-slate-800"
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    Uitnodigen
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <InlineMessage
              tone="info"
              message="Je kunt leden bekijken, maar niet beheren."
            />
          )}

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-950">Huidige leden</h2>
            <div className="grid gap-4">
              {members.map((member) => (
                <MemberCard
                  key={member.userId}
                  member={member}
                  canManage={canManage}
                  canAssignOwner={currentMember?.role === "owner"}
                  isSaving={isSaving}
                  isLastOwner={member.role === "owner" && ownerCount <= 1}
                  onRoleChange={handleRoleChange}
                  onRemove={setMemberToRemove}
                />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-950">Openstaande uitnodigingen</h2>
            {invites.length > 0 ? (
              <div className="grid gap-4">
                {invites.map((invite) => (
                  <InviteCard
                    key={invite.id}
                    invite={invite}
                    canManage={canManage}
                    isSaving={isSaving}
                    onCancel={setInviteToCancel}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-cyan-200 bg-white/75 px-5 py-8 text-sm leading-6 text-slate-600">
                Er staan geen uitnodigingen open.
              </div>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        open={Boolean(memberToRemove)}
        title="Lid verwijderen?"
        description={
          memberToRemove
            ? `${getMemberName(memberToRemove)} verliest toegang tot deze reis.`
            : "Dit lid verliest toegang tot deze reis."
        }
        confirmLabel="Verwijderen"
        isSaving={isSaving}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        onConfirm={confirmRemoveMember}
      />

      <ConfirmDialog
        open={Boolean(inviteToCancel)}
        title="Uitnodiging intrekken?"
        description={
          inviteToCancel
            ? `De uitnodiging voor ${inviteToCancel.email} wordt ingetrokken.`
            : "Deze uitnodiging wordt ingetrokken."
        }
        confirmLabel="Intrekken"
        isSaving={isSaving}
        onOpenChange={(open) => !open && setInviteToCancel(null)}
        onConfirm={confirmCancelInvite}
      />
    </div>
  );
}

type MemberCardProps = {
  member: TripMember;
  canManage: boolean;
  canAssignOwner: boolean;
  isSaving: boolean;
  isLastOwner: boolean;
  onRoleChange: (member: TripMember, role: TripRole) => void;
  onRemove: (member: TripMember) => void;
};

function MemberCard({
  member,
  canManage,
  canAssignOwner,
  isSaving,
  isLastOwner,
  onRoleChange,
  onRemove,
}: MemberCardProps) {
  const availableRoles = canAssignOwner ? allRoles : inviteRoles;

  return (
    <Card className="border-cyan-100 bg-white/95 shadow-[0_14px_35px_rgba(14,165,233,0.10)]">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-semibold text-slate-950">
              {getMemberName(member)}
            </h3>
            <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
              {tripRoleLabels[member.role]}
            </Badge>
          </div>
          {member.email ? (
            <p className="mt-1 break-words text-sm text-slate-600">{member.email}</p>
          ) : null}
        </div>
        {canManage ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={member.role}
              disabled={isSaving || isLastOwner}
              onValueChange={(nextRole: TripRole) => onRoleChange(member, nextRole)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((roleOption) => (
                  <SelectItem key={roleOption} value={roleOption}>
                    {tripRoleLabels[roleOption]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="border-pink-100 bg-white text-pink-700 hover:bg-pink-50"
              disabled={isSaving || isLastOwner}
              onClick={() => onRemove(member)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Verwijderen
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

type InviteCardProps = {
  invite: TripInvite;
  canManage: boolean;
  isSaving: boolean;
  onCancel: (invite: TripInvite) => void;
};

function InviteCard({ invite, canManage, isSaving, onCancel }: InviteCardProps) {
  return (
    <Card className="border-cyan-100 bg-white/95 shadow-[0_14px_35px_rgba(14,165,233,0.10)]">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-semibold text-slate-950">
              {invite.email}
            </h3>
            <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">
              Uitgenodigd
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Rol: {tripRoleLabels[invite.role]}
          </p>
        </div>
        {canManage ? (
          <Button
            type="button"
            variant="outline"
            className="border-pink-100 bg-white text-pink-700 hover:bg-pink-50"
            disabled={isSaving}
            onClick={() => onCancel(invite)}
          >
            Intrekken
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isSaving,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-cyan-100 bg-white shadow-[0_22px_70px_rgba(236,72,153,0.14)] sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-pink-50 text-pink-700">
            <Trash2 className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Annuleren
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={isSaving}
            onClick={onConfirm}
          >
            {isSaving ? "Bezig..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type InlineMessageProps = {
  tone: "error" | "success" | "info";
  message: string;
};

function InlineMessage({ tone, message }: InlineMessageProps) {
  const toneClassNames: Record<InlineMessageProps["tone"], string> = {
    error: "border-pink-100 bg-pink-50 text-pink-800",
    success: "border-lime-100 bg-lime-50 text-lime-800",
    info: "border-cyan-100 bg-cyan-50 text-cyan-800",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${toneClassNames[tone]}`}>
      {message}
    </div>
  );
}

type RouteStateProps = {
  title: string;
  description: string;
};

function RouteState({ title, description }: RouteStateProps) {
  return (
    <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
        <Users className="size-5" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
    </section>
  );
}

function getMemberName(member: TripMember) {
  return member.displayName || member.email || "Onbekend lid";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Er ging iets mis. Probeer het opnieuw.";
}
