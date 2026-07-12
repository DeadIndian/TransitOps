"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { LICENSE_CATEGORIES } from "@/core/utils/constants";
import {
  createDriverAction,
  updateDriverAction,
  type ActionResult,
} from "@/app/(safety-officer)/drivers/actions";

export type DriverFormValues = {
  id?: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string; // yyyy-mm-dd
  contactNumber: string;
  safetyScore: string;
};

const EMPTY: DriverFormValues = {
  name: "",
  licenseNumber: "",
  licenseCategory: "LMV",
  licenseExpiryDate: "",
  contactNumber: "",
  safetyScore: "100",
};

// Add/Edit driver form (plan §3). Shared Zod schema re-validates server-side, so
// this is UX-only — errors returned by the action render inline per field.
export function DriverForm({
  initial,
  onDone,
}: {
  initial?: DriverFormValues;
  onDone: () => void;
}) {
  const [values, setValues] = useState<DriverFormValues>(initial ?? EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (k: keyof DriverFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setValues((v) => ({ ...v, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    startTransition(async () => {
      const payload = {
        name: values.name,
        licenseNumber: values.licenseNumber,
        licenseCategory: values.licenseCategory,
        licenseExpiryDate: values.licenseExpiryDate,
        contactNumber: values.contactNumber,
        safetyScore: values.safetyScore,
      };
      const res: ActionResult = initial?.id
        ? await updateDriverAction(initial.id, payload)
        : await createDriverAction(payload);
      if (res.ok) {
        onDone();
      } else {
        setFormError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Input
        label="Driver Name"
        name="name"
        value={values.name}
        onChange={set("name")}
        error={fieldErrors.name}
        autoFocus
      />
      <Input
        label="License Number"
        name="licenseNumber"
        value={values.licenseNumber}
        onChange={set("licenseNumber")}
        error={fieldErrors.licenseNumber}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Category"
          name="licenseCategory"
          value={values.licenseCategory}
          onChange={set("licenseCategory")}
          error={fieldErrors.licenseCategory}
        >
          {LICENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Input
          label="License Expiry"
          name="licenseExpiryDate"
          type="date"
          value={values.licenseExpiryDate}
          onChange={set("licenseExpiryDate")}
          error={fieldErrors.licenseExpiryDate}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Contact Number"
          name="contactNumber"
          value={values.contactNumber}
          onChange={set("contactNumber")}
          error={fieldErrors.contactNumber}
        />
        <Input
          label="Safety Score (0–100)"
          name="safetyScore"
          type="number"
          min={0}
          max={100}
          value={values.safetyScore}
          onChange={set("safetyScore")}
          error={fieldErrors.safetyScore}
        />
      </div>

      {formError && (
        <p className="font-mono text-[12px] text-red border-2 border-red rounded-[4px] px-3 py-2">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : initial?.id ? "Save Changes" : "Add Driver"}
        </Button>
      </div>
    </form>
  );
}
