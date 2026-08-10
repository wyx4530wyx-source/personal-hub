import { Reveal } from "./Reveal";
export function PageHero({ index, title, count, description }: { index: string; title: string; count?: string; description: string }) {
  return <Reveal><header className="page-hero"><div className="page-kicker"><span>{index}</span><span>{count}</span></div><h1>{title}</h1><p className="page-description">{description}</p></header></Reveal>;
}
