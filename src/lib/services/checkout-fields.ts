import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { decodeEntities } from "@/lib/api/parsers";

export interface CheckoutFieldOption {
  value: string;
  label: string;
}

/** A single configured billing field, mirroring WC's checkout field config. */
export interface CheckoutField {
  /** Billing key without the `billing_` prefix (e.g. `first_name`, `address_1`). */
  key: string;
  label: string;
  /** WC field type: text | email | tel | select | country | state | textarea | … */
  type: string;
  required: boolean;
  priority: number;
  placeholder: string;
  class: string[];
  options: CheckoutFieldOption[] | null;
}

interface CheckoutFieldRaw {
  key: string;
  label: string;
  type: string;
  required: boolean;
  priority: number;
  placeholder: string;
  class: string[];
  options: CheckoutFieldOption[] | null;
}

/** Public read for the store's configured billing checkout fields. */
export const checkoutFieldsService = {
  async getFields(): Promise<CheckoutField[]> {
    const { data } = await api.get<CheckoutFieldRaw[]>(endpoints.settings.checkoutFields);
    return (data ?? []).map((f) => ({
      ...f,
      label: decodeEntities(f.label),
      placeholder: decodeEntities(f.placeholder),
      options: f.options
        ? f.options.map((o) => ({ value: o.value, label: decodeEntities(o.label) }))
        : null,
    }));
  },
};
