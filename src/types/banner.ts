/** Fila de `public.banners`: un anuncio del carrusel de Inicio. */
export type Banner = {
  id: string;
  titulo: string;
  imagen_url: string | null;
  enlace_url: string | null;
  orden: number;
  activo: boolean;
  creado_en: string;
};

/** Lo que el carrusel necesita de cada banner. */
export type BannerInicio = Pick<Banner, "id" | "titulo" | "imagen_url" | "enlace_url">;
