"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  packingCategories,
  packingCategoryLabels,
} from "@/features/packing/packingCategories";
import type {
  PackingCategory,
  PackingItem,
  PackingItemFormValues,
} from "@/features/packing/packingTypes";

type PackingItemDialogProps = {
  open: boolean;
  item?: PackingItem;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PackingItemFormValues) => void | Promise<void>;
};

type PackingItemFormErrors = {
  name?: string;
  category?: string;
  quantity?: string;
};

function getInitialValues(item?: PackingItem): PackingItemFormValues {
  return {
    name: item?.name ?? "",
    category: item?.category ?? "overig",
    quantity: String(item?.quantity ?? 1),
    note: item?.note ?? "",
    isDefault: item?.isDefault ?? true,
  };
}

export function PackingItemDialog({
  open,
  item,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: PackingItemDialogProps) {
  const initialValues = useMemo(() => getInitialValues(item), [item]);
  const [values, setValues] = useState<PackingItemFormValues>(initialValues);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const errors = getValidationErrors(values);

  function updateValue<Key extends keyof PackingItemFormValues>(
    key: Key,
    value: PackingItemFormValues[Key]
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }

  async function handleSubmit() {
    setSubmitAttempted(true);

    if (Object.keys(errors).length > 0) {
      return;
    }

    await onSubmit(values);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setValues(initialValues);
          setSubmitAttempted(false);
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-cyan-100 bg-white shadow-[0_22px_70px_rgba(14,165,233,0.18)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {item ? "Item bewerken" : "Item toevoegen"}
          </DialogTitle>
          <DialogDescription>
            Beheer je persoonlijke standaard-inpaklijst.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="packing-name">Naam *</Label>
              <Input
                id="packing-name"
                value={values.name}
                onChange={(event) => updateValue("name", event.target.value)}
                placeholder="Bijvoorbeeld: Telefoonlader"
                required
                aria-invalid={submitAttempted && Boolean(errors.name)}
              />
              {submitAttempted && errors.name ? (
                <p className="text-sm font-medium text-pink-700">
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="packing-category">Categorie *</Label>
              <Select
                value={values.category}
                onValueChange={(value) =>
                  updateValue("category", value as PackingCategory)
                }
              >
                <SelectTrigger
                  id="packing-category"
                  className="w-full"
                  aria-invalid={submitAttempted && Boolean(errors.category)}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {packingCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {packingCategoryLabels[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {submitAttempted && errors.category ? (
                <p className="text-sm font-medium text-pink-700">
                  {errors.category}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="packing-quantity">Aantal *</Label>
              <Input
                id="packing-quantity"
                type="number"
                min={1}
                step={1}
                value={values.quantity}
                onChange={(event) =>
                  updateValue("quantity", event.target.value)
                }
                required
                aria-invalid={submitAttempted && Boolean(errors.quantity)}
              />
              {submitAttempted && errors.quantity ? (
                <p className="text-sm font-medium text-pink-700">
                  {errors.quantity}
                </p>
              ) : null}
            </div>

            <label className="flex min-h-12 items-start gap-3 rounded-xl border border-lime-100 bg-lime-50 px-4 py-3 text-sm text-lime-800 sm:col-span-2">
              <input
                type="checkbox"
                checked={values.isDefault}
                onChange={(event) =>
                  updateValue("isDefault", event.target.checked)
                }
                className="mt-1 size-4 rounded border-lime-300"
              />
              <span>
                <span className="block font-semibold">Altijd meenemen</span>
                <span className="mt-1 block leading-6">
                  Markeer dit als standaarditem voor je inpaklijst.
                </span>
              </span>
            </label>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="packing-note">Notitie</Label>
              <Textarea
                id="packing-note"
                value={values.note}
                onChange={(event) => updateValue("note", event.target.value)}
                placeholder="Bijvoorbeeld: USB-C, reisformaat of merk"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"
            >
              {isSubmitting ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getValidationErrors(
  values: PackingItemFormValues
): PackingItemFormErrors {
  const errors: PackingItemFormErrors = {};
  const quantity = Number(values.quantity);

  if (values.name.trim().length === 0) {
    errors.name = "Vul een naam in.";
  }

  if (!packingCategories.includes(values.category)) {
    errors.category = "Kies een geldige categorie.";
  }

  if (!Number.isFinite(quantity) || quantity < 1) {
    errors.quantity = "Vul een aantal van minimaal 1 in.";
  }

  return errors;
}
