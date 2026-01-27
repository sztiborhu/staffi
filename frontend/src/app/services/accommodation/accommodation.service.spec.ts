import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  AccommodationService,
  Accommodation,
  Room,
  CreateAccommodationRequest,
  CreateRoomRequest,
  RoomOccupant
} from './accommodation.service';
import { AuthService } from '../authservice/auth.service';

describe('AccommodationService', () => {
  let service: AccommodationService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockToken = 'fake-jwt-token';
  const apiUrl = 'http://localhost:8081/api';

  const mockAccommodation: Accommodation = {
    id: 1,
    name: 'Munkásszálló A',
    address: 'Budapest, Fő utca 123., 1011',
    managerContact: 'manager@example.com',
    totalCapacity: 100
  };

  const mockOccupant: RoomOccupant = {
    allocationId: 1,
    employeeId: 5,
    employeeName: 'János Kovács',
    companyName: 'Test Kft.',
    checkInDate: '2026-01-15'
  };

  const mockRoom: Room = {
    id: 1,
    roomNumber: '101',
    capacity: 4,
    currentOccupancy: 1,
    currentOccupants: [mockOccupant]
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthService', ['getAuthToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AccommodationService,
        { provide: AuthService, useValue: spy }
      ]
    });

    service = TestBed.inject(AccommodationService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    authServiceSpy.getAuthToken.and.returnValue(mockToken);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Accommodation Management', () => {
    describe('getAllAccommodations', () => {
      it('should fetch all accommodations', () => {
        const mockAccommodations: Accommodation[] = [mockAccommodation];

        service.getAllAccommodations().subscribe(accommodations => {
          expect(accommodations).toEqual(mockAccommodations);
          expect(accommodations.length).toBe(1);
        });

        const req = httpMock.expectOne(`${apiUrl}/accommodations`);
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
        req.flush(mockAccommodations);
      });

      it('should handle empty list', () => {
        service.getAllAccommodations().subscribe(accommodations => {
          expect(accommodations).toEqual([]);
        });

        const req = httpMock.expectOne(`${apiUrl}/accommodations`);
        req.flush([]);
      });
    });

    describe('createAccommodation', () => {
      it('should create a new accommodation', () => {
        const newAccommodation: CreateAccommodationRequest = {
          name: 'Új Szálló',
          address: 'Budapest, Új utca 1., 1010',
          managerContact: 'newmanager@example.com',
          totalCapacity: 50
        };

        service.createAccommodation(newAccommodation).subscribe(accommodation => {
          expect(accommodation).toBeDefined();
          expect(accommodation.name).toBe('Új Szálló');
        });

        const req = httpMock.expectOne(`${apiUrl}/accommodations`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(newAccommodation);
        req.flush({ id: 2, ...newAccommodation });
      });

      it('should handle validation error', () => {
        const invalidAccommodation: CreateAccommodationRequest = {
          name: '',
          address: 'Address',
          managerContact: 'Contact',
          totalCapacity: 0
        };

        service.createAccommodation(invalidAccommodation).subscribe(
          () => fail('should have failed'),
          error => {
            expect(error.status).toBe(400);
          }
        );

        const req = httpMock.expectOne(`${apiUrl}/accommodations`);
        req.flush(
          { message: 'Name is required' },
          { status: 400, statusText: 'Bad Request' }
        );
      });
    });

    describe('updateAccommodation', () => {
      it('should update an accommodation', () => {
        const accommodationId = 1;
        const updateData: Partial<CreateAccommodationRequest> = {
          name: 'Updated Name',
          totalCapacity: 120
        };

        service.updateAccommodation(accommodationId, updateData).subscribe(accommodation => {
          expect(accommodation.name).toBe('Updated Name');
          expect(accommodation.totalCapacity).toBe(120);
        });

        const req = httpMock.expectOne(`${apiUrl}/accommodations/${accommodationId}`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(updateData);
        req.flush({ ...mockAccommodation, ...updateData });
      });

      it('should handle accommodation not found', () => {
        const accommodationId = 999;

        service.updateAccommodation(accommodationId, { name: 'Test' }).subscribe(
          () => fail('should have failed'),
          error => {
            expect(error.status).toBe(404);
          }
        );

        const req = httpMock.expectOne(`${apiUrl}/accommodations/${accommodationId}`);
        req.flush(
          { message: 'Accommodation not found' },
          { status: 404, statusText: 'Not Found' }
        );
      });
    });
  });

  describe('Room Management', () => {
    describe('getRoomsByAccommodation', () => {
      it('should fetch rooms for an accommodation', () => {
        const accommodationId = 1;
        const mockRooms: Room[] = [mockRoom];

        service.getRoomsByAccommodation(accommodationId).subscribe(rooms => {
          expect(rooms).toEqual(mockRooms);
          expect(rooms.length).toBe(1);
          expect(rooms[0].currentOccupants.length).toBe(1);
        });

        const req = httpMock.expectOne(`${apiUrl}/accommodations/${accommodationId}/rooms`);
        expect(req.request.method).toBe('GET');
        req.flush(mockRooms);
      });

      it('should handle empty room list', () => {
        const accommodationId = 1;

        service.getRoomsByAccommodation(accommodationId).subscribe(rooms => {
          expect(rooms).toEqual([]);
        });

        const req = httpMock.expectOne(`${apiUrl}/accommodations/${accommodationId}/rooms`);
        req.flush([]);
      });
    });

    describe('createRoom', () => {
      it('should create a new room', () => {
        const accommodationId = 1;
        const newRoom: CreateRoomRequest = {
          accommodationId: 1,
          roomNumber: '102',
          capacity: 2
        };

        service.createRoom(accommodationId, newRoom).subscribe(room => {
          expect(room).toBeDefined();
          expect(room.roomNumber).toBe('102');
          expect(room.capacity).toBe(2);
        });

        const req = httpMock.expectOne(`${apiUrl}/accommodations/${accommodationId}/rooms`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(newRoom);
        req.flush({
          id: 2,
          roomNumber: '102',
          capacity: 2,
          currentOccupancy: 0,
          currentOccupants: []
        });
      });

      it('should handle room number already exists error', () => {
        const accommodationId = 1;
        const duplicateRoom: CreateRoomRequest = {
          accommodationId: 1,
          roomNumber: '101',
          capacity: 4
        };

        service.createRoom(accommodationId, duplicateRoom).subscribe(
          () => fail('should have failed'),
          error => {
            expect(error.status).toBe(400);
          }
        );

        const req = httpMock.expectOne(`${apiUrl}/accommodations/${accommodationId}/rooms`);
        req.flush(
          { message: 'Room number already exists' },
          { status: 400, statusText: 'Bad Request' }
        );
      });
    });

    describe('updateRoom', () => {
      it('should update a room', () => {
        const roomId = 1;
        const updateData: Partial<CreateRoomRequest> = {
          capacity: 6
        };

        service.updateRoom(roomId, updateData).subscribe(room => {
          expect(room.capacity).toBe(6);
        });

        const req = httpMock.expectOne(`${apiUrl}/accommodations/rooms/${roomId}`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(updateData);
        req.flush({ ...mockRoom, capacity: 6 });
      });

      it('should handle room not found', () => {
        const roomId = 999;

        service.updateRoom(roomId, { capacity: 4 }).subscribe(
          () => fail('should have failed'),
          error => {
            expect(error.status).toBe(404);
          }
        );

        const req = httpMock.expectOne(`${apiUrl}/accommodations/rooms/${roomId}`);
        req.flush(
          { message: 'Room not found' },
          { status: 404, statusText: 'Not Found' }
        );
      });
    });

    describe('deleteRoom', () => {
      it('should delete an empty room', () => {
        const roomId = 1;

        service.deleteRoom(roomId).subscribe(response => {
          expect(response).toBeNull();
        });

        const req = httpMock.expectOne(`${apiUrl}/accommodations/rooms/${roomId}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
      });

      it('should handle room with occupants error', () => {
        const roomId = 1;

        service.deleteRoom(roomId).subscribe(
          () => fail('should have failed'),
          error => {
            expect(error.status).toBe(400);
            expect(error.error.message).toContain('active allocations');
          }
        );

        const req = httpMock.expectOne(`${apiUrl}/accommodations/rooms/${roomId}`);
        req.flush(
          { message: 'Cannot delete room with active allocations. Currently 1 employee(s) living here.' },
          { status: 400, statusText: 'Bad Request' }
        );
      });

      it('should handle room not found', () => {
        const roomId = 999;

        service.deleteRoom(roomId).subscribe(
          () => fail('should have failed'),
          error => {
            expect(error.status).toBe(404);
          }
        );

        const req = httpMock.expectOne(`${apiUrl}/accommodations/rooms/${roomId}`);
        req.flush(
          { message: 'Room not found' },
          { status: 404, statusText: 'Not Found' }
        );
      });
    });
  });
});

