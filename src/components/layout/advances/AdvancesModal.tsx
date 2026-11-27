"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { AdvanceForm } from "@/components/layout/advances/AdvanceForm";
import { AdvanceList } from "@/components/layout/advances/AdvanceList";
import { useBackdropClose } from "@/hooks/useBackdropClose";
import type { TranslateFn } from "@/lib/i18n/translations";
import type { PayAdvanceRow, SellerAdvances } from "@/lib/money/pay-advances";

// What the modal shows: one seller's advances, the form for a new one (seller picked
// first when opened for a seller), or the form to edit one.
export type AdvancesModalView =
  | { kind: "list"; userId: string }
  | { kind: "create"; userId?: string }
  | { kind: "edit"; userId: string; advance: PayAdvanceRow };

export interface AdvancesModalHandle {
  show: (view: AdvancesModalView) => void;
}

interface AdvancesModalProps {
  sellers: SellerAdvances[];
  ref: Ref<AdvancesModalHandle>;
  t: TranslateFn;
}

// The advances modal opened from "Por pagar": a seller's advances ("Adelantos de
// {name}": date, amount, description, edit / delete, total) and the add / edit form.
export function AdvancesModal({ sellers, ref, t }: AdvancesModalProps) {
  const [modal, setModal] = useState<AdvancesModalView | null>(null);
  const [formKey, setFormKey] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropClose = useBackdropClose();
  // Only current sellers can be given a new advance; former ones still show their history.
  const activeSellers = sellers.filter((s) => s.active);
  const modalSeller = modal && modal.kind !== "create" ? sellers.find((s) => s.userId === modal.userId) : undefined;

  const show = useCallback((next: AdvancesModalView) => {
    setModal(next);
    setFormKey((key) => key + 1);
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);

  useImperativeHandle(ref, () => ({ show }), [show]);

  const close = useCallback(() => dialogRef.current?.close(), []);

  // After adding an advance (or cancelling it) the modal closes: the list only opens
  // from the seller's list icon. After editing one (opened from that list) it goes back
  // to the list. Reads the modal through a ref so the callback stays the same and the
  // form's "saved" effect never runs twice.
  const modalRef = useRef(modal);
  useEffect(() => {
    modalRef.current = modal;
  }, [modal]);
  const backOrClose = useCallback(() => {
    const current = modalRef.current;
    if (current?.kind === "edit") setModal({ kind: "list", userId: current.userId });
    else dialogRef.current?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      {...backdropClose}
      onClose={() => setModal(null)}
      className="w-[calc(100%-1.5rem)] max-h-[90dvh] max-w-xl overflow-y-auto rounded-2xl border border-foreground/10 bg-background p-4 text-foreground sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold">
          {modal?.kind === "list" && modalSeller
            ? t("advances.modalTitle", { name: modalSeller.userName })
            : modal?.kind === "edit"
              ? t("advances.editTitle", { name: modalSeller?.userName ?? "" })
              : t("advances.newTitle")}
        </h3>
        <button
          type="button"
          onClick={close}
          aria-label={t("records.close")}
          className="-mt-1 -mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
        >
          ✕
        </button>
      </div>

      {modal?.kind === "list" && modalSeller ? (
        <>
          <AdvanceList seller={modalSeller} onEdit={(advance) => show({ kind: "edit", userId: modalSeller.userId, advance })} t={t} />
          {modalSeller.active ? (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => show({ kind: "create", userId: modalSeller.userId })}
                className="inline-flex min-h-10 items-center rounded-md bg-amber-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
              >
                + {t("advances.add")}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
      {modal?.kind === "create" ? (
        <AdvanceForm key={formKey} sellers={activeSellers} defaultUserId={modal.userId} onSaved={backOrClose} onCancel={backOrClose} t={t} />
      ) : null}
      {modal?.kind === "edit" ? (
        <AdvanceForm key={formKey} advance={modal.advance} onSaved={backOrClose} onCancel={backOrClose} t={t} />
      ) : null}
    </dialog>
  );
}
