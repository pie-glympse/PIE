/**
 * Tests du garde-fou horaires : un lieu ne doit être proposé que s'il est
 * ouvert pendant TOUTES les sessions de l'événement (gestion de minuit, des
 * événements multi-jours et des lieux ouverts 24h/24).
 */
import {
  isPlaceOpenForSessions,
  buildEventSessions,
  eachDayBetween,
  timeToMinutes,
  type OpeningPeriod,
  type EventSession,
} from "@/lib/event-closure";

// day: 0 = dimanche … 6 = samedi (convention Google == Date.getDay())
const period = (
  openDay: number,
  openHour: number,
  closeDay: number,
  closeHour: number,
  openMinute = 0,
  closeMinute = 0,
): OpeningPeriod => ({
  open: { day: openDay, hour: openHour, minute: openMinute },
  close: { day: closeDay, hour: closeHour, minute: closeMinute },
});

const session = (
  weekday: number,
  startMinute: number,
  endMinute: number,
): EventSession => ({ weekday, startMinute, endMinute });

const H = (h: number, m = 0) => h * 60 + m;

describe("isPlaceOpenForSessions", () => {
  it("garde le lieu quand les horaires sont inconnus", () => {
    expect(isPlaceOpenForSessions(null, [session(5, H(20), H(22))])).toBe(true);
    expect(isPlaceOpenForSessions([], [session(5, H(20), H(22))])).toBe(true);
  });

  it("garde le lieu quand aucune session n'est définie", () => {
    expect(isPlaceOpenForSessions([period(5, 12, 5, 14)], [])).toBe(true);
  });

  it("écarte un lieu fermé pendant la fenêtre (créneau midi)", () => {
    // Restaurant : vendredi 12h–14h puis 19h–23h
    const hours = [period(5, 12, 5, 14), period(5, 19, 5, 23)];
    // Événement vendredi 20h–22h → couvert
    expect(isPlaceOpenForSessions(hours, [session(5, H(20), H(22))])).toBe(true);
    // Événement vendredi 15h–16h → fermé (entre les deux services)
    expect(isPlaceOpenForSessions(hours, [session(5, H(15), H(16))])).toBe(
      false,
    );
    // Événement vendredi 13h–15h → déborde la fermeture de 14h → écarté
    expect(isPlaceOpenForSessions(hours, [session(5, H(13), H(15))])).toBe(
      false,
    );
  });

  it("gère une fenêtre d'événement qui franchit minuit", () => {
    // Bar ouvert vendredi 18h → samedi 02h
    const hours = [period(5, 18, 6, 2)];
    // Soirée vendredi 23h → 01h (endMinute < startMinute ⇒ franchit minuit)
    expect(isPlaceOpenForSessions(hours, [session(5, H(23), H(1))])).toBe(true);
    // Soirée vendredi 23h → 03h : le bar ferme à 2h → écarté
    expect(isPlaceOpenForSessions(hours, [session(5, H(23), H(3))])).toBe(
      false,
    );
  });

  it("couvre un créneau minuit→2h par la plage de la veille au soir", () => {
    // Club ouvert samedi 22h → dimanche 04h
    const hours = [period(6, 22, 0, 4)];
    // Événement dimanche 00h → 02h
    expect(isPlaceOpenForSessions(hours, [session(0, H(0), H(2))])).toBe(true);
    // Événement dimanche 03h → 05h : ferme à 4h → écarté
    expect(isPlaceOpenForSessions(hours, [session(0, H(3), H(5))])).toBe(false);
  });

  it("traite une période sans close comme ouvert 24h/24", () => {
    const alwaysOpen: OpeningPeriod[] = [
      { open: { day: 0, hour: 0, minute: 0 } },
    ];
    expect(isPlaceOpenForSessions(alwaysOpen, [session(3, H(3), H(5))])).toBe(
      true,
    );
  });

  it("multi-jours : exige l'ouverture chaque jour sur la fenêtre diurne", () => {
    // Ouvert mardi (2) et mercredi (3) 9h–18h, mais FERMÉ le lundi (1)
    const hours = [period(2, 9, 2, 18), period(3, 9, 3, 18)];
    // Séminaire mardi + mercredi 10h–17h → ouvert les deux jours
    expect(
      isPlaceOpenForSessions(hours, [
        session(2, H(10), H(17)),
        session(3, H(10), H(17)),
      ]),
    ).toBe(true);
    // Séminaire lundi + mardi → fermé le lundi → écarté
    expect(
      isPlaceOpenForSessions(hours, [
        session(1, H(10), H(17)),
        session(2, H(10), H(17)),
      ]),
    ).toBe(false);
  });
});

describe("buildEventSessions / eachDayBetween / timeToMinutes", () => {
  it("timeToMinutes lit heures:minutes d'un DateTime local", () => {
    expect(timeToMinutes(new Date(1970, 0, 1, 20, 30))).toBe(H(20, 30));
    expect(timeToMinutes(null)).toBeNull();
  });

  it("eachDayBetween renvoie chaque jour inclus (borné à 14)", () => {
    const days = eachDayBetween(
      new Date(2026, 6, 23),
      new Date(2026, 6, 25),
    );
    expect(days).toHaveLength(3);
  });

  it("buildEventSessions renvoie [] sans heure et une session par jour sinon", () => {
    const days = [new Date(2026, 6, 24)]; // un vendredi
    expect(
      buildEventSessions({ days, startMinute: null, endMinute: H(22) }),
    ).toEqual([]);
    const sessions = buildEventSessions({
      days,
      startMinute: H(20),
      endMinute: H(22),
    });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ startMinute: H(20), endMinute: H(22) });
  });
});
