const AUTOCOMPLETE_MAP: Record<string, string> = {
  first_name: "given-name",
  last_name: "family-name",
  email: "email",
  phone: "tel",
  address_1: "street-address",
  address_2: "address-line2",
  city: "address-level2",
  state: "address-level1",
  postcode: "postal-code",
  country: "country",
};

/** Map WC checkout field row classes to Tailwind grid column spans. */
export function checkoutFieldGridClass(classes: string[]): string {
  if (classes.includes("form-row-wide")) {
    return "sm:col-span-2";
  }
  return "";
}

/** Standard HTML autocomplete token for a billing field key. */
export function checkoutFieldAutoComplete(key: string): string | undefined {
  return AUTOCOMPLETE_MAP[key];
}
