import { assign, createActor, not, setup } from "xstate";

// const inspector = typeof window !== "undefined" ? createBrowserInspector() : { inspect: undefined };

export const SuggestiveScrollMachine = setup({
  actions: {
    resetContext: assign({
      scrolledToBottom: false,
      intervalCount: 0,
    }),
    assignScrolledToBottomTrue: assign({
      scrolledToBottom: true,
    }),
    increaseIntervalCount: assign({
      intervalCount: ({ context, event }) => context.intervalCount + 1,
    }),
  },
  actors: {},
  guards: {
    hasScrolledToBottom: function ({ context, event }, params) {
      return context.scrolledToBottom;
    },
    hasNoBodyScroll: function ({ context, event }, params) {
      if (typeof window === "undefined") return true;

      return document.body.scrollHeight > window.innerHeight;
    },
    shouldMarkHasScrolledToBottom: function ({ context, event }, params) {
      if (typeof window === "undefined") return true;

      if (document.body.scrollHeight - window.innerHeight === 0) return true;
      const scrolledPercentage =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

      return scrolledPercentage >= context.scrollPercentageRequiredToUnlock;
    },
  },
  types: {
    events: {} as { type: "reset" } | { type: "unlock" },
    context: {} as {
      scrolledToBottom: boolean;
      scrollPercentageRequiredToUnlock: number;
      intervalCount: number;
      checkInterval: number;
    },
  },
  delays: {},
}).createMachine({
  context: {
    intervalCount: 0,
    checkInterval: 100, // ms
    scrolledToBottom: false,
    scrollPercentageRequiredToUnlock: 90, // % of the way down the page revealed by active scrolling
  },
  id: "Suggestive Scroll Machine",
  initial: "LOCKED",
  states: {
    LOCKED: {
      entry: ["increaseIntervalCount"],
      after: {
        "100": [
          {
            target: "UNLOCKED",
            guard: not("hasNoBodyScroll"),
            actions: [],
            description: "",
            meta: {},
          },
          {
            target: "UNLOCKED",
            actions: [],
            guard: "shouldMarkHasScrolledToBottom",
          },
          {
            target: "UNLOCKED",
            guard: "hasScrolledToBottom",
            actions: [],
          },
          {
            target: "LOCKED",
            actions: [],
            reenter: true,
          },
        ],
      },
      on: {
        unlock: {
          target: "UNLOCKED",
        },
      },
    },
    UNLOCKED: {
      entry: {
        type: "assignScrolledToBottomTrue",
      },
      on: {
        reset: {
          target: "LOCKED",
          actions: {
            type: "resetContext",
          },
        },
      },
    },
  },
});

export const SuggestiveScrollActor = createActor(SuggestiveScrollMachine, {
  // inspect: inspector?.inspect,
});
SuggestiveScrollActor.start();
