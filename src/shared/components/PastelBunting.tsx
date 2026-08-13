import { useTheme } from '../../application/theme/useTheme';

const COLORES_BANDERIN = ['#8ECFF5', '#C7B7F5', '#F7A8CE', '#FBE08A', '#96E3B0'];

/** Fila de banderines decorativos, al estilo del anuncio de la papelería. Solo se muestra con el tema pastel. */
export function PastelBunting() {
  const { tema } = useTheme();
  if (tema !== 'pastel') return null;

  const cantidad = 14;
  const ancho = 44;
  const alto = 40;

  return (
    <div className="w-full shrink-0 overflow-hidden bg-white/40" aria-hidden="true">
      <svg viewBox={`0 0 ${ancho * cantidad} ${alto}`} preserveAspectRatio="none" className="h-7 w-full">
        <line x1="0" y1="3" x2={ancho * cantidad} y2="3" stroke="#B08D57" strokeWidth="2" />
        {Array.from({ length: cantidad }).map((_, indice) => {
          const centroX = indice * ancho + ancho / 2;
          const color = COLORES_BANDERIN[indice % COLORES_BANDERIN.length];
          return (
            <polygon
              key={indice}
              points={`${centroX - ancho * 0.34},3 ${centroX + ancho * 0.34},3 ${centroX},${alto - 4}`}
              fill={color}
            />
          );
        })}
      </svg>
    </div>
  );
}
