export interface PaginaImprimible {
  dataUrl: string;
}

/**
 * Abre una ventana con una imagen por página (a tamaño real de hoja) y lanza
 * el diálogo de impresión del navegador en cuanto cargan. No depende de que
 * el usuario descargue el PDF primero.
 */
export function imprimirPaginas(paginas: PaginaImprimible[], anchoCm: number, altoCm: number): void {
  if (paginas.length === 0) return;

  const ventana = window.open('', '_blank', 'width=900,height=700');
  if (!ventana) {
    throw new Error('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes e intenta de nuevo.');
  }

  const paginasHtml = paginas
    .map(
      (pagina, indice) =>
        `<div class="pagina"${indice < paginas.length - 1 ? ' style="page-break-after: always;"' : ''}>` +
        `<img src="${pagina.dataUrl}" /></div>`,
    )
    .join('');

  ventana.document.open();
  ventana.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Imprimir</title>
<style>
  @page { size: ${anchoCm}cm ${altoCm}cm; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .pagina { width: ${anchoCm}cm; height: ${altoCm}cm; }
  .pagina img { display: block; width: 100%; height: 100%; object-fit: contain; }
</style>
</head>
<body>
${paginasHtml}
<script>
  window.onload = function () {
    window.focus();
    window.print();
  };
</script>
</body>
</html>`);
  ventana.document.close();
}
