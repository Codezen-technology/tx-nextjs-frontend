"use client";

import type {
  AggregatedActiveSubscription,
  LicenceCartItem,
  LicenceOrderSummary,
  UpsellHint,
} from "@/types/business-pricing";
import { ActiveSubBanner } from "./active-sub-banner";
import { CourseSearchInput } from "./course-search-input";
import { OrderActions } from "./order-actions";
import { OrderSummary } from "./order-summary";
import { OrderTable } from "./order-table";
import { SeatPicker } from "./seat-picker";
import { SubOrderSummary } from "./sub-order-summary";
import { UpsellBanner } from "./upsell-banner";

interface LicenceTabProps {
  cart: LicenceCartItem[];
  totalQty: number;
  upsellHint: UpsellHint | null;
  summary: LicenceOrderSummary | null;
  calcLoading: boolean;
  checkoutLoading: boolean;
  vatEnabled: boolean;
  vatLabel: string;
  onAddToCart: (item: LicenceCartItem) => void;
  onUpdateQty: (courseId: number, qty: number) => void;
  onRemove: (courseId: number) => void;
  onCheckout: () => void;
  onQuote: () => void;
}

export function LicenceTab({
  cart,
  totalQty,
  upsellHint,
  summary,
  calcLoading,
  checkoutLoading,
  vatEnabled,
  vatLabel,
  onAddToCart,
  onUpdateQty,
  onRemove,
  onCheckout,
  onQuote,
}: LicenceTabProps) {
  return (
    <>
      <p className="mb-3 text-xs text-[#3F576F]">
        💡 You can add multiple courses in a single order
      </p>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          {totalQty > 0 && <UpsellBanner hint={upsellHint} />}
          <CourseSearchInput cartCourseIds={cart.map((c) => c.courseId)} onSelect={onAddToCart} />
          <OrderTable items={cart} onQtyChange={onUpdateQty} onRemove={onRemove} />
        </div>
        <div className="shrink-0 lg:w-72">
          <OrderSummary
            summary={summary}
            vatEnabled={vatEnabled}
            vatLabel={vatLabel}
            isLoading={calcLoading && cart.length > 0}
          />
          <OrderActions
            onCheckout={onCheckout}
            onQuote={onQuote}
            loading={checkoutLoading}
            disabled={cart.length === 0}
            vatEnabled={vatEnabled}
            vatLabel={vatLabel}
          />
        </div>
      </div>
    </>
  );
}

interface SubscriptionTabProps {
  activeSub: AggregatedActiveSubscription | null | undefined;
  seatQty: number;
  subBasePrice: number;
  subUpsellHint: UpsellHint | null;
  subDiscount: number;
  subDiscountAmt: number;
  subSubtotal: number;
  subVat: number;
  subTotal: number;
  subCheckoutLoading: boolean;
  vatEnabled: boolean;
  vatLabel: string;
  onSetSeatQty: (qty: number) => void;
  onCheckout: () => void;
  onQuote: () => void;
  onContact: () => void;
}

export function SubscriptionTab({
  activeSub,
  seatQty,
  subBasePrice,
  subUpsellHint,
  subDiscount,
  subDiscountAmt,
  subSubtotal,
  subVat,
  subTotal,
  subCheckoutLoading,
  vatEnabled,
  vatLabel,
  onSetSeatQty,
  onCheckout,
  onQuote,
  onContact,
}: SubscriptionTabProps) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 lg:flex-row">
      <div className="flex-1 rounded-xl border border-neutral-200 bg-white p-6">
        {activeSub && <ActiveSubBanner activeSub={activeSub} />}
        <p className="mb-4 text-sm font-medium text-neutral-700">
          Give your team access to every course in the library.
        </p>
        <SeatPicker
          seatQty={seatQty}
          subBasePrice={subBasePrice}
          subUpsellHint={subUpsellHint}
          onSetSeatQty={onSetSeatQty}
        />
      </div>
      <SubOrderSummary
        seatQty={seatQty}
        subBasePrice={subBasePrice}
        subDiscount={subDiscount}
        subDiscountAmt={subDiscountAmt}
        subSubtotal={subSubtotal}
        subVat={subVat}
        subTotal={subTotal}
        subCheckoutLoading={subCheckoutLoading}
        disabled={subBasePrice === 0}
        vatEnabled={vatEnabled}
        vatLabel={vatLabel}
        onCheckout={onCheckout}
        onQuote={onQuote}
        onContact={onContact}
      />
    </div>
  );
}
