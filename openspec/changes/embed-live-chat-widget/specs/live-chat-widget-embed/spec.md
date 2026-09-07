## Purpose

Defines how this site loads Codezen's Custom Live Chat widget — a single, environment-gated third-party script that gives every visitor a support channel on any page, without this app handing the widget any visitor data or duplicating the chat platform's own routing decisions.

## ADDED Requirements

### Requirement: Live chat is reachable from every page

The site SHALL load the live-chat widget on every route, in every locale and every route group, from a single mount point. The widget's own launcher is the entry point; the site SHALL NOT render a launcher of its own.

#### Scenario: Public marketing page

- **WHEN** a visitor loads the home page and the widget is configured
- **THEN** the widget's host element is present in the document
- **AND** activating its launcher opens the chat panel

#### Scenario: Authenticated area

- **WHEN** a signed-in student loads `/dashboard` and the widget is configured
- **THEN** the widget's host element is present, exactly as on a public page

#### Scenario: Non-default locale

- **WHEN** a visitor loads a page under a locale prefix and the widget is configured
- **THEN** the widget's host element is present

### Requirement: The widget is off unless explicitly configured

The widget SHALL load only when a public widget-script URL is configured for the environment. With no URL configured, the site SHALL emit no widget script tag and make no request to any chat origin, so that local development, automated test runs, and preview deployments cannot reach a live agent inbox.

#### Scenario: URL not configured

- **WHEN** the app renders any page with no widget-script URL configured
- **THEN** no script tag for the widget appears in the document
- **AND** no request is made to a chat API, gateway, or widget origin

#### Scenario: URL configured

- **WHEN** the app renders any page with a widget-script URL configured
- **THEN** exactly one script tag with that URL appears in the document

#### Scenario: Environment points at a local chat stack

- **WHEN** the configured URL is a locally served widget bundle
- **THEN** the widget loads from it, and no production chat origin is contacted

### Requirement: Loading the widget never degrades the page

The widget SHALL load without blocking rendering or interactivity, and its failure SHALL be contained. A widget script that is slow, blocked, or unavailable SHALL leave the page fully usable.

#### Scenario: Script blocked or unreachable

- **WHEN** the widget script fails to load (network failure, ad blocker, DNS)
- **THEN** the page renders and functions normally, with no visible error and no unhandled exception surfaced to the user

#### Scenario: First paint

- **WHEN** a page loads with the widget configured
- **THEN** the widget script does not block first paint, and the page's largest contentful paint element is not the widget

#### Scenario: Client navigation

- **WHEN** a visitor navigates between routes within the app
- **THEN** the widget script is loaded once for the session, not re-executed per navigation

### Requirement: No visitor data crosses into the widget

The site SHALL NOT pass any visitor or account information — name, email, user id, session token, order, or enrolment data — to the widget or to any chat origin. Identifying the visitor SHALL remain the widget's own pre-chat form.

#### Scenario: Signed-in visitor opens chat

- **WHEN** a signed-in student opens the chat panel and starts a conversation
- **THEN** they are asked for their name and email by the widget itself
- **AND** no value from the site's session or user profile was supplied to the widget

#### Scenario: Script configuration carries no PII

- **WHEN** the widget script tag is rendered
- **THEN** its attributes carry only origin configuration, never visitor or account data

### Requirement: Brand attribution is the deployment's responsibility, not the page's

Chats SHALL be attributed to a brand by the site's own origin, which the browser sends automatically. The site SHALL NOT encode a brand identifier in the page. A deployment whose hostname is not registered with the chat platform SHALL still be able to start a chat — it arrives unattributed rather than being refused.

#### Scenario: Registered hostname

- **WHEN** a visitor starts a chat from a deployment whose hostname is registered as a brand
- **THEN** the chat is attributed to that brand in the agent inbox

#### Scenario: Unregistered hostname

- **WHEN** a visitor starts a chat from a preview or unregistered hostname with the widget configured
- **THEN** the chat is still created and answerable, with no brand attached

### Requirement: Suppressing chat for a URL is a chat-platform decision

Where the widget appears SHALL be governed by the chat platform's page rules, not by route logic in this codebase. The site SHALL NOT add per-route conditions that hide the widget.

#### Scenario: A page rule disables chat for a path

- **WHEN** the chat platform has a rule turning chat off for a URL pattern, and a visitor loads a matching page
- **THEN** no launcher is shown on that page
- **AND** this codebase contains no route-specific rule reproducing that decision

### Requirement: The widget origin is documented configuration

The widget-script URL SHALL be documented as an environment variable with the app's other public origins, so that a deployment is configured the same way as every other external dependency and no origin is hard-coded in a component.

#### Scenario: New environment is set up

- **WHEN** an operator configures a new deployment from the documented environment sample
- **THEN** the widget-script variable is listed there with its production value and an explanation that leaving it unset disables chat
