# Form

The form is a stateless contact submission. A reader fills in a name, an email, and a message, then sends it.

## What it does

The page collects the three fields and posts them to `POST /api/tools/form`. The server validates the payload and returns the validated values with a server-side acknowledgement. Nothing is stored; state is per request.

## Data shape

The request body is:

```json
{ "name": "<text>", "email": "<text>", "message": "<text>" }
```

- `name` is required and at most 100 characters.
- `email` is required, at most 254 characters, and must contain a local part, an `@`, a domain, and a dot.
- `message` is required and at most 1000 characters.

The success body is:

```json
{
  "name": "<text>",
  "email": "<text>",
  "message": "<text>",
  "acknowledged": true,
  "receivedAt": "<ISO 8601 timestamp>"
}
```

`acknowledged` is the server-side acknowledgement. `receivedAt` is set on the server for this request.

## Failure modes

| Input | Response |
| --- | --- |
| A missing field, or an unknown field | `400`, rejected by the route body schema. |
| An empty `name` or `message` | `400`, because the field has a minimum length of 1. |
| An `email` without an `@` and a dot | `400`, rejected by the pattern in the body schema. |
| A field longer than its limit | `400`, rejected by the body schema. |

## Statelessness

The route reads the request body, validates it, and returns a value. It keeps no server-side state, so two submissions cannot influence each other.
