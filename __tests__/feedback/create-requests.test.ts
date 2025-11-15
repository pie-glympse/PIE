/**
 * Tests pour l'API de création de notifications de feedback
 * Ces tests vérifient que les notifications sont créées correctement
 * le lendemain de la fin d'un événement
 */

// Mock Next.js server modules avant d'importer quoi que ce soit
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => {
      const response = {
        json: jest.fn(async () => data),
        status: init?.status || 200,
      };
      return response;
    }),
  },
}));

// Mock Prisma - créer l'instance directement dans le mock factory
// Utiliser globalThis pour stocker l'instance et éviter les problèmes de hoisting
jest.mock('@prisma/client', () => {
  // Créer l'instance directement dans le factory
  const instance = {
    event: {
      findMany: jest.fn(),
    },
    notification: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    feedback: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  
  // Stocker l'instance dans globalThis pour y accéder dans les tests
  (globalThis as any).__mockPrismaInstance = instance;
  
  return {
    PrismaClient: jest.fn(() => instance),
  };
});

// Import après les mocks
import { POST } from '@/app/api/feedback/create-requests/route';
import { PrismaClient } from '@prisma/client';

describe('POST /api/feedback/create-requests', () => {
  let originalDate: DateConstructor;
  let mockPrismaInstance: any;

  beforeEach(() => {
    // Sauvegarder le constructeur Date original
    originalDate = global.Date;
    
    // Récupérer l'instance mock depuis globalThis
    mockPrismaInstance = (globalThis as any).__mockPrismaInstance;
    
    // Réinitialiser les mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restaurer le constructeur Date original
    global.Date = originalDate;
  });

  it('devrait créer des notifications pour les événements terminés hier', async () => {
    // Utiliser jest.useFakeTimers pour mocker le temps
    jest.useFakeTimers();
    const mockNow = new originalDate('2025-01-15T10:00:00Z').getTime();
    jest.setSystemTime(mockNow);

    // Événement qui s'est terminé hier soir (14 janvier 2025, 20h00)
    const yesterdayEvening = new originalDate('2025-01-14T20:00:00Z');
    
    // Utilisateur invité à l'événement
    const mockUser = {
      id: BigInt(1),
    };

    const mockEvent = {
      id: BigInt(1),
      title: 'Événement de test',
      state: 'CONFIRMED',
      endDate: yesterdayEvening,
      endTime: null,
      startDate: new Date('2025-01-14T18:00:00Z'),
      duration: 120, // 2 heures
      users: [mockUser],
    };

    // Mock Prisma
    (mockPrismaInstance.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);
    (mockPrismaInstance.notification.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrismaInstance.feedback.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrismaInstance.notification.create as jest.Mock).mockResolvedValue({
      id: BigInt(1),
      userId: mockUser.id,
      eventId: mockEvent.id,
      message: `Donnez votre avis sur l'événement "${mockEvent.title}"`,
      type: 'FEEDBACK_REQUEST',
    });

    // Appeler l'API
    const response = await POST();
    const data = await response.json();

    // Vérifications
    expect(response.status).toBe(200);
    expect(data.notificationsCreated).toBe(1);
    expect(mockPrismaInstance.notification.create).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        message: `Donnez votre avis sur l'événement "${mockEvent.title}"`,
        type: 'FEEDBACK_REQUEST',
        eventId: mockEvent.id,
      },
    });
    
    // Restaurer les timers
    jest.useRealTimers();
  });

  it('ne devrait pas créer de notifications pour les événements qui ne se sont pas encore terminés', async () => {
    // Mock de la date actuelle : 15 janvier 2025, 10h00
    const mockNow = new Date('2025-01-15T10:00:00Z');
    
    global.Date = jest.fn(() => mockNow) as any;
    global.Date.now = jest.fn(() => mockNow.getTime());
    global.Date.parse = originalDate.parse;
    global.Date.UTC = originalDate.UTC;
    Object.setPrototypeOf(global.Date, originalDate);
    global.Date.prototype = originalDate.prototype;

    // Événement qui se termine demain (16 janvier 2025)
    const tomorrow = new Date('2025-01-16T20:00:00Z');
    
    const mockUser = {
      id: BigInt(1),
    };

    const mockEvent = {
      id: BigInt(1),
      title: 'Événement futur',
      state: 'CONFIRMED',
      endDate: tomorrow,
      endTime: null,
      startDate: new Date('2025-01-16T18:00:00Z'),
      duration: 120,
      users: [mockUser],
    };

    // Mock Prisma
    (mockPrismaInstance.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);

    // Appeler l'API
    const response = await POST();
    const data = await response.json();

    // Vérifications
    expect(response.status).toBe(200);
    expect(data.notificationsCreated).toBe(0);
    expect(mockPrismaInstance.notification.create).not.toHaveBeenCalled();
  });

  it('ne devrait pas créer de notifications si une notification existe déjà', async () => {
    // Mock de la date actuelle : 15 janvier 2025, 10h00
    const mockNow = new Date('2025-01-15T10:00:00Z');
    
    global.Date = jest.fn(() => mockNow) as any;
    global.Date.now = jest.fn(() => mockNow.getTime());
    global.Date.parse = originalDate.parse;
    global.Date.UTC = originalDate.UTC;
    Object.setPrototypeOf(global.Date, originalDate);
    global.Date.prototype = originalDate.prototype;

    const yesterdayEvening = new Date('2025-01-14T20:00:00Z');
    
    const mockUser = {
      id: BigInt(1),
    };

    const mockEvent = {
      id: BigInt(1),
      title: 'Événement de test',
      state: 'CONFIRMED',
      endDate: yesterdayEvening,
      endTime: null,
      startDate: new Date('2025-01-14T18:00:00Z'),
      duration: 120,
      users: [mockUser],
    };

    // Mock Prisma - une notification existe déjà
    (mockPrismaInstance.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);
    (mockPrismaInstance.notification.findFirst as jest.Mock).mockResolvedValue({
      id: BigInt(1),
      userId: mockUser.id,
      eventId: mockEvent.id,
      type: 'FEEDBACK_REQUEST',
    });

    // Appeler l'API
    const response = await POST();
    const data = await response.json();

    // Vérifications
    expect(response.status).toBe(200);
    expect(data.notificationsCreated).toBe(0);
    expect(mockPrismaInstance.notification.create).not.toHaveBeenCalled();
  });

  it('ne devrait pas créer de notifications si un feedback existe déjà', async () => {
    // Mock de la date actuelle : 15 janvier 2025, 10h00
    const mockNow = new Date('2025-01-15T10:00:00Z');
    
    global.Date = jest.fn(() => mockNow) as any;
    global.Date.now = jest.fn(() => mockNow.getTime());
    global.Date.parse = originalDate.parse;
    global.Date.UTC = originalDate.UTC;
    Object.setPrototypeOf(global.Date, originalDate);
    global.Date.prototype = originalDate.prototype;

    const yesterdayEvening = new Date('2025-01-14T20:00:00Z');
    
    const mockUser = {
      id: BigInt(1),
    };

    const mockEvent = {
      id: BigInt(1),
      title: 'Événement de test',
      state: 'CONFIRMED',
      endDate: yesterdayEvening,
      endTime: null,
      startDate: new Date('2025-01-14T18:00:00Z'),
      duration: 120,
      users: [mockUser],
    };

    // Mock Prisma - un feedback existe déjà
    (mockPrismaInstance.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);
    (mockPrismaInstance.notification.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrismaInstance.feedback.findUnique as jest.Mock).mockResolvedValue({
      userId: mockUser.id,
      eventId: mockEvent.id,
      participated: true,
      rating: BigInt(5),
    });

    // Appeler l'API
    const response = await POST();
    const data = await response.json();

    // Vérifications
    expect(response.status).toBe(200);
    expect(data.notificationsCreated).toBe(0);
    expect(mockPrismaInstance.notification.create).not.toHaveBeenCalled();
  });

  it('devrait utiliser startDate + duration si endDate n\'est pas défini', async () => {
    // Utiliser jest.useFakeTimers pour mocker le temps
    jest.useFakeTimers();
    const mockNow = new originalDate('2025-01-15T10:00:00Z').getTime();
    jest.setSystemTime(mockNow);

    // Événement qui a commencé hier à 18h et dure 2 heures (se termine à 20h)
    const startDate = new originalDate('2025-01-14T18:00:00Z');
    
    const mockUser = {
      id: BigInt(1),
    };

    const mockEvent = {
      id: BigInt(1),
      title: 'Événement sans endDate',
      state: 'CONFIRMED',
      endDate: null,
      endTime: null,
      startDate: startDate,
      duration: 120, // 2 heures
      users: [mockUser],
    };

    // Mock Prisma
    (mockPrismaInstance.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);
    (mockPrismaInstance.notification.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrismaInstance.feedback.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrismaInstance.notification.create as jest.Mock).mockResolvedValue({
      id: BigInt(1),
      userId: mockUser.id,
      eventId: mockEvent.id,
      message: `Donnez votre avis sur l'événement "${mockEvent.title}"`,
      type: 'FEEDBACK_REQUEST',
    });

    // Appeler l'API
    const response = await POST();
    const data = await response.json();

    // Vérifications
    expect(response.status).toBe(200);
    expect(data.notificationsCreated).toBe(1);
    expect(mockPrismaInstance.notification.create).toHaveBeenCalled();
    
    // Restaurer les timers
    jest.useRealTimers();
  });
});

