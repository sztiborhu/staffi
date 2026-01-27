import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../authservice/auth.service';

export interface Accommodation {
  id: number;
  name: string;
  address: string;
  managerContact: string;
  totalCapacity: number;
}

export interface RoomOccupant {
  allocationId: number;
  employeeId: number;
  employeeName: string;
  companyName: string;
  checkInDate: string;
}

export interface Room {
  id: number;
  roomNumber: string;
  capacity: number;
  currentOccupancy: number;
  currentOccupants: RoomOccupant[];
}

export interface CreateAccommodationRequest {
  name: string;
  address: string;
  managerContact: string;
  totalCapacity?: number;
}

export interface CreateRoomRequest {
  accommodationId: number;
  roomNumber: string;
  capacity: number;
}

export interface RoomHistory {
  id: number;
  roomNumber: string;
  employeeName: string;
  checkInDate: string;
  checkOutDate: string | null;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccommodationService {
  private apiUrl = 'http://localhost:8081/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Accommodations
  getAllAccommodations(): Observable<Accommodation[]> {
    return this.http.get<Accommodation[]>(`${this.apiUrl}/accommodations`, { headers: this.getHeaders() });
  }

  createAccommodation(data: CreateAccommodationRequest): Observable<Accommodation> {
    return this.http.post<Accommodation>(`${this.apiUrl}/accommodations`, data, { headers: this.getHeaders() });
  }

  updateAccommodation(id: number, data: Partial<CreateAccommodationRequest>): Observable<Accommodation> {
    return this.http.put<Accommodation>(`${this.apiUrl}/accommodations/${id}`, data, { headers: this.getHeaders() });
  }

  // Rooms
  getRoomsByAccommodation(accommodationId: number): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/accommodations/${accommodationId}/rooms`, { headers: this.getHeaders() });
  }

  createRoom(accommodationId: number, data: CreateRoomRequest): Observable<Room> {
    return this.http.post<Room>(`${this.apiUrl}/accommodations/${accommodationId}/rooms`, data, { headers: this.getHeaders() });
  }

  updateRoom(roomId: number, data: Partial<CreateRoomRequest>): Observable<Room> {
    return this.http.put<Room>(`${this.apiUrl}/accommodations/rooms/${roomId}`, data, { headers: this.getHeaders() });
  }

  deleteRoom(roomId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/accommodations/rooms/${roomId}`, { headers: this.getHeaders() });
  }

  // Room History
  getEmployeeRoomHistory(employeeId: number): Observable<RoomHistory[]> {
    return this.http.get<RoomHistory[]>(`${this.apiUrl}/accommodations/employees/${employeeId}/room-history`, { headers: this.getHeaders() });
  }
}
