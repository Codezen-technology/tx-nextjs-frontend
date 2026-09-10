# WooCommerce Order Attribution + PixelYourSite — primary-source research

**Date:** 2026-09-09
**Sources pinned to:** `woocommerce/woocommerce` `trunk` @ `5ec0df0e5c08` (2026-09-09), plugin version `11.2.0-dev`; PixelYourSite `11.4.0` (WordPress.org SVN, current stable tag).
**Method:** raw plugin source only (GitHub raw + WordPress.org plugin SVN). No blog posts or secondary write-ups were used as evidence. The one woocommerce.com doc page cited is used only to corroborate a claim already proven in code.

---

## Summary — what changes about the plan

Four findings change the design. Two are corrections, two are simplifications.

1. **The Store API has a built-in order-attribution extension.** `OrderAttributionBlocksController` calls
   `ExtendSchema::register_endpoint_data()` with namespace **`woocommerce/order-attribution`** on the
   `checkout` schema. Both `POST /wc/store/v1/checkout` and `POST /wc/store/v1/checkout/{id}` accept it
   (`CheckoutOrderSchema extends CheckoutSchema`, and the parent builds its `extensions` property from
   `self::IDENTIFIER === 'checkout'`). **The plan's "the Store API takes no attribution, so stamp it with a
   follow-up WC REST v3 `PUT`" premise is wrong.** Both Store API paths can carry attribution natively,
   in-band, in the same request that places the order. The follow-up `PUT` can be dropped for the
   WooCommerce half.
2. **The Origin label for `source_type: "utm"` is `"Source: <utm_source>"`, not the campaign.** And every
   label runs through `ucfirst()`, so it reads `Organic: Google`, `Referral: Example.com`. Acceptance
   criteria 1 and 2 in `docs/ORDER_ATTRIBUTION.md` describe the wrong strings.
3. **WC REST v3 `POST /orders` does accept and persist underscore-prefixed `meta_data`.** WooCommerce's
   `meta_data` property is a controller-owned property, entirely separate from WordPress core's registered-
   `meta` field, so core's protected-meta rule never engages. There is no `is_protected_meta()` check
   anywhere on the write path. Plan's assumption holds.
4. **PixelYourSite is cheaper to fix than the spec assumed.** It writes **one** order meta key,
   `pys_enrich_data` (no leading underscore, an array), and — critically — every field it stores is first
   read from `$_REQUEST`. Appending query-string params (`?pys_landing=…&pys_source=…&pys_utm=…`) to the
   order-creating REST call makes PixelYourSite record real attribution with **zero PHP and zero plugin
   changes**. The spec's "PixelYourSite's keys are internal and would need a mapping hook maintained in the
   backend plugin" is not accurate.

---

## 1. Exact meta key names

**Answer.** Prefix is `_wc_order_attribution_` — confirmed. The enumerating array is `$default_fields` in
the `OrderAttributionMeta` trait. It lists **16** fields. A **17th** key, `device_type`, is written too, but
is derived server-side from `user_agent` rather than being in the array.

`plugins/woocommerce/src/Internal/Traits/OrderAttributionMeta.php` (lines 26–48):

```php
private $default_fields = array(
    // main fields.
    'source_type'          => 'current.typ',
    'referrer'             => 'current_add.rf',

    // utm fields.
    'utm_campaign'         => 'current.cmp',
    'utm_source'           => 'current.src',
    'utm_medium'           => 'current.mdm',
    'utm_content'          => 'current.cnt',
    'utm_id'               => 'current.id',
    'utm_term'             => 'current.trm',
    'utm_source_platform'  => 'current.plt',
    'utm_creative_format'  => 'current.fmt',
    'utm_marketing_tactic' => 'current.tct',

    // additional fields.
    'session_entry'        => 'current_add.ep',
    'session_start_time'   => 'current_add.fd',
    'session_pages'        => 'session.pgs',
    'session_count'        => 'udata.vst',
    'user_agent'           => 'udata.uag',
);
```

The prefix is built in `set_field_prefix()` — note the double underscore handling, which is why the stored
key has exactly one leading underscore:

```php
$prefix = (string) apply_filters( 'wc_order_attribution_tracking_field_prefix', 'wc_order_attribution_' );
$prefix = trim( $prefix, '_' );          // -> 'wc_order_attribution'
$this->field_prefix = "{$prefix}_";      // -> 'wc_order_attribution_'
...
private function get_meta_prefixed_field_name( string $name ): string {
    return "_{$this->get_prefixed_field_name( $name )}";   // -> '_wc_order_attribution_source_type'
}
```

`device_type` is added in `get_source_values()`:

```php
// Set the device type if possible using the user agent.
if ( array_key_exists( 'user_agent', $values ) && ! empty( $values['user_agent'] ) ) {
    $values['device_type'] = $this->get_device_type( $values );
}
```

**Complete list of order meta keys written (17):**

```
_wc_order_attribution_source_type
_wc_order_attribution_referrer
_wc_order_attribution_utm_campaign
_wc_order_attribution_utm_source
_wc_order_attribution_utm_medium
_wc_order_attribution_utm_content
_wc_order_attribution_utm_id
_wc_order_attribution_utm_term
_wc_order_attribution_utm_source_platform
_wc_order_attribution_utm_creative_format
_wc_order_attribution_utm_marketing_tactic
_wc_order_attribution_session_entry
_wc_order_attribution_session_start_time
_wc_order_attribution_session_pages
_wc_order_attribution_session_count
_wc_order_attribution_user_agent
_wc_order_attribution_device_type      # derived from user_agent, not in $default_fields
```

`origin` is **never stored**. It is computed on every render from `source_type` + `utm_source` (see §3).
The field list is filterable (`wc_order_attribution_tracking_fields`) and so is the prefix
(`wc_order_attribution_tracking_field_prefix`), so a third-party plugin could in principle change both —
worth a one-time check against the live store, but no core code path alters them.

Two hooks the same file exposes, relevant to us:

- `set_order_source_data()` writes with `add_meta_data()` and **bails entirely if every value is empty**:
  `if ( empty( array_filter( $source_data ) ) ) { return; }`.
- `OrderAttributionController::has_attribution( $order )` returns true if **any** of the 16 field keys
  already exists on the order. Both the classic-checkout and Store API save paths check it first, so
  attribution is written once and never overwritten.

**URLs**

- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/Internal/Traits/OrderAttributionMeta.php
- https://raw.githubusercontent.com/woocommerce/woocommerce/trunk/plugins/woocommerce/src/Internal/Traits/OrderAttributionMeta.php
- Corroboration (docs, not evidence): https://woocommerce.com/document/order-attribution-tracking/ — "The Origin label … is no longer stored as a generated meta key … the value is generated on the fly."

---

## 2. Allowed values

### `source_type`

The field is a free-form string (`sanitize_text_field`) — WooCommerce does **not** validate it against an
enum on write. What is authoritative is the set of values that _render a label_. That set is the `switch` in
`OrderAttributionMeta::get_origin_label()`:

`plugins/woocommerce/src/Internal/Traits/OrderAttributionMeta.php`, `get_origin_label()`:

```php
switch ( $source_type ) {
    case 'utm':        $label = __( 'Source: %s', 'woocommerce' );   break;
    case 'organic':    $label = __( 'Organic: %s', 'woocommerce' );  break;
    case 'referral':   $label = __( 'Referral: %s', 'woocommerce' ); break;
    case 'typein':     $label = ''; $source = __( 'Direct', 'woocommerce' );        break;
    case 'mobile_app': $label = ''; $source = __( 'Mobile app', 'woocommerce' );    break;
    case 'admin':      $label = ''; $source = __( 'Web admin', 'woocommerce' );     break;
    case 'pos':        $label = ''; $source = __( 'Point of Sale', 'woocommerce' ); break;
    default:           $label = ''; $source = __( 'Unknown', 'woocommerce' );       break;
}
```

So the recognised set is exactly:

| `source_type`          | produced by                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `utm`                  | Sourcebuster, when any `utm_*` is present                                           |
| `organic`              | Sourcebuster, referrer matched as a search engine                                   |
| `referral`             | Sourcebuster, external referrer                                                     |
| `typein`               | Sourcebuster, no/internal referrer                                                  |
| `admin`                | `OrderAttributionController::maybe_set_admin_source()` — orders created in wp-admin |
| `mobile_app`           | WooCommerce mobile app (not written by any code path in this repo tree)             |
| `pos`                  | WooCommerce Point of Sale                                                           |
| anything else / absent | falls through to `Unknown`                                                          |

Corroborated independently by the metabox, which treats the same four as label-only sources —
`plugins/woocommerce/src/Internal/Admin/Orders/MetaBoxes/OrderAttribution.php`:

```php
// For direct, web admin, mobile app or pos orders, also don't show more details.
$simple_sources = array( 'typein', 'admin', 'mobile_app', 'pos' );
```

The first four come from Sourcebuster, which WooCommerce bundles. Its terms table
(`plugins.svn.wordpress.org/woocommerce/trunk/assets/js/sourcebuster/sourcebuster.js`):

```js
traffic: {
  utm:        'utm',
  organic:    'organic',
  referral:   'referral',
  typein:     'typein'
},
none: '(none)',
```

and the direct defaults, same file:

```js
params.typein_attributes = { source: "(direct)", medium: "(none)" };
```

— which is where `utm_source = "(direct)"` / `utm_medium = "(none)"` in the plan's classification table
comes from. That matches WooCommerce's own behaviour.

### `device_type`

Exactly three values, produced by `MobileDetect`:

```php
protected function get_device_type( array $values ): string {
    $detector = new MobileDetect( array(), $values['user_agent'] );
    if ( $detector->isMobile() ) {  return 'Mobile'; }
    elseif ( $detector->isTablet() ) { return 'Tablet'; }
    else { return 'Desktop'; }
}
```

The metabox maps anything else to `Unknown` for display only
(`MetaBoxes/OrderAttribution.php::format_meta_data()`). Case matters: `Desktop`, `Mobile`, `Tablet`.

### `session_start_time`

`MySQL-style datetime string, UTC: "YYYY-MM-DD HH:MM:SS"`. It maps to Sourcebuster's `current_add.fd`
("fire date"). Sourcebuster's formatter:

```js
setDate: function(date, offset) {
  ...
  return (year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second);
}
```

and WooCommerce initialises Sourcebuster with `timezone_offset: '0', // utc`
(`plugins/woocommerce/client/legacy/js/frontend/order-attribution.js`). So the plan's stated format is
correct.

**URLs**

- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/Internal/Traits/OrderAttributionMeta.php
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/Internal/Admin/Orders/MetaBoxes/OrderAttribution.php
- https://plugins.svn.wordpress.org/woocommerce/trunk/assets/js/sourcebuster/sourcebuster.js
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/client/legacy/js/frontend/order-attribution.js

---

## 3. Origin column rendering

**Answer.** The column is registered in `OrderAttributionController::register_order_origin_column()` and
rendered by `output_origin_column()`, which reads exactly **two** meta keys and delegates to
`get_origin_label()`.

`plugins/woocommerce/src/Internal/Orders/OrderAttributionController.php`:

```php
private function output_origin_column( WC_Order $order ) {
    $source_type = $order->get_meta( $this->get_meta_prefixed_field_name( 'source_type' ) );
    $source      = $order->get_meta( $this->get_meta_prefixed_field_name( 'utm_source' ) );
    $origin      = $this->get_origin_label( $source_type, $source );
    echo esc_html( $origin );
}
```

The label build, tail of `get_origin_label()` in the trait — note `ucfirst()` and the paren-stripping:

```php
$formatted_source = apply_filters(
    'wc_order_attribution_origin_formatted_source',
    ucfirst( trim( $source, '()' ) ),
    $source
);
$label = (string) apply_filters( 'wc_order_attribution_origin_label', $label, $source_type, $source, $formatted_source );

if ( false === strpos( $label, '%' ) ) {
    return $formatted_source;
}
return sprintf( $label, $formatted_source );
```

### Exact mapping

| stored `source_type`       | stored `utm_source`  | rendered label          |
| -------------------------- | -------------------- | ----------------------- |
| `utm`                      | `newsletter`         | `Source: Newsletter`    |
| `utm`                      | `google`             | `Source: Google`        |
| `organic`                  | `google`             | `Organic: Google`       |
| `referral`                 | `example.com`        | `Referral: Example.com` |
| `typein`                   | `(direct)` (ignored) | `Direct`                |
| `admin`                    | anything (ignored)   | `Web admin`             |
| `mobile_app`               | anything (ignored)   | `Mobile app`            |
| `pos`                      | anything (ignored)   | `Point of Sale`         |
| **missing / unrecognised** | —                    | `Unknown`               |

Mechanics worth internalising:

- For `typein` / `admin` / `mobile_app` / `pos`, `$label` is set to `''` and `$source` is **overwritten**
  with the literal. `strpos('', '%')` is false, so the function returns `$formatted_source` alone —
  the stored `utm_source` is discarded entirely for those four.
- For `utm` / `organic` / `referral`, `$formatted_source = ucfirst( trim( $utm_source, '()' ) )`. So
  `google` renders as `Google`, and a value that was written as `(direct)` would render as `Direct`.
- **Fallback with no meta at all:** `$order->get_meta()` returns `''` for both keys, `''` hits the
  `default:` branch, `$source` becomes `Unknown`, `$label` is `''` → the column prints `Unknown`. This is
  exactly the symptom the headless store sees today.
- The same `get_origin_label()` also feeds `filter_meta_data()` (which injects a synthetic `origin` key for
  the edit-order metabox) and `send_order_tracks()` (untranslated variant, `$translated = false`).

**URLs**

- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/Internal/Orders/OrderAttributionController.php
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/Internal/Traits/OrderAttributionMeta.php

---

## 4. WC REST API v3 and underscore-prefixed meta

**Answer: yes — `POST /wp-json/wc/v3/orders` accepts `meta_data` entries whose `key` starts with `_`, and
persists them. WooCommerce applies no protected-meta restriction on this path.**

The v3 orders controller routes `meta_data` straight into `MetaDataUtil::update()`.

`plugins/woocommerce/includes/rest-api/Controllers/Version3/class-wc-rest-orders-controller.php`,
`prepare_object_for_database()`:

```php
case 'meta_data':
    MetaDataUtil::update( $value, $order );
    break;
```

`plugins/woocommerce/src/Utilities/MetaDataUtil.php`:

```php
public static function update( $meta_data, WC_Data $target, $default_id = '' ): void {
    if ( ! is_array( $meta_data ) ) {
        return;
    }
    foreach ( self::normalize( $meta_data, $default_id ) as $meta ) {
        $target->update_meta_data( $meta['key'], $meta['value'], $meta['id'] );
    }
}
```

`normalize()` only requires that `key` be set. There is **no** key-shape check, no `is_protected_meta()`,
no allow/deny list. The v2 controller (which v3 extends) is the same, just inlined:

`plugins/woocommerce/includes/rest-api/Controllers/Version2/class-wc-rest-orders-v2-controller.php`:

```php
case 'meta_data':
    if ( is_array( $value ) ) {
        foreach ( $value as $meta ) {
            $order->update_meta_data( $meta['key'], $meta['value'], isset( $meta['id'] ) ? $meta['id'] : '' );
        }
    }
    break;
```

**Why core's protection does not apply.** WordPress core protects underscore-prefixed meta through
`WP_REST_Meta_Fields`, which backs the **`meta`** object on core post-type endpoints and only ever exposes
keys registered with `register_meta( …, show_in_rest )`. WooCommerce's `meta_data` is a _different_,
controller-owned array property on its own CRUD controllers (`WC_REST_CRUD_Controller` →
`WC_REST_Controller`); it never goes through `WP_REST_Meta_Fields`. I read
`class-wc-rest-controller.php`, `class-wc-rest-crud-controller.php`, and both orders controllers: the only
meta filtering that exists is on **read**, never on write —

- `WC_REST_Controller::get_meta_data_for_response()` applies the `include_meta` / `exclude_meta` query
  params;
- `WC_REST_Orders_V2_Controller::filter_internal_meta_keys()` hides `WC_Order_Data_Store_CPT`'s internal
  meta keys from the response when HPOS is on. The `_wc_order_attribution_*` keys are not internal meta
  keys (they map to no HPOS column), so they persist and read back normally.

`woocommerce_rest_check_permissions` is a **capability** filter (`wc-rest-functions.php`), applied at
`permission_callback` time against `edit_shop_orders` etc. It has nothing to do with meta keys.

The one write-side restriction that does exist is scoped to **line-item** meta, not order meta:
`OrderLineMetaValidator::assert_no_serialized_meta_value()` rejects serialized values under reserved line
meta keys (`taxes` / `_taxes` …). Order-level `meta_data` is untouched by it.

**Practical consequence for us.** `POST /wc/v3/orders` with

```json
{ "meta_data": [ { "key": "_wc_order_attribution_source_type", "value": "organic" }, … ] }
```

works as the plan assumes. No alternative API is needed. Two additional notes:

- `OrderAttributionController::maybe_set_admin_source()` runs on `woocommerce_new_order` but bails unless
  `is_admin()`, so a REST-created order will **not** be stamped `source_type: admin`.
- Because the meta is added before `$order->save()` completes, it lands before `woocommerce_new_order`
  fires — which matters for PixelYourSite (§6).
- If you ever want the PHP-side path instead, the supported programmatic hook is
  `do_action( 'woocommerce_order_save_attribution_data', $order, $unprefixed_params )`, documented
  `@since 8.5.0` in `OrderAttributionController`. That requires PHP, which this project is avoiding.

**URLs**

- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/includes/rest-api/Controllers/Version3/class-wc-rest-orders-controller.php
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/includes/rest-api/Controllers/Version2/class-wc-rest-orders-v2-controller.php
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/Utilities/MetaDataUtil.php
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/includes/rest-api/Controllers/Version3/class-wc-rest-controller.php
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/includes/wc-rest-functions.php

---

## 5. Store API

### (a) Does the Store API accept arbitrary meta?

**No.** The checkout schema has no `meta_data` property at all. The only extension surface is `extensions`,
and only namespaces registered through `ExtendSchema::register_endpoint_data()` survive.

`plugins/woocommerce/src/StoreApi/Schemas/V1/CheckoutSchema.php::get_properties()` ends with:

```php
self::EXTENDING_KEY => $this->get_extended_schema( self::IDENTIFIER ),
```

(`AbstractSchema::EXTENDING_KEY = 'extensions'`.) `AbstractSchema::get_extended_schema()` builds the
property from `ExtendSchema::get_endpoint_schema()`, which iterates only over `$this->extend_data[$endpoint]`
— i.e. registered namespaces. The sanitize callback then **rebuilds the array from the registered property
list**, so unregistered keys are dropped:

`plugins/woocommerce/src/StoreApi/Schemas/V1/AbstractSchema.php::get_recursive_sanitize_callback()`:

```php
return function ( $values, $request, $param ) use ( $properties ) {
    $sanitized_values = [];
    foreach ( $properties as $property_key => $property_value ) {
        $current_value = isset( $values[ $property_key ] ) ? $values[ $property_key ] : null;
        ...
        $sanitized_values[ $property_key ] = $current_value;
    }
    return $sanitized_values;
};
```

Registration itself hard-fails on an unknown endpoint:

`plugins/woocommerce/src/StoreApi/Schemas/ExtendSchema.php::register_endpoint_data()`:

```php
if ( ! in_array( $args['endpoint'], $this->endpoints, true ) ) {
    $this->throw_exception( sprintf( 'You must provide a valid Store REST endpoint to extend, valid endpoints are: %1$s. You provided %2$s.', … ) );
}
$this->extend_data[ $args['endpoint'] ][ $args['namespace'] ] = [ … ];
```

### (b) Is there a built-in attribution extension? — **Yes.**

`plugins/woocommerce/src/Internal/Orders/OrderAttributionBlocksController.php`:

```php
private function extend_api() {
    $this->extend_schema->register_endpoint_data(
        array(
            'endpoint'        => CheckoutSchema::IDENTIFIER,
            'namespace'       => 'woocommerce/order-attribution',
            'schema_callback' => $this->get_schema_callback(),
        )
    );
    // Update order based on extended data.
    add_action(
        'woocommerce_store_api_checkout_update_order_from_request',
        function ( $order, $request ) {
            $extensions = $request->get_param( 'extensions' );
            $params     = $extensions['woocommerce/order-attribution'] ?? array();

            if ( empty( $params ) ) {
                return;
            }
            if ( $this->order_attribution_controller->has_attribution( $order ) ) {
                return;
            }
            do_action( 'woocommerce_order_save_attribution_data', $order, $params );
        },
        10,
        2
    );
}
```

**Namespace string:** `woocommerce/order-attribution`

**Field names it expects:** `$this->order_attribution_controller->get_field_names()`, i.e.
`array_keys( $default_fields )` — the **16 unprefixed** names from §1, in this order:

```
source_type, referrer, utm_campaign, utm_source, utm_medium, utm_content, utm_id, utm_term,
utm_source_platform, utm_creative_format, utm_marketing_tactic, session_entry,
session_start_time, session_pages, session_count, user_agent
```

Each is declared `'type' => array( 'string', 'null' )` with `sanitize_text_field` — so **send strings, not
numbers**, for `session_pages` / `session_count`. `device_type` is **not** a schema field; it is derived
server-side from `user_agent` inside `get_source_values()`. This is corroborated by WooCommerce's own
storefront client, which posts the same shape:

`plugins/woocommerce/client/legacy/js/frontend/order-attribution.js`:

```js
window.wp.data
  .dispatch(window.wc.wcBlocksData.CHECKOUT_STORE_KEY)
  .setExtensionData("woocommerce/order-attribution", values, true);
```

where `values` is `Object.fromEntries` over `Object.entries( wc_order_attribution.fields )` — all 16 keys,
always.

### Does it reach `POST /checkout/{id}` too?

Yes. `CheckoutOrderSchema extends CheckoutSchema` and its `get_properties()` calls
`parent::get_properties()` (only unsetting `create_account`). The parent builds `extensions` from
`self::IDENTIFIER`, which resolves at compile time in `CheckoutSchema` to `'checkout'` — so the
`checkout-order` schema inherits the `checkout` extension surface. And the hook that consumes it,
`woocommerce_store_api_checkout_update_order_from_request`, is fired from
`StoreApi/Utilities/CheckoutTrait::update_order_from_request()`, a trait used by **both** `Checkout` and
`CheckoutOrder`:

`plugins/woocommerce/src/StoreApi/Routes/V1/CheckoutOrder.php`:

```php
class CheckoutOrder extends AbstractCartRoute {
	use OrderAuthorizationTrait;
	use CheckoutTrait;
...
	$this->update_billing_address( $request );
	$this->update_order_from_request( $request );
```

**Caveats to design around**

1. `has_attribution()` short-circuits. For the Buy-Now path (`POST /wc/v3/orders` then
   `POST /wc/store/v1/checkout/{id}`), the REST v3 create will already have written the meta, so the
   Store API extension on the pay call is a no-op. That is correct behaviour, not a bug — but it means the
   Buy-Now path must keep writing its meta at create time.
2. **Send all 16 keys.** `OrderAttributionMeta::get_source_values()` indexes `$raw_values[ $field_name ]`
   with no null-coalesce; omitted fields produce a PHP "undefined array key" warning and an empty value.
   Use `"(none)"` for fields you want WooCommerce to skip — `get_source_values()` explicitly drops that
   sentinel: `if ( '(none)' === $value ) { continue; }`.
3. The extension only exists when the `order_attribution` feature is enabled — `on_init()` bails on
   `! $this->features_controller->feature_is_enabled( 'order_attribution' )`. It is on by default (since
   8.5) but is toggleable in **WooCommerce → Settings → Advanced → Features**. Verify on the live store.
4. Store API non-GET requests still require the `Nonce` header or a Cart-Token
   (`AbstractCartRoute::check_nonce()`), which the BFF already satisfies today.

**URLs**

- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/Internal/Orders/OrderAttributionBlocksController.php
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/StoreApi/Schemas/ExtendSchema.php
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/StoreApi/Schemas/V1/AbstractSchema.php
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/StoreApi/Schemas/V1/CheckoutSchema.php
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/StoreApi/Schemas/V1/CheckoutOrderSchema.php
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/StoreApi/Routes/V1/CheckoutOrder.php
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/StoreApi/Utilities/CheckoutTrait.php

### Example payload

```jsonc
// POST /wp-json/wc/store/v1/checkout   (and POST /wc/store/v1/checkout/{id})
{
  "billing_address": {
    /* … */
  },
  "payment_method": "stripe",
  "extensions": {
    "woocommerce/order-attribution": {
      "source_type": "organic",
      "referrer": "https://www.google.com/",
      "utm_campaign": "(none)",
      "utm_source": "google",
      "utm_medium": "organic",
      "utm_content": "(none)",
      "utm_id": "(none)",
      "utm_term": "(none)",
      "utm_source_platform": "(none)",
      "utm_creative_format": "(none)",
      "utm_marketing_tactic": "(none)",
      "session_entry": "https://example.com/courses",
      "session_start_time": "2026-09-09 10:00:00",
      "session_pages": "4",
      "session_count": "2",
      "user_agent": "Mozilla/5.0 (Macintosh; …)",
    },
  },
}
```

---

## 6. PixelYourSite

Pinned to **PixelYourSite 11.4.0** (WordPress.org stable tag). All paths below are relative to the plugin
root.

### Meta keys

**PixelYourSite writes exactly one order meta key: `pys_enrich_data`** — no underscore prefix, value is a
PHP array. It is **not** one key per field. The metabox's "Landing Page", "Traffic source" and the five
UTM rows are all rendered from sub-keys of that one array.

`includes/enrich/class_enrich_order.php`, `save_pys_data_to_order()`:

```php
// PROTECTION AGAINST DOUBLE EXECUTION:
// Check if our data already exists. If it does - interrupt execution.
if ( ! empty( $order->get_meta( 'pys_enrich_data' ) ) ) {
    return;
}

$pysData = $this->getPysData( false );
$order->update_meta_data( 'pys_enrich_data', $pysData );
$order->save();
```

The array shape, `buildRegularPysData()` + `getPysData()`:

```php
return [
    'pys_landing'      => $this->getRequestValue( 'pys_landing', $default_landing, 'undefined' ),
    'pys_source'       => $this->getRequestValue( 'pys_source', $default_source, 'undefined' ),
    'pys_utm'          => $this->getRequestValue( 'pys_utm', $default_utm ),
    'pys_utm_id'       => $this->getRequestValue( 'pys_utm_id', $default_utm_id ),
    'last_pys_landing' => $this->getRequestValue( 'last_pys_landing', $default_last_landing, 'undefined' ),
    'last_pys_source'  => $this->getRequestValue( 'last_pys_source', $default_last_source, 'undefined' ),
    'last_pys_utm'     => $this->getRequestValue( 'last_pys_utm', $default_last_utm ),
    'last_pys_utm_id'  => $this->getRequestValue( 'last_pys_utm_id', $default_last_utm_id ),
];
// …then:
$pysData['pys_browser_time'] = $this->getRequestValue( 'pys_browser_time', getBrowserTime() );
```

| metabox row                                                                   | array sub-key                                       |
| ----------------------------------------------------------------------------- | --------------------------------------------------- | ------- | ------- |
| FIRST VISIT → Landing Page                                                    | `pys_landing`                                       |
| FIRST VISIT → Traffic source                                                  | `pys_source`                                        |
| FIRST VISIT → utm_source / utm_medium / utm_campaign / utm_content / utm_term | `pys_utm` (one pipe-joined string)                  |
| FIRST VISIT → ad click ids                                                    | `pys_utm_id` (`fbadid`, `gadid`, `padid`, `bingid`) |
| LAST VISIT → Landing Page                                                     | `last_pys_landing`                                  |
| LAST VISIT → Traffic source                                                   | `last_pys_source`                                   |
| LAST VISIT → UTMs                                                             | `last_pys_utm`                                      |
| LAST VISIT → ad click ids                                                     | `last_pys_utm_id`                                   |
| Client's browser time (Hour / Day / Month)                                    | `pys_browser_time` (pipe-joined `HH-HH              | Weekday | Month`) |

The UTM sub-keys are **not** separate meta. They are a single pipe-joined `key:value` string built by
`formatUtms()`:

```php
return implode( '|', array_map(
    function ( $key, $value ) { return "$key:$value"; },
    array_keys( $utms ), $utms
) );
```

e.g. `utm_source:newsletter|utm_medium:email|utm_campaign:spring|utm_term:undefined|utm_content:undefined`.

### The metabox

Registered and rendered in the same class; the view is
`includes/enrich/views/html-order-meta-box.php`:

```php
$data = $order->get_meta( 'pys_enrich_data', true );
...
<th>Landing Page:</th>  … $data['pys_landing'] ?: "No Landing Page"
<th>Traffic source:</th> … $data['pys_source'] ?: "No Traffic source"
<?php if ( ! empty( $data['pys_utm'] ) ) { $utms = explode("|", $data['pys_utm']); \PixelYourSite\Enrich\printUtm($utms); } ?>
```

and `includes/enrich/views/function-helper.php` turns the literal `undefined` into the observed text:

```php
$value = $item[1] == "undefined" ? "No ".$name." detected for this order" : $item[1];
```

The metabox is registered on `add_meta_boxes` in `woo_add_order_meta_boxes()` and gated by the
`woo_enabled_save_data_to_orders` / `woo_enabled_display_data_to_orders` plugin options.

### Why it stores the literal `"REST API"` — confirmed

Four functions in `includes/enrich/class_enrich_order.php` produce it. They all have the same shape: read
the value from `$_SESSION` / `$_COOKIE`; if that yields nothing **and** we are in a REST request, use the
literal.

```php
private function getDefaultLanding() {
    $landingPage = $_SESSION['LandingPage'] ?? $_COOKIE['pys_landing_page'] ?? '';

    if ((empty($landingPage) || strpos($landingPage, 'undefined') === 0 || strpos($landingPage, 'http://undefined') === 0)
        && (defined( 'REST_REQUEST' ) && REST_REQUEST) ) {
        $landingPage = 'REST API';
    }
    return sanitize_text_field($landingPage);
}

private function getDefaultSource() {
    $trafficSource = $_SESSION['TrafficSource'] ?? $_COOKIE['pysTrafficSource'] ?? '';
    if ((empty($trafficSource) || strpos($trafficSource, 'undefined') === 0)
        && (defined( 'REST_REQUEST' ) && REST_REQUEST) ) {
        $trafficSource = 'REST API';
    }
    return sanitize_text_field($trafficSource);
}
```

plus `getDefaultLastLanding()` and `getDefaultLastSource()`, identical logic against
`last_pys_landing_page` / `last_pysTrafficSource`. A fifth site in
`includes/functions-common.php::getTrafficSource()`:

```php
} else {
    return defined( 'REST_REQUEST' ) && REST_REQUEST ? 'REST API' : $source;
}
```

**This confirms the diagnosis exactly.** The trigger is `REST_REQUEST` being defined with no browser
cookies/session — i.e. a server-to-server order create. It is a deliberate sentinel, not a bug.

The empty UTM rows come from the same request having no `$_GET`/cookie UTMs:
`getUtms( true )` seeds `"undefined"` for all five (`includes/functions-common.php`), `formatUtms()` joins
them, and `printUtm()` renders each as `No utm_source detected for this order`. That is a precise match for
the observed metabox.

### The cheap fix — `$_REQUEST` overrides

Every field is read through `getRequestValue()`, which prefers `$_REQUEST` over the cookie/session fallback:

```php
private function getRequestValue( $key, $fallback = '', $empty_fallback = null ) {
    if ( isset( $_REQUEST[ $key ] ) ) {
        return sanitize_text_field( $_REQUEST[ $key ] );
    }
    if ( $empty_fallback !== null && empty( $fallback ) ) {
        return $empty_fallback;
    }
    return $fallback ?? '';
}
```

So appending these as **query-string** params to the order-creating request makes PixelYourSite record real
attribution with no PHP:

```
POST /wp-json/wc/v3/orders
  ?pys_landing=https%3A%2F%2Fexample.com%2Fcourses
  &pys_source=google
  &pys_utm=utm_source%3Agoogle%7Cutm_medium%3Aorganic%7Cutm_campaign%3Aundefined%7Cutm_term%3Aundefined%7Cutm_content%3Aundefined
  &last_pys_landing=…&last_pys_source=…&last_pys_utm=…
```

Query string, not JSON body — PHP populates `$_REQUEST` from `$_GET`/`$_POST`, and a
`Content-Type: application/json` body never lands in `$_POST`. WP REST ignores params it has no schema for,
so the extra query args are harmless to WooCommerce.

Alternatively, write `pys_enrich_data` yourself in the REST v3 `meta_data` array — it has no underscore
prefix and §4 shows underscore-prefixed keys are accepted anyway. On the REST v3 create path this wins,
because order meta is persisted inside `$order->save()` **before** `woocommerce_new_order` fires, and
`save_pys_data_to_order()` bails when `pys_enrich_data` is already non-empty. (`meta_data` values are
JSON, so you would be writing an object where PixelYourSite writes a PHP array — WooCommerce serialises
either, and `is_array()` in the view would be satisfied by a JSON object decoding to an associative array.
**Unverified against a live store**; the `$_REQUEST` route avoids the question entirely and is the one to
try first.)

**Hazard on the Store API path.** `woo_save_checkout_fields_block()` — bound to
`woocommerce_store_api_checkout_order_processed` — has **no** double-execution guard and overwrites
unconditionally:

```php
public function woo_save_checkout_fields_block( $order ) {
    if ( ! $order instanceof \WC_Order ) { return; }
    $pysData = $this->getPysData( false );
    $order->update_meta_data( 'pys_enrich_data', $pysData );
    $order->save();
}
```

So for `POST /wc/store/v1/checkout` a pre-written `pys_enrich_data` will be clobbered — but since
`getPysData()` still reads `$_REQUEST` first, the query-string approach survives that overwrite. Another
reason to prefer it.

**URLs**

- https://plugins.svn.wordpress.org/pixelyoursite/tags/11.4.0/includes/enrich/class_enrich_order.php
- https://plugins.svn.wordpress.org/pixelyoursite/tags/11.4.0/includes/enrich/views/html-order-meta-box.php
- https://plugins.svn.wordpress.org/pixelyoursite/tags/11.4.0/includes/enrich/views/function-helper.php
- https://plugins.svn.wordpress.org/pixelyoursite/tags/11.4.0/includes/functions-common.php
- Trac browser equivalents: https://plugins.trac.wordpress.org/browser/pixelyoursite/tags/11.4.0/includes/enrich/class_enrich_order.php

---

## What I could NOT verify

- **`mobile_app` and `pos` writers.** `get_origin_label()` handles both, and the metabox lists them in
  `$simple_sources`, but no code in the `woocommerce/woocommerce` tree writes either value. They come from
  the WooCommerce mobile app and the Point of Sale extension, neither of which is in this repo. The label
  mapping is verified; the producer is not. Irrelevant to this project.
- **Live-store confirmation.** Nothing here was executed against the actual WordPress instance. Specifically
  unverified: (a) that no plugin on the live store filters `wc_order_attribution_tracking_fields` or
  `wc_order_attribution_tracking_field_prefix`; (b) that the `order_attribution` feature toggle is enabled;
  (c) that PixelYourSite's `woo_enabled_save_data_to_orders` option is on; (d) the installed WooCommerce and
  PixelYourSite versions. The plan already carries a task to confirm the meta keys against a real order —
  extend it to cover these four.
- **Writing `pys_enrich_data` as a JSON object via REST `meta_data`.** Reasoned from the code but not run.
  See §6.
- **`extensions` default-filling behaviour when the key is omitted from the request.** I traced
  `get_recursive_schema_property_defaults()` / `get_recursive_sanitize_callback()` and concluded that
  omitted namespace fields sanitize to `""` (and that `set_order_source_data()` then bails because
  `array_filter()` is empty, which is why orders currently show `Unknown` rather than a row of blanks). This
  is a code reading, not an executed test. It does not change the recommendation, which is to send all 16
  fields explicitly.
- **WooCommerce version on trunk is `11.2.0-dev`.** Order Attribution has been stable since 8.5.0 and the
  trait's `@since` tags show no field-list changes, but I did not diff every release tag between 8.5 and
  11.2. If the live store runs an older WooCommerce, `pos` may be absent from `get_origin_label()` (it is
  the newest branch) — harmless for us.

---

## Corrections to `docs/ORDER_ATTRIBUTION.md` and `docs/superpowers/plans/2026-09-09-order-attribution.md`

### `docs/ORDER_ATTRIBUTION.md`

1. **"Order paths that must be covered" table + surrounding prose — factually wrong.** Replace:

   > "The two Store API paths cannot [carry meta] — the Store API only accepts `extensions`, which requires a
   > registered PHP extension. Those two write the meta with a follow-up WC REST v3 `PUT`…"

   with: the Store API accepts `extensions`, and **WooCommerce registers its own attribution extension** under
   namespace `woocommerce/order-attribution` on the `checkout` schema, inherited by `checkout-order`. Both
   Store API paths carry attribution in-band. No follow-up `PUT` is needed for WooCommerce meta.

2. **Acceptance criterion 1** — "the newsletter campaign" is wrong. With
   `utm_source=newsletter&utm_medium=email&utm_campaign=spring`, the Origin column reads
   **`Source: Newsletter`** (from `utm_source`, `ucfirst`-ed). The campaign appears in the edit-order metabox
   and Analytics, not in the Origin label. Reword.
3. **Acceptance criterion 2** — the rendered label is **`Organic: Google`**, capital G (`ucfirst`). State the
   exact expected string.
4. **Acceptance criterion 3** — add that the Origin column renders **`Direct`** for `typein`, and that
   `utm_source` is ignored entirely for that source type.
5. **"WooCommerce meta keys" section** — the 17-key list is correct. Add: `origin` is never stored, it is
   derived at render time; and `device_type` is not part of `$default_fields` (it is derived from
   `user_agent`), which is why the Store API extension schema has only 16 fields.
6. **"This key list must be verified against the live store" note** — it can now be softened: the list is
   verified against WooCommerce source. Keep a live check, but retarget it at the two filters
   (`wc_order_attribution_tracking_fields`, `wc_order_attribution_tracking_field_prefix`) and the
   `order_attribution` feature toggle rather than at the key names.
7. **"Why WooCommerce Order Attribution meta and not PixelYourSite meta"** — the stated reason ("PixelYourSite's
   keys are internal and would need a mapping hook maintained in the backend plugin") is not accurate.
   PixelYourSite stores one non-protected key, `pys_enrich_data`, and reads every field from `$_REQUEST`
   first. Both can be satisfied at once, with no PHP. Recommend adding a short "PixelYourSite (optional
   extra)" section: append `pys_landing`, `pys_source`, `pys_utm`, `pys_utm_id`, `last_pys_landing`,
   `last_pys_source`, `last_pys_utm`, `last_pys_utm_id` as **query-string** params on the order-creating
   call. Note the `pys_utm` pipe format: `utm_source:x|utm_medium:y|utm_campaign:z|utm_term:…|utm_content:…`,
   with the literal `undefined` for unknown values.
8. **"Non-goals" → "Restoring the PixelYourSite metabox specifically"** — this can be promoted from non-goal
   to a low-cost stretch goal, given (7). At minimum, note that it is achievable without touching the plugin.

### `docs/superpowers/plans/2026-09-09-order-attribution.md`

1. **Task 6 ("Attribute the two Store API order paths") — rewrite.** Its premise is stated at line ~1260:

   > "The Store API takes no `meta_data`; it only accepts `extensions`, which needs a registered PHP
   > extension. Both paths therefore stamp the meta with a follow-up WC REST v3 `PUT`, deferred with
   > `after()`…"

   The registered extension already exists in core. Replace the deferred-`PUT` design with: add
   `extensions: { "woocommerce/order-attribution": { …16 string fields… } }` to the Store API request bodies
   built in `src/app/api/cart/checkout/route.ts` and `src/app/api/orders/[id]/store-pay/route.ts`. This
   removes a whole class of failure (a `PUT` that can fail after the shopper has paid) and removes the
   `after()` machinery from those two routes.

2. **Add a second builder alongside `buildOrderAttributionMeta()`** — e.g.
   `buildStoreApiAttributionExtension(state, userAgent): Record<string, string>` — that emits the **16
   unprefixed** field names, **all present**, `String()`-cast (`session_pages`, `session_count` must be
   strings), using `"(none)"` rather than `""` for absent values, and **omitting `device_type`** (WooCommerce
   derives it from `user_agent`). The current builder's `.filter(value !== "")` behaviour is right for
   `meta_data` but wrong for the Store API extension, where omitted keys trigger a PHP undefined-key warning.
3. **`SourceType` union (line ~284)** — `"utm" | "organic" | "referral" | "typein"` covers everything the
   proxy can produce and is fine as the _emit_ type. Add a comment recording that WooCommerce additionally
   recognises `admin`, `mobile_app` and `pos` (written by WordPress admin / the mobile app / POS), and that
   any unrecognised value renders as `Unknown`.
4. **`order-attribution.ts` doc comment (line ~1054)** — "Verified against a real order on the live store;
   see docs/ORDER_ATTRIBUTION.md" is not yet true. Change to cite this research file and the WooCommerce
   source path, and leave the live-order check as an open task.
5. **`buildOrderAttributionMeta()` (line ~1071) — keep as is for the REST v3 path.** The 17-key output
   including `device_type` is correct there: nothing on the REST v3 path derives `device_type`, so writing it
   explicitly is required for the edit-order metabox and Analytics. Add a comment saying so, since the Store
   API builder deliberately differs.
6. **Add a note to the Buy-Now path (Task 5)** — because `OrderAttributionController::has_attribution()`
   short-circuits, the attribution written at `POST /wc/v3/orders` time is what sticks; the subsequent
   `POST /wc/store/v1/checkout/{id}` extension will be ignored for that order. Sending it anyway is harmless
   and is the right defensive default, but the test should assert the create-time write, not the pay-time one.
7. **Assumption list (lines 20–21)** — both assumptions are now verified. Promote them from "assumed" to
   "verified against WooCommerce trunk", citing this file.
8. **Add a task: confirm the `order_attribution` feature toggle is enabled on the live store**
   (WooCommerce → Settings → Advanced → Features). If it is off, neither the meta nor the Store API extension
   does anything, and the Origin column will not even be registered.
9. **Optional new task: PixelYourSite query-string params.** Small, isolated, no PHP — append the eight
   `pys_*` params to the order-creating requests. Worth its own task so it can be dropped if the metabox is
   judged not worth the URL noise.
