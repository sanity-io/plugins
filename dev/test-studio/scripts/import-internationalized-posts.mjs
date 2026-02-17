import { getCliClient } from "sanity/cli";

/**
 * Import seed content for the internationalized array example.
 * Run with:
 *   pnpm --filter test-studio run import:internationalized-posts
 *
 * Optional:
 *   pnpm --filter test-studio run import:internationalized-posts -- --old-format
 *   IMPORT_OLD_FORMAT=true pnpm --filter test-studio run import:internationalized-posts
 */
const args = new Set(process.argv.slice(2));
const useOldFormat =
  args.has("--old-format") || process.env.IMPORT_OLD_FORMAT === "true";

const posts = [
  {
    id: "bmw-r-1250-gs",
    translations: {
      en: {
        title: "BMW R 1250 GS",
        description:
          "A benchmark adventure bike with boxer torque, long-distance comfort, and excellent road-to-trail versatility.",
      },
      es: {
        title: "BMW R 1250 GS",
        description:
          "Una moto adventure de referencia, con gran par boxer, comodidad para largas distancias y mucha versatilidad.",
      },
      fr: {
        title: "BMW R 1250 GS",
        description:
          "Une reference du segment adventure, avec couple boxer, confort longue distance et grande polyvalence route-piste.",
      },
    },
  },
  {
    id: "ducati-multistrada-v4",
    translations: {
      en: {
        title: "Ducati Multistrada V4",
        description:
          "A high-performance ADV tourer combining sporty handling, advanced electronics, and all-day touring capability.",
      },
      es: {
        title: "Ducati Multistrada V4",
        description:
          "Una adventure touring de alto rendimiento con manejo deportivo, electronica avanzada y gran comodidad en ruta.",
      },
      fr: {
        title: "Ducati Multistrada V4",
        description:
          "Une routiere adventure tres performante, avec comportement sportif, electronique avancee et confort sur longue etape.",
      },
    },
  },
  {
    id: "ktm-1290-super-adventure-s",
    translations: {
      en: {
        title: "KTM 1290 Super Adventure S",
        description:
          "A powerful V-twin machine built for fast touring, with agile chassis dynamics and confidence-inspiring rider aids.",
      },
      es: {
        title: "KTM 1290 Super Adventure S",
        description:
          "Una V-twin muy potente para viajar rapido, con chasis agil y asistencias que aportan mucha confianza.",
      },
      fr: {
        title: "KTM 1290 Super Adventure S",
        description:
          "Une machine V-twin puissante pour rouler vite, avec un chassis agile et des aides a la conduite rassurantes.",
      },
    },
  },
  {
    id: "triumph-tiger-1200-rally-pro",
    translations: {
      en: {
        title: "Triumph Tiger 1200 Rally Pro",
        description:
          "A premium long-range adventure motorcycle with shaft drive, comfort-focused ergonomics, and serious off-road intent.",
      },
      es: {
        title: "Triumph Tiger 1200 Rally Pro",
        description:
          "Una adventure premium para largas rutas, con cardan, ergonomia comoda y clara orientacion al off-road.",
      },
      fr: {
        title: "Triumph Tiger 1200 Rally Pro",
        description:
          "Une adventure premium pour les longues distances, avec transmission par cardan, ergonomie confortable et vrai ADN tout-terrain.",
      },
    },
  },
  {
    id: "honda-crf1100l-africa-twin",
    translations: {
      en: {
        title: "Honda CRF1100L Africa Twin",
        description:
          "A balanced adventure platform known for reliability, manageable weight, and excellent control on mixed terrain.",
      },
      es: {
        title: "Honda CRF1100L Africa Twin",
        description:
          "Una plataforma adventure muy equilibrada, famosa por su fiabilidad, peso contenido y gran control en terreno mixto.",
      },
      fr: {
        title: "Honda CRF1100L Africa Twin",
        description:
          "Une plateforme adventure tres equilibree, reconnue pour sa fiabilite, son poids maitrise et son excellent controle.",
      },
    },
  },
  {
    id: "yamaha-tenere-700",
    translations: {
      en: {
        title: "Yamaha Tenere 700",
        description:
          "A lightweight middleweight ADV favorite with a durable twin engine and straightforward, trail-ready character.",
      },
      es: {
        title: "Yamaha Tenere 700",
        description:
          "Una adventure media y ligera muy querida, con motor bicilindrico robusto y caracter simple listo para pistas.",
      },
      fr: {
        title: "Yamaha Tenere 700",
        description:
          "Une adventure de moyenne cylindree, legere et populaire, avec un bicylindre robuste et un esprit pret pour les pistes.",
      },
    },
  },
  {
    id: "suzuki-v-strom-1050de",
    translations: {
      en: {
        title: "Suzuki V-Strom 1050DE",
        description:
          "A practical adventure tourer delivering smooth V-twin power, comfort, and improved capability for rougher roads.",
      },
      es: {
        title: "Suzuki V-Strom 1050DE",
        description:
          "Una adventure touring muy practica, con potencia V-twin suave, confort y mejor capacidad en caminos irregulares.",
      },
      fr: {
        title: "Suzuki V-Strom 1050DE",
        description:
          "Une adventure touring tres pratique, avec un V-twin souple, du confort et de meilleures aptitudes sur routes degradees.",
      },
    },
  },
  {
    id: "harley-davidson-pan-america-1250-special",
    translations: {
      en: {
        title: "Harley-Davidson Pan America 1250 Special",
        description:
          "A modern American ADV with strong power, adaptive ride-height tech, and impressive touring comfort.",
      },
      es: {
        title: "Harley-Davidson Pan America 1250 Special",
        description:
          "Una ADV americana moderna con mucha potencia, altura adaptativa y gran comodidad para viajar.",
      },
      fr: {
        title: "Harley-Davidson Pan America 1250 Special",
        description:
          "Une ADV americaine moderne, avec une forte puissance, une hauteur adaptative et un tres bon confort de voyage.",
      },
    },
  },
  {
    id: "moto-guzzi-v85-tt",
    translations: {
      en: {
        title: "Moto Guzzi V85 TT",
        description:
          "A character-rich adventure bike offering classic style, relaxed touring manners, and light off-pavement capability.",
      },
      es: {
        title: "Moto Guzzi V85 TT",
        description:
          "Una adventure con mucha personalidad, estilo clasico, conduccion tranquila en ruta y capacidad ligera fuera del asfalto.",
      },
      fr: {
        title: "Moto Guzzi V85 TT",
        description:
          "Une adventure pleine de caractere, avec style classique, conduite detendue et aptitudes legeres hors bitume.",
      },
    },
  },
  {
    id: "aprilia-tuareg-660",
    translations: {
      en: {
        title: "Aprilia Tuareg 660",
        description:
          "A nimble mid-size adventure bike with strong off-road behavior, responsive power, and excellent suspension setup.",
      },
      es: {
        title: "Aprilia Tuareg 660",
        description:
          "Una adventure mediana y agil, con gran rendimiento off-road, motor reactivo y suspensiones muy bien ajustadas.",
      },
      fr: {
        title: "Aprilia Tuareg 660",
        description:
          "Une adventure agile de moyenne cylindree, avec de vraies qualites tout-terrain, un moteur vif et de super suspensions.",
      },
    },
  },
];

const randomKey = () => crypto.randomUUID();

function asInternationalizedPost(post) {
  const title = Object.entries(post.translations).map(
    ([language, localized]) => {
      if (useOldFormat) {
        return {
          _key: language,
          _type: "internationalizedArrayStringValue",
          value: `${localized.title} - old format`,
        };
      }

      return {
        _key: randomKey(),
        _type: "internationalizedArrayStringValue",
        language,
        value: `${localized.title} - new format`,
      };
    },
  );

  const description = Object.entries(post.translations).map(
    ([language, localized]) => {
      if (useOldFormat) {
        return {
          _key: language,
          _type: "internationalizedArrayTextValue",
          value: localized.description,
        };
      }

      return {
        _key: randomKey(),
        _type: "internationalizedArrayTextValue",
        language,
        value: localized.description,
      };
    },
  );

  return {
    _type: "internationalizedPost",
    title,
    description,
    slug: {
      _type: "slug",
      current: post.id,
    },
  };
}

async function run() {
  const client = getCliClient({ apiVersion: "2025-02-06" });
  let transaction = client.transaction();

  for (const post of posts) {
    transaction = transaction.create(asInternationalizedPost(post));
  }

  const result = await transaction.commit();
  console.warn(`Imported ${posts.length} internationalizedPost documents.`);
  console.warn(
    `Format: ${useOldFormat ? "old (_key language)" : "new (language field)"}`,
  );
  console.warn(`Transaction ID: ${result.transactionId}`);
}

run().catch((error) => {
  console.error("Failed to import internationalized posts:");
  console.error(error);
  process.exitCode = 1;
});
