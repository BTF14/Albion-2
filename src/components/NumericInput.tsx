import React, { useState, useEffect, useRef } from 'react';

export interface NumericInputProps {
  id?: string;
  name?: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  autoSelectOnFocus?: boolean;
  allowDecimals?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

/**
 * Componente de entrada numérica optimizado para móviles y navegadores web.
 * - Resuelve el problema donde el usuario presiona borrar y se queda un '0' atrapado.
 * - Evita ceros a la izquierda accidentales como '099' al escribir tras un cero.
 * - Permite borrar el campo por completo para escribir cómodamente desde cero sin que rebote el número.
 * - No bloquea la escritura imponiendo 'min' antes de que el usuario termine de tipear.
 * - Soporta decimales opcionales (ej: kg de peso 0.05, 1.5).
 * - Abre el teclado numérico nativo en Android y iOS sin los bugs de input type="number".
 * - Soporta flechas arriba/abajo con step personalizable.
 */
export const NumericInput: React.FC<NumericInputProps> = ({
  id,
  name,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder = '0',
  className = '',
  autoSelectOnFocus = true,
  allowDecimals = false,
  onFocus,
  onBlur,
  disabled = false,
  readOnly = false,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(
    value === undefined || isNaN(value) ? '' : String(value)
  );
  const isFocusedRef = useRef<boolean>(false);
  const lastPropValueRef = useRef<number>(value);
  const selectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (selectTimeoutRef.current) {
        clearTimeout(selectTimeoutRef.current);
      }
    };
  }, []);

  // Sincronizar con el valor recibido por props si cambia externamente (ej: cambio de ítem, presets, reseteo)
  // Pero si el usuario tiene el campo enfocado y está escribiendo, NO sobreescribir su edición actual.
  useEffect(() => {
    if (value !== lastPropValueRef.current) {
      lastPropValueRef.current = value;
      if (isFocusedRef.current) {
        return;
      }
      setDisplayValue(value === undefined || isNaN(value) ? '' : String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    let cleaned: string;
    if (allowDecimals) {
      // Permitir dígitos y a lo sumo un punto decimal
      cleaned = raw.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
      }
      if (cleaned.startsWith('.')) {
        cleaned = '0' + cleaned;
      }
      // Eliminar ceros iniciales solo si no van seguidos de punto (ej: '05' -> '5', pero '0.5' se mantiene)
      if (cleaned.length > 1 && cleaned.startsWith('0') && cleaned[1] !== '.') {
        cleaned = cleaned.replace(/^0+(?=\d)/, '');
      }
    } else {
      // Permitir solo dígitos numéricos enteros
      cleaned = raw.replace(/[^0-9]/g, '');
      // Eliminar ceros a la izquierda no deseados (ej: '099' -> '99', '0700' -> '700', pero mantener '0' si es único)
      if (cleaned.length > 1 && cleaned.startsWith('0')) {
        cleaned = cleaned.replace(/^0+(?=\d)/, '');
      }
    }

    setDisplayValue(cleaned);

    if (cleaned === '' || cleaned === '.') {
      // El usuario borró por completo el número: reportamos 0 para no romper cálculos, pero la pantalla se queda limpia
      lastPropValueRef.current = 0;
      onChange(0);
    } else {
      let num = allowDecimals ? parseFloat(cleaned) : parseInt(cleaned, 10);
      if (Number.isFinite(num)) {
        // Solo recortamos si excede el máximo permitido
        if (max !== undefined && num > max) {
          num = max;
          cleaned = String(max);
          setDisplayValue(cleaned);
        }
        // NOTA CLAVE: NO recortamos si num < min durante el tipeo activo para permitir
        // que el usuario borre y comience a escribir números que empiecen por 0 o dígitos bajos.
        lastPropValueRef.current = num;
        onChange(num);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    if (autoSelectOnFocus) {
      const target = e.target;
      target.select();
      // Garantizar selección total en navegadores de escritorio y móviles (Android / iOS)
      if (selectTimeoutRef.current) {
        clearTimeout(selectTimeoutRef.current);
      }
      selectTimeoutRef.current = setTimeout(() => {
        try {
          target.select();
        } catch {
          // ignore
        }
      }, 30);
    }
    if (onFocus) onFocus(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (autoSelectOnFocus && (displayValue === '0' || displayValue === '')) {
      (e.target as HTMLInputElement).select();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = false;
    let finalNum: number;

    const parsedVal = allowDecimals ? parseFloat(displayValue) : parseInt(displayValue, 10);
    if (displayValue === '' || !Number.isFinite(parsedVal)) {
      finalNum = min !== undefined ? min : 0;
    } else {
      finalNum = parsedVal;
      if (min !== undefined && finalNum < min) finalNum = min;
      if (max !== undefined && finalNum > max) finalNum = max;
    }

    setDisplayValue(String(finalNum));
    lastPropValueRef.current = finalNum;
    onChange(finalNum);

    if (onBlur) onBlur(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = (allowDecimals ? parseFloat(displayValue) : parseInt(displayValue, 10)) || (min !== undefined ? min : 0);
      let next = current + (step || 1);
      if (allowDecimals) {
        next = Math.round(next * 100) / 100;
      }
      if (max !== undefined && next > max) next = max;
      setDisplayValue(String(next));
      lastPropValueRef.current = next;
      onChange(next);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = (allowDecimals ? parseFloat(displayValue) : parseInt(displayValue, 10)) || 0;
      let next = current - (step || 1);
      if (allowDecimals) {
        next = Math.round(next * 100) / 100;
      }
      if (min !== undefined && next < min) next = min;
      setDisplayValue(String(next));
      lastPropValueRef.current = next;
      onChange(next);
    }
  };

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      pattern={allowDecimals ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onClick={handleClick}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      readOnly={readOnly}
      autoComplete="off"
    />
  );
};
