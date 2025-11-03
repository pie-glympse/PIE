"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

const DECORATION_CONFIG: Record<string, DecorationConfig> = {
  "/events": {
    image: "/images/formes/round-star-red.png",
    position: "bottom-right",
    size: { width: 500, height: 100 },
  },
  "/profile": {
    image: "/images/formes/wave-red.png",
    position: "bottom-right",
    size: { width: 500, height: 100 },
  },
  "/home": {
    image: "/images/formes/palm-yellow.png",
    position: "bottom-right",
    size: { width: 500, height: 100 },
  },
  "/events/*": {
    image: "/images/formes/palm-yellow.png",
    position: "bottom-right",
    size: { width: 500, height: 100 },
  },

  "/create-event": {
    image: "/images/formes/palm-pink.png",
    position: "bottom-right",
    size: { width: 500, height: 100 },
  },

  "/answer-event": {
    image: "/images/formes/palm-pink.png",
    position: "bottom-right",
    size: { width: 500, height: 100 },
  },
};

type Position =
  | "bottom-right"
  | "bottom-left"
  | "bottom-center"
  | "top-right"
  | "top-left"
  | "top-center";

interface DecorationConfig {
  image: string;
  position: Position;
  size: { width: number; height: number };
}

const getPositionClasses = (position: Position): string => {
  const baseClasses = "fixed z-[-1] pointer-events-none";

  switch (position) {
    case "bottom-right":
      return `${baseClasses} bottom-0 right-0`;
    case "bottom-left":
      return `${baseClasses} bottom-0 left-0`;
    case "bottom-center":
      return `${baseClasses} bottom-0 left-1/2 transform -translate-x-1/2`;
    case "top-right":
      return `${baseClasses} top-0 right-0`;
    case "top-left":
      return `${baseClasses} top-0 left-0`;
    case "top-center":
      return `${baseClasses} top-0 left-1/2 transform -translate-x-1/2`;
    default:
      return `${baseClasses} bottom-0 right-0`;
  }
};

export default function DecorationImage() {
  const pathname = usePathname();
  const getDecorationConfig = () => {
    if (DECORATION_CONFIG[pathname as keyof typeof DECORATION_CONFIG]) {
      return DECORATION_CONFIG[pathname as keyof typeof DECORATION_CONFIG];
    }

    for (const [route, config] of Object.entries(DECORATION_CONFIG)) {
      if (route.endsWith("/*")) {
        const baseRoute = route.replace("/*", "");
        if (pathname.startsWith(baseRoute) && pathname !== baseRoute) {
          return config;
        }
      }
    }

    return null;
  };

  const config = getDecorationConfig();
  if (!config) {
    return null;
  }

  return (
    <div className={getPositionClasses(config.position)}>
      <Image
        src={config.image}
        alt="Décoration"
        width={config.size.width}
        height={config.size.height}
        className="object-contain"
        priority={false}
      />
    </div>
  );
}
