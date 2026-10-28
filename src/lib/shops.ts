import type { StaticImageData } from "next/image";
import aeroberticsLogo from "@/assets/shops/aerobertics.png";
import area51Logo from "@/assets/shops/area51.png";
import banggoodLogo from "@/assets/shops/banggood.png";
import bauerLogo from "@/assets/shops/bauer.png";
import berlinskiLogo from "@/assets/shops/berlinski.svg";
import bliekLogo from "@/assets/shops/bliek.png";
import chinahobbylineLogo from "@/assets/shops/chinahobbyline.png";
import copterfarmLogo from "@/assets/shops/copterfarm.png";
import deditionLogo from "@/assets/shops/dedition.png";
import derkumLogo from "@/assets/shops/derkum.png";
import dmtLogo from "@/assets/shops/dmt.png";
import dronefpvracerLogo from "@/assets/shops/dronefpvracer.png";
import droneshopLogo from "@/assets/shops/droneshop.png";
import ercLogo from "@/assets/shops/erc.png";
import flashrcLogo from "@/assets/shops/flashrc.svg";
import freakwareLogo from "@/assets/shops/freakware.png";
import ghwLogo from "@/assets/shops/ghw.png";
import hackerLogo from "@/assets/shops/hacker.png";
import heligearLogo from "@/assets/shops/heligear.png";
import helygoLogo from "@/assets/shops/helygo.png";
import hepfLogo from "@/assets/shops/hepf.svg";
import hobby351Logo from "@/assets/shops/hobby351.png";
import hobbykingLogo from "@/assets/shops/hobbyking.svg";
import hoelleinLogo from "@/assets/shops/hoellein.png";
import jonathanLogo from "@/assets/shops/jonathan.png";
import lindingerLogo from "@/assets/shops/lindinger.svg";
import metzLogo from "@/assets/shops/metz.png";
import mgmodellbauLogo from "@/assets/shops/mgmodellbau.png";
import mikadoLogo from "@/assets/shops/mikado.png";
import minizshopLogo from "@/assets/shops/minizshop.svg";
import modelvigoLogo from "@/assets/shops/modelvigo.png";
import monsterhopupsLogo from "@/assets/shops/monsterhopups.png";
import mrcmodelismeLogo from "@/assets/shops/mrcmodelisme.png";
import myrcpitstopLogo from "@/assets/shops/myrcpitstop.png";
import nfactoryLogo from "@/assets/shops/nfactory.png";
import originhobbiesLogo from "@/assets/shops/originhobbies.png";
import premiummodellbauLogo from "@/assets/shops/premiummodellbau.png";
import quartelLogo from "@/assets/shops/quartel.png";
import radiocontrolledshopLogo from "@/assets/shops/radiocontrolledshop.png";
import rccaronlineLogo from "@/assets/shops/rccaronline.png";
import rceuropeLogo from "@/assets/shops/rceurope.png";
import rcfoxLogo from "@/assets/shops/rcfox.png";
import rckleinkramLogo from "@/assets/shops/rckleinkram.png";
import rcmotorsportsLogo from "@/assets/shops/rcmotorsports.png";
import rcnmoreLogo from "@/assets/shops/rcnmore.png";
import rcproLogo from "@/assets/shops/rcpro.png";
import rcraceshopLogo from "@/assets/shops/rcraceshop.png";
import rcstorealgarveLogo from "@/assets/shops/rcstorealgarve.png";
import rcteamLogo from "@/assets/shops/rcteam.png";
import rcypadelLogo from "@/assets/shops/rcypadel.png";
import rotoramaLogo from "@/assets/shops/rotorama.png";
import ruddogLogo from "@/assets/shops/ruddog.png";
import scalercbuzzLogo from "@/assets/shops/scalercbuzz.png";
import shamrockLogo from "@/assets/shops/shamrock.png";
import shopzinnigLogo from "@/assets/shops/shopzinnig.png";
import smartmodelismoLogo from "@/assets/shops/smartmodelismo.png";
import speedlimitrcLogo from "@/assets/shops/speedlimitrc.png";
import speelgoedenmodelbouwLogo from "@/assets/shops/speelgoedenmodelbouw.png";
import stormrcLogo from "@/assets/shops/stormrc.png";
import svmodelismoLogo from "@/assets/shops/svmodelismo.png";
import tamicoLogo from "@/assets/shops/tamico.png";
import tflLogo from "@/assets/shops/tfl.png";
import theborderLogo from "@/assets/shops/theborder.png";
import todohobbyLogo from "@/assets/shops/todohobby.png";
import toemenLogo from "@/assets/shops/toemen.png";
import toprcLogo from "@/assets/shops/toprc.svg";
import tormodelLogo from "@/assets/shops/tormodel.png";
import trxxsLogo from "@/assets/shops/trxxs.png";
import ttmodelismoLogo from "@/assets/shops/ttmodelismo.png";
import turbohobbyLogo from "@/assets/shops/turbohobby.png";
import voltmasterLogo from "@/assets/shops/voltmaster.svg";
import wartelleLogo from "@/assets/shops/wartelle.png";
import wetronicLogo from "@/assets/shops/wetronic.png";
import xtremrcLogo from "@/assets/shops/xtremrc.png";

/** Talen van productnamen die we vertalen. */
export type SourceLanguage = "de" | "fr" | "es" | "it" | "pt";

/** De omschrijving staat per taal in de woordenboeken (dict.shops[slug]). */
export type ShopInfo = {
  slug: string;
  name: string;
  url: string;
  domain: string;
  /** Logo zoals de webshop het zelf op zijn site gebruikt. */
  logo: StaticImageData;
  /** Achtergrond waarop het logo goed leesbaar is (TopRC en Wetronic zijn licht). */
  logoBg: string;
  /**
   * Affiliate-partnerschap: deze query-parameters komen op de link naar het product,
   * eventueel alleen voor producten in de genoemde categorieën.
   */
  affiliate?: { params: Record<string, string>; categories?: string[] };
  /** Land van de webshop (ISO 3166-1 alpha-2); leeg als dat niet eenduidig is. */
  country?: string;
  /** Taal van de productnamen als die niet Nederlands of Engels is; die namen worden vertaald (zie src/lib/translate.ts). */
  language?: SourceLanguage;
  /**
   * Verzendkosten van een gewoon pakket naar Nederland, en vanaf welk orderbedrag verzending
   * gratis is. Alleen invullen als het op de site van de webshop zelf staat; zonder dit veld
   * tonen we geen verzendkosten of totaalprijs.
   */
  shipping?: { cost: number; freeFrom?: number };
};

// Houd de slugs gelijk met crawler/internal/shops/*.go.
export const SHOPS: ShopInfo[] = [
  {
    slug: "toprc",
    name: "TopRC",
    url: "https://www.toprc.nl",
    domain: "toprc.nl",
    logo: toprcLogo,
    logoBg: "bg-[#00607b]",
    country: "NL",
  },
  {
    slug: "toemen",
    name: "Toemen Modelsport",
    url: "https://www.toemen.nl",
    domain: "toemen.nl",
    logo: toemenLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "wetronic",
    name: "Wetronic",
    url: "https://wetronic.nl",
    domain: "wetronic.nl",
    logo: wetronicLogo,
    logoBg: "bg-[#0b1530]",
    country: "NL",
  },
  {
    slug: "minizshop",
    name: "Mini-Zshop",
    url: "https://mini-zshop.nl",
    domain: "mini-zshop.nl",
    logo: minizshopLogo,
    logoBg: "bg-[#800f0b]",
    country: "NL",
  },
  {
    slug: "berlinski",
    name: "Modellbau Berlinski",
    url: "https://www.modellbau-berlinski.de",
    domain: "modellbau-berlinski.de",
    logo: berlinskiLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "hoellein",
    name: "Hoellein",
    url: "https://hoelleinshop.com",
    domain: "hoelleinshop.com",
    logo: hoelleinLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "mgmodellbau",
    name: "MG-Modellbau",
    url: "https://www.mg-modellbau.de",
    domain: "mg-modellbau.de",
    logo: mgmodellbauLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "hacker",
    name: "Hacker Motor",
    url: "https://www.hacker-motor-shop.com",
    domain: "hacker-motor-shop.com",
    logo: hackerLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "rcmotorsports",
    name: "RC Motorsports",
    url: "https://www.rcmotorsports.nl",
    domain: "rcmotorsports.nl",
    logo: rcmotorsportsLogo,
    logoBg: "bg-[#191919]",
    country: "NL",
  },
  {
    slug: "droneshop",
    name: "Droneshop.nl",
    url: "https://droneshop.nl",
    domain: "droneshop.nl",
    logo: droneshopLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "tamico",
    name: "Tamico",
    url: "https://tamico.de",
    domain: "tamico.de",
    logo: tamicoLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "chinahobbyline",
    name: "ChinaHobbyLine",
    url: "https://chinahobbyline.com/nl",
    domain: "chinahobbyline.com",
    logo: chinahobbylineLogo,
    logoBg: "bg-white ring-1 ring-border",
    affiliate: { params: { ref: "rc-garage" }, categories: ["accus-laders"] },
  },
  {
    slug: "hepf",
    name: "Hepf",
    url: "https://hepf.com",
    domain: "hepf.com",
    logo: hepfLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "AT",
    language: "de",
  },
  {
    slug: "bliek",
    name: "Bliek Modelbouw",
    url: "https://webshop.bliekmodelbouw.nl",
    domain: "bliekmodelbouw.nl",
    logo: bliekLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "aerobertics",
    name: "Aerobertics",
    url: "https://aerobertics.be/nl",
    domain: "aerobertics.be",
    logo: aeroberticsLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "BE",
  },
  {
    slug: "heligear",
    name: "Heligear",
    url: "https://www.heligear.nl",
    domain: "heligear.nl",
    logo: heligearLogo,
    logoBg: "bg-[#1e1e1e]",
    country: "NL",
  },
  {
    slug: "area51",
    name: "Area51 RC",
    url: "https://www.area51-rc.es/shop/en/",
    domain: "area51-rc.es",
    logo: area51Logo,
    logoBg: "bg-[#212121]",
    country: "ES",
  },
  {
    slug: "banggood",
    name: "Banggood",
    url: "https://nl.banggood.com",
    domain: "banggood.com",
    logo: banggoodLogo,
    logoBg: "bg-[#1e1e1e]",
    // De prijzen zijn die van het Chinese magazijn (standaard op de productpagina).
    country: "CN",
    // Partnerlink: Banggood gebruikt ?p=<referral code> (account BG104716091).
    affiliate: { params: { p: "IM180966903162202610" } },
  },
  {
    slug: "voltmaster",
    name: "Voltmaster",
    url: "https://www.voltmaster.de",
    domain: "voltmaster.de",
    logo: voltmasterLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "nfactory",
    name: "N-Factory",
    url: "https://n-factory.de",
    domain: "n-factory.de",
    logo: nfactoryLogo,
    logoBg: "bg-[#1e1e1e]",
    country: "DE",
    language: "de",
  },
  {
    slug: "lindinger",
    name: "Lindinger",
    url: "https://www.lindinger.at",
    domain: "lindinger.at",
    logo: lindingerLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "AT",
    language: "de",
  },
  {
    slug: "rccaronline",
    name: "RC-Car-Online",
    url: "https://rc-car-online.de",
    domain: "rc-car-online.de",
    logo: rccaronlineLogo,
    logoBg: "bg-[#ffff00]",
    country: "DE",
    language: "de",
  },
  {
    slug: "premiummodellbau",
    name: "Premium-Modellbau",
    url: "https://www.premium-modellbau.de",
    domain: "premium-modellbau.de",
    logo: premiummodellbauLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "copterfarm",
    name: "CopterFarm",
    url: "https://www.copterfarm.de",
    domain: "copterfarm.de",
    logo: copterfarmLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "shopzinnig",
    name: "Shopzinnig",
    url: "https://www.shopzinnig.nl",
    domain: "shopzinnig.nl",
    logo: shopzinnigLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "hobbyking",
    name: "HobbyKing",
    url: "https://hobbyking.com/nl_nl/",
    domain: "hobbyking.com",
    logo: hobbykingLogo,
    logoBg: "bg-[#202020]",
    // De prijzen zijn die van het EU-magazijn in Frankrijk (stock_id 7, zie de crawler).
    country: "FR",
  },
  {
    slug: "speelgoedenmodelbouw",
    name: "SPEELGOEDenMODELBOUW",
    url: "https://www.speelgoedenmodelbouw.com",
    domain: "speelgoedenmodelbouw.com",
    logo: speelgoedenmodelbouwLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "theborder",
    name: "The Border RC",
    url: "https://www.the-border.com",
    domain: "the-border.com",
    logo: theborderLogo,
    logoBg: "bg-black",
    country: "NL",
  },
  {
    slug: "trxxs",
    name: "Trxxs-Winkel",
    url: "https://www.trxxs-winkel.be",
    domain: "trxxs-winkel.be",
    logo: trxxsLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "BE",
  },
  {
    slug: "erc",
    name: "e-rc",
    url: "https://www.e-rc.be",
    domain: "e-rc.be",
    logo: ercLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "BE",
  },
  {
    slug: "rcnmore",
    name: "RC N-more",
    url: "https://rcn-more.be",
    domain: "rcn-more.be",
    logo: rcnmoreLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "BE",
  },
  {
    slug: "rcteam",
    name: "RC Team",
    url: "https://www.rcteam.com",
    domain: "rcteam.com",
    logo: rcteamLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "FR",
    language: "fr",
  },
  {
    slug: "mrcmodelisme",
    name: "MRC Modélisme",
    url: "https://www.mrcmodelisme.com",
    domain: "mrcmodelisme.com",
    logo: mrcmodelismeLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "FR",
    language: "fr",
  },
  {
    slug: "dronefpvracer",
    name: "Drone FPV Racer",
    url: "https://www.drone-fpv-racer.com",
    domain: "drone-fpv-racer.com",
    logo: dronefpvracerLogo,
    logoBg: "bg-[#1e1e1e]",
    country: "FR",
    language: "fr",
  },
  {
    slug: "flashrc",
    name: "FlashRC",
    url: "https://www.flashrc.com/fr/",
    domain: "flashrc.com",
    logo: flashrcLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "FR",
    language: "fr",
  },
  {
    slug: "originhobbies",
    name: "OriginHobbies",
    url: "https://originhobbies.com",
    domain: "originhobbies.com",
    logo: originhobbiesLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "FI",
  },
  {
    slug: "stormrc",
    name: "Storm RC",
    url: "https://storm-rc.com",
    domain: "storm-rc.com",
    logo: stormrcLogo,
    logoBg: "bg-black",
    country: "FR",
    language: "fr",
  },
  {
    slug: "speedlimitrc",
    name: "SpeedLimit RC",
    url: "https://speedlimitrc.com",
    domain: "speedlimitrc.com",
    logo: speedlimitrcLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "ES",
    language: "es",
  },
  {
    slug: "rcypadel",
    name: "RC y Pádel",
    url: "https://www.rcypadel.es",
    domain: "rcypadel.es",
    logo: rcypadelLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "ES",
    language: "es",
  },
  {
    slug: "ttmodelismo",
    name: "TTmodelismo",
    url: "https://ttmodelismo.com",
    domain: "ttmodelismo.com",
    logo: ttmodelismoLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "PT",
    language: "pt",
  },
  {
    slug: "scalercbuzz",
    name: "scaleRCBuzz",
    url: "https://scalercbuzz.com",
    domain: "scalercbuzz.com",
    logo: scalercbuzzLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "PT",
    language: "pt",
  },
  {
    slug: "smartmodelismo",
    name: "Smart Modelismo",
    url: "https://smartmodelismo.pt",
    domain: "smartmodelismo.pt",
    logo: smartmodelismoLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "PT",
    language: "pt",
  },
  {
    slug: "rcstorealgarve",
    name: "RC Store Algarve",
    url: "https://rcstorealgarve.pt",
    domain: "rcstorealgarve.pt",
    logo: rcstorealgarveLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "PT",
    language: "pt",
  },
  {
    slug: "myrcpitstop",
    name: "MyRCPitstop",
    url: "https://myrcpitstop.eu",
    domain: "myrcpitstop.eu",
    logo: myrcpitstopLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "CY",
  },
  {
    slug: "radiocontrolledshop",
    name: "Radio Controlled Shop",
    url: "https://www.radiocontrolledshop.ie",
    domain: "radiocontrolledshop.ie",
    logo: radiocontrolledshopLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "IE",
  },
  {
    slug: "helygo",
    name: "Hely-Go!",
    url: "https://hely-go.net",
    domain: "hely-go.net",
    logo: helygoLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "IT",
    language: "it",
  },
  {
    slug: "todohobby",
    name: "TodoHobby",
    url: "https://todohobby.net",
    domain: "todohobby.net",
    logo: todohobbyLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "ES",
    language: "es",
  },
  {
    slug: "rcpro",
    name: "RC-Pro",
    url: "https://www.rc-pro.es",
    domain: "rc-pro.es",
    logo: rcproLogo,
    logoBg: "bg-black",
    country: "ES",
    language: "es",
  },
  {
    slug: "tormodel",
    name: "Tormodel",
    url: "https://www.tormodel.com",
    domain: "tormodel.com",
    logo: tormodelLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "ES",
    language: "es",
  },
  {
    slug: "hobby351",
    name: "Hobby351",
    url: "https://hobby351.com",
    domain: "hobby351.com",
    logo: hobby351Logo,
    logoBg: "bg-white ring-1 ring-border",
    country: "PT",
    language: "pt",
  },
  {
    slug: "quartel",
    name: "Quartel",
    url: "https://quartel.nl",
    domain: "quartel.nl",
    logo: quartelLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "monsterhopups",
    name: "Monster-Hopups",
    url: "https://www.monsterhopups.de",
    domain: "monsterhopups.de",
    logo: monsterhopupsLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "ghw",
    name: "GHW Modellbau",
    url: "https://ghw-modellbau.de",
    domain: "ghw-modellbau.de",
    logo: ghwLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "rcfox",
    name: "RCFOX",
    url: "https://www.rcfox.de",
    domain: "rcfox.de",
    logo: rcfoxLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "ruddog",
    name: "RUDDOG",
    url: "https://www.ruddog.eu",
    domain: "ruddog.eu",
    logo: ruddogLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "shamrock",
    name: "Shamrock Modelbouw",
    url: "https://shamrock-modelbouw.nl",
    domain: "shamrock-modelbouw.nl",
    logo: shamrockLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "bauer",
    name: "Bauer Modelle",
    url: "https://www.bauer-modelle.com",
    domain: "bauer-modelle.com",
    logo: bauerLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "rcraceshop",
    name: "RC-Race-Shop",
    url: "https://www.rc-race-shop.de",
    domain: "rc-race-shop.de",
    logo: rcraceshopLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "dedition",
    name: "D-Edition",
    url: "https://www.d-edition.de",
    domain: "d-edition.de",
    logo: deditionLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "rckleinkram",
    name: "RC-Kleinkram",
    url: "https://www.rc-kleinkram.de",
    domain: "rc-kleinkram.de",
    logo: rckleinkramLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "jonathan",
    name: "Jonathan",
    url: "https://shop.jonathan.it",
    domain: "shop.jonathan.it",
    logo: jonathanLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "IT",
    language: "it",
  },
  {
    slug: "tfl",
    name: "TFL Hobby",
    url: "https://www.tfl-hobby.de",
    domain: "tfl-hobby.de",
    logo: tflLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "dmt",
    name: "D-M-T Modellsport",
    url: "https://www.d-m-t.at",
    domain: "d-m-t.at",
    logo: dmtLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "AT",
    language: "de",
  },
  {
    slug: "rceurope",
    name: "RC-Europe",
    url: "https://www.rc-europe.eu",
    domain: "rc-europe.eu",
    logo: rceuropeLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "turbohobby",
    name: "TurboHobby",
    url: "https://turbohobby.com",
    domain: "turbohobby.com",
    logo: turbohobbyLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "ES",
    language: "es",
  },
  {
    slug: "xtremrc",
    name: "XtremRC",
    url: "https://www.xtremrc.com",
    domain: "xtremrc.com",
    logo: xtremrcLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "FR",
    language: "fr",
  },
  {
    slug: "derkum",
    name: "Derkum Modellbau",
    url: "https://www.derkum-modellbau.com",
    domain: "derkum-modellbau.com",
    logo: derkumLogo,
    logoBg: "bg-black",
    country: "DE",
    language: "de",
  },
  {
    slug: "metz",
    name: "Modellbau Metz",
    url: "https://www.modellbau-metz.com",
    domain: "modellbau-metz.com",
    logo: metzLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "rotorama",
    name: "Rotorama",
    url: "https://www.rotorama.com",
    domain: "rotorama.com",
    logo: rotoramaLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "CZ",
  },
  {
    slug: "freakware",
    name: "Freakware",
    url: "https://www.freakware.de",
    domain: "freakware.de",
    logo: freakwareLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "svmodelismo",
    name: "SV Modelismo",
    url: "https://www.svmodelismo.net",
    domain: "svmodelismo.net",
    logo: svmodelismoLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "PT",
  },
  {
    slug: "modelvigo",
    name: "ModelVigo",
    url: "https://www.modelvigo.es",
    domain: "modelvigo.es",
    logo: modelvigoLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "ES",
    language: "es",
  },
  {
    slug: "wartelle",
    name: "Wartelle Shop",
    url: "https://www.wartelle-shop.com",
    domain: "wartelle-shop.com",
    logo: wartelleLogo,
    logoBg: "bg-black",
    country: "FR",
    language: "fr",
  },
  {
    slug: "mikado",
    name: "Mikado",
    url: "https://shop.mikado-heli.de",
    domain: "shop.mikado-heli.de",
    logo: mikadoLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
];

const bySlug = new Map(SHOPS.map((s) => [s.slug, s]));

export function getShop(slug: string | null | undefined): ShopInfo | undefined {
  return slug ? bySlug.get(slug) : undefined;
}

/** Webshops met productnamen in een andere taal, per slug. */
export const SHOP_LANGUAGES = new Map(
  SHOPS.flatMap((s) =>
    s.language ? [[s.slug, s.language] as [string, SourceLanguage]] : [],
  ),
);

/** Webshops met productnamen die we vertalen. */
export const TRANSLATED_SHOPS = [...SHOP_LANGUAGES.keys()];

/** Shops uit dit land tellen als "binnenland": geen douane, meestal snelle levering. */
export const HOME_COUNTRIES = ["NL", "BE"];

/** Verzendkosten naar Nederland voor dit bedrag, of null als we ze niet kennen. */
export function shippingCost(slug: string, price: number): number | null {
  const shipping = getShop(slug)?.shipping;
  if (!shipping) return null;
  return shipping.freeFrom !== undefined && price >= shipping.freeFrom
    ? 0
    : shipping.cost;
}

/** Waar een klik naar de webshop vandaan komt (voor de statistieken in /admin). */
export const CLICK_SOURCES = [
  "site",
  "mail",
  "discord",
  "alarm",
  "feed",
  /** Uitgelichte (betaalde) plaatsing, zie src/lib/promotions.ts. */
  "featured",
] as const;
export type ClickSource = (typeof CLICK_SOURCES)[number];

/**
 * Link naar de webshop via /api/uit/[id], dat de klik telt en doorstuurt naar productLink().
 * `origin` is nodig buiten de site (mail, Discord, feed), waar een relatieve link niet werkt.
 */
export function outLink(
  deal: { id: number; url: string; shopSlug: string; categorySlug: string },
  source: ClickSource = "site",
  origin = "",
): { href: string; rel: string } {
  const query = source === "site" ? "" : `?bron=${source}`;
  const { rel } = productLink(deal);
  return {
    href: `${origin}/api/uit/${deal.id}${query}`,
    rel: source === "featured" ? sponsoredRel(rel) : rel,
  };
}

/** Een betaalde plaatsing is altijd rel="sponsored", ook zonder affiliate-link. */
function sponsoredRel(rel: string) {
  return rel.includes("sponsored") ? rel : `${rel} sponsored`;
}

/** Link naar de homepage van een uitgelichte webshop via /api/uit/webshop/[slug] (telt de klik). */
export function shopOutLink(slug: string): { href: string; rel: string } {
  return {
    href: `/api/uit/webshop/${slug}?bron=featured`,
    rel: "noopener nofollow sponsored",
  };
}

/** Homepage van de webshop, met partnerparameters als die voor de hele shop gelden. */
export function shopLink(shop: ShopInfo): string {
  if (!shop.affiliate || shop.affiliate.categories) return shop.url;
  const url = new URL(shop.url);
  for (const [k, v] of Object.entries(shop.affiliate.params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

/**
 * Link en rel-attribuut voor "naar de webshop". Affiliate-links krijgen de partnerparameters
 * en rel="sponsored", zoals zoekmachines voor betaalde links vragen.
 */
export function productLink(deal: {
  url: string;
  shopSlug: string;
  categorySlug: string;
}): { href: string; rel: string } {
  const affiliate = getShop(deal.shopSlug)?.affiliate;
  if (
    !affiliate ||
    (affiliate.categories && !affiliate.categories.includes(deal.categorySlug))
  ) {
    return { href: deal.url, rel: "noopener nofollow" };
  }
  let url: URL;
  try {
    url = new URL(deal.url);
  } catch {
    return { href: deal.url, rel: "noopener nofollow" };
  }
  for (const [k, v] of Object.entries(affiliate.params)) {
    url.searchParams.set(k, v);
  }
  return { href: url.toString(), rel: "noopener nofollow sponsored" };
}
