/**
 * Smoke Test Configuration
 *
 * This file contains the single source of truth for routes, page assertions,
 * and user flows to test. Update this file when routes change or new flows are added.
 *
 * To update:
 * - Add new routes to routesToCheck array
 * - Add corresponding page assertions to pageAssertions array
 * - Define new user flows in flows object
 */

export interface PageAssertion {
  route: string;
  locator: string;
  type: "testid" | "roleHeading" | "text";
}

export interface FlowStep {
  action: "fill" | "click" | "check" | "select" | "wait";
  locator: string;
  value?: string;
  type?: "testid" | "role" | "text";
}

export interface UserFlow {
  name: string;
  startRoute: string;
  steps: FlowStep[];
  successAssertion: {
    type: "url" | "testid" | "text" | "roleHeading";
    value: string;
  };
}

export const smokeConfig = {
  // Base URL for testing - can be overridden via BASE_URL env var
  baseURL: process.env.BASE_URL || "http://localhost:3000",

  // Routes that are safe to visit and should render correctly
  routesToCheck: [
    "/",
    "/intake",
    "/feedback",
    "/soap",
    "/privacy",
    "/terms",
    // Note: /success is not included as it's only meaningful after form submission
  ],

  // Assertions for each page to confirm they loaded correctly
  pageAssertions: [
    {
      route: "/",
      locator: "app-shell",
      type: "testid" as const,
    },
    {
      route: "/",
      locator: "Client Intake Form",
      type: "roleHeading" as const,
    },
    {
      route: "/intake",
      locator: "app-shell",
      type: "testid" as const,
    },
    {
      route: "/intake",
      locator: "intake-form",
      type: "testid" as const,
    },
    {
      route: "/intake",
      locator: "Client Intake Form",
      type: "roleHeading" as const,
    },
    {
      route: "/feedback",
      locator: "app-shell",
      type: "testid" as const,
    },
    {
      route: "/soap",
      locator: "app-shell",
      type: "testid" as const,
    },
    {
      route: "/privacy",
      locator: "Privacy Policy",
      type: "roleHeading" as const,
    },
    {
      route: "/terms",
      locator: "Terms of Service",
      type: "roleHeading" as const,
    },
  ],

  // Key user flows to test end-to-end
  flows: {
    intakeSubmission: {
      name: "Complete Intake Form Submission",
      startRoute: "/intake",
      steps: [
        // Step 1: Fill personal details
        {
          action: "fill" as const,
          locator: "firstName",
          type: "testid" as const,
          value: "John",
        },
        {
          action: "fill" as const,
          locator: "lastName",
          type: "testid" as const,
          value: "Doe",
        },
        {
          action: "fill" as const,
          locator: "email",
          type: "testid" as const,
          value: "john.doe@example.com",
        },
        {
          action: "fill" as const,
          locator: "mobile",
          type: "testid" as const,
          value: "0412 345 678",
        },
        {
          action: "fill" as const,
          locator: "dateOfBirth",
          type: "testid" as const,
          value: "01/01/1990",
        },
        {
          action: "click" as const,
          locator: "next-step-btn",
          type: "testid" as const,
        },

        // Wait for step 2 to load
        {
          action: "wait" as const,
          locator: "Step 2 - About Your Visit",
          type: "roleHeading" as const,
        },

        // Step 2: About your visit - use text selectors for visible labels
        {
          action: "click" as const,
          locator:
            'label:has(input[name="visitReasons"][value="Relieve pain / tension"])',
          type: "css" as const,
        },
        {
          action: "click" as const,
          locator: 'label:has(input[name="referralSource"][value="Google"])',
          type: "css" as const,
        },
        {
          action: "fill" as const,
          locator: "occupation",
          type: "testid" as const,
          value: "Software Engineer",
        },
        {
          action: "fill" as const,
          locator: "sleepQuality",
          type: "testid" as const,
          value: "7",
        },
        {
          action: "fill" as const,
          locator: "stressLevel",
          type: "testid" as const,
          value: "4",
        },
        {
          action: "click" as const,
          locator:
            'label:has(input[name="exerciseFrequency"][value="3-4 days per week"])',
          type: "css" as const,
        },
        {
          action: "click" as const,
          locator: 'label:has(input[name="previousMassage"][value="No"])',
          type: "css" as const,
        },
        {
          action: "click" as const,
          locator: "next-step-btn",
          type: "testid" as const,
        },
        {
          action: "wait" as const,
          locator: {
            name: "Accidents, Injuries, Surgeries & Conditions",
            level: 3,
          },
          type: "roleHeading" as const,
        },
        {
          action: "click" as const,
          locator: 'label:has(input[name="hasRecentInjuries"][value="Yes"])',
          type: "css" as const,
        },
        {
          action: "click" as const,
          locator: "next-step-btn",
          type: "testid" as const,
        },

        // Wait for step 3 to load
        {
          action: "wait" as const,
          locator: "Step 3 - Health History",
          type: "roleHeading" as const,
        },

        // Step 3: Health history - use text selectors for radio buttons
        {
          action: "click" as const,
          locator: "No",
          type: "text" as const,
        },
        // Note: Multiple "No" radio buttons - use more specific approach
        {
          action: "click" as const,
          locator: 'label:has(input[name="hasAllergies"][value="No"])',
          type: "css" as const,
        },
        {
          action: "click" as const,
          locator: 'label:has(input[name="hasRecentInjuries"][value="No"])',
          type: "css" as const,
        },
        {
          action: "click" as const,
          locator: "None of the above",
          type: "text" as const,
        },
        {
          action: "click" as const,
          locator: 'label:has(input[name="seenOtherProvider"][value="No"])',
          type: "css" as const,
        },
        {
          action: "click" as const,
          locator: 'label:has(input[name="pregnantBreastfeeding"][value="No"])',
          type: "css" as const,
        },
        {
          action: "click" as const,
          locator: "next-step-btn",
          type: "testid" as const,
        },

        // Wait for step 4 to load
        {
          action: "wait" as const,
          locator: "Step 4 - Consent",
          type: "roleHeading" as const,
        },

        // Step 4: Consent and submission - use label selectors for checkboxes
        {
          action: "click" as const,
          locator: 'label:has(input[name="privacyConsent"])',
          type: "css" as const,
        },
        {
          action: "click" as const,
          locator: 'label:has(input[name="treatmentConsent"])',
          type: "css" as const,
        },
        {
          action: "click" as const,
          locator: 'label:has(input[name="termsConsent"])',
          type: "css" as const,
        },
        {
          action: "click" as const,
          locator: "submit-intake",
          type: "testid" as const,
        },
      ],
      successAssertion: {
        type: "testid" as const,
        value: "intake-success",
      },
    } as UserFlow,
  },
};

export default smokeConfig;
