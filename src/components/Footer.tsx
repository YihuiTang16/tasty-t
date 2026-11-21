import { Brand } from "./Brand.tsx";
import { formatRetrieved } from "../lib/format.ts";

interface FooterProps {
  placeCount: number;
  stationCount: number;
  osmRetrievedAt: string;
  mbtaRetrievedAt: string;
  osmLicenseUrl: string;
  massdotAgreementUrl: string;
}

export function Footer({
  placeCount,
  stationCount,
  osmRetrievedAt,
  mbtaRetrievedAt,
  osmLicenseUrl,
  massdotAgreementUrl,
}: FooterProps) {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted sm:px-6">
        <p><Brand /></p>
        <p className="max-w-3xl leading-6">
          An independent student project for BostonHacks BostonBound, on the Bos(tons) of Eats and Streets track. SUBwayTREK is not
          affiliated with, endorsed by, or a partner of the MBTA or MassDOT, and it does not use their logos.
        </p>
        <p className="max-w-3xl leading-6">
          {placeCount.toLocaleString("en-US")} places © OpenStreetMap contributors, retrieved {formatRetrieved(osmRetrievedAt)}{" "}
          through the Overpass API. Data is available under the{" "}
          <a className="font-medium text-harbor underline-offset-4 hover:underline" href={osmLicenseUrl}>
            Open Database License
          </a>
          . {stationCount.toLocaleString("en-US")} subway and light rail stations were retrieved {formatRetrieved(mbtaRetrievedAt)}{" "}
          from the MBTA V3 API. Station data provided by MassDOT under the{" "}
          <a className="font-medium text-harbor underline-offset-4 hover:underline" href={massdotAgreementUrl}>
            Developers License Agreement
          </a>
          .
        </p>
        <p className="max-w-3xl leading-6">
          Straight-line distances are not travel times. Prices appear only when OpenStreetMap has a fee or a simple charge. Google
          Maps transit directions are a link out of this app.
        </p>
      </div>
    </footer>
  );
}
