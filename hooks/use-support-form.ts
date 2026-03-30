'use client';

import { ChangeEvent, useEffect, useMemo, useReducer, useRef } from 'react';

import {
  type CurrencyCode,
  type CanceledChoice,
  formatAmountInputForField,
  getFirstInvalidStep,
  initialSupportFormData,
  isSupportFormValid,
  type FormStep,
  type EditableFormStep,
  type MembershipType,
  type RequiredStringField,
  type ReroutedChoice,
  type StepValidationResult,
  type SupportFormData,
  type SupportFormFieldErrors,
  type UnableToGoChoice,
  validateAccountabilityStepDetailed,
  validatePartnerStepDetailed,
  validateSupportFormDetailed,
} from '@/lib/support-form';

type CheckboxField = 'consentGiven';

type SupportFormState = {
  data: SupportFormData;
  step: FormStep;
  fieldErrors: SupportFormFieldErrors;
  formErrors: string[];
};

type SupportFormAction =
  | {
      type: 'set-text';
      field: RequiredStringField;
      value: string;
    }
  | {
      type: 'set-checkbox';
      field: CheckboxField;
      value: boolean;
    }
  | {
      type: 'set-currency';
      value: CurrencyCode;
    }
  | {
      type: 'set-membership';
      value: MembershipType;
    }
  | {
      type: 'set-canceled';
      value: CanceledChoice;
    }
  | {
      type: 'set-unable-to-go';
      value: UnableToGoChoice;
    }
  | {
      type: 'set-rerouted';
      value: ReroutedChoice;
    }
  | {
      type: 'set-step';
      value: FormStep;
    }
  | {
      type: 'set-signature';
      value: string;
    }
  | {
      type: 'set-validation';
      value: StepValidationResult;
    }
  | {
      type: 'clear-validation';
    }
  | {
      type: 'reset';
    };

const initialState: SupportFormState = {
  data: initialSupportFormData,
  step: 'partner',
  fieldErrors: {},
  formErrors: [],
};

function withoutFieldError(errors: SupportFormFieldErrors, field: keyof SupportFormFieldErrors) {
  if (!errors[field]) {
    return errors;
  }

  const nextErrors = { ...errors };
  delete nextErrors[field];
  return nextErrors;
}

function reducer(state: SupportFormState, action: SupportFormAction): SupportFormState {
  switch (action.type) {
    case 'set-text':
      return {
        ...state,
        data: {
          ...state.data,
          [action.field]: action.value,
        },
        fieldErrors: withoutFieldError(state.fieldErrors, action.field),
      };
    case 'set-checkbox':
      return {
        ...state,
        data: {
          ...state.data,
          [action.field]: action.value,
        },
        fieldErrors: withoutFieldError(state.fieldErrors, action.field),
      };
    case 'set-currency':
      return {
        ...state,
        data: {
          ...state.data,
          currency: action.value,
        },
        fieldErrors: withoutFieldError(state.fieldErrors, 'currency'),
      };
    case 'set-membership':
      return {
        ...state,
        data: {
          ...state.data,
          membershipType: action.value,
        },
      };
    case 'set-canceled':
      return {
        ...state,
        data: {
          ...state.data,
          canceledChoice: action.value,
        },
        fieldErrors: withoutFieldError(state.fieldErrors, 'canceledChoice'),
      };
    case 'set-unable-to-go':
      return {
        ...state,
        data: {
          ...state.data,
          unableToGoChoice: action.value,
        },
        fieldErrors: withoutFieldError(state.fieldErrors, 'unableToGoChoice'),
      };
    case 'set-rerouted':
      return {
        ...state,
        data: {
          ...state.data,
          reroutedChoice: action.value,
        },
        fieldErrors: withoutFieldError(state.fieldErrors, 'reroutedChoice'),
      };
    case 'set-step':
      return {
        ...state,
        step: action.value,
      };
    case 'set-signature':
      return {
        ...state,
        data: {
          ...state.data,
          partnerSignature: action.value,
        },
        fieldErrors: withoutFieldError(state.fieldErrors, 'partnerSignature'),
      };
    case 'set-validation':
      return {
        ...state,
        fieldErrors: action.value.fieldErrors,
        formErrors: action.value.formErrors,
      };
    case 'clear-validation':
      return {
        ...state,
        fieldErrors: {},
        formErrors: [],
      };
    case 'reset':
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

export function useSupportForm(initialMembershipType?: MembershipType) {
  const [state, dispatch] = useReducer(
    reducer,
    initialMembershipType,
    (membership): SupportFormState => {
      if (membership === 'nonVictory') {
        return {
          ...initialState,
          data: { ...initialSupportFormData, membershipType: 'nonVictory' },
        };
      }
      return initialState;
    },
  );
  const latestDataRef = useRef(state.data);

  useEffect(() => {
    latestDataRef.current = state.data;
  }, [state.data]);

  const isFormValid = useMemo(() => isSupportFormValid(state.data), [state.data]);
  const isPartnerStepComplete = useMemo(() => {
    const result = validatePartnerStepDetailed(state.data);
    return Object.keys(result.fieldErrors).length === 0 && result.formErrors.length === 0;
  }, [state.data]);
  const isAccountabilityStepComplete = useMemo(() => {
    const result = validateAccountabilityStepDetailed(state.data);
    return Object.keys(result.fieldErrors).length === 0 && result.formErrors.length === 0;
  }, [state.data]);

  const onTextChange = (field: RequiredStringField) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue =
      field === 'amount' ? formatAmountInputForField(event.target.value) : event.target.value;

    dispatch({
      type: 'set-text',
      field,
      value: nextValue,
    });
  };

  const onCheckboxChange = (field: CheckboxField) => (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'set-checkbox',
      field,
      value: event.target.checked,
    });
  };

  const onCurrencyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: 'set-currency',
      value: event.target.value as CurrencyCode,
    });
  };

  const setMembership = (value: MembershipType) => {
    latestDataRef.current = {
      ...latestDataRef.current,
      membershipType: value,
    };

    dispatch({
      type: 'set-membership',
      value,
    });
  };

  const onCanceledChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'set-canceled',
      value: event.target.value as CanceledChoice,
    });
  };

  const onUnableToGoChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'set-unable-to-go',
      value: event.target.value as UnableToGoChoice,
    });
  };

  const onReroutedChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'set-rerouted',
      value: event.target.value as ReroutedChoice,
    });
  };

  const setPartnerSignature = (value: string) => {
    dispatch({
      type: 'set-signature',
      value,
    });
  };

  const resetForm = () => {
    dispatch({ type: 'reset' });
  };

  const goToStep = (value: EditableFormStep) => {
    dispatch({ type: 'clear-validation' });
    dispatch({ type: 'set-step', value });
  };

  const goToPartner = () => {
    goToStep('partner');
  };

  const goToAccountability = (): boolean => {
    const currentData = {
      ...state.data,
      ...latestDataRef.current,
    };
    const validationResult = validatePartnerStepDetailed(currentData);
    dispatch({ type: 'set-validation', value: validationResult });

    if (
      Object.keys(validationResult.fieldErrors).length > 0 ||
      validationResult.formErrors.length > 0
    ) {
      dispatch({ type: 'set-step', value: 'partner' });
      return false;
    }

    dispatch({ type: 'clear-validation' });
    dispatch({ type: 'set-step', value: 'accountability' });
    return true;
  };

  const goToReview = (): boolean => {
    const currentData = {
      ...state.data,
      ...latestDataRef.current,
    };

    const validationResult = validateSupportFormDetailed(currentData);
    dispatch({ type: 'set-validation', value: validationResult });

    if (
      Object.keys(validationResult.fieldErrors).length === 0 &&
      validationResult.formErrors.length === 0
    ) {
      dispatch({ type: 'set-step', value: 'review' });
      return true;
    }

    const firstInvalidStep = getFirstInvalidStep(currentData);
    dispatch({ type: 'set-step', value: firstInvalidStep ?? 'partner' });
    return false;
  };

  return {
    data: state.data,
    step: state.step,
    fieldErrors: state.fieldErrors,
    formErrors: state.formErrors,
    isFormValid,
    isPartnerStepComplete,
    isAccountabilityStepComplete,
    onTextChange,
    onCurrencyChange,
    onCheckboxChange,
    setField: (field: RequiredStringField, value: string) => {
      dispatch({ type: 'set-text', field, value });
    },
    setMembership,
    onUnableToGoChange,
    onReroutedChange,
    onCanceledChange,
    setPartnerSignature,
    resetForm,
    goToPartner,
    goToAccountability,
    goToReview,
    // allow callers to set validation results (useful for external checks like QR share)
    setValidation: (value: { fieldErrors: SupportFormFieldErrors; formErrors: string[] }) => {
      dispatch({ type: 'set-validation', value });
    },
  };
}
