"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

export interface ValidationRule<
  FormData = Record<string, string | number | boolean | string[]>,
> {
  field: string;
  validator: (
    value: string | number | boolean | string[],
    formData?: FormData,
  ) => string | null;
  dependencies?: string[];
  debounceMs?: number;
}

export interface ValidationState {
  errors: Record<string, string>;
  warnings: Record<string, string>;
  isValidating: Record<string, boolean>;
  touchedFields: Set<string>;
  isValid: boolean;
}

export enum ValidationMode {
  ON_CHANGE = "onChange",
  ON_BLUR = "onBlur",
  ALL = "all",
}

export interface UseFormValidationProps {
  rules?: ValidationRule[];
  schema?: z.ZodSchema;
  mode?: ValidationMode;
  debounceMs?: number;
}

export function useFormValidation({
  rules = [],
  schema,
  mode = ValidationMode.ON_CHANGE,
  debounceMs = 300,
}: UseFormValidationProps = {}) {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    warnings: {},
    isValidating: {},
    touchedFields: new Set(),
    isValid: true,
  });

  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const validateCountRef = useRef<Record<string, number>>({});

  const validateField = useCallback(
    async (
      field: string,
      value: string | number | boolean | string[],
      formData: Record<string, string | number | boolean | string[]> = {},
    ) => {
      validateCountRef.current[field] = validateCountRef.current[field] || 0;
      const validateId = ++validateCountRef.current[field];

      setValidationState((prev) => ({
        ...prev,
        isValidating: { ...prev.isValidating, [field]: true },
      }));

      const rule = rules.find((r) => r.field === field);
      const fieldDebounceMs = rule?.debounceMs ?? debounceMs;

      return new Promise<void>((resolve) => {
        if (timeoutRefs.current[field]) {
          clearTimeout(timeoutRefs.current[field]);
        }

        timeoutRefs.current[field] = setTimeout(async () => {
          if (validateCountRef.current[field] !== validateId) {
            resolve();
            return;
          }

          let error: string | null = null;
          let warning: string | null = null;

          try {
            if (rule) {
              const result = rule.validator(value, formData);
              if (result) {
                if (result.startsWith("Warning:")) {
                  warning = result.replace("Warning:", "").trim();
                } else {
                  error = result;
                }
              }
            }

            if (schema && !error) {
              try {
                if ("shape" in schema && schema.shape) {
                  const shape = schema.shape as Record<string, z.ZodTypeAny>;
                  const fieldSchema = shape[field];
                  if (fieldSchema) {
                    fieldSchema.parse(value);
                  }
                }
              } catch (zodError) {
                if (zodError instanceof z.ZodError) {
                  error = zodError.issues[0]?.message || "Invalid value";
                }
              }
            }
          } catch (validationError) {
            error =
              validationError instanceof Error
                ? validationError.message
                : "Validation error";
          }

          setValidationState((prev) => {
            const newErrors = { ...prev.errors };
            const newWarnings = { ...prev.warnings };
            const newIsValidating = { ...prev.isValidating };

            if (error) {
              newErrors[field] = error;
              delete newWarnings[field];
            } else {
              delete newErrors[field];
              if (warning) {
                newWarnings[field] = warning;
              } else {
                delete newWarnings[field];
              }
            }

            newIsValidating[field] = false;

            const hasErrors = Object.keys(newErrors).length > 0;

            return {
              ...prev,
              errors: newErrors,
              warnings: newWarnings,
              isValidating: newIsValidating,
              isValid: !hasErrors,
            };
          });

          resolve();
        }, fieldDebounceMs);
      });
    },
    [rules, schema, debounceMs],
  );

  const validateForm = useCallback(
    async (formData: Record<string, string | number | boolean | string[]>) => {
      const fieldPromises = Object.keys(formData).map((field) =>
        validateField(field, formData[field], formData),
      );

      await Promise.all(fieldPromises);

      if (schema) {
        try {
          schema.parse(formData);
        } catch (zodError) {
          if (zodError instanceof z.ZodError) {
            const errors: Record<string, string> = {};
            zodError.issues.forEach((error) => {
              const path = error.path.join(".");
              errors[path] = error.message;
            });

            setValidationState((prev) => ({
              ...prev,
              errors: { ...prev.errors, ...errors },
              isValid: false,
            }));
          }
        }
      }
    },
    [schema, validateField],
  );

  const touchField = useCallback((field: string) => {
    setValidationState((prev) => ({
      ...prev,
      touchedFields: new Set([...prev.touchedFields, field]),
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setValidationState((prev) => {
      const newErrors = { ...prev.errors };
      const newWarnings = { ...prev.warnings };
      delete newErrors[field];
      delete newWarnings[field];

      return {
        ...prev,
        errors: newErrors,
        warnings: newWarnings,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setValidationState({
      errors: {},
      warnings: {},
      isValidating: {},
      touchedFields: new Set(),
      isValid: true,
    });

    Object.values(timeoutRefs.current).forEach(clearTimeout);
    timeoutRefs.current = {};
    validateCountRef.current = {};
  }, []);

  const getFieldError = useCallback(
    (field: string) => {
      const shouldShowError =
        mode === ValidationMode.ALL ||
        mode === ValidationMode.ON_CHANGE ||
        (mode === ValidationMode.ON_BLUR &&
          validationState.touchedFields.has(field));

      return shouldShowError ? validationState.errors[field] : undefined;
    },
    [mode, validationState.errors, validationState.touchedFields],
  );

  const getFieldWarning = useCallback(
    (field: string) => {
      const shouldShowWarning =
        mode === ValidationMode.ALL ||
        mode === ValidationMode.ON_CHANGE ||
        (mode === ValidationMode.ON_BLUR &&
          validationState.touchedFields.has(field));

      return shouldShowWarning ? validationState.warnings[field] : undefined;
    },
    [mode, validationState.warnings, validationState.touchedFields],
  );

  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  return {
    ...validationState,
    validateField,
    validateForm,
    touchField,
    clearFieldError,
    reset,
    getFieldError,
    getFieldWarning,
    isFieldValidating: (field: string) =>
      validationState.isValidating[field] || false,
    hasFieldError: (field: string) => !!validationState.errors[field],
    hasFieldWarning: (field: string) => !!validationState.warnings[field],
  };
}
