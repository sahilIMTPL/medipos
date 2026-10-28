"use client";

import React from "react";
import GstBillDetailModal from "./GstBillDetailModal";

interface PurchaseDetailsModalProps {
  purchaseId: string | null;
  onClose: () => void;
}

export default function PurchaseDetailsModal({
  purchaseId,
  onClose,
}: PurchaseDetailsModalProps) {
  if (!purchaseId) return null;

  return (
    <GstBillDetailModal
      billId={purchaseId}
      onClose={onClose}
    />
  );
}
