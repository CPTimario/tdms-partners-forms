"use client";

import { ChangeEvent, useEffect, useMemo, useReducer, useRef } from "react";
import {
  type CanceledChoice,
  getFirstInvalidStep,
  initialSupportFormData,
  isSupportFormValid,
  type FormStep,
  type EditableFormStep,
  type MembershipType,
  type RequiredStringField,
  type ReroutedChoice,
  type SupportFormData,
  type UnableToGoChoice,
  validateAccountabilityStep,
  validatePartnerStep,
  validateSupportForm,
} from "@/lib/support-form";

type CheckboxField = "consentGiven";

type SupportFormState = {
  data: SupportFormData;
  step: FormStep;
  validationErrors: string[];
};

type SupportFormAction =
  | {
      type: "set-text";
      field: RequiredStringField;
      value: string;
    }
  | {
      type: "set-checkbox";
      field: CheckboxField;
      value: boolean;
    }
  | {
      type: "set-membership";
      value: MembershipType;
    }
  | {
      type: "set-canceled";
      value: CanceledChoice;
    }
  | {
      type: "set-unable-to-go";
      value: UnableToGoChoice;
    }
  | {
      type: "set-rerouted";
      value: ReroutedChoice;
    }
  | {
      type: "set-step";
      value: FormStep;
    }
  | {
      type: "set-errors";
      value: string[];
    }
  | {
      type: "reset";
    };

const initialState: SupportFormState = {
  data: initialSupportFormData,
  step: "partner",
  validationErrors: [],
};

function reducer(
  state: SupportFormState,
  action: SupportFormAction,
): SupportFormState {
  switch (action.type) {
    case "set-text":
      return {
        ...state,
        data: {
          ...state.data,
          [action.field]: action.value,
        },
      };
    case "set-checkbox":
      return {
        ...state,
        data: {
          ...state.data,
          [action.field]: action.value,
        },
      };
    case "set-membership":
      return {
        ...state,
        data: {
          ...state.data,
          membershipType: action.value,
        },
      };
    case "set-canceled":
      return {
        ...state,
        data: {
          ...state.data,
          canceledChoice: action.value,
        },
      };
    case "set-unable-to-go":
      return {
        ...state,
        data: {
          ...state.data,
          unableToGoChoice: action.value,
        },
      };
    case "set-rerouted":
      return {
        ...state,
        data: {
          ...state.data,
          reroutedChoice: action.value,
        },
      };
    case "set-step":
      return {
        ...state,
        step: action.value,
      };
    case "set-errors":
      return {
        ...state,
        validationErrors: action.value,
      };
    case "reset":
      return {
        ...initialState,
        data: {
          ...initialSupportFormData,
          membershipType: state.data.membershipType,
        },
      };
    default:
      return state;
  }
}

export function useSupportForm() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const latestDataRef = useRef(state.data);

  useEffect(() => {
    latestDataRef.current = state.data;
  }, [state.data]);

  const isFormValid = useMemo(() => isSupportFormValid(state.data), [state.data]);
  const isPartnerStepComplete = useMemo(
    () => validatePartnerStep(state.data).length === 0,
    [state.data],
  );
  const isAccountabilityStepComplete = useMemo(
    () => validateAccountabilityStep(state.data).length === 0,
    [state.data],
  );

  const onTextChange =
    (field: RequiredStringField) => (event: ChangeEvent<HTMLInputElement>) => {
      dispatch({
        type: "set-text",
        field,
        value: event.target.value,
      });
    };

  const onCheckboxChange =
    (field: CheckboxField) => (event: ChangeEvent<HTMLInputElement>) => {
      dispatch({
        type: "set-checkbox",
        field,
        value: event.target.checked,
      });
    };

  const setMembership = (value: MembershipType) => {
    latestDataRef.current = {
      ...latestDataRef.current,
      membershipType: value,
    };

    dispatch({
      type: "set-membership",
      value,
    });
  };

  const onCanceledChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "set-canceled",
      value: event.target.value as CanceledChoice,
    });
  };

  const onUnableToGoChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "set-unable-to-go",
      value: event.target.value as UnableToGoChoice,
    });
  };

  const onReroutedChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "set-rerouted",
      value: event.target.value as ReroutedChoice,
    });
  };

  const resetForm = () => {
    dispatch({ type: "reset" });
  };

  const goToStep = (value: EditableFormStep) => {
    dispatch({ type: "set-errors", value: [] });
    dispatch({ type: "set-step", value });
  };

  const goToPartner = () => {
    goToStep("partner");
  };

  const goToAccountability = () => {
    goToStep("accountability");
  };

  const goToReview = () => {
    const currentData = {
      ...state.data,
      ...latestDataRef.current,
    };

    const errors = validateSupportForm(currentData);
    dispatch({ type: "set-errors", value: errors });

    if (errors.length === 0) {
      dispatch({ type: "set-step", value: "review" });
      return;
    }

    const firstInvalidStep = getFirstInvalidStep(currentData);
    dispatch({ type: "set-step", value: firstInvalidStep ?? "partner" });
  };

  return {
    data: state.data,
    step: state.step,
    validationErrors: state.validationErrors,
    isFormValid,
    isPartnerStepComplete,
    isAccountabilityStepComplete,
    onTextChange,
    onCheckboxChange,
    setMembership,
    onUnableToGoChange,
    onReroutedChange,
    onCanceledChange,
    resetForm,
    goToPartner,
    goToAccountability,
    goToReview,
  };
}
