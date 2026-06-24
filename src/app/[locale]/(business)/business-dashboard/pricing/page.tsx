"use client";

import { BulkDiscountModal } from "@/components/business/pricing/bulk-discount-modal";
import { PricingHeader } from "@/components/business/pricing/pricing-header";
import { LicenceTab, SubscriptionTab } from "@/components/business/pricing/pricing-tabs";
import { QuoteModal } from "@/components/business/pricing/quote-modal";
import { SubContactModal } from "@/components/business/pricing/sub-order-summary";
import { useBusinessPricing } from "@/lib/hooks/useBusinessPricing";

export default function BusinessPricingPage() {
  const pricing = useBusinessPricing();

  return (
    <div className="mx-auto max-w-5xl px-4 py-2">
      <PricingHeader
        tab={pricing.tab}
        onTabChange={pricing.setTab}
        quoteSuccess={pricing.quoteSuccess}
        onDismissQuote={() => pricing.setQuoteSuccess(false)}
        maxDiscount={pricing.maxDiscount}
        onOpenBulkModal={() => pricing.setModalOpen(true)}
      />

      {pricing.tab === "licence" ? (
        <LicenceTab
          cart={pricing.cart}
          totalQty={pricing.totalQty}
          upsellHint={pricing.upsellHint}
          summary={pricing.summary}
          calcLoading={pricing.calcLoading}
          checkoutLoading={pricing.checkoutLoading}
          vatEnabled={pricing.vatEnabled}
          vatLabel={pricing.vatLabel}
          onAddToCart={pricing.addToCart}
          onUpdateQty={pricing.updateQty}
          onRemove={pricing.removeItem}
          onCheckout={pricing.handleCheckout}
          onQuote={() => pricing.setQuoteOpen(true)}
        />
      ) : (
        <SubscriptionTab
          activeSub={pricing.activeSub}
          seatQty={pricing.seatQty}
          subBasePrice={pricing.subBasePrice}
          subUpsellHint={pricing.subUpsellHint}
          subDiscount={pricing.subDiscount}
          subDiscountAmt={pricing.subDiscountAmt}
          subSubtotal={pricing.subSubtotal}
          subVat={pricing.subVat}
          subTotal={pricing.subTotal}
          subCheckoutLoading={pricing.subCheckoutLoading}
          vatEnabled={pricing.vatEnabled}
          vatLabel={pricing.vatLabel}
          onSetSeatQty={pricing.setSeatQty}
          onCheckout={pricing.handleSubCheckout}
          onQuote={() => pricing.setSubQuoteOpen(true)}
          onContact={() => pricing.setSubContactOpen(true)}
        />
      )}

      <BulkDiscountModal
        tiers={pricing.tiers}
        open={pricing.modalOpen}
        onClose={() => pricing.setModalOpen(false)}
        unit={pricing.tab === "subscription" ? "seat" : "licence"}
      />

      <QuoteModal
        open={pricing.quoteOpen}
        cart={pricing.cart}
        onClose={() => pricing.setQuoteOpen(false)}
        onSubmit={pricing.handleQuoteSubmit}
        isSubmitting={pricing.quoteLoading}
      />

      <QuoteModal
        open={pricing.subQuoteOpen}
        cart={[]}
        onClose={() => pricing.setSubQuoteOpen(false)}
        onSubmit={pricing.handleSubQuoteSubmit}
        isSubmitting={pricing.quoteLoading}
      />

      <SubContactModal
        open={pricing.subContactOpen}
        onClose={() => pricing.setSubContactOpen(false)}
      />
    </div>
  );
}
