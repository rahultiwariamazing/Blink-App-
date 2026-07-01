# React Native Interview Master Guide (Easy -> Hard)

This guide is ordered from easy to hard and grouped section-wise.

How to answer in interview (always use this flow):
1. Quick Hint (one-line memory trigger)
2. Speakable Answer (30-45 seconds)
3. Example (code or real scenario)

---

## Section A: JavaScript (Easy -> Hard)

### A1) Difference between var, let, and const
Quick Hint:
- var = function scope
- let = block scope mutable
- const = block scope immutable binding

Speakable Answer:
var is function-scoped and can be re-declared, so it can create bugs in modern code. let is block-scoped and re-assignable. const is block-scoped and cannot be re-assigned after initialization. I use const by default and let only when value changes.

Example:
```js
const name = "Pawan";
// name = "Rahul"; // Error

let count = 1;
count = 2; // allowed
```

### A2) Hoisting
Quick Hint:
- function declarations are fully hoisted
- var hoisted as undefined
- let/const hoisted but TDZ

Speakable Answer:
In JavaScript, declarations are processed before execution. Function declarations are usable before they appear. var is hoisted with undefined. let and const are hoisted but cannot be accessed before declaration because of TDZ.

Example:
```js
console.log(a); // undefined
var a = 10;
```

### A3) Temporal Dead Zone (TDZ)
Quick Hint:
- Access let/const before declaration -> ReferenceError

Speakable Answer:
TDZ is the period between entering scope and the actual declaration line of let/const. During TDZ, variable exists but is not initialized.

Example:
```js
// console.log(x); // ReferenceError
let x = 5;
```

### A4) String + number and string - number
Quick Hint:
- "3" + 3 = "33"
- "3" - 3 = 0

Speakable Answer:
Plus with a string triggers concatenation. Minus triggers numeric coercion if possible.

Example:
```js
"3" + 3; // "33"
"3" - 3; // 0
```

### A5) map vs filter vs forEach
Quick Hint:
- map transform
- filter select
- forEach side effect

Speakable Answer:
map returns a transformed array of the same length. filter returns only matching items. forEach runs logic for each item and is usually used for side effects.

Example:
```js
const arr = [1, 2, 3];
arr.map((x) => x * 2); // [2,4,6]
arr.filter((x) => x > 1); // [2,3]
arr.forEach((x) => console.log(x));
```

### A6) for...in vs for...of
Quick Hint:
- for...in -> keys
- for...of -> values

Speakable Answer:
for...in iterates enumerable keys, usually for objects. for...of iterates values of iterables like arrays, strings, Map, Set.

Example:
```js
for (const k in { a: 1 }) console.log(k); // a
for (const v of [10, 20]) console.log(v); // 10,20
```

### A7) Spread vs Rest
Quick Hint:
- spread expands
- rest collects

Speakable Answer:
Spread unpacks arrays/objects into elements/properties. Rest collects remaining arguments/properties into one array/object.

Example:
```js
const a = [1, 2];
const b = [...a, 3]; // spread
function sum(...nums) { return nums.reduce((t, n) => t + n, 0); } // rest
```

### A8) Object copy: shallow vs deep
Quick Hint:
- shallow copies top-level only
- deep copies nested data too

Speakable Answer:
Shallow copy duplicates only first level, nested references stay shared. Deep copy creates independent nested copies. For nested mutable state, deep copy or immutable update helpers are safer.

Example:
```js
const shallow = { ...obj };
const deep = structuredClone(obj);
```

### A9) Object immutability
Quick Hint:
- freeze at runtime
- readonly at type level

Speakable Answer:
To prevent accidental mutation, we can use Object.freeze for shallow runtime immutability. In TypeScript, readonly helps compile-time safety.

Example:
```js
const cfg = Object.freeze({ api: "/v1" });
```

### A10) Get second last element from dynamic array
Quick Hint:
- arr[arr.length - 2]

Speakable Answer:
Use length-based indexing so it works even when array size changes.

Example:
```js
const secondLast = arr[arr.length - 2];
```

### A11) Pure vs Impure functions
Quick Hint:
- pure: no side effects, deterministic
- impure: side effects or external dependency

Speakable Answer:
Pure functions are easier to test and reason about because same input gives same output. Impure functions may read/write outside state.

Example:
```js
const pureAdd = (a, b) => a + b;
```

### A12) Arrow function and advantages
Quick Hint:
- concise syntax
- lexical this

Speakable Answer:
Arrow functions are shorter and inherit this from outer scope, which avoids many callback context bugs.

Example:
```js
const add = (a, b) => a + b;
```

### A13) this keyword
Quick Hint:
- normal function this depends on call site
- arrow uses lexical this

Speakable Answer:
this in normal functions is determined by how function is called. Arrow functions do not create their own this; they capture from parent scope.

Example:
```js
const obj = {
  name: "Rahul",
  fn() { setTimeout(() => console.log(this.name), 0); }
};
```

### A14) call, apply, bind and when to use bind
Quick Hint:
- call now (args list)
- apply now (args array)
- bind later (new function)

Speakable Answer:
I use bind when passing a method as callback and I must preserve this context.

Example:
```js
fn.call(obj, a, b);
fn.apply(obj, [a, b]);
const bound = fn.bind(obj);
```

### A15) Closure
Quick Hint:
- function remembers outer scope

Speakable Answer:
Closure allows function to retain access to variables from parent scope even after parent returns. Useful for private state, debounce, factories.

Example:
```js
function makeCounter() {
  let count = 0;
  return () => ++count;
}
```

### A16) Currying
Quick Hint:
- f(a,b) -> f(a)(b)

Speakable Answer:
Currying converts multi-argument functions into unary chain. It helps composition and reusable preconfigured functions.

Example:
```js
const multiply = (a) => (b) => a * b;
const double = multiply(2);
```

### A17) Prototype and inheritance
Quick Hint:
- objects inherit via prototype chain

Speakable Answer:
JavaScript uses prototype chain lookup: object -> prototype -> higher prototype -> null.

Example:
```js
const parent = { greet() { return "Hi"; } };
const child = Object.create(parent);
child.greet(); // "Hi"
```

### A18) Generator function (yield, next)
Quick Hint:
- pause/resume execution

Speakable Answer:
Generator functions return an iterator. yield pauses and emits value; next resumes from pause point.

Example:
```js
function* gen() {
  yield 1;
  yield 2;
}
const it = gen();
it.next(); // { value: 1, done: false }
```

### A19) Event loop (microtask vs macrotask)
Quick Hint:
- sync -> microtasks -> macrotask

Speakable Answer:
After synchronous code runs, JavaScript drains microtasks (Promise then/catch/finally) before handling macrotasks like setTimeout.

Example:
```js
console.log("A");
Promise.resolve().then(() => console.log("B"));
setTimeout(() => console.log("C"), 0);
console.log("D");
// A D B C
```

### A20) Promise chaining and error handling
Quick Hint:
- error skips to nearest catch

Speakable Answer:
In promise chains, values flow through then. Any thrown error/rejected promise jumps to catch. finally always runs.

Example:
```js
Promise.resolve(1)
  .then((x) => x + 1)
  .then(() => { throw new Error("fail"); })
  .catch((e) => console.log(e.message))
  .finally(() => console.log("done"));
```

### A21) Promise.all vs Promise.race
Quick Hint:
- all waits all
- race returns first settled

Speakable Answer:
Promise.all resolves when all succeed (or rejects immediately on first failure). Promise.race resolves/rejects on first settled promise.

Example:
```js
Promise.all([p1, p2]);
Promise.race([p1, p2]);
```

### A22) What if Promise.reject is not caught?
Quick Hint:
- unhandled rejection warning/crash policy dependent

Speakable Answer:
Unhandled rejection can cause warnings and in strict/runtime policies can fail process/app behavior. Always catch or use top-level error handling.

Example:
```js
Promise.reject(new Error("boom")).catch(() => {});
```

### A23) Debounce vs Throttle
Quick Hint:
- debounce after pause
- throttle at interval

Speakable Answer:
Debounce is ideal for search input. Throttle is ideal for scroll/resize where periodic updates are needed.

Example:
```js
// debounce: run after user stops typing
// throttle: run every 200ms while scrolling
```

### A24) WeakMap vs Map
Quick Hint:
- WeakMap keys are weakly referenced objects

Speakable Answer:
WeakMap helps metadata caching without preventing garbage collection; useful in memory-sensitive scenarios.

Example:
```js
const meta = new WeakMap();
meta.set(obj, { touched: true });
```

### A25) Node.js comfort + middleware
Quick Hint:
- event loop backend runtime
- middleware = pipeline function

Speakable Answer:
I am comfortable with Node for API services and tooling scripts. Middleware is a function in request pipeline that can validate auth, log, transform request/response, then pass control.

Example:
```js
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
```

---

## Section B: React (Easy -> Hard)

### B1) React Element vs Component
Quick Hint:
- element = description object
- component = function/class returning element

Speakable Answer:
Element is lightweight object representation of UI node. Component is reusable unit that returns elements.

Example:
```jsx
const el = <h1>Hello</h1>;
function Title() { return <h1>Hello</h1>; }
```

### B2) Virtual DOM
Quick Hint:
- in-memory tree for diffing

Speakable Answer:
React creates virtual UI tree and compares previous vs next to minimize real DOM/native updates.

Example:
- Updating one list item updates only changed node, not full tree.

### B3) Reconciliation
Quick Hint:
- diffing algorithm with heuristics

Speakable Answer:
Reconciliation is React's process of comparing trees and deciding minimal updates. Keys are critical for stable identity.

Example:
- same key + type allows reuse of item instance.

### B4) Why keys matter and why index key can fail
Quick Hint:
- unstable keys break identity

Speakable Answer:
If list order changes and index is used as key, React may reuse wrong item state and show wrong UI.

Example:
```jsx
{items.map((item) => <Row key={item.id} item={item} />)}
```

### B5) Controlled vs Uncontrolled inputs
Quick Hint:
- controlled by state vs ref/native value

Speakable Answer:
Controlled components keep source of truth in React state. Uncontrolled relies on direct ref access. Controlled is preferred for validation and predictable behavior.

Example:
```jsx
// Controlled
<TextInput value={value} onChangeText={setValue} />
```

### B6) Re-render triggers
Quick Hint:
- state, props, parent render, context change

Speakable Answer:
A component re-renders when its state/props/context changes or parent re-renders. Optimization needs measuring first.

Example:
- parent state update can re-render children unless memoized.

### B7) React.memo, useMemo, useCallback
Quick Hint:
- memo component
- useMemo value
- useCallback function

Speakable Answer:
React.memo skips child render if props are shallow-equal. useMemo caches expensive computed value. useCallback keeps handler reference stable.

Example:
```jsx
const onPress = useCallback(() => submit(id), [id]);
```

### B8) Lifecycle in functional components
Quick Hint:
- useEffect models mount/update/unmount

Speakable Answer:
useEffect runs after render and can return cleanup. Dependency array controls when it reruns.

Example:
```jsx
useEffect(() => {
  const sub = subscribe();
  return () => sub.unsubscribe();
}, []);
```

### B9) HOC use cases
Quick Hint:
- cross-cutting wrapper

Speakable Answer:
HOC is used when many components need same behavior (auth guard, analytics tracking, permission gate).

Example:
```jsx
const withAuth = (Comp) => (props) => isAuth ? <Comp {...props} /> : <Login />;
```

### B10) Refs and forwardRef
Quick Hint:
- refs for imperative access
- forwardRef pass-through ref

Speakable Answer:
Refs help with focus, measure, scroll, imperative methods. forwardRef lets parent pass ref through abstraction layer.

Example:
```jsx
const Input = React.forwardRef((props, ref) => <TextInput ref={ref} {...props} />);
```

### B11) Lazy loading and Suspense
Quick Hint:
- reduce initial bundle and startup time

Speakable Answer:
Lazy loading defers module loading until required route/screen. This improves startup but needs loading fallback.

Example:
```jsx
const Screen = React.lazy(() => import("./Screen"));
```

### B12) React Fiber
Quick Hint:
- modern reconciliation engine with priority scheduling

Speakable Answer:
Fiber lets React split and prioritize rendering work for better responsiveness.

Example:
- high-priority user input can be handled before low-priority rendering work.

### B13) React hooks hard rules
Quick Hint:
- never call hooks conditionally

Speakable Answer:
Hooks rely on consistent call order across renders. Conditional hook calls break mapping and can cause bugs.

Example:
```jsx
// bad: if (cond) useEffect(...)
```

### B14) Stale closure
Quick Hint:
- callback uses old captured value

Speakable Answer:
Stale closure happens when effect/callback captures previous state due to missing dependencies.

Example:
```jsx
useEffect(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

---

## Section C: React Native (Easy -> Hard)

### C1) Which React Native version have you worked on?
Quick Hint:
- always answer exact version + architecture mode

Speakable Answer:
Mention exact RN version, Hermes usage, and whether app is bridge-based or new architecture enabled.

Example:
- RN 0.7x, Hermes on, incremental migration to new architecture.

### C2) How to upgrade RN safely
Quick Hint:
- release notes + upgrade helper + staged testing

Speakable Answer:
I review breaking changes, use upgrade helper diff, upgrade incrementally, verify native module compatibility, then run smoke/regression tests on both Android and iOS.

Example:
1. upgrade branch
2. pod install / gradle sync
3. critical flow tests

### C3) Bridging, old vs new architecture, Fabric, TurboModules
Quick Hint:
- old: bridge overhead
- new: JSI faster calls

Speakable Answer:
Old architecture communicates via async bridge and has serialization overhead. New architecture uses JSI, TurboModules, and Fabric for better startup and lower overhead.

Example:
- frequent native calls (camera, animations) benefit from reduced bridge overhead.

### C4) JS thread vs UI thread
Quick Hint:
- heavy JS blocks interactions

Speakable Answer:
JS thread runs business logic; UI thread draws frames. If JS is blocked, user interactions lag and frames drop.

Example:
- heavy loop in onPress causes touch lag.

### C5) Navigation and route guards with roles
Quick Hint:
- client guard for UX, server auth for security

Speakable Answer:
I build role-based route guards in navigation for user experience, but true authorization is always enforced by backend APIs.

Example:
- admin tab hidden for non-admin in UI, but API checks role regardless.

### C6) If roles are in session/local storage and editable, how restrict access?
Quick Hint:
- never trust client storage

Speakable Answer:
Client role flags are only hints. Backend must validate token claims/permissions for every protected endpoint.

Example:
- tampered local role still gets 403 from server.

### C7) Large list handling (30K+) and why FlatList can still be slow
Quick Hint:
- virtualization + stable keys + light rows

Speakable Answer:
I use FlatList/FlashList with pagination, stable keyExtractor, memoized renderItem, and lightweight rows. Lag still occurs with heavy components, unstable keys, or expensive inline logic.

Example:
```jsx
<FlatList
  data={items}
  keyExtractor={(i) => i.id}
  initialNumToRender={12}
  windowSize={7}
/>
```

### C8) Memory leaks in RN and proper cleanup
Quick Hint:
- remove listeners, clear timers, cancel requests

Speakable Answer:
Leaks often happen from listeners, timers, or unresolved async callbacks after unmount. Always cleanup in useEffect return.

Example:
```jsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  const sub = emitter.addListener("x", onEvent);
  return () => {
    clearInterval(id);
    sub.remove();
  };
}, []);
```

### C9) Image optimization
Quick Hint:
- right size, caching, CDN resize

Speakable Answer:
I avoid loading oversized images, use caching policies, and use CDN transformations to match device dimensions.

Example:
- request image width/height from CDN query params.

### C10) Startup optimization
Quick Hint:
- defer non-critical work

Speakable Answer:
I keep initial render path lean by lazy-loading non-critical modules and reducing startup API calls.

Example:
- fetch secondary widgets after first screen paint.

### C11) Native module real example
Quick Hint:
- expose native capability to JS

Speakable Answer:
For camera/Bluetooth/background services, native module is implemented per platform and exposed to JS API.

Example:
- `scanDevices()` wrapper calling Android/iOS native APIs.

### C12) Debugging tools and production issue flow
Quick Hint:
- observe, reproduce, isolate, fix, validate

Speakable Answer:
I use Flipper, React DevTools, Sentry/Crashlytics, and native logs. In production issues, I identify affected version/devices, reproduce, isolate layer, patch, release phased fix, and monitor.

Example:
1. crash spike alert
2. group by app version
3. rollback or hotfix

### C13) API failure handling and retry
Quick Hint:
- retry transient failures with backoff

Speakable Answer:
Use retry with backoff for transient failures, show fallback UI, and avoid retrying non-retryable business errors.

Example:
```js
async function fetchWithRetry(api, retries = 3) {
  try {
    return await api();
  } catch (e) {
    if (retries === 0) throw e;
    await new Promise((r) => setTimeout(r, 300));
    return fetchWithRetry(api, retries - 1);
  }
}
```

---

## Section D: State Management and TypeScript (Mid -> Senior)

### D1) Redux basics
Quick Hint:
- predictable global state, one-way flow

Speakable Answer:
Redux manages shared state with actions and reducers. It improves predictability and debugging for complex apps.

Example:
- cart/auth/global domain state.

### D2) Redux vs Redux Toolkit
Quick Hint:
- RTK is standard modern Redux

Speakable Answer:
RTK reduces boilerplate, includes Immer and async helpers, and enforces best practices by default.

Example:
- createSlice + createAsyncThunk.

### D3) createAsyncThunk and failure handling
Quick Hint:
- pending/fulfilled/rejected lifecycle

Speakable Answer:
createAsyncThunk standardizes async actions and error states. On failure, reducer should capture error and keep UI stable with retry path.

Example:
```js
createAsyncThunk("user/fetch", async (id, { rejectWithValue }) => {
  try { return await api.user(id); }
  catch (e) { return rejectWithValue(e.message); }
});
```

### D4) RTK Query
Quick Hint:
- built-in fetch/cache/invalidation

Speakable Answer:
RTK Query handles server state, deduping, invalidation, and loading/error states with less custom code.

Example:
- product list query auto-cached by key.

### D5) Is reducer pure? Why?
Quick Hint:
- yes conceptually; deterministic state transition

Speakable Answer:
A reducer must be pure so state updates are predictable and testable. RTK uses Immer to allow mutable-looking syntax while producing immutable updates.

Example:
- same action + same input state -> same output state.

### D6) Could RTK Query replace Redux? Why not store everything in Redux?
Quick Hint:
- server state != all app state

Speakable Answer:
RTK Query can replace many custom async slices for server state, but UI-only local state and ephemeral form state should not be forced into Redux.

Example:
- text input local state in component, not global store.

### D7) Type vs Interface
Quick Hint:
- interface for object contracts
- type for unions/composition

Speakable Answer:
I use interface for public object shapes and extension contracts; type for unions/intersections and advanced aliases.

Example:
```ts
interface User { id: string; }
type Status = "idle" | "loading" | "done";
```

### D8) unknown vs any, generics
Quick Hint:
- unknown safe, any unsafe
- generics preserve type information

Speakable Answer:
unknown forces type narrowing and keeps safety, unlike any. Generics help reusable utilities without losing type accuracy.

Example:
```ts
function identity<T>(v: T): T { return v; }
```

---

## Section E: Coding Round Questions (Easy -> Hard)

### E1) Remove duplicates by id + name
Quick Hint:
- Set key by composite identifier

Speakable Answer:
Use one pass with Set to track composite key. Complexity O(n).

Example:
```js
const uniqueByIdName = (arr) => {
  const seen = new Set();
  return arr.filter((x) => {
    const key = `${x.id}|${x.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
```

### E2) Group data
Quick Hint:
- reduce + accumulator

Speakable Answer:
Use reduce to build grouped object or Map in single pass.

Example:
```js
const grouped = arr.reduce((acc, x) => {
  (acc[x.type] ||= []).push(x);
  return acc;
}, {});
```

### E3) Large dataset efficiency
Quick Hint:
- avoid nested loops, use Map/Set, chunk processing

Speakable Answer:
For big data, use O(n) data structures, paginate/chunk processing, and avoid blocking UI thread.

Example:
- replace nested duplicate checks with Set key lookup.

### E4) Extra coding asks at this level (added)
Quick Hint:
- common senior asks

Speakable Answer:
Expect debounce/throttle, LRU cache, concurrency limiter, interval merge, top-k frequency.

Example:
- prepare 2-3 reusable templates before interview.

---

## Section F: Architect-Level Questions (Hard)

### F1) Performance strategy for large RN app
Quick Hint:
- measure first, optimize second

Speakable Answer:
I define performance budgets (startup, FPS, memory), profile bottlenecks, then optimize rendering, network, and data flow. Every optimization is validated with before/after metrics.

Example:
- startup p95 reduced after lazy module split.

### F2) Security strategy
Quick Hint:
- defense in depth

Speakable Answer:
Use secure storage, TLS, token rotation, API authorization, log redaction, and threat-model-based controls (pinning/integrity checks where required).

Example:
- backend enforces role checks even if client role value is tampered.

### F3) Production incident handling (RCA)
Quick Hint:
- timeline -> root cause -> prevention

Speakable Answer:
I identify blast radius, reproduce issue, isolate root cause, patch safely, and add prevention guardrails (test/alert/runbook).

Example:
1. Crash spike
2. Identify affected version
3. Hotfix + postmortem

### F4) System design: scalable mobile app
Quick Hint:
- separate UI, domain, data

Speakable Answer:
I design modular feature architecture with clear boundaries, caching strategy, retries, offline behavior, and observability.

Example:
- feature modules + shared design system + typed API contracts.

### F5) Handle 1M users
Quick Hint:
- scale API + cache + CDN + pagination

Speakable Answer:
Use cursor pagination, CDN for static assets, efficient payloads, cache invalidation strategy, and robust observability for error/latency.

Example:
- avoid loading full catalog into app memory.

### F6) Offline-first and optimistic UI
Quick Hint:
- local first, sync later, conflict policy

Speakable Answer:
Store critical data locally, queue writes offline, sync when connected, and apply conflict strategy. Use optimistic UI with rollback on failure.

Example:
- show pending status until server confirms.

### F7) Authentication vs Authorization
Quick Hint:
- authN = who, authZ = what access

Speakable Answer:
Authentication verifies identity. Authorization checks permission. For security, authZ must always be enforced server-side.

Example:
- valid login token but no admin permission -> 403.

### F8) CI/CD and release confidence (added)
Quick Hint:
- automate quality gates

Speakable Answer:
Mature flow includes lint/test/build/signing, staged rollout, feature flags, crash and latency monitoring, and rollback plan.

Example:
- 5% canary -> monitor -> 100% rollout.

### F9) Testing strategy expected for senior/architect (added)
Quick Hint:
- unit + integration + e2e pyramid

Speakable Answer:
I keep most tests at unit/integration level and a small set of stable E2E tests for critical flows. I optimize for confidence, not only coverage percentage.

Example:
- auth/cart/checkout as E2E critical paths.

### F10) Observability metrics (added)
Quick Hint:
- track crash, latency, startup, funnel

Speakable Answer:
I track crash-free users, app startup percentiles, API errors, screen load latency, and conversion funnels to catch regressions early.

Example:
- alert when crash-free drops below SLO.

---

## Section G: 30 Hard Follow-Ups (Kept + Speakable Hints)

These are asked after your first answer. Keep 1-2 line answers ready.

1. What happens if dependency array is wrong in useEffect?
- Hint: stale closure or infinite rerun
- Speakable: Wrong dependencies cause stale state bugs or repeated effect execution.

2. Why React.memo fails sometimes?
- Hint: parent sends new reference props
- Speakable: Memo uses shallow compare; new object/function references still trigger re-render.

3. Can useMemo cause memory issue?
- Hint: yes if overused
- Speakable: Over-memoization can increase memory and complexity without real gain.

4. Why key should not be index?
- Hint: unstable identity
- Speakable: Reordering with index keys can map wrong state to wrong row.

5. What happens if you mutate state directly?
- Hint: React may miss update
- Speakable: Direct mutation breaks predictability and may not trigger proper re-render.

6. How to cancel API request?
- Hint: AbortController or request token
- Speakable: Cancel in effect cleanup to avoid updating unmounted components.

7. What is stale closure example?
- Hint: interval uses old state
- Speakable: Callback captures old variable because dependency list is incorrect.

8. Difference between sync and async rendering?
- Hint: blocking vs schedulable work
- Speakable: Async/concurrent rendering allows prioritized, interruptible rendering work.

9. What happens if JS thread blocked?
- Hint: lag, dropped interactions
- Speakable: UI responsiveness degrades because logic cannot process events in time.

10. How to debug memory leak?
- Hint: listeners/timers/subscriptions
- Speakable: Profile memory, inspect retained objects, and verify cleanup paths.

11. What happens if two API calls update same state?
- Hint: race condition
- Speakable: Last response may overwrite newer data; solve with request id/version guards.

12. Why Redux reducer must be pure?
- Hint: deterministic updates
- Speakable: Purity ensures same input leads same output and simplifies debugging/testing.

13. What if createAsyncThunk fails?
- Hint: rejected action
- Speakable: Handle rejected state, show error UI, and allow retry.

14. What happens if FlatList key is unstable?
- Hint: wrong reuse + jank
- Speakable: Item remounts increase and visual/state bugs appear.

15. How to handle large images?
- Hint: resize/cdn/cache
- Speakable: Serve right dimensions and cache strategically.

16. How to measure performance?
- Hint: profiler + metrics
- Speakable: Track startup, FPS, memory, API latency, crash-free users.

17. What is batching in React?
- Hint: combine updates
- Speakable: React batches multiple state updates to reduce unnecessary renders.

18. Why hooks must not be called conditionally?
- Hint: call order must be stable
- Speakable: Conditional calls break hook indexing and cause incorrect state mapping.

19. What happens if useEffect missing dependency?
- Hint: stale data
- Speakable: Effect may run with outdated closure and produce inconsistent behavior.

20. What if Promise.reject is not caught?
- Hint: unhandled rejection
- Speakable: It can surface as runtime warning/error and unstable flow.

21. Difference between Promise.all and race?
- Hint: all vs first settled
- Speakable: all waits for all success, race settles on first result/error.

22. What happens if component unmounted before API return?
- Hint: state update after unmount risk
- Speakable: Must cancel request or guard state update in cleanup.

23. What is cleanup in useEffect?
- Hint: teardown function
- Speakable: Return function runs before rerun/unmount to release resources.

24. Why we need memoization?
- Hint: avoid expensive repeated work
- Speakable: It reduces unnecessary recalculation and rerendering when used correctly.

25. Can over-memoization harm performance?
- Hint: yes
- Speakable: Memoization has overhead; use only where profiling shows benefit.

26. Difference between shallow and deep compare?
- Hint: top-level vs nested
- Speakable: Shallow compares references at first level; deep compares nested values.

27. What happens if you freeze object?
- Hint: no mutation (shallow)
- Speakable: Object properties become non-writable/configurable, but nested objects still mutable unless frozen too.

28. Could RTK Query replace Redux?
- Hint: replace many async slices, not all app state
- Speakable: RTK Query can handle server state, but UI/local state still needs appropriate place.

29. Why not store everything in Redux?
- Hint: unnecessary complexity
- Speakable: Keep local UI state local to avoid over-globalization and rerender overhead.

30. What happens if API returns huge data?
- Hint: memory + render pressure
- Speakable: Use pagination, normalization, chunking, and lazy rendering.

---

## Final Interview Strategy

1. Start with quick hint sentence.
2. Speak for 30-45 seconds only.
3. Give one practical example.
4. Mention one trade-off.
5. Stop. Let interviewer ask follow-up.

You are now prepared for:
- Mid-level React Native rounds
- Senior React Native rounds
- Most architect-leaning interview rounds with follow-ups
