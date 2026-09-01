import { useEffect, useState, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface CampoNumericoProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max'> {
  value: number;
  onChange: (valor: number) => void;
  min?: number;
  max?: number;
}

/**
 * Input numérico "de borrador": mientras escribes, el campo guarda el texto
 * tal cual (incluso vacío, "-", "1." a medio escribir…) sin forzar de vuelta
 * un dígito en cada tecleo — eso es lo que hacía que un <input type="number">
 * atado directo a un estado numérico "no dejara escribir bien" (al borrar
 * para reemplazar un valor, Number('') = 0 y el campo se re-llenaba solo).
 * El valor solo se valida y confirma al salir del campo (blur) o con Enter;
 * si quedó vacío o inválido, se revierte en silencio al último valor válido
 * y el borde se pone rojo un momento como aviso sutil, sin interrumpir con
 * una alerta.
 */
export function CampoNumerico({ value, onChange, min, max, className, onBlur, onKeyDown, ...resto }: CampoNumericoProps) {
  const [texto, setTexto] = useState(String(value));
  const [invalido, setInvalido] = useState(false);

  useEffect(() => {
    setTexto(String(value));
  }, [value]);

  function confirmar() {
    const limpio = texto.trim();
    const parsed = Number(limpio);
    if (limpio === '' || Number.isNaN(parsed)) {
      setTexto(String(value));
      setInvalido(true);
      setTimeout(() => setInvalido(false), 1200);
      return;
    }
    let final = parsed;
    if (min !== undefined) final = Math.max(min, final);
    if (max !== undefined) final = Math.min(max, final);
    setTexto(String(final));
    if (final !== value) onChange(final);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={(e) => {
        confirmar();
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          confirmar();
          e.currentTarget.blur();
        }
        onKeyDown?.(e);
      }}
      className={clsx(
        className,
        invalido && 'border-red-400 ring-2 ring-red-100 dark:border-red-700 dark:ring-red-900/50',
      )}
      {...resto}
    />
  );
}
