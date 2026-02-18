/**
 * Stable Smoke Test Configuration - Uses deterministic data-testid selectors
 * This version replaces flaky CSS/text selectors with data-testids for reliable step navigation
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
  type?: "testid" | "role" | "text" | "css";
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
  baseURL: process.env.BASE_URL || "http://localhost:3000",

  routesToCheck: ["/", "/intake", "/feedback", "/soap", "/privacy", "/terms"],

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

  flows: {
    intakeSubmission: {
      name: "Complete Intake Form Submission",
      startRoute: "/intake",
      steps: [
        // === STEP 1: Your Details ===
        {
          action: "wait" as const,
          locator: "intake-step-1",
          type: "testid" as const,
        },

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

        // Click Next and wait for Step 2 to load
        {
          action: "click" as const,
          locator: "wizard-next",
          type: "testid" as const,
        },
        {
          action: "wait" as const,
          locator: "intake-step-2",
          type: "testid" as const,
        },

        // === STEP 2: About Your Visit ===
        // Select visit goals (new multi-select chip structure)
        {
          action: "click" as const,
          locator: '.visit-btn[data-value="Pain / Tension relief"]',
          type: "css" as const,
        },
        // Select referral source
        {
          action: "click" as const,
          locator: 'input[name="referralSource"][value="Google"]',
          type: "css" as const,
        },
        // Fill occupation
        {
          action: "fill" as const,
          locator: "occupation",
          type: "testid" as const,
          value: "Software Engineer",
        },
        // Fill sleep quality slider
        {
          action: "fill" as const,
          locator: "sleepQuality",
          type: "testid" as const,
          value: "7",
        },
        // Fill stress level slider
        {
          action: "fill" as const,
          locator: "stressLevel",
          type: "testid" as const,
          value: "4",
        },
        // Select exercise frequency
        {
          action: "click" as const,
          locator: 'input[name="exerciseFrequency"][value="3-4 days per week"]',
          type: "css" as const,
        },
        // Select previous massage experience
        {
          action: "click" as const,
          locator: 'input[name="previousMassage"][value="No"]',
          type: "css" as const,
        },

        // Click Next and wait for Step 3
        {
          action: "click" as const,
          locator: "wizard-next",
          type: "testid" as const,
        },
        {
          action: "wait" as const,
          locator: "intake-step-3",
          type: "testid" as const,
        },

        // === STEP 3: Health History ===
        // Medications - select No to skip conditional required list
        {
          action: "click" as const,
          locator: 'input[name="takingMedications"][value="No"]',
          type: "css" as const,
        },
        // Allergies - select No
        {
          action: "click" as const,
          locator: 'input[name="hasAllergies"][value="No"]',
          type: "css" as const,
        },
        // Recent injuries - select No
        {
          action: "click" as const,
          locator: 'input[name="hasRecentInjuries"][value="No"]',
          type: "css" as const,
        },
        // Medical conditions - select "None of the above"
        {
          action: "click" as const,
          locator: 'input[name="medicalConditions"][value="None of the above"]',
          type: "css" as const,
        },
        // Pregnant/breastfeeding - select Not applicable
        {
          action: "click" as const,
          locator:
            'input[name="pregnantBreastfeeding"][value="Not applicable"]',
          type: "css" as const,
        },

        // Click Next and wait for Step 4
        {
          action: "click" as const,
          locator: "wizard-next",
          type: "testid" as const,
        },
        {
          action: "wait" as const,
          locator: "intake-step-4",
          type: "testid" as const,
        },

        // === STEP 4: Pain & Signals ===
        // Skip optional pain level (by not interacting with slider)
        // Skip optional pain cause question
        // Skip optional pain descriptors
        // Skip optional "worse than usual"
        // Skip optional pressure preference
        // Skip optional areas to avoid
        // Skip optional body map

        // Click Next and wait for Step 5
        {
          action: "click" as const,
          locator: "wizard-next",
          type: "testid" as const,
        },
        {
          action: "wait" as const,
          locator: "intake-step-5",
          type: "testid" as const,
        },

        // === STEP 5: Consent & Signature ===
        // Check required consent boxes
        {
          action: "check" as const,
          locator: "consent-care",
          type: "testid" as const,
        },
        {
          action: "check" as const,
          locator: "medical-disclaimer",
          type: "testid" as const,
        },
        // Leave marketing consent unchecked (it's optional)

        // Draw signature (or skip by clicking submit - form may not require actual signature)
        // Submit form
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
