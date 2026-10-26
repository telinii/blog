import { CategoryArt } from "./category-art";
import { assetUrl } from "@/lib/api";

// Capa do post: usa a foto enviada pelo autor ou, quando não existe,
// cai na arte gerada a partir da categoria.
export function PostCover({
  categoria,
  capa,
  className = "",
}: {
  categoria: string;
  capa: string | null;
  className?: string;
}) {
  if (!capa) {
    return <CategoryArt categoria={categoria} className={className} />;
  }

  return (
    <div className={`relative overflow-hidden bg-line/40 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetUrl(capa)}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
